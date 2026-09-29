-- Cost of refreshing stats when a player resets everything (one DELETE of every completion).
-- Statement-level triggers refresh the player once; a row-level trigger would refresh once per row.
-- Run: docker exec -i supabase_db_skillverse psql -U postgres < scripts/bench/stats_trigger.sql
\set ON_ERROR_STOP on
begin;
insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000be4c1', 'bench@bench.invalid');
insert into public.challenge_completions (user_id, challenge_id) select '00000000-0000-0000-0000-0000000be4c1', id from public.challenges;
insert into public.skill_completions (user_id, skill_id) select '00000000-0000-0000-0000-0000000be4c1', id from public.skills;
select count(*) as completion_rows from public.challenge_completions where user_id = '00000000-0000-0000-0000-0000000be4c1';
\timing on
\echo '--- one refresh (what the statement trigger does)'
select private.refresh_stats('00000000-0000-0000-0000-0000000be4c1');
\echo '--- one refresh per row (what a row-level trigger would do)'
select count(private.refresh_stats('00000000-0000-0000-0000-0000000be4c1')) from public.challenge_completions where user_id = '00000000-0000-0000-0000-0000000be4c1';
\echo '--- the real reset: delete all challenge completions'
delete from public.challenge_completions where user_id = '00000000-0000-0000-0000-0000000be4c1';
rollback;
