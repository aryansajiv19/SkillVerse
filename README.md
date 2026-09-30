# SkillVerse

A learning platform that turns a software engineering curriculum into a navigable skill graph, builds a personalised path to any skill, and grades progress on the server.

[Live demo](https://skillverse-sable.vercel.app) · [Architecture walkthrough](https://skillverse-sable.vercel.app/about) · [Security model](SECURITY.md)

https://github.com/user-attachments/assets/14bd5aa6-041c-4cea-8e70-698c8ebd8937

## Overview

SkillVerse is for self-taught and early-career developers who know where they want to get to but not what to learn next. Skills are nodes in a prerequisite graph, rendered as a star map. Selecting any skill produces an ordered learning path, and each step has a lesson, curated free resources, practice exercises and a knowledge check.

The project began as a hackathon prototype that kept all progress in the browser. It was rebuilt as a full-stack application in which PostgreSQL is the single source of truth for progress, grading and rankings.

## Highlights

- **Server-side grading.** Quizzes are graded inside PostgreSQL against an answer key the API cannot read, and CI fails the build if any answer reaches the client bundle.
- **Leaderboard ranking at scale.** Replacing a per-row rank count with a single window function cut a rank-filtered query from 5.4 s to 3.4 ms at 10,000 players.
- **Security enforced by the database.** Row-level security and column-level grants on every table, checked by schema-wide invariant tests in CI.
- **Three layers of tests.** 63 database tests, 220 unit tests and 19 browser tests, including WCAG 2.1 AA accessibility scans.

## How it works

1. A learner selects a target skill. The client computes a topological ordering of its unmastered prerequisites and highlights that path on the map.
2. Each skill's lesson lists learning objectives and curated resources, followed by practice and a knowledge check.
3. Answers are checked one at a time through `check_answer`, then the full quiz is graded by `submit_quiz`. A pass records the completion and masters the skill in one transaction.
4. Triggers refresh the learner's XP and streak, and Supabase Realtime pushes the change to every open leaderboard.
5. Completing every skill on a career path, such as full-stack or DevOps, forms that path's constellation on the learner's map.

<table>
  <tr>
    <td><img src="docs/media/path.jpg" alt="A learning path to LLM Apps highlighted across three tracks"></td>
    <td><img src="docs/media/lesson.jpg" alt="The React lesson with objectives and resources"></td>
  </tr>
  <tr>
    <td><img src="docs/media/skill-check.jpg" alt="A server-graded knowledge check with feedback"></td>
    <td><img src="docs/media/constellations.jpg" alt="Completed career paths drawn as constellations"></td>
  </tr>
</table>

## Architecture

```mermaid
flowchart TB
    subgraph Browser
        SPA[React SPA]
        W[Web Worker<br/>code sandbox]
    end
    subgraph Supabase
        AUTH[Auth<br/>anonymous + GitHub]
        API[PostgREST<br/>RLS tables + RPCs]
        RT[Realtime]
        FN[Edge Function<br/>AI tutor]
        subgraph Postgres
            PUB[(public schema)]
            PRIV[(private schema<br/>answer key, rate limits)]
            CRON[pg_cron]
        end
    end
    GEM[Gemini API]
    SPA --> W
    SPA --> AUTH
    SPA --> API --> PUB
    API -. grading RPCs .-> PRIV
    PUB -- player_stats --> RT --> SPA
    SPA --> FN --> GEM
    FN -- per-user quota --> API
    CRON --> PUB
```

There is no custom application server. The React client talks to PostgREST, which exposes RLS-protected tables and four player-callable functions. A `private` schema, invisible to the API, holds the answer key and rate-limit state. One Deno edge function relays the AI tutor, and `pg_cron` purges inactive guest accounts nightly.

## Engineering decisions

**The database as the only authority.** Every visitor receives a real anonymous session, so the client has to be treated as hostile. Rather than add an API server, all rules live in PostgreSQL: RLS policies, grading functions and trigger-maintained statistics. The trade-off is business logic in PL/pgSQL, which is harder to unit test, so the database has its own pgTAP suite.

**Keeping answers off the client.** Questions and answers are authored in one file that no application code imports. A build step splits it into a public catalog, with options shuffled deterministically so generated files stay stable in git, and a SQL file that loads the answer key into the private schema. A CI step scans the production bundle for any answer explanation.

**Preventing forged progress.** Clients may insert into `challenge_completions`, but only the `challenge_id` column. `user_id` defaults to `auth.uid()` and `completed_at` to `now()`, so a request cannot record activity for another user or backdate it to extend a streak. Quiz completions and masteries can only be written by the grading function.

**Rank as a window function.** The first design ranked each player by counting players with more XP. That is cheap for a top-50 read, but the leaderboard is a public view and PostgREST accepts filters such as `?rank=eq.1000`, which forced the count for every row. One `rank()` pass bounds any request to a single scan of `player_stats`. Single-player reads still scan the table (about 10 ms at 45,000 players); an index range-count function is the upgrade path.

**Statement-level triggers.** XP and streaks are recomputed from completion rows by triggers that use transition tables, so a reset that deletes fifty rows refreshes the player once instead of fifty times. A database test asserts the trigger-maintained values always equal a full recomputation.

**Derived rather than stored constellations.** A career path is defined by its goal skills; its members are their prerequisite closure. Completion is a pure function of the mastered set, so it needs no new tables or policies and cannot drift out of sync when a skill is reset.

**Account takeover through identity linking.** A guest can attach an email address to its own account. With email confirmation disabled, that address counts as verified immediately, so when its real owner later signs in with GitHub, Supabase links their identity into the guest's account. Email confirmation is kept on, and OAuth uses PKCE so a crafted callback link cannot replace a visitor's session.

## Tech stack

**Frontend:** React 18, TypeScript, Vite, TanStack Query, Tailwind CSS, Three.js  
**Backend:** Supabase (PostgreSQL 17, PostgREST, Auth, Realtime, Edge Functions), PL/pgSQL, pg_cron  
**AI:** Gemini API, streamed through an edge function with a per-user quota  
**Testing:** pgTAP, Vitest, Playwright, axe  
**Infrastructure:** GitHub Actions, Vercel

## Testing

- **Database (pgTAP, 63 tests):** write permissions and cross-user access, grading, trigger consistency, streaks, rate limits, and schema-wide invariants such as RLS on every table and no function callable without a session.
- **Unit (Vitest, 220 tests):** learning-path ordering, constellation completion, catalog integrity including a reference solution for every code challenge, and the code sandbox.
- **Browser (Playwright, 19 tests):** complete learner flows against a local Supabase stack, plus axe WCAG 2.1 AA scans of 10 pages with no rules disabled.

CI runs all three suites, the production build and the answer-leak check on every push.

## Performance

Measured on local Supabase (PostgreSQL 17) with synthetic players, inside transactions that roll back. Scripts are in [`scripts/bench/`](scripts/bench).

| Query | Before | After |
|---|---:|---:|
| Leaderboard filtered by rank, 10,000 players | 5,398 ms | 3.4 ms |
| Leaderboard filtered by rank, 50,000 players | > 120 s (timeout) | 17.6 ms |
| Top 50 leaderboard, 10,000 players | | 1.8 to 2.6 ms |

Route-level code splitting keeps the 234 kB (gzipped) Three.js renderer on the map route only.

## Getting started

Requires Node.js 22+ and Docker.

```bash
npm ci
npx supabase start            # local Postgres, Auth, Realtime
cp .env.example .env.local    # values from `npx supabase status`
npm run dev
```

Tests: `npm test`, `npx supabase test db` and `npm run test:e2e`.

## Project structure

```
src/pages/               Galaxy, lessons, dashboard, leaderboard, profiles
src/hooks/useProgress.ts All data access: queries, RPCs, Realtime
src/lib/                 Auth, learning paths, constellations, code runner
content/                 Authored challenges with answers (never imported by the client)
supabase/                Migrations, generated catalog, pgTAP tests, edge function
scripts/                 Catalog generator, bundle check, benchmarks
e2e/                     Playwright tests
```

## Future work

- Question pools with randomised draws and attempt cooldowns, since per-question feedback currently reveals answers before a retake.
- An index range-count function for single-player rank lookups.
- Spaced-repetition review of mastered skills.

---

Built by [Aryan Sajiv](https://github.com/aryansajiv19). The original hackathon prototype was created with Divyansh Jhajhria.
