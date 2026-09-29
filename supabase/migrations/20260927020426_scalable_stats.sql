-- Scalable stats.
-- v1 recomputed every player's XP and streak on every leaderboard read. Now each
-- player has one stats row, refreshed by statement-level triggers whenever their
-- completions change. Reads become an index scan, and the table is published to
-- Realtime so leaderboards update live.

create table public.player_stats (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  xp int not null default 0 check (xp >= 0),
  skills_mastered int not null default 0,
  challenges_done int not null default 0,
  streak int not null default 0,      -- current run of active UTC days (as of last_active)
  best_streak int not null default 0,
  last_active date,
  updated_at timestamptz not null default now()
);
create index player_stats_xp_idx on public.player_stats (xp desc, user_id);

alter table public.player_stats enable row level security;
create policy "stats are public" on public.player_stats for select to authenticated using (true);
grant select on public.player_stats to authenticated;

-- Recompute one player's row from their completions. Bounded by the catalog size
-- (at most skills + challenges rows per player), so it stays cheap at any user count.
create function private.refresh_stats(p_user_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.player_stats as s (user_id, xp, skills_mastered, challenges_done, streak, best_streak, last_active, updated_at)
  select
    p_user_id,
    coalesce(sk.n, 0) * 100 + coalesce(ch.xp, 0),
    coalesce(sk.n, 0),
    coalesce(ch.n, 0),
    coalesce(st.current_len, 0),
    coalesce(st.best_len, 0),
    st.last_day,
    now()
  from (select 1) one
  left join (select count(*) as n from public.skill_completions where user_id = p_user_id) sk on true
  left join (
    select count(*) as n, sum(c.xp) as xp
    from public.challenge_completions cc join public.challenges c on c.id = cc.challenge_id
    where cc.user_id = p_user_id
  ) ch on true
  left join lateral (
    -- gaps and islands: consecutive days share the same (day - row_number)
    with days as (
      select (completed_at at time zone 'utc')::date as d from public.skill_completions where user_id = p_user_id
      union
      select (completed_at at time zone 'utc')::date from public.challenge_completions where user_id = p_user_id
    ),
    runs as (
      select max(d) as last_day, count(*) as len
      from (select d, d - (row_number() over (order by d))::int as grp from days) g
      group by grp
    )
    select
      (select max(last_day) from runs) as last_day,
      (select len from runs order by last_day desc limit 1) as current_len,
      (select max(len) from runs) as best_len
  ) st on true
  on conflict (user_id) do update set
    xp = excluded.xp,
    skills_mastered = excluded.skills_mastered,
    challenges_done = excluded.challenges_done,
    streak = excluded.streak,
    best_streak = excluded.best_streak,
    last_active = excluded.last_active,
    updated_at = excluded.updated_at;
end;
$$;

-- Statement-level triggers see every affected row at once, so a bulk reset refreshes
-- each player once instead of once per deleted row.
create function private.on_completions_inserted()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  perform private.refresh_stats(u.user_id) from (select distinct user_id from new_rows) u;
  return null;
end;
$$;

create function private.on_completions_deleted()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  perform private.refresh_stats(u.user_id)
  from (select distinct user_id from old_rows) u
  where exists (select 1 from public.profiles p where p.id = u.user_id); -- skip users being deleted
  return null;
end;
$$;

create trigger skill_completions_ins after insert on public.skill_completions
  referencing new table as new_rows for each statement execute function private.on_completions_inserted();
create trigger skill_completions_del after delete on public.skill_completions
  referencing old table as old_rows for each statement execute function private.on_completions_deleted();
create trigger challenge_completions_ins after insert on public.challenge_completions
  referencing new table as new_rows for each statement execute function private.on_completions_inserted();
create trigger challenge_completions_del after delete on public.challenge_completions
  referencing old table as old_rows for each statement execute function private.on_completions_deleted();

-- New players start with a zeroed stats row.
create or replace function private.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, 'cadet_' || substr(md5(new.id::text), 1, 10));
  insert into public.player_stats (user_id) values (new.id);
  return new;
end;
$$;

-- Backfill anyone who signed up before this migration.
insert into public.player_stats (user_id) select id from public.profiles on conflict do nothing;
select private.refresh_stats(id) from public.profiles;

-- ── Leaderboard: rank = players with strictly more XP + 1 (an index range count),
-- so reading the top N never touches every row. Streak reads 0 once a day is missed.
drop view public.leaderboard;
create view public.leaderboard with (security_invoker = true) as
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
  (select count(*) from public.player_stats x where x.xp > s.xp)::int + 1 as rank
from public.player_stats s
join public.profiles p on p.id = s.user_id;

grant select on public.leaderboard to authenticated;

-- Usernames are unique regardless of case ("Ada" and "ada" can't both exist).
alter table public.profiles drop constraint profiles_username_key;
create unique index profiles_username_lower_idx on public.profiles (lower(username));

-- Live leaderboard updates.
alter publication supabase_realtime add table public.player_stats;
