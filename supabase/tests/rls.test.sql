-- Run: npx supabase test db
begin;
select plan(10);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000001', 'ada@test.dev'),
  ('00000000-0000-0000-0000-000000000002', 'bob@test.dev');

select is((select count(*)::int from public.profiles), 2, 'signup trigger creates profiles');

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-000000000001", "role": "authenticated"}';

select throws_ok(
  $$ insert into public.skill_completions (skill_id) values ('html') $$,
  '42501', null, 'cannot master a skill without passing its check');

select lives_ok(
  $$ insert into public.challenge_completions (challenge_id) values ('html-check') $$,
  'can pass the check of an unlocked skill');

select lives_ok(
  $$ insert into public.skill_completions (skill_id) values ('html') $$,
  'can master a skill after passing its check');

select throws_ok(
  $$ insert into public.challenge_completions (challenge_id) values ('react-check') $$,
  '42501', null, 'cannot attempt a skill whose prerequisites are not mastered');

select throws_ok(
  $$ insert into public.challenge_completions (user_id, challenge_id)
     values ('00000000-0000-0000-0000-000000000002', 'css-check') $$,
  '42501', null, 'cannot write progress for another user');

select throws_ok(
  $$ insert into public.challenge_completions (challenge_id) values ('made-up') $$,
  '23503', null, 'cannot complete a challenge that is not in the catalog');

select is(
  (select xp from public.leaderboard where true
     and user_id = '00000000-0000-0000-0000-000000000001'),
  130, 'leaderboard XP = 100 mastery + 30 check');

update public.profiles set username = 'hijacked' where id = '00000000-0000-0000-0000-000000000002';
select is((select username from public.profiles where id = '00000000-0000-0000-0000-000000000002'),
  'cadet_' || substr(md5('00000000-0000-0000-0000-000000000002'), 1, 10), 'cannot rename another user');

select throws_ok(
  $$ update public.profiles set username = 'bad name!' where id = '00000000-0000-0000-0000-000000000001' $$,
  '23514', null, 'usernames are validated');

select * from finish();
rollback;
