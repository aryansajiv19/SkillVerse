-- Demo learners for the hosted demo, so the leaderboard, profiles and heatmaps aren't empty.
-- Idempotent: re-running replaces them. Accounts use the reserved .invalid domain and can't sign in.
-- Run as the database owner (bypasses RLS): psql "$DB_URL" -f scripts/seed-demo.sql
begin;

delete from auth.users where email like '%@demo.skillverse.invalid';

create temp table demo (username text, skills text[], extras text[], days int) on commit drop;
insert into demo values
  ('ada_lovelace',   array['html','css','javascript','typescript','react','nextjs','a11y','tailwind','git','linux','docker','ci-cd'], array['html-1','css-1','css-2','js-1','js-2','js-3','js-game-1','a11y-1','typescript-1','react-1','ci-cd-1','linux-1'], 40),
  ('grace_hopper',   array['python','sql','postgres','pandas','data-viz','ml-basics','deep-learning','git'], array['pandas-1','data-viz-1','ml-basics-1','deep-learning-1'], 34),
  ('linus_t',        array['linux','git','docker','kubernetes','cloud','iac','ci-cd','html'], array['linux-1','ci-cd-1','cloud-1','html-1'], 28),
  ('margaret_h',     array['html','javascript','nodejs','express','rest-apis','sql','postgres','auth'], array['html-1','js-1','nodejs-1','express-1','rest-apis-1','auth-1'], 25),
  ('katherine_j',    array['python','pandas','sql','ml-basics','data-viz'], array['pandas-1','ml-basics-1'], 18),
  ('tim_bl',         array['html','css','javascript','a11y'], array['html-1','css-1','a11y-1'], 12),
  ('radia_p',        array['linux','git','docker'], array['linux-1'], 9),
  ('alan_t',         array['python','sql'], array[]::text[], 5);

-- Accounts (the signup trigger creates profiles + stats), then rename them.
insert into auth.users (id, email)
select gen_random_uuid(), username || '@demo.skillverse.invalid' from demo;
update public.profiles p set username = d.username
from demo d join auth.users u on u.email = d.username || '@demo.skillverse.invalid'
where p.id = u.id;

-- Masteries in catalog order, spread over the last `days` days, with the skill check alongside.
insert into public.skill_completions (user_id, skill_id, completed_at)
select u.id, s.id, now() - make_interval(days => d.days) * (1 - (s.ord::float / cardinality(d.skills)))
from demo d
join auth.users u on u.email = d.username || '@demo.skillverse.invalid'
cross join lateral unnest(d.skills) with ordinality as s(id, ord);

insert into public.challenge_completions (user_id, challenge_id, completed_at)
select sc.user_id, sc.skill_id || '-check', sc.completed_at from public.skill_completions sc
join auth.users u on u.id = sc.user_id where u.email like '%@demo.skillverse.invalid';

insert into public.challenge_completions (user_id, challenge_id, completed_at)
select u.id, e.id, now() - make_interval(days => d.days) * (1 - (e.ord::float / greatest(cardinality(d.extras), 1))) + interval '3 hours'
from demo d
join auth.users u on u.email = d.username || '@demo.skillverse.invalid'
cross join lateral unnest(d.extras) with ordinality as e(id, ord)
where exists (select 1 from public.challenges c where c.id = e.id);

commit;

select username, xp, level, skills_mastered, rank from public.leaderboard where user_id in
  (select id from auth.users where email like '%@demo.skillverse.invalid') order by rank;
