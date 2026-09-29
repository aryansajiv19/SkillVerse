-- Leaderboard query costs at scale. Seeds N synthetic players inside a transaction that
-- is always rolled back. Run: docker exec -i supabase_db_skillverse psql -U postgres -v n=50000 < scripts/bench/leaderboard.sql
\set ON_ERROR_STOP on
\timing off
begin;
set local statement_timeout = '120s';

insert into auth.users (id, email)
select gen_random_uuid(), 'bench' || g || '@bench.invalid' from generate_series(1, :n) g;
-- Signup trigger created profiles + zeroed stats; give them a realistic XP spread.
update public.player_stats set xp = (random() ^ 2 * 4340)::int, last_active = current_date
where user_id in (select id from auth.users where email like '%@bench.invalid');
analyze public.player_stats;

-- v1 rank: one "players with more XP" count per row.
create temp view leaderboard_v1 as
select s.user_id, s.xp, (select count(*) from public.player_stats x where x.xp > s.xp)::int + 1 as rank
from public.player_stats s;

\echo '--- top 50 (current view)'
explain (analyze, costs off, timing on, summary on) select user_id, xp, rank from public.leaderboard order by xp desc, user_id limit 50;
\echo '--- filter on rank (current view: one window pass)'
explain (analyze, costs off, summary on) select user_id from public.leaderboard where rank = 1000;
\echo '--- filter on rank (v1 per-row count)'
explain (analyze, costs off, summary on) select user_id from leaderboard_v1 where rank = 1000;

rollback;
