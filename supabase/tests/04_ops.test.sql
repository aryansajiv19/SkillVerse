-- Guest cleanup and live updates.
begin;
select plan(4);

insert into auth.users (id, email, is_anonymous, created_at) values
  ('00000000-0000-0000-0000-0000000000a1', null, true, now() - interval '40 days'),  -- idle guest
  ('00000000-0000-0000-0000-0000000000a2', null, true, now() - interval '40 days'),  -- old guest with XP
  ('00000000-0000-0000-0000-0000000000a3', null, true, now()),                       -- new guest
  ('00000000-0000-0000-0000-0000000000a4', 'kept@test.dev', false, now() - interval '400 days');
insert into public.challenge_completions (user_id, challenge_id) values ('00000000-0000-0000-0000-0000000000a2', 'html-1');

select is(private.purge_idle_guests(), 1, 'purges exactly the idle, XP-less, 30+ day old guest');
select is((select count(*)::int from public.profiles where id::text like '00000000-0000-0000-0000-0000000000a%'), 3,
  'guests with XP, new guests and real accounts are kept');

select is((select count(*)::int from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'player_stats'),
  1, 'player_stats is published to Realtime');
select is((select count(*)::int from cron.job where jobname in ('purge-idle-guests', 'trim-rate-limits')),
  2, 'maintenance jobs are scheduled');

select * from finish();
rollback;
