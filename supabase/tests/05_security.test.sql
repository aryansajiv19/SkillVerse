-- Security invariants for the whole schema, plus regressions from the security review.
-- The invariants fail when a new table, view or function is added without locking it down.
begin;
select plan(18);

-- ── Invariants
select is(
  array(select relname::text from pg_class where relnamespace = 'public'::regnamespace and relkind in ('r', 'p') and not relrowsecurity),
  '{}'::text[], 'every public table has RLS on');

select is(
  array(select relname::text from pg_class
        where relnamespace = 'public'::regnamespace and relkind = 'v'
          and not coalesce(reloptions @> array['security_invoker=true'], false)),
  '{}'::text[], 'every public view runs with the caller''s permissions');

select ok(not has_schema_privilege('anon', 'private', 'usage') and not has_schema_privilege('authenticated', 'private', 'usage'),
  'the API roles cannot reach the private schema');

select set_eq(
  $$ select c.relname::text, a.privilege_type from pg_class c, aclexplode(c.relacl) a
     where c.relnamespace = 'public'::regnamespace and a.grantee = 'anon'::regrole $$,
  $$ values ('skills', 'SELECT'), ('challenges', 'SELECT') $$,
  'visitors without a session can only read the catalog');

select set_eq(
  $$ select c.relname::text, a.privilege_type from pg_class c, aclexplode(c.relacl) a
     where c.relnamespace = 'public'::regnamespace and a.grantee = 'authenticated'::regrole $$,
  $$ values ('skills', 'SELECT'), ('challenges', 'SELECT'), ('profiles', 'SELECT'), ('player_stats', 'SELECT'),
            ('leaderboard', 'SELECT'), ('skill_completions', 'SELECT'), ('skill_completions', 'DELETE'),
            ('challenge_completions', 'SELECT'), ('challenge_completions', 'DELETE') $$,
  'players get exactly these table privileges (no insert, update or truncate)');

select set_eq(
  $$ select c.relname::text, a.attname::text, x.privilege_type
     from pg_attribute a join pg_class c on c.oid = a.attrelid, aclexplode(a.attacl) x
     where c.relnamespace = 'public'::regnamespace and x.grantee in ('anon'::regrole, 'authenticated'::regrole) $$,
  $$ values ('profiles', 'username', 'UPDATE'), ('challenge_completions', 'challenge_id', 'INSERT') $$,
  'column grants: rename yourself, and insert a challenge id (user and time come from defaults)');

select is(
  array(select p.oid::regprocedure::text from pg_proc p
        where p.prosecdef and p.pronamespace in ('public'::regnamespace, 'private'::regnamespace)
          and not exists (select 1 from unnest(p.proconfig) c where c like 'search_path=%')),
  '{}'::text[], 'every SECURITY DEFINER function pins its search_path');

select is(
  array(select p.oid::regprocedure::text from pg_proc p
        where p.pronamespace = 'public'::regnamespace and has_function_privilege('anon', p.oid, 'execute')),
  '{}'::text[], 'visitors without a session cannot call any RPC');

select set_eq(
  $$ select p.proname::text from pg_proc p
     where p.pronamespace = 'public'::regnamespace and p.prosecdef and has_function_privilege('authenticated', p.oid, 'execute') $$,
  $$ values ('check_answer'), ('submit_quiz'), ('consume_ai_quota') $$,
  'the only privileged RPCs players can call');

select is(
  array(select format('%I.%I', schemaname, tablename) from pg_publication_tables t
        join pg_class c on c.oid = format('%I.%I', t.schemaname, t.tablename)::regclass
        where pubname = 'supabase_realtime' and not c.relrowsecurity),
  '{}'::text[], 'Realtime only publishes tables that RLS protects');

select col_hasnt_default('public', 'challenges', 'kind', 'challenge kind fails closed: the catalog must set it');

select throws_ok($$ insert into private.quiz_answers values ('html-check', 99, array['a', ''], 'x') $$,
  '23514', null, 'an empty accepted answer (which would pass blank submissions) is rejected');

-- ── Regressions, as a player
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'ada@test.dev'),
  ('00000000-0000-0000-0000-00000000000b', 'bob@test.dev');
insert into public.challenge_completions (user_id, challenge_id) values ('00000000-0000-0000-0000-00000000000b', 'html-1');

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}';

select throws_ok($$ select public.check_answer('html-check', 3, repeat('u', 201)) $$,
  '22001', null, 'check_answer rejects oversized answers');
select throws_ok($$ select public.submit_quiz('html-check', array_fill('0'::text, array[51])) $$,
  '22001', null, 'submit_quiz rejects oversized answer lists');
select throws_ok($$ select public.submit_quiz('html-check', array['0', repeat('u', 201)]) $$,
  '22001', null, 'submit_quiz rejects oversized answers');

delete from public.challenge_completions where user_id = '00000000-0000-0000-0000-00000000000b';
select is((select count(*)::int from public.challenge_completions where user_id = '00000000-0000-0000-0000-00000000000b'), 1,
  'cannot delete another player''s progress');

insert into public.challenge_completions (challenge_id) values ('html-1');
delete from public.challenge_completions where challenge_id = 'html-1' and user_id = auth.uid();
insert into public.challenge_completions (challenge_id) values ('html-1');
select is((select xp from public.player_stats where user_id = auth.uid()), 50, 'undo and redo cannot farm XP');

-- A token outlives its account by up to an hour (for example a purged guest). It can't write anything.
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-0000000000ff", "role": "authenticated"}';
select throws_ok($$ select public.submit_quiz('html-check', array['0']) $$,
  '23503', null, 'a token for a deleted account cannot record progress');

select * from finish();
rollback;
