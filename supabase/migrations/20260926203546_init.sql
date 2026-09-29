-- SkillVerse schema.
-- Access model: learning activity is public (it feeds the leaderboard, like a
-- GitHub contribution graph); every write is owner-only and validated against
-- the skill graph, so XP can't be invented and prerequisites can't be skipped.

-- ── Catalog: server-side copy of src/content (rows come from supabase/catalog.sql)
create table public.skills (
  id text primary key,
  track text not null,
  requires text[] not null default '{}'
);

create table public.challenges (
  id text primary key,
  skill_id text not null references public.skills (id) on delete cascade,
  xp int not null check (xp > 0)
);
create index on public.challenges (skill_id);

-- ── Players
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username ~ '^[A-Za-z0-9_-]{3,20}$'),
  created_at timestamptz not null default now()
);

create table public.challenge_completions (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  challenge_id text not null references public.challenges (id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, challenge_id)
);
create index on public.challenge_completions (challenge_id);

create table public.skill_completions (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  skill_id text not null references public.skills (id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, skill_id)
);
create index on public.skill_completions (skill_id);

-- True when the current user has mastered every prerequisite of the skill.
create function public.skill_unlocked(p_skill_id text)
returns boolean
language sql stable security invoker set search_path = ''
as $$
  select not exists (
    select 1
    from public.skills s
    cross join unnest(s.requires) as r (req)
    where s.id = p_skill_id
      and not exists (
        select 1 from public.skill_completions done
        where done.user_id = (select auth.uid()) and done.skill_id = r.req
      )
  );
$$;

-- ── Row Level Security
alter table public.skills enable row level security;
alter table public.challenges enable row level security;
alter table public.profiles enable row level security;
alter table public.challenge_completions enable row level security;
alter table public.skill_completions enable row level security;

create policy "catalog is public" on public.skills for select to anon, authenticated using (true);
create policy "catalog is public" on public.challenges for select to anon, authenticated using (true);

create policy "profiles are public" on public.profiles for select to authenticated using (true);
create policy "rename yourself" on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "activity is public" on public.challenge_completions for select to authenticated using (true);
create policy "complete unlocked challenges" on public.challenge_completions for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and public.skill_unlocked((select c.skill_id from public.challenges c where c.id = challenge_id))
  );
create policy "undo own challenges" on public.challenge_completions for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "activity is public" on public.skill_completions for select to authenticated using (true);
-- Mastering a skill requires its prerequisites and a passed skill check.
create policy "master unlocked skills" on public.skill_completions for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and public.skill_unlocked(skill_id)
    and exists (
      select 1 from public.challenge_completions cc
      where cc.user_id = (select auth.uid()) and cc.challenge_id = skill_id || '-check'
    )
  );
create policy "undo own skills" on public.skill_completions for delete to authenticated
  using ((select auth.uid()) = user_id);

grant select on public.skills, public.challenges to anon, authenticated;
grant select, update (username) on public.profiles to authenticated;
grant select, insert, delete on public.challenge_completions, public.skill_completions to authenticated;

-- ── New users (including anonymous guests) get a profile with a generated name
create schema if not exists private;

create function private.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, 'cadet_' || substr(md5(new.id::text), 1, 10));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- ── Leaderboard: XP, level and streak derived from completions (never stored)
-- ponytail: recomputed on every read; materialize it if the player count gets large.
-- Streak days are UTC.
create view public.leaderboard with (security_invoker = true) as
with xp as (
  select user_id, sum(xp) as xp from (
    select sc.user_id, 100 as xp from public.skill_completions sc
    union all
    select cc.user_id, c.xp from public.challenge_completions cc
    join public.challenges c on c.id = cc.challenge_id
  ) t group by user_id
),
mastered as (
  select user_id, count(*) as n from public.skill_completions group by user_id
),
days as (
  select user_id, (completed_at at time zone 'utc')::date as d from public.skill_completions
  union
  select user_id, (completed_at at time zone 'utc')::date from public.challenge_completions
),
runs as (
  select user_id, max(d) as last_day, count(*) as len
  from (select user_id, d, d - (row_number() over (partition by user_id order by d))::int as grp from days) g
  group by user_id, grp
),
streaks as (
  select user_id, max(len) as streak from runs
  where last_day >= (now() at time zone 'utc')::date - 1
  group by user_id
)
select
  p.id as user_id,
  p.username,
  coalesce(xp.xp, 0)::int as xp,
  (coalesce(xp.xp, 0) / 500 + 1)::int as level,
  coalesce(mastered.n, 0)::int as skills_mastered,
  coalesce(streaks.streak, 0)::int as streak,
  rank() over (order by coalesce(xp.xp, 0) desc)::int as rank
from public.profiles p
left join xp on xp.user_id = p.id
left join mastered on mastered.user_id = p.id
left join streaks on streaks.user_id = p.id;

grant select on public.leaderboard to authenticated;
