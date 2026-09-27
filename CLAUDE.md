# SkillVerse

Vite + React 18 + TypeScript (strict) SPA on Supabase. See README.md for the architecture and SECURITY.md for the threat model.

## Commands

```bash
npx supabase start            # local stack (Docker). db reset rebuilds from migrations + supabase/catalog.sql
npm run dev                   # http://localhost:8080 (needs .env.local, see .env.example)
npm run typecheck && npm run lint && npm test
npx supabase test db          # pgTAP
npm run test:e2e              # Playwright + axe (starts its own dev server on 8086)
npm run build && npm run check:bundle
```

## Invariants (CI enforces most of these)

- **Answers never ship.** `content/challenges.ts` is the authoring source and contains answers. Nothing under `src/` may import it. The app imports `src/content/challenges.ts`, which re-exports the generated `challenges.gen.ts`.
- **Regenerate after content edits.** Run `npm run db:catalog` and commit both `src/content/challenges.gen.ts` and `supabase/catalog.sql`. Every JS code challenge needs a reference solution in `content/catalog.test.ts`.
- **The database is the authority.** New public tables need RLS, explicit grants and a policy; new RPCs must be revoked from `public, anon`. `supabase/tests/05_security.test.sql` holds allow-lists that fail when these are skipped: update them deliberately.
- **Migrations are append-only once deployed.** Add a new file with `npx supabase migration new <name>`; don't edit released ones.
- **XP and streaks are derived.** Only triggers write `player_stats`. Never compute XP client-side for display beyond reading the `leaderboard` view.
- **All data access goes through `src/hooks/useProgress.ts`.**

## Conventions

- Design language: "star atlas". Navy background, track hues from `src/content/skills.ts`, gold (`--glow-completed`) for mastery, Syne for display and Figtree for body. Motion is calm and respects `prefers-reduced-motion`. `src/contrast.test.ts` guards WCAG AA for the theme tokens.
- Fixed UI on phones sits above the tab bar via `--bottom-bar-height`. The tutor launcher is bottom-right, 56px, 24px in.
- Copy is sentence case, plain verbs, and specific. No exclamation marks in UI chrome.
- E2E selectors live in `e2e/helpers.ts`. Update them there when UI copy or roles change.
