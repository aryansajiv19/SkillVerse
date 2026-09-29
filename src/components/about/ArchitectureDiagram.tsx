import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";

// Hand-drawn in viewBox units. Two layouts of the same system: wide for desktop,
// a single column for phones, where the wide one would shrink to unreadable text.

const LABEL =
  "Architecture. The browser loads a static React build from Vercel and talks straight to Supabase. " +
  "Auth issues guest or GitHub-linked sessions. PostgREST exposes tables under row-level security and a few database functions. " +
  "The chat edge function spends the caller's quota, then streams a reply from Gemini. " +
  "Passing a skill check: submit_quiz reads the private answer key, inserts completions, a trigger refreshes player_stats, " +
  "and Realtime pushes the change back to every open leaderboard.";

type Ids = { plain: string; gold: string };

const Markers = ({ ids }: { ids: Ids }) => (
  <defs>
    {([["plain", "fill-foreground/60"], ["gold", "fill-glow-completed"]] as const).map(([k, cls]) => (
      <marker key={k} id={ids[k]} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 z" className={cls} />
      </marker>
    ))}
  </defs>
);

const Arrow = ({ d, ids, gold, both }: { d: string; ids: Ids; gold?: boolean; both?: boolean }) => {
  const end = `url(#${gold ? ids.gold : ids.plain})`;
  return (
    <path
      d={d}
      fill="none"
      className={gold ? "stroke-glow-completed" : "stroke-foreground/50"}
      strokeWidth={gold ? 2 : 1.25}
      markerEnd={end}
      markerStart={both ? end : undefined}
    />
  );
};

/** Arrow label with a halo in the plate colour, so lines passing behind it break cleanly. */
const Label = ({ x, y, children, anchor = "start", size = 11.5 }: { x: number; y: number; children: ReactNode; anchor?: "start" | "middle" | "end"; size?: number }) => (
  <text
    x={x}
    y={y}
    textAnchor={anchor}
    fontSize={size}
    className="fill-muted-foreground stroke-background"
    strokeWidth={4}
    strokeLinejoin="round"
    paintOrder="stroke"
  >
    {children}
  </text>
);

const Step = ({ x, y, n, r = 9 }: { x: number; y: number; n: number; r?: number }) => (
  <g>
    <circle cx={x} cy={y} r={r} className="fill-glow-completed stroke-background" strokeWidth={3} />
    <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={r + 2} fontWeight={700} className="fill-background">
      {n}
    </text>
  </g>
);

const Frame = ({ x, y, w, h, title, size = 15, inset = 20, titleClass = "font-display" }: { x: number; y: number; w: number; h: number; title: string; size?: number; inset?: number; titleClass?: string }) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx={14} fill="none" className="stroke-foreground/25" />
    <text x={x + inset} y={y + 26} fontSize={size} fontWeight={700} className={cn("fill-foreground", titleClass)}>
      {title}
    </text>
  </g>
);

interface BoxProps {
  x: number;
  y: number;
  w: number;
  h: number;
  title?: string;
  lines?: string[];
  monoTitle?: boolean;
  monoLines?: boolean;
  dashed?: boolean;
  center?: boolean;
  compact?: boolean;
}

const Box = ({ x, y, w, h, title, lines = [], monoTitle, monoLines, dashed, center, compact }: BoxProps) => {
  const tx = center ? x + w / 2 : x + (compact ? 9 : 16);
  const titleSize = compact ? 13 : 13.5;
  const lineSize = 12;
  const first = y + (compact ? 19 : 24);
  const step = compact ? 16 : 18;
  const lineStart = title ? first + step + (compact ? 1 : 2) : first;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={9} className="fill-card stroke-foreground/30" strokeDasharray={dashed ? "5 4" : undefined} />
      {title && (
        <text x={tx} y={first} textAnchor={center ? "middle" : "start"} fontSize={monoTitle ? titleSize - 1 : titleSize} fontWeight={600} className={cn("fill-foreground", monoTitle && "font-mono")}>
          {title}
        </text>
      )}
      {lines.map((l, i) => (
        <text key={l} x={tx} y={lineStart + i * step} textAnchor={center ? "middle" : "start"} fontSize={monoLines ? lineSize - (compact ? 1 : 0.5) : lineSize} className={cn(monoLines ? "fill-foreground/85 font-mono" : "fill-muted-foreground")}>
          {l}
        </text>
      ))}
    </g>
  );
};

const Wide = ({ ids }: { ids: Ids }) => (
  <svg viewBox="0 0 960 632" role="img" aria-label={LABEL} className="hidden h-auto w-full lg:block">
    <Markers ids={ids} />

    {/* Browser */}
    <Frame x={20} y={16} w={700} h={136} title="Browser" />
    <text x={112} y={42} fontSize={12} className="fill-muted-foreground">untrusted: Postgres validates every write</text>
    <Box x={40} y={58} w={380} h={78} title="React SPA" lines={["react-query cache and supabase-js", "public catalog: questions, no answers"]} />
    <Step x={398} y={80} n={6} />
    <Box x={480} y={58} w={220} h={78} title="Web Worker" lines={["runs JavaScript tests", "2 s timeout, then killed"]} />
    <Arrow d="M420,97 H480" ids={ids} both />
    <Label x={450} y={89} anchor="middle" size={11}>code</Label>
    <Label x={450} y={115} anchor="middle" size={11}>results</Label>

    <Box x={780} y={58} w={160} h={78} title="Vercel CDN" lines={["static build", "SPA rewrite"]} />
    <Arrow d="M780,97 H720" ids={ids} />
    <Label x={750} y={89} anchor="middle" size={11}>assets</Label>

    {/* Supabase services */}
    <Frame x={20} y={196} w={700} h={420} title="Supabase" />
    <Box x={40} y={240} w={140} h={86} title="Realtime" lines={["pushes changes", "to subscribers"]} />
    <Box x={196} y={240} w={140} h={86} title="Auth" lines={["anonymous guests", "GitHub linking"]} />
    <Box x={352} y={240} w={160} h={86} title="PostgREST" lines={["tables, under RLS", "and /rpc functions"]} />
    <Box x={572} y={240} w={128} h={86} title="Edge Function" lines={["chat, on Deno", "JWT required"]} />
    <Box x={780} y={240} w={160} h={86} title="Gemini API" lines={["Google, free tier", "streams replies"]} />

    <Arrow d="M132,240 V152" ids={ids} gold />
    <Step x={132} y={174} n={5} />
    <Label x={148} y={178}>websocket</Label>
    <Arrow d="M266,152 V240" ids={ids} both />
    <Label x={276} y={178}>sign-in, JWT</Label>
    <Arrow d="M432,152 V240" ids={ids} gold />
    <Step x={432} y={174} n={1} />
    <Label x={448} y={178}>REST + RPC, with JWT</Label>
    <Arrow d="M636,152 V240" ids={ids} />
    <Label x={646} y={178}>POST, with JWT</Label>

    <Arrow d="M572,300 H512" ids={ids} />
    <Label x={542} y={292} anchor="middle" size={11}>quota</Label>
    <Arrow d="M700,272 H780" ids={ids} />
    <Label x={740} y={264} anchor="middle" size={11}>prompt</Label>
    <Arrow d="M780,296 H700" ids={ids} />
    <Label x={740} y={314} anchor="middle" size={11}>stream</Label>

    {/* Postgres */}
    <Frame x={36} y={392} w={668} h={208} title="Postgres" size={14} titleClass="font-sans" />
    <Box x={80} y={432} w={104} h={84} center title="player_stats" monoTitle lines={["XP and streaks", "per player"]} />
    <Box x={228} y={432} w={104} h={84} center title="completions" monoTitle lines={["skills and", "challenges"]} />
    <Box x={376} y={432} w={136} h={84} center lines={["check_answer", "submit_quiz", "reset_skill"]} monoLines />
    <Box x={568} y={432} w={116} h={84} center dashed title="private schema" lines={["quiz_answers", "rate_limits"]} monoLines />
    <Box x={80} y={532} w={252} h={52} center title="leaderboard view" lines={["rank = 1 + players with more XP"]} />
    <Box x={376} y={532} w={308} h={52} center title="pg_cron" lines={["nightly: purge idle guests, trim rate limits"]} />

    <Arrow d="M432,326 V432" ids={ids} gold />
    <Label x={444} y={364}>as role authenticated</Label>
    <Arrow d="M512,474 H568" ids={ids} gold />
    <Step x={540} y={474} n={2} />
    <Label x={540} y={456} anchor="middle" size={11}>reads key</Label>
    <Arrow d="M376,474 H332" ids={ids} gold />
    <Step x={354} y={474} n={3} />
    <Label x={354} y={456} anchor="middle" size={11}>insert</Label>
    <Arrow d="M228,474 H184" ids={ids} gold />
    <Step x={206} y={474} n={4} />
    <Label x={206} y={456} anchor="middle" size={11}>trigger</Label>
    <Arrow d="M132,432 V326" ids={ids} gold />
    <Label x={144} y={364}>row changes</Label>
  </svg>
);

const Narrow = ({ ids }: { ids: Ids }) => (
  <svg viewBox="0 0 360 828" role="img" aria-label={LABEL} className="h-auto w-full lg:hidden">
    <Markers ids={ids} />

    <Box x={8} y={8} w={104} h={48} compact center title="Vercel CDN" lines={["static build"]} />
    <Arrow d="M60,56 V76" ids={ids} />

    <Frame x={8} y={76} w={104} h={648} title="Browser" size={14} inset={10} />
    <Box x={14} y={108} w={92} h={84} compact title="React SPA" lines={["catalog,", "no answers"]} />
    <Step x={27} y={176} n={6} r={8} />
    <Box x={14} y={202} w={92} h={68} compact title="Web Worker" lines={["JS tests,", "2 s timeout"]} />
    {["untrusted:", "Postgres", "validates", "every write"].map((l, i) => (
      <text key={l} x={16} y={298 + i * 16} fontSize={11.5} className="fill-muted-foreground">{l}</text>
    ))}

    <Frame x={128} y={76} w={224} h={664} title="Supabase" size={14} inset={12} />
    <Box x={140} y={112} w={200} h={48} compact title="Auth" lines={["guests, GitHub linking"]} />
    <Arrow d="M112,136 H140" ids={ids} both />
    <Label x={121} y={127} anchor="middle">JWT</Label>

    <Box x={140} y={176} w={200} h={48} compact title="PostgREST" lines={["tables under RLS, /rpc"]} />
    <Arrow d="M112,200 H140" ids={ids} gold />
    <Step x={121} y={200} n={1} r={8} />
    <Label x={121} y={186} anchor="middle">RPC</Label>

    <Frame x={140} y={240} w={200} h={348} title="Postgres" size={13} inset={12} titleClass="font-sans" />
    <Box x={236} y={252} w={98} h={74} compact dashed title="private" lines={["quiz_answers", "rate_limits"]} monoLines />
    <text x={245} y={319} fontSize={11.5} className="fill-muted-foreground">no API grants</text>
    <Box x={152} y={354} w={140} h={64} compact center lines={["check_answer", "submit_quiz", "reset_skill"]} monoLines />
    <Box x={152} y={450} w={140} h={46} compact center title="completions" monoTitle lines={["one row per pass"]} />
    <Box x={152} y={530} w={140} h={46} compact center title="player_stats" monoTitle lines={["XP and streaks"]} />

    <Arrow d="M222,224 V354" ids={ids} gold />
    <Arrow d="M270,354 V326" ids={ids} gold />
    <Step x={270} y={343} n={2} r={7} />
    <Label x={282} y={347}>reads</Label>
    <Arrow d="M222,418 V450" ids={ids} gold />
    <Step x={222} y={434} n={3} r={8} />
    <Label x={236} y={438}>insert</Label>
    <Arrow d="M222,496 V530" ids={ids} gold />
    <Step x={222} y={513} n={4} r={8} />
    <Label x={236} y={517}>trigger</Label>

    <Box x={140} y={612} w={200} h={48} compact title="Realtime" lines={["pushes row changes"]} />
    <Arrow d="M222,576 V612" ids={ids} gold />
    <Arrow d="M140,636 H112" ids={ids} gold />
    <Step x={126} y={651} n={5} r={8} />
    <Label x={121} y={622} anchor="middle">live</Label>

    <Box x={140} y={676} w={200} h={48} compact title="Edge Function: chat" lines={["JWT required, spends quota"]} />
    <Arrow d="M112,700 H140" ids={ids} />
    <Label x={121} y={692} anchor="middle">POST</Label>

    <Box x={140} y={772} w={200} h={48} compact title="Gemini API" lines={["free tier, streamed replies"]} />
    <Arrow d="M240,724 V772" ids={ids} both />
    <Label x={250} y={758}>prompt, stream</Label>
  </svg>
);

export const ArchitectureDiagram = () => {
  const id = useId().replace(/:/g, "");
  return (
    <>
      <Wide ids={{ plain: `${id}-w-plain`, gold: `${id}-w-gold` }} />
      <Narrow ids={{ plain: `${id}-n-plain`, gold: `${id}-n-gold` }} />
    </>
  );
};
