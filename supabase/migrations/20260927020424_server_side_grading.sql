-- Server-side grading.
-- Quiz answers and explanations live in the `private` schema, which the Data API
-- can't read, so the answer key is not in the browser bundle. check_answer reveals
-- one question's answer as feedback after the learner answers it. Quizzes are graded
-- in Postgres, and passing a skill check masters the skill in the same transaction.
-- Clients can no longer write quiz completions or skill masteries directly.
-- Feedback means a retake can use answers seen on an earlier try. That is deliberate;
-- see "Quiz feedback" in SECURITY.md.

-- ── Catalog: challenge kind (set by catalog.sql)
-- The insert policy below trusts every non-quiz kind, so the column fails closed. A
-- catalog loaded before this migration gets its skill checks marked as quizzes, and
-- after that every catalog row must name its kind.
alter table public.challenges
  add column kind text not null default 'code' check (kind in ('quiz', 'code', 'game'));
update public.challenges set kind = 'quiz' where id = skill_id || '-check';
alter table public.challenges alter column kind drop default;

-- ── Answer key (rows come from catalog.sql)
revoke all on schema private from public, anon, authenticated;

create table private.quiz_answers (
  challenge_id text not null references public.challenges (id) on delete cascade,
  idx int not null check (idx >= 0),
  -- normalized; choice answers are the option index. An empty accepted answer would pass blank submissions.
  accepted text[] not null check (cardinality(accepted) > 0 and '' <> all (accepted)),
  explanation text not null,
  primary key (challenge_id, idx)
);

-- Case, surrounding space, angle brackets and backticks don't matter: "<UL>" = "ul".
create function private.normalize_answer(p text)
returns text
language sql immutable set search_path = ''
as $$ select lower(btrim(regexp_replace(coalesce(p, ''), '[<>`]', '', 'g'))) $$;

-- ── Per-user fixed-window rate limits
create table private.rate_limits (
  user_id uuid not null references auth.users (id) on delete cascade,
  bucket text not null,
  window_start timestamptz not null default now(),
  hits int not null default 0,
  primary key (user_id, bucket)
);

-- Raises SQLSTATE PT429, which PostgREST turns into HTTP 429.
create function private.consume_quota(p_bucket text, p_limit int, p_window interval)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_hits int;
begin
  insert into private.rate_limits as r (user_id, bucket, window_start, hits)
  values ((select auth.uid()), p_bucket, now(), 1)
  on conflict (user_id, bucket) do update set
    window_start = case when r.window_start < now() - p_window then now() else r.window_start end,
    hits = case when r.window_start < now() - p_window then 1 else r.hits + 1 end
  returning hits into v_hits;

  if v_hits > p_limit then
    raise exception 'Too many requests. Try again later.' using errcode = 'PT429';
  end if;
end;
$$;

create function private.require_user()
returns uuid
language plpgsql stable set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception 'Sign in first.' using errcode = '42501';
  end if;
  return v_uid;
end;
$$;

-- ── RPC: check one answer (instant feedback while taking a quiz)
create function public.check_answer(p_challenge_id text, p_index int, p_answer text)
returns jsonb
language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_skill text;
  v_key private.quiz_answers;
begin
  perform private.require_user();
  if length(p_answer) > 200 then
    raise exception 'Answer too long' using errcode = '22001';
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

-- ── RPC: submit a whole quiz. Grades every answer; pass = at most one wrong.
create function public.submit_quiz(p_challenge_id text, p_answers text[])
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
    raise exception 'Too many answers' using errcode = '22001';
  end if;
  if exists (select 1 from unnest(p_answers) a where length(a) > 200) then
    raise exception 'Answer too long' using errcode = '22001';
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

revoke execute on function public.check_answer(text, int, text) from public, anon;
revoke execute on function public.submit_quiz(text, text[]) from public, anon;
grant execute on function public.check_answer(text, int, text) to authenticated;
grant execute on function public.submit_quiz(text, text[]) to authenticated;

-- ── Lock down direct writes: quizzes and masteries only change through submit_quiz
drop policy "master unlocked skills" on public.skill_completions;
revoke insert on public.skill_completions from authenticated;

drop policy "complete unlocked challenges" on public.challenge_completions;
create policy "complete unlocked code and games" on public.challenge_completions for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.challenges c
      where c.id = challenge_id and c.kind <> 'quiz' and public.skill_unlocked(c.skill_id)
    )
  );

-- ── Least privilege. Supabase's default privileges grant ALL on new public tables
-- to the API roles; RLS then decides rows. Revoke that so a missing policy means
-- "permission denied", not a silent no-op, and grant exactly what the app uses.
revoke all on all tables in schema public from anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;

grant select on public.skills, public.challenges to anon, authenticated;
grant select, update (username) on public.profiles to authenticated;
grant select, delete on public.skill_completions to authenticated;
grant select, delete on public.challenge_completions to authenticated;
-- Only the challenge id: user_id defaults to auth.uid() and completed_at to now(),
-- so clients can't backdate activity to fake a streak.
grant insert (challenge_id) on public.challenge_completions to authenticated;
grant select on public.leaderboard to authenticated;

-- Functions in public are RPC endpoints, and new ones are executable by everyone.
-- skill_unlocked is only needed by the insert policy above.
revoke execute on function public.skill_unlocked(text) from public, anon;
grant execute on function public.skill_unlocked(text) to authenticated;

-- ── RPC: reset a skill. Also resets every skill that depends on it (transitively),
-- so nothing is left "mastered but locked". Runs as the caller: RLS limits it to own rows.
create function public.reset_skill(p_skill_id text)
returns text[]
language sql volatile security invoker set search_path = ''
as $$
  with recursive affected (id) as (
    select p_skill_id
    union
    select s.id from public.skills s join affected a on a.id = any (s.requires)
  ),
  gone_checks as (
    delete from public.challenge_completions cc
    using affected a
    where cc.user_id = (select auth.uid()) and cc.challenge_id = a.id || '-check'
  ),
  gone as (
    delete from public.skill_completions sc
    using affected a
    where sc.user_id = (select auth.uid()) and sc.skill_id = a.id
    returning sc.skill_id
  )
  select coalesce(array_agg(skill_id order by skill_id), '{}') from gone;
$$;

revoke execute on function public.reset_skill(text) from public, anon;
grant execute on function public.reset_skill(text) to authenticated;

-- ── RPC: spend one AI tutor message from the caller's hourly quota (called by the chat function).
create function public.consume_ai_quota()
returns void
language plpgsql volatile security definer set search_path = ''
as $$
begin
  perform private.require_user();
  perform private.consume_quota('ai', 40, interval '1 hour');
end;
$$;

revoke execute on function public.consume_ai_quota() from public, anon;
grant execute on function public.consume_ai_quota() to authenticated;
