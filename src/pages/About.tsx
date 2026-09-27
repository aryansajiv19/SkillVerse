import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Github } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { ArchitectureDiagram } from "@/components/about/ArchitectureDiagram";
import { Button } from "@/components/ui/button";
import { skills, tracks } from "@/content/skills";

const REPO = "https://github.com/aryansajiv19/SkillVerse";
// HEAD resolves to the default branch on GitHub, so links survive the feature branch being merged and deleted.
const BRANCH = "HEAD";
const INIT = "supabase/migrations/20260926203546_init.sql";
const GRADING = "supabase/migrations/20260927020424_server_side_grading.sql";
const STATS = "supabase/migrations/20260927020426_scalable_stats.sql";
const OPS = "supabase/migrations/20260927020428_ops.sql";

const Src = ({ path }: { path: string }) => (
  <a
    href={`${REPO}/${path.endsWith("/") ? "tree" : "blob"}/${BRANCH}/${path}`}
    target="_blank"
    rel="noreferrer"
    aria-describedby="about-new-tab"
    className="rounded-sm font-mono text-[0.8125rem] text-muted-foreground underline decoration-muted-foreground/40 underline-offset-4 [overflow-wrap:anywhere] hover:text-foreground hover:decoration-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
  >
    {/* break long paths after a slash or underscore, not mid-word */}
    {(path.match(/[^/_]*[/_]?/g) ?? []).filter(Boolean).map((part, i) => <span key={i}>{i > 0 && <wbr />}{part}</span>)}
  </a>
);

const Sources = ({ paths }: { paths: string[] }) => (
  <p className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
    {paths.map((p) => <Src key={p} path={p} />)}
  </p>
);

const C = ({ children }: { children: ReactNode }) => (
  <code className="rounded bg-muted/70 px-1 py-px font-mono text-[0.875em] text-foreground">{children}</code>
);

const Section = ({ id, title, children, className = "max-w-[70ch]" }: { id: string; title: string; children: ReactNode; className?: string }) => (
  <section aria-labelledby={id} className={`mt-24 ${className}`}>
    <h2 id={id} className="scroll-mt-28 text-2xl font-bold sm:text-3xl">{title}</h2>
    {children}
  </section>
);

interface Item {
  title: string;
  body: ReactNode;
  src: string[];
}

const steps: Item[] = [
  {
    title: "Each answer is checked as you go",
    body: (
      <>
        The quiz sends your answer to <C>check_answer</C>. Postgres confirms you're signed in and the skill is unlocked,
        counts the call against a limit of 600 an hour, and returns whether you were right, the correct answer and an
        explanation. No progress is recorded yet.
      </>
    ),
    src: ["src/components/QuizChallenge.tsx", GRADING],
  },
  {
    title: "Finishing sends every answer again",
    body: (
      <>
        <C>submit_quiz</C> grades the whole set against <C>private.quiz_answers</C>, ignoring case, surrounding spaces,
        angle brackets and backticks. You pass with at most one wrong answer. The feedback from step 1 carries no weight:
        only this grade counts.
      </>
    ),
    src: [GRADING],
  },
  {
    title: "A pass is written in the same transaction",
    body: (
      <>
        The function inserts the challenge completion and, because this quiz is the skill's check, the mastery row.
        Both use <C>on conflict do nothing</C>, so a retake awards no XP. Clients have no insert grant on{" "}
        <C>skill_completions</C>, which makes this function the only way to master a skill.
      </>
    ),
    src: [GRADING],
  },
  {
    title: "Triggers refresh your stats",
    body: (
      <>
        Statement-level triggers on both completion tables call <C>private.refresh_stats</C> once per affected player.
        It recomputes XP (100 per mastered skill plus each challenge's reward), the current streak and the best streak
        from that player's rows only.
      </>
    ),
    src: [STATS],
  },
  {
    title: "Realtime updates every open leaderboard",
    body: (
      <>
        <C>player_stats</C> is in the <C>supabase_realtime</C> publication. Leaderboards subscribe to it and refetch the
        top 50 once events stop for 1.5 seconds, so a burst of passes costs each viewer one query.
      </>
    ),
    src: ["src/hooks/useProgress.ts", STATS],
  },
  {
    title: "The star lights up",
    body: (
      <>
        Your client refetches its completions and recomputes which stars are unlocked with the same rule as the
        database's <C>skill_unlocked()</C>: every prerequisite mastered. The result screen names the stars you just
        unlocked. Back on the map, the camera frames the star, it ignites from a hollow ring into a filled star in its
        constellation's colour, and new constellation lines draw out to the stars it unlocked. With reduced motion on,
        the map simply lands on the star.
      </>
    ),
    src: ["src/lib/progress.ts", "src/pages/Learn.tsx", "src/components/SkillStar.tsx"],
  },
];

const security: Item[] = [
  {
    title: "Answers never reach the browser",
    body: (
      <>
        Quizzes are written with their answers in <C>content/challenges.ts</C>, which nothing under <C>src/</C> imports.
        <C>npm run db:catalog</C> splits them: the browser gets only questions and options, and the answer key goes to{" "}
        <C>private.quiz_answers</C> through generated SQL. The <C>private</C> schema has no grants for the API roles. A
        Vitest test checks that the public catalog has no answer fields, and <C>npm run check:bundle</C> searches the
        production build for the text of every explanation.
      </>
    ),
    src: ["scripts/catalog.ts", "scripts/check-bundle.ts", "content/catalog.test.ts"],
  },
  {
    title: "Least privilege first, then row-level security",
    body: (
      <>
        Supabase grants full access to new tables by default. A migration revokes that and grants back only what the app
        uses, so anything else fails loudly with "permission denied" instead of silently matching nothing. Completions are
        readable by any signed-in player, because they feed public profiles, but only their owner can write them. For
        code challenges, clients may insert one column, <C>challenge_id</C>: <C>user_id</C> defaults to{" "}
        <C>auth.uid()</C> and <C>completed_at</C> to <C>now()</C>, so nobody can backdate activity to fake a streak. The
        policy also requires a real, unlocked, non-quiz challenge.
      </>
    ),
    src: [GRADING, INIT, "supabase/tests/01_write_rules.test.sql"],
  },
  {
    title: "Privileged functions check the caller",
    body: (
      <>
        <C>check_answer</C>, <C>submit_quiz</C> and the quota functions are <C>security definer</C>, which lets them read
        the private schema. Each pins <C>search_path = ''</C> and schema-qualifies every name, so nothing can be shadowed.
        The callable ones start with <C>private.require_user()</C>, the quiz functions re-check that the skill is
        unlocked, and none is executable by <C>anon</C>. <C>reset_skill</C> needs no extra rights, so it runs as the caller, under RLS.
      </>
    ),
    src: [GRADING, "supabase/tests/02_grading.test.sql"],
  },
  {
    title: "Rate limits live in the database",
    body: (
      <>
        <C>private.consume_quota</C> keeps a fixed-window counter per user and action. Past the limit it raises SQLSTATE{" "}
        <C>PT429</C>, which PostgREST returns as HTTP 429. The hourly limits are 600 answer checks, 120 quiz submissions
        and 40 tutor messages.
      </>
    ),
    src: [GRADING],
  },
  {
    title: "The AI tutor is behind a JWT and a quota",
    body: (
      <>
        The <C>chat</C> edge function keeps Supabase's JWT verification on, so only signed-in sessions, guests included,
        reach it. Before calling Gemini it spends one unit of quota through <C>consume_ai_quota</C> with the caller's own
        token, so Postgres enforces the limit rather than function memory. It forwards at most the last 12 messages of
        2,000 characters each, and the Gemini key never leaves the server.
      </>
    ),
    src: ["supabase/functions/chat/index.ts"],
  },
  {
    title: "Guest accounts are cleaned up",
    body: (
      <>
        Every visitor is signed in anonymously, so progress saves from the first click, and linking GitHub keeps the
        same user id. A nightly <C>pg_cron</C> job deletes guests older than 30 days who never earned XP; their rows
        cascade.
      </>
    ),
    src: ["src/lib/auth.tsx", OPS, "supabase/tests/04_ops.test.sql"],
  },
];

const tradeoffs: Item[] = [
  {
    title: "Instant feedback reveals the answer",
    body: (
      <>
        After you attempt a question, <C>check_answer</C> returns the correct answer so the explanation makes sense.
        Someone could fail a quiz once to learn it. Grading still happens on the server and the rate limit slows
        scraping; the stricter option is to reveal answers only after submitting.
      </>
    ),
    src: [],
  },
  {
    title: "Code challenges run on your machine",
    body: (
      <>
        Code tests and the game run in the browser, JavaScript inside a Web Worker, so the server can't prove a
        solution passed. It bounds the
        claim instead: the challenge must be real, in a skill you've unlocked, and counted once, with XP taken from the
        catalog. They add XP but never master or unlock a skill. Only server-graded skill checks do that.
      </>
    ),
    src: ["src/lib/runner.ts"],
  },
];

const scale: Item[] = [
  {
    title: "Stats are maintained, not recomputed",
    body: (
      <>
        The first version recalculated every player's XP and streak on each leaderboard read. Now <C>player_stats</C>{" "}
        holds one row per player, refreshed when that player's completions change. A refresh reads only that player's
        rows, at most one per skill and challenge in the catalog, so its cost doesn't grow with the player count.
      </>
    ),
    src: [STATS],
  },
  {
    title: "Rank is an index count",
    body: (
      <>
        A player's rank is one plus the number of players with more XP, counted on the <C>(xp desc, user_id)</C> index.
        Reading the top 50 walks the index instead of ranking the whole table.
      </>
    ),
    src: [STATS],
  },
  {
    title: "Bulk resets refresh once",
    body: (
      <>
        The stats triggers fire per statement with transition tables, so resetting a skill and everything built on it
        refreshes each player once per table touched, not once per deleted row.
      </>
    ),
    src: ["supabase/tests/03_stats.test.sql"],
  },
  {
    title: "Live updates are debounced",
    body: (
      <>
        Clients don't patch rows from Realtime events. They refetch after 1.5 quiet seconds, so heavy activity costs
        each open leaderboard one query, not one per event.
      </>
    ),
    src: ["src/hooks/useProgress.ts"],
  },
  {
    title: "Each page loads its own code",
    body: (
      <>
        Routes are lazy chunks. three.js loads with the galaxy only, not with this page or a shared profile link.
      </>
    ),
    src: ["src/App.tsx"],
  },
  {
    title: "There's no app server to scale",
    body: (
      <>
        The frontend is a static build on Vercel's CDN. Everything dynamic is Auth, Postgres, PostgREST, Realtime and one
        edge function, all managed by Supabase.
      </>
    ),
    src: ["vercel.json"],
  },
];

const stack: [string, string][] = [
  ["Frontend", "React 18, TypeScript in strict mode, Vite, Tailwind CSS, Radix UI primitives, TanStack Query, React Router"],
  ["Graphics", "three.js through React Three Fiber"],
  ["Backend", "Supabase: Postgres with row-level security, Auth, PostgREST, Realtime, Edge Functions on Deno, pg_cron"],
  ["AI tutor", "Google Gemini, free tier, through its OpenAI-compatible API"],
  ["Testing", "pgTAP, Vitest, Playwright, axe-core"],
  ["Delivery", "GitHub Actions, Vercel"],
];

const About = () => (
  <PageShell
    title="How it's built"
    width="max-w-5xl"
    subtitle={
      <>
        SkillVerse maps {skills.length} developer skills in {tracks.length} tracks as stars. Each star has a skill check,
        a short quiz graded by the database. Pass it to light the star; a star unlocks once every star it builds on is lit.
      </>
    }
  >
    <span id="about-new-tab" hidden>Opens GitHub in a new tab</span>
    <div className="flex flex-wrap gap-3">
      <Button asChild size="lg"><Link to="/">Back to the galaxy</Link></Button>
      <Button asChild size="lg" variant="outline">
        <a href={REPO} target="_blank" rel="noreferrer" aria-describedby="about-new-tab"><Github aria-hidden />Source on GitHub</a>
      </Button>
    </div>

    <Section id="architecture" title="Architecture" className="max-w-none">
      <p className="mt-4 max-w-[70ch] leading-relaxed text-foreground/85">
        A static React app talks straight to Supabase. There's no custom API server: Postgres enforces the rules itself,
        through row-level security and a handful of functions, and one edge function relays the AI tutor to Gemini.
      </p>
      <figure className="mt-8 max-w-[480px] lg:max-w-none">
        <div className="relative z-20 rounded-2xl border bg-background p-2 sm:p-4 lg:p-6">
          <ArchitectureDiagram />
        </div>
        <figcaption className="mt-4 flex max-w-[70ch] gap-3 text-sm leading-relaxed text-muted-foreground">
          <span aria-hidden className="mt-2 h-0.5 w-6 shrink-0 bg-[hsl(var(--glow-completed))]" />
          <span>
            Gold arrows trace a passing skill check, numbered to match the steps below. The private schema has no API
            grants, so only database functions can read the answer key.
          </span>
        </figcaption>
      </figure>
    </Section>

    <Section id="skill-check" title="What happens when you pass a skill check">
      <ol role="list" className="relative mt-8 space-y-9 before:absolute before:bottom-3 before:left-[15px] before:top-3 before:w-px before:bg-[hsl(var(--glow-completed)/0.35)]">
        {steps.map((s, i) => (
          <li key={s.title} className="relative pl-14">
            <span className="absolute left-0 top-0 grid h-8 w-8 place-items-center rounded-full bg-[hsl(var(--glow-completed))] font-display text-sm font-bold text-background ring-4 ring-background">
              {i + 1}
            </span>
            <h3 className="pt-0.5 text-lg font-semibold">{s.title}</h3>
            <p className="mt-2 leading-relaxed text-foreground/85">{s.body}</p>
            <Sources paths={s.src} />
          </li>
        ))}
      </ol>
    </Section>

    <Section id="security" title="Security model">
      <p className="mt-4 leading-relaxed text-foreground/85">
        The browser is treated as untrusted. Every rule that matters runs in Postgres, where a modified client can't
        skip it, and pgTAP tests try to break each one.
      </p>
      <div className="mt-8 space-y-8">
        {security.map((s) => (
          <div key={s.title}>
            <h3 className="text-lg font-semibold">{s.title}</h3>
            <p className="mt-2 leading-relaxed text-foreground/85">{s.body}</p>
            <Sources paths={s.src} />
          </div>
        ))}
      </div>
      <div className="mt-12 border-l-2 border-[hsl(var(--glow-completed)/0.5)] pl-6">
        <h3 className="text-xl font-bold">Trade-offs</h3>
        <div className="mt-4 space-y-6">
          {tradeoffs.map((s) => (
            <div key={s.title}>
              <h4 className="font-semibold">{s.title}</h4>
              <p className="mt-1.5 leading-relaxed text-foreground/85">{s.body}</p>
              {s.src.length > 0 && <Sources paths={s.src} />}
            </div>
          ))}
        </div>
      </div>
    </Section>

    <Section id="scalability" title="Scalability" className="max-w-none">
      <div className="mt-8 grid gap-x-12 gap-y-9 md:grid-cols-2">
        {scale.map((s) => (
          <div key={s.title} className="max-w-[60ch]">
            <h3 className="text-lg font-semibold">{s.title}</h3>
            <p className="mt-2 leading-relaxed text-foreground/85">{s.body}</p>
            <Sources paths={s.src} />
          </div>
        ))}
      </div>
    </Section>

    <Section id="testing" title="Testing and CI">
      <div className="mt-6 space-y-6 leading-relaxed text-foreground/85">
        <div>
          <strong className="font-semibold text-foreground">pgTAP</strong> suites each run inside a rolled-back transaction,
          covering write rules, grading, stats, operations and privilege boundaries. The write-rule, grading and security
          suites act as the <C>authenticated</C> role with forged JWT claims. They
          assert things like "cannot backdate activity to fake a streak", "cannot peek at answers for a locked skill" and
          "incremental stats match a full recompute".
          <Sources paths={["supabase/tests/"]} />
        </div>
        <div>
          <strong className="font-semibold text-foreground">Vitest</strong> checks the catalog: unique ids, prerequisites
          that exist, an acyclic skill graph, exactly one skill check per skill, no answers in the public catalog, and
          shuffled options that still point at the right answer. Reference solutions prove every JavaScript challenge is
          solvable and that its starter code fails. Unlock, level and runner rules have their own tests.
          <Sources paths={["content/catalog.test.ts", "src/lib/progress.test.ts", "src/lib/runner.test.ts"]} />
        </div>
        <div>
          <strong className="font-semibold text-foreground">End-to-end tests</strong> drive the real app in Chromium
          against a local Supabase: a fresh guest passes a skill check, fails one, solves a code challenge, resets a skill
          and its dependents, renames, and checks the leaderboard. Every main page is scanned with axe-core for WCAG 2.1 AA
          violations, with no rules disabled.
          <Sources paths={["e2e/", "playwright.config.ts"]} />
        </div>
        <div>
          <strong className="font-semibold text-foreground">GitHub Actions</strong> runs on every pull request and push
          to main, in three jobs. The first typechecks, lints, runs Vitest, regenerates the catalog and fails if it differs
          from the committed files, builds, and runs <C>check:bundle</C> to prove no answers shipped. The second starts
          Supabase and runs the Playwright and axe suite. The third starts Postgres with the Supabase CLI and runs pgTAP.
          <Sources paths={[".github/workflows/ci.yml"]} />
        </div>
      </div>
    </Section>

    <Section id="stack" title="Stack">
      <dl className="mt-6 space-y-4">
        {stack.map(([term, value]) => (
          <div key={term} className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:gap-6">
            <dt className="font-semibold">{term}</dt>
            <dd className="text-foreground/85">{value}</dd>
          </div>
        ))}
      </dl>
    </Section>

    <Section id="credits" title="Credits">
      <p className="mt-4 leading-relaxed text-foreground/85">
        Started as a hackathon MVP built by Divyansh Jhajhria for our team; rebuilt into a full-stack app by Aryan Sajiv.
      </p>
      <p className="mt-3">
        <a
          href={REPO}
          target="_blank"
          rel="noreferrer"
          aria-describedby="about-new-tab"
          className="rounded-sm font-medium underline decoration-muted-foreground/50 underline-offset-4 hover:decoration-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          github.com/aryansajiv19/SkillVerse
        </a>
      </p>
    </Section>
  </PageShell>
);

export default About;
