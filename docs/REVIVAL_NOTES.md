# SkillVerse revival: working notes

Handoff doc for the rebuild on branch `revive`. Last updated 2026-09-26.

## Goal

Bring the hackathon MVP (built by Divyansh Jhajhria, generated with Lovable) back to life as a real
full-stack portfolio project: Supabase backend, more content, visual polish, tests + CI, live demo on Vercel.

Decisions made with Aryan:

| Question | Decision |
|---|---|
| Backend | Supabase (Auth + Postgres + RLS + Edge Function), keep the Vite/React frontend |
| AI | Free only: Google Gemini free tier via Edge Function. Hidden/graceful if no key |
| Repo | Clean up `aryansajiv19/SkillVerse` in place on a branch, keep teammate history, open a PR |
| Improvements | More skill tracks, visual polish, tests + CI, live demo deploy |
| Supabase hosting | New **free** org (Aryan is creating it). The existing org is Pro with 3 projects, so a 4th would cost money |

## What the original repo had (and what was broken)

- Code lived under `Desktop/Hackathon Project/`; last 12 commits were "Delete X"; `.env` committed.
- Frontend only: all progress in `localStorage`, fake leaderboard with hardcoded demo users.
- `progressSystem.ts` called `require()` in an ESM app, so completing a skill would throw.
- Finishing any challenge marked the whole skill mastered (+100 XP).
- JS "tests" matched substrings and fell through to `return true`, so any code passed.
- AI chat pointed at Lovable's managed Supabase + `LOVABLE_API_KEY` (dead). A second "AI guide" was canned replies.
- "Galaxy Builder" game had no component; `SearchLearningPath` referenced skill ids that didn't exist.
- `npm install` failed on a peer-dep conflict from an unused package; TypeScript `strict` was off.

## What's done

### Repo
- Flattened to repo root (git history preserved via `git mv`), `.env` untracked and gitignored, `.env.example` added.
- Removed Lovable tagger/branding, unused deps (drei, postprocessing, zod, date-fns, …) and ~40 unused shadcn components.
- `npm install` works without flags. TS `strict` + `noUnused*` on, 0 errors. ESLint: 0 errors.

### Content: `src/content/`
- `skills.ts`: 4 tracks as constellations (Frontend/Lyra, Backend/Orion, Data & AI/Cygnus, DevOps & Cloud/Draco),
  28 skills with cross-track prerequisites and map positions. Single source of truth.
- `challenges.ts`: every skill has one **skill check** quiz (`<skill>-check`). Passing it masters the skill.
  Plus 11 code challenges (JS/HTML/CSS) with real tests and the Planet Debugger game. 40 challenges total.
- `cheatsheets.ts`: moved from the old utils.

### Database: `supabase/`
- `migrations/*_init.sql`: `skills`, `challenges` (server copy of the catalog), `profiles`,
  `skill_completions`, `challenge_completions`, a `leaderboard` view (XP/level/streak derived, never stored).
- RLS: activity is publicly readable (it feeds the leaderboard); writes are owner-only and validated:
  can't skip prerequisites, can't master without passing the skill check, can't invent XP or challenge ids.
- Anonymous sign-ins: every visitor gets a guest account automatically (trigger creates a profile).
- `catalog.sql` is **generated** from `src/content` by `npm run db:catalog`; used as the seed file.
- `tests/rls.test.sql`: pgTAP, 10 tests, all passing (`npx supabase test db`).
- `functions/chat`: Gemini (OpenAI-compatible endpoint), JWT required, input size limits, 503 if no key.

### Frontend
- `src/lib/supabase.ts` client, `src/lib/auth.tsx` (auto guest session, save account, sign in/out),
  `src/hooks/useProgress.ts` (react-query: completions, stats, mutations, leaderboard, rename).
- `src/lib/progress.ts`: pure rules (unlocking, levels, next up, achievements).
- `src/lib/runner.ts` + `runner.worker.ts`: JS runs in a Web Worker with a 2s timeout; HTML/CSS checked via
  `DOMParser` / `CSSStyleSheet`.
- Pages rewritten: Galaxy (`Index`), Learn (skill list → skill → challenge), Dashboard (merged old Progress),
  Leaderboard (real data), Account (was Settings). Skills page folded into Learn.
- New design direction: star-atlas navy, per-track constellation colours, Syne + Figtree, always-visible star
  labels (hollow = available, filled = mastered, dim = locked), first-visit intro with track picker, HUD.

### Tests
- Vitest: 38 tests (`npm test`). Catalog integrity (ids, prerequisites exist, acyclic, one check per skill,
  answerable questions), reference solutions proving every JS challenge is passable and starter code fails,
  unlock/level/achievement rules, runner behaviour.

## Status checks at this checkpoint

| Check | Result |
|---|---|
| `npm run typecheck` | ✅ 0 errors |
| `npm run lint` | ✅ 0 errors (4 fast-refresh warnings) |
| `npm test` | ✅ 38/38 |
| `npx supabase test db` | ✅ 10/10 |
| `npm run build` | ✅ |
| App loads against local Supabase, guest session created, map renders | ✅ (checked in browser) |
| Quiz → master flow, code challenge flow, save account, AI tutor in browser | ⏳ not yet clicked through |

## Next steps (in order)

1. **Hosted Supabase**: once the free org exists, create project `skillverse`, apply the migration + `catalog.sql`,
   enable anonymous sign-ins, turn off email confirmation, set Site URL, run `get_advisors`.
2. **Click-through QA** in the browser: pass HTML check → CSS/JS unlock, code challenge claim, reset skill,
   rename, save account, sign out/in, leaderboard. Mobile widths.
3. **Visual fixes seen in the first screenshot**: bottom constellation labels (Draco/Cygnus) collide with the
   focus bar and HUD; retune the Three.js background (`src/components/galaxy/`) from purple streaks to the navy atlas palette.
4. **AI tutor**: Aryan gets a free key at https://aistudio.google.com/apikey →
   `npx supabase secrets set GEMINI_API_KEY=...` → `npx supabase functions deploy chat`.
5. **CI**: GitHub Actions: install, typecheck, lint, test, build, `db:catalog` freshness check
   (`git diff --exit-code supabase/catalog.sql`), and pgTAP via `supabase start` + `supabase test db`.
6. **Deploy** to Vercel with SPA rewrites; add the prod URL to Supabase auth redirect URLs.
7. **README** rewrite: screenshots/GIF, architecture diagram, security model, how to run, credit to the original team.
8. Open the PR from `revive` → `main`.

## Running it locally

```bash
npm install
npx supabase start          # needs Docker; prints the local URL + publishable key
cp .env.example .env.local  # fill in the values from `supabase status`
npm run dev                 # http://localhost:8080
```

`npx supabase db reset` rebuilds the local DB from the migration + `catalog.sql`.
After editing `src/content`, run `npm run db:catalog` and commit `supabase/catalog.sql`.

## Known limitations / deliberate shortcuts

- Leaderboard view is recomputed on every read (fine at this scale; materialize if it grows). Streak days are UTC.
- Quiz answers ship in the client bundle; the server can only bound XP to the catalog, not prove a quiz was solved.
- Anonymous users accumulate; add a scheduled cleanup of stale guests before real traffic.
- Username generation is `cadet_` + 10 hex chars of md5(user id): collision is possible but negligible.

---

## Session 2 (2026-09-27): checkpoint-2 status

Done since checkpoint-1 (see commit e50dba7 / tag `checkpoint-2`):
- 164-agent review of checkpoint-1 with 3-skeptic verification; content/security/logic fixes applied in the v2 foundation.
- DB v2: server-side quiz grading (private answer key), least-privilege grants, trigger-maintained `player_stats`,
  indexed leaderboard, Realtime, cascading `reset_skill`, per-user rate limits, pg_cron guest purge. 44 pgTAP tests pass.
- Content pipeline: `content/` authoring → `scripts/catalog.ts` → public catalog (no answers, shuffled options) + SQL.
  `npm run check:bundle` proves no answers ship. 41 Vitest tests pass.
- Auth hardened; GitHub linking replaces unverified email upgrade. Code-split routes, error boundary, page titles.
- CI workflow (`.github/workflows/ci.yml`) and `vercel.json` added. Playwright + axe installed (not yet used).

Open items, in order:
1. **Security review flag**: an automated commit review reported a possible authorization bypass in
   `supabase/migrations/20260927020424_server_side_grading.sql`. Investigate before deploying.
2. Remaining confirmed review findings not yet fixed: runner (`deepEqual` key check, `checkCss` cascade/selector
   lists, worker `onerror`, overlapping runs), CodeEditor Tab keyboard trap, a11y-1 tests, PlanetDebugger level 3,
   mobile nav/HUD overlaps, intro dialog focus trap, AI tutor focus/Escape, contrast issues.
   Full list: review workflow result (task w8kybuvot output).
3. Planned fan-out (worktrees): galaxy pan/zoom + ignite animation; learn fixes + resources; public profiles +
   heatmap + live leaderboard; mobile nav + ⌘K + accessible tutor + OG image; About page; Playwright E2E in CI.
4. Blocked on Aryan: free Supabase org (for hosting), optional Gemini key, GitHub OAuth app (for account linking).
5. Deploy (Vercel + hosted Supabase), README rewrite, push `revive`, open PR.
