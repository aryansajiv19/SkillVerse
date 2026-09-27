-- Security hardening from the v2 review (see SECURITY.md). A separate migration, so databases
-- that already ran the v2 migrations get it from `supabase migration up`.

-- ── Challenge kind fails closed. The insert policy on challenge_completions trusts every
-- non-quiz kind, and the column defaulted to 'code'. A catalog loaded before the kind column
-- existed gets its skill checks marked as quizzes; after this, every catalog row names its kind.
update public.challenges set kind = 'quiz' where id = skill_id || '-check';
alter table public.challenges alter column kind drop default;

-- ── An empty accepted answer would pass blank submissions.
alter table private.quiz_answers
  drop constraint quiz_answers_accepted_check,
  add constraint quiz_answers_accepted_check check (cardinality(accepted) > 0 and '' <> all (accepted));

-- ── Bounded input for the grading RPCs. Same bodies as before, plus the caps.
create or replace function public.check_answer(p_challenge_id text, p_index int, p_answer text)
returns jsonb
language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_skill text;
  v_key private.quiz_answers;
begin
  perform private.require_user();
  if length(p_answer) > 200 then
    raise exception 'Answers can be at most 200 characters.' using errcode = '22001';
  end if;

  select c.skill_id into v_skill from public.challenges c where c.id = p_challenge_id and c.kind = 'quiz';
  if v_skill is null then
    raise exception 'Unknown quiz %', p_challenge_id using errcode = 'P0002';
  end if;
  if not public.skill_unlocked(v_skill) then
    raise exception 'This skill is locked.' using errcode = '42501';
  end if;
  perform private.consume_quota('check_answer', 600, interval '1 hour');

  select * into v_key from private.quiz_answers a where a.challenge_id = p_challenge_id and a.idx = p_index;
  if not found then
    raise exception 'Unknown question' using errcode = 'P0002';
  end if;

  return jsonb_build_object(
    'correct', private.normalize_answer(p_answer) = any (v_key.accepted),
    'answer', v_key.accepted[1],
    'explanation', v_key.explanation
  );
end;
$$;

create or replace function public.submit_quiz(p_challenge_id text, p_answers text[])
returns jsonb
language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_uid uuid := private.require_user();
  v_skill text;
  v_xp int;
  v_total int;
  v_score int;
  v_passed boolean;
  v_mastered boolean := false;
  v_first boolean := false;
begin
  -- Separate checks: the length scan only runs on an array of sane size.
  if cardinality(p_answers) > 50 then
    raise exception 'A quiz takes at most 50 answers.' using errcode = '22001';
  end if;
  if exists (select 1 from unnest(p_answers) a where length(a) > 200) then
    raise exception 'Answers can be at most 200 characters.' using errcode = '22001';
  end if;

  select c.skill_id, c.xp into v_skill, v_xp from public.challenges c where c.id = p_challenge_id and c.kind = 'quiz';
  if v_skill is null then
    raise exception 'Unknown quiz %', p_challenge_id using errcode = 'P0002';
  end if;
  if not public.skill_unlocked(v_skill) then
    raise exception 'This skill is locked.' using errcode = '42501';
  end if;
  perform private.consume_quota('submit_quiz', 120, interval '1 hour');

  select count(*)::int,
         count(*) filter (where private.normalize_answer(p_answers[a.idx + 1]) = any (a.accepted))::int
    into v_total, v_score
    from private.quiz_answers a
   where a.challenge_id = p_challenge_id;

  v_passed := v_total > 0 and v_score >= greatest(v_total - 1, 1);

  if v_passed then
    insert into public.challenge_completions (user_id, challenge_id)
    values (v_uid, p_challenge_id)
    on conflict do nothing;
    v_first := found;

    if p_challenge_id = v_skill || '-check' then
      insert into public.skill_completions (user_id, skill_id)
      values (v_uid, v_skill)
      on conflict do nothing;
      v_mastered := true;
    end if;
  end if;

  return jsonb_build_object(
    'score', v_score,
    'total', v_total,
    'passed', v_passed,
    'mastered', v_mastered,
    'xp_awarded', case when v_first then v_xp + case when v_mastered then 100 else 0 end else 0 end
  );
end;
$$;

-- ── Functions in public are RPC endpoints, and new ones are executable by everyone.
-- skill_unlocked is only needed by the insert policy on challenge_completions.
revoke execute on function public.skill_unlocked(text) from public, anon;
grant execute on function public.skill_unlocked(text) to authenticated;

-- ── Leaderboard rank as one window pass. It was a count per row, and PostgREST lets any player
-- filter or sort on rank (?rank=eq.0), which ran that count for every player: quadratic work
-- for one request. Now any read costs at most one pass over player_stats, and a top-N read
-- stops after N rows of the xp index. Same numbers: rank() = 1 + players with more XP.
-- ponytail: a one-player read (own stats, a profile) also scans player_stats (about 10 ms at
-- 45k players). Add a player_rank(uuid) RPC doing an index range count if that read shows up.
create or replace view public.leaderboard with (security_invoker = true) as
select
  s.user_id,
  p.username,
  s.xp,
  s.xp / 500 + 1 as level,
  s.skills_mastered,
  s.challenges_done,
  case when s.last_active >= (now() at time zone 'utc')::date - 1 then s.streak else 0 end as streak,
  s.best_streak,
  s.last_active,
  s.rank
from (select *, (rank() over (order by xp desc))::int as rank from public.player_stats) s
join public.profiles p on p.id = s.user_id;
