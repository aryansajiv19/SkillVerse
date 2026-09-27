# Security

## Reporting a vulnerability

Please report vulnerabilities privately through GitHub:
[Security → Report a vulnerability](https://github.com/aryansajiv19/SkillVerse/security/advisories/new).
Don't open a public issue. Include steps to reproduce and what an attacker gains.

This is a portfolio project maintained by one person. I'll acknowledge reports within a week and credit you in the
advisory unless you'd rather stay anonymous.

## Threat model

SkillVerse is a public web app. Every visitor gets an anonymous guest account, so anyone can hold a valid session
and call the API directly. The client is treated as fully attacker-controlled.

| Who | How they reach the backend |
|---|---|
| Visitor without a session | Supabase publishable key, `anon` role |
| Guest | Anonymous sign-in, `authenticated` role (`is_anonymous` in the JWT) |
| Linked account | Guest who linked GitHub (same user id), `authenticated` role |
| Script | Any of the above, calling PostgREST, Realtime and the Edge Function directly |

What we protect, in order:

1. **Other people's accounts and progress.** Nobody can write, delete or take over another player's data.
2. **Private data.** The quiz answer key, rate-limit state and account details stay server-side.
3. **Service health.** No single request is expensive, and one account can't use up the AI tutor's free Gemini
   quota.
4. **Leaderboard integrity**, as far as a public, guest-first learning app allows (see trade-offs).

Out of scope: the Supabase and Vercel platforms themselves, and leaked owner or `service_role` credentials.

## What is enforced where

### Database (the source of truth)

- **RLS on every table, least-privilege grants.** Visitors without a session can only read the catalog. Players can
  read public activity, rename themselves, insert a code or game completion (only the `challenge_id` column), and
  delete their own completions. Nothing else: no direct writes to masteries, quiz completions, stats or profiles.
- **Server-side values.** `user_id` defaults to `auth.uid()` and `completed_at` to `now()`, and clients have no
  column grant to set either, so progress can't be forged for someone else or backdated to fake a streak.
- **Prerequisites.** Code challenges, `check_answer` and `submit_quiz` all require the skill to be unlocked.
- **Quizzes are graded in Postgres.** The answer key lives in the `private` schema, which the API can't reach.
  `submit_quiz` grades, records the completion and masters the skill in one transaction.
- **Derived stats.** `player_stats` (XP, streaks) is written only by triggers from completion rows, so undoing and
  redoing work can't farm XP.
- **Privileged functions are few and pinned.** Every `SECURITY DEFINER` function sets `search_path = ''`. The only
  ones players can call are `check_answer`, `submit_quiz` and `consume_ai_quota`, and each checks `auth.uid()`.
  Visitors without a session can call no RPC at all.
- **Rate limits and input bounds.** Per-account fixed windows (`PT429`, HTTP 429): 600 answer checks and 120 quiz
  submissions an hour, 40 tutor messages an hour. Answers are capped at 200 characters and 50 per submission.
- **Bounded reads.** Players can filter and sort the leaderboard view on any column, so `rank` is one window pass
  over `player_stats`, not a count per row. Any read costs at most one pass over the table, and the top-N read stops
  after N rows of the XP index.
- **Views run as the caller** (`security_invoker`), and Realtime only publishes RLS-protected `player_stats`.
- **Guest cleanup.** A nightly `pg_cron` job deletes guests older than 30 days that never earned XP.

`supabase/tests/05_security.test.sql` asserts these as schema-wide invariants (RLS everywhere, exact grants,
pinned search paths, no anonymous RPC, …), so a new table or function that skips them fails CI.

### Edge Function (`chat`)

- JWT verification at the gateway, then the caller's own token spends one unit of their quota through
  `consume_ai_quota`. A publishable key alone gets a 401.
- Validates the body (1 MB cap, shape checks, last 12 turns, 2,000 characters each) before spending quota. The cap
  counts bytes as they arrive, so a request without `Content-Length` (chunked, HTTP/2) can't make it buffer more.
- The Gemini key is a function secret and never reaches the browser. Errors are logged server-side; callers get a
  generic message.
- CORS allows the origin in `ALLOWED_ORIGIN` (default `*`). Auth is a bearer token, not a cookie, so CORS is not
  what stops cross-site abuse; setting it just keeps other sites' pages from using the tutor.

### Auth

- Guests and GitHub only. Email signup is off.
- **Email confirmations stay on.** A guest can still add an email to its own account (`PUT /auth/v1/user`), and
  Supabase Auth allows that whether or not the email provider is enabled. With confirmations off, the address counts
  as verified at once, so when its real owner later uses "Sign in with GitHub", Supabase links their GitHub identity
  into the attacker's account (pre-account takeover). With confirmations on, the change waits for a link sent to that
  mailbox.

### Client

Nothing in the browser is trusted, and the UI enforces nothing the database doesn't. Two things still matter:

- **PKCE OAuth flow.** A GitHub callback only completes in the browser that started it. With the default implicit
  flow, a link with tokens in its `#fragment` would silently replace a visitor's session (and a guest's progress
  with it) with the link author's account.
- **Same-origin redirects.** OAuth `redirectTo` is always `window.location.origin + "/settings"`, and Supabase Auth
  only redirects to the site URL or the allow-list.

## Known trade-offs

### Quiz feedback

After each answer, `check_answer` says whether it was right and shows the correct answer and an explanation. That's
the point of a learning app, but it means someone can answer a quiz badly, read the feedback, and pass on the retake,
or script the same thing. Grading on the server still guarantees the prerequisite order and the XP ceiling; it
doesn't prove the learner knew the answers the first time.

We considered stateful attempts (lock the first answer per question, grade the recorded attempt). Because a failed
attempt costs nothing, that only turns a scripted pass into a scripted fail followed by a pass, while adding state
for abandoned and multi-tab attempts. Not worth it. If quiz results ever carry real weight, the fix is a larger
question pool with random draws and a cooldown between attempts.

### Code challenges are self-reported

JavaScript, HTML and CSS challenges run in the browser (a Web Worker with a timeout), so the server can't verify a
pass. It only checks that the challenge exists and its skill is unlocked. Running learner code server-side would need
a sandbox this project doesn't have.

### The leaderboard is best-effort

Together, the two points above mean a script can max out an account. XP per account is bounded by the catalog
(4,340 XP today), and anonymous sign-ups are limited to 30 an hour per IP, but that doesn't stop a determined
person filling the top of the board with bots. If that happens: enable Cloudflare Turnstile for anonymous sign-ins
(Supabase supports it natively), and consider ranking only GitHub-linked accounts.

### Activity is public

Usernames, XP, masteries and completion timestamps are visible to every signed-in player, like a contribution graph.
Nothing else about an account (GitHub email, identity data) is exposed through the API. Guests are pseudonymous.

### Tutor quota is per account

Each guest has its own 40-message hourly quota, so someone creating many guests can use up the shared Gemini free
tier. Gemini's own limit is the global ceiling. When it's hit, everyone gets "try again in a minute" until it resets.
No money is at risk on the free tier.

## Deployment checklist

For the hosted Supabase project (the dashboard doesn't read `config.toml`):

- Auth → Providers → Email: **Confirm email on** (see Auth above). This is the setting that stops a guest claiming
  an address it doesn't own; turning the provider off does not. Email signups off.
- Auth → Providers: anonymous sign-ins on, manual linking on, GitHub on.
- Auth → URL configuration: site URL = the production URL. Add preview URLs to the allow-list only if needed.
- Optional: Turnstile or hCaptcha for anonymous sign-ins.
- Function secrets: `GEMINI_API_KEY`, and `ALLOWED_ORIGIN` = the production origin.
- Only the publishable key goes in Vercel env vars. Never the `service_role` or secret key.
- After migrating, run the security advisors (`supabase db advisors` or the dashboard) and `supabase test db`.
