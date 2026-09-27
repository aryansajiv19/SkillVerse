-- Server-side grading: answers stay private, quizzes are graded in Postgres.
begin;
select plan(19);

insert into auth.users (id, email) values ('00000000-0000-0000-0000-00000000000a', 'ada@test.dev');

-- The test (as owner) reads the answer key so it can answer like a learner who knows the material.
create temp table answer_key as
  select challenge_id, array_agg(accepted[1] order by idx) as answers
  from private.quiz_answers group by challenge_id;
grant select on answer_key to authenticated;

set local role anon;
select throws_ok($$ select public.submit_quiz('html-check', array['0']) $$,
  '42501', null, 'visitors without a session cannot submit');

set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}';

select throws_ok($$ select * from private.quiz_answers $$, '42501', null, 'the answer key is not readable');

select is(public.check_answer('html-check', 1, (select answers[2] from answer_key where challenge_id = 'html-check'))->>'correct',
  'true', 'check_answer accepts the right option');
select is(public.check_answer('html-check', 1, 'zzz')->>'correct', 'false', 'check_answer rejects a wrong answer');
select ok(public.check_answer('html-check', 1, 'zzz')->>'explanation' <> '', 'wrong answers come with an explanation');
select is(public.check_answer('html-check', 3, '  <UL> ')->>'correct', 'true', 'fill-in answers ignore case, spaces and brackets');
select throws_ok($$ select public.check_answer('react-check', 0, '0') $$,
  '42501', null, 'cannot peek at answers for a locked skill');

select is(public.submit_quiz('html-check', array['zzz', 'zzz', 'zzz', 'zzz']) ->> 'passed', 'false', 'two or more wrong fails');
select is((select count(*)::int from public.skill_completions where user_id = '00000000-0000-0000-0000-00000000000a'), 0,
  'failing records nothing');

select is(
  public.submit_quiz('html-check', (select array['zzz'] || answers[2:] from answer_key where challenge_id = 'html-check')),
  '{"score": 3, "total": 4, "passed": true, "mastered": true, "xp_awarded": 130}'::jsonb,
  'one wrong still passes; the check masters the skill and awards 100 + 30 XP');
select is(public.submit_quiz('html-check', (select answers from answer_key where challenge_id = 'html-check')) ->> 'xp_awarded',
  '0', 'retaking awards no XP');
select is((select xp from public.player_stats where user_id = '00000000-0000-0000-0000-00000000000a'), 130,
  'stats update in the same transaction');

select lives_ok($$ insert into public.challenge_completions (challenge_id) values ('js-1') $$,
  'mastering HTML unlocks JavaScript challenges');
select throws_ok($$ select public.submit_quiz('ghost-check', array['0']) $$, 'P0002', null, 'unknown quizzes are rejected');

-- Reset cascades through dependents: resetting HTML also resets CSS, which requires it.
select is(public.submit_quiz('css-check', (select answers from answer_key where challenge_id = 'css-check')) ->> 'mastered',
  'true', 'CSS mastered');
select is(public.reset_skill('html'), array['css', 'html'], 'reset_skill resets the skill and everything built on it');
select is((select count(*)::int from public.skill_completions where user_id = '00000000-0000-0000-0000-00000000000a'), 0,
  'no mastered-but-locked skills are left behind');

select lives_ok($$ select public.consume_ai_quota() $$, 'a signed-in user can spend AI quota');

reset role;
select throws_ok(
  $$ select private.consume_quota('test', 2, interval '1 hour') from generate_series(1, 3) $$,
  'PT429', null, 'rate limit raises PT429 (HTTP 429) past the limit');

select * from finish();
rollback;
