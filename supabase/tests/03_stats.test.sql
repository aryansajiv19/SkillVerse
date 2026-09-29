-- Trigger-maintained stats match a from-scratch recompute; streaks and ranks.
begin;
select plan(9);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'ada@test.dev'),
  ('00000000-0000-0000-0000-00000000000b', 'bob@test.dev'),
  ('00000000-0000-0000-0000-00000000000c', 'cy@test.dev');

-- Ada: active today, yesterday and the day before, plus an older 1-day run.
insert into public.challenge_completions (user_id, challenge_id, completed_at) values
  ('00000000-0000-0000-0000-00000000000a', 'html-check', now()),
  ('00000000-0000-0000-0000-00000000000a', 'html-1', now() - interval '1 day'),
  ('00000000-0000-0000-0000-00000000000a', 'css-check', now() - interval '2 days'),
  ('00000000-0000-0000-0000-00000000000a', 'css-1', now() - interval '6 days');
insert into public.skill_completions (user_id, skill_id, completed_at) values
  ('00000000-0000-0000-0000-00000000000a', 'html', now()),
  ('00000000-0000-0000-0000-00000000000a', 'css', now() - interval '2 days');
-- Bob: one burst, a week ago.
insert into public.challenge_completions (user_id, challenge_id, completed_at) values
  ('00000000-0000-0000-0000-00000000000b', 'html-1', now() - interval '7 days');

select is((select xp from public.player_stats where user_id = '00000000-0000-0000-0000-00000000000a'),
  200 + 30 + 50 + 30 + 50, 'xp = 100 per mastery + challenge xp');
select is((select streak from public.leaderboard where user_id = '00000000-0000-0000-0000-00000000000a'), 3, 'current streak counts consecutive days');
select is((select best_streak from public.player_stats where user_id = '00000000-0000-0000-0000-00000000000a'), 3, 'best streak');
select is((select streak from public.leaderboard where user_id = '00000000-0000-0000-0000-00000000000b'), 0, 'a missed day resets the visible streak');
select is((select best_streak from public.player_stats where user_id = '00000000-0000-0000-0000-00000000000b'), 1, '…but best streak is kept');

-- Ranks are compared to each other, not to 1-2-3, so players already in a dev database don't break the test.
select results_eq(
  $$ select username, rank - 1 = (select count(*) from public.player_stats x where x.xp > l.xp)
     from public.leaderboard l where user_id::text like '00000000-%' order by rank, username $$,
  $$ values ('cadet_' || substr(md5('00000000-0000-0000-0000-00000000000a'), 1, 10), true),
            ('cadet_' || substr(md5('00000000-0000-0000-0000-00000000000b'), 1, 10), true),
            ('cadet_' || substr(md5('00000000-0000-0000-0000-00000000000c'), 1, 10), true) $$,
  'rank orders by XP');

-- A bulk reset (one statement, many rows) refreshes the player once.
delete from public.challenge_completions where user_id = '00000000-0000-0000-0000-00000000000a';
delete from public.skill_completions where user_id = '00000000-0000-0000-0000-00000000000a';
select is((select (xp, skills_mastered, challenges_done, streak) from public.player_stats
           where user_id = '00000000-0000-0000-0000-00000000000a'),
  row(0, 0, 0, 0), 'reset zeroes the stats');

-- Invariant: trigger-maintained rows equal a from-scratch recompute.
create temp table snapshot as select user_id, xp, skills_mastered, challenges_done, streak, best_streak, last_active
  from public.player_stats where user_id::text like '00000000-%';
select private.refresh_stats(user_id) from snapshot;
select set_eq(
  $$ select user_id, xp, skills_mastered, challenges_done, streak, best_streak, last_active from public.player_stats
     where user_id::text like '00000000-%' $$,
  $$ select * from snapshot $$,
  'incremental stats match a full recompute');

select is((select count(*)::int from public.leaderboard where user_id::text like '00000000-%'), 3, 'every player appears on the leaderboard view');

select * from finish();
rollback;
