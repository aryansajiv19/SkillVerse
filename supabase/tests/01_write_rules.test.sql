-- Direct table writes: what a client can and can't do without the RPCs.
begin;
select plan(12);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'ada@test.dev'),
  ('00000000-0000-0000-0000-00000000000b', 'bob@test.dev');

select is((select count(*)::int from public.profiles where id::text like '00000000-%'), 2, 'signup creates a profile');
select is((select count(*)::int from public.player_stats where user_id::text like '00000000-%' and xp = 0), 2, 'signup creates a zeroed stats row');

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}';

select throws_ok($$ insert into public.skill_completions (skill_id) values ('html') $$,
  '42501', null, 'masteries can only come from submit_quiz');
select throws_ok($$ insert into public.challenge_completions (challenge_id) values ('html-check') $$,
  '42501', null, 'quiz completions can only come from submit_quiz');
select lives_ok($$ insert into public.challenge_completions (challenge_id) values ('html-1') $$,
  'can complete a code challenge of an unlocked skill');
select throws_ok($$ insert into public.challenge_completions (challenge_id) values ('js-1') $$,
  '42501', null, 'cannot complete a challenge of a locked skill');
select throws_ok($$ insert into public.challenge_completions (user_id, challenge_id)
                    values ('00000000-0000-0000-0000-00000000000b', 'html-1') $$,
  '42501', null, 'cannot write progress for another user');
select throws_ok($$ insert into public.challenge_completions (challenge_id) values ('made-up') $$,
  '42501', null, 'cannot complete a challenge that is not in the catalog');
select throws_ok($$ insert into public.challenge_completions (challenge_id, completed_at) values ('css-1', now() - interval '3 days') $$,
  '42501', null, 'cannot backdate activity to fake a streak');
select throws_ok($$ update public.player_stats set xp = 99999 $$,
  '42501', null, 'stats are read-only for clients');

update public.profiles set username = 'hijacked' where id = '00000000-0000-0000-0000-00000000000b';
select isnt((select username from public.profiles where id = '00000000-0000-0000-0000-00000000000b'),
  'hijacked', 'cannot rename another user');
select throws_ok($$ update public.profiles set username = 'Cadet_' || substr(md5('00000000-0000-0000-0000-00000000000b'), 1, 10)
                    where id = '00000000-0000-0000-0000-00000000000a' $$,
  '23505', null, 'usernames are unique regardless of case');

select * from finish();
rollback;
