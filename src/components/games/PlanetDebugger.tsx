import { useEffect, useRef, useState } from "react";
import { Check, Lightbulb, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CodeArea } from "@/components/CodeEditor";
import type { GameChallenge } from "@/content/challenges";
import { deepEqual, runLogsSandboxed, type RunOutput } from "@/lib/runner";
import { cn } from "@/lib/utils";

interface Planet {
  name: string;
  code: string;
  /** Runs after the snippet, e.g. to call the function it defines */
  call?: string;
  /** What console.log should print once the bug is fixed. Any fix that prints this passes. */
  expected: string[];
  hint: string;
  lesson: string;
}

// eslint-disable-next-line react-refresh/only-export-components
export const planets: Planet[] = [
  {
    name: "Mercury",
    code: "function greet(name) {\n  console.log('Hello ' + nam);\n}\n",
    call: "greet('Ada'); greet('Lin')",
    expected: ["Hello Ada", "Hello Lin"],
    hint: "Read the error message. Which variable doesn't exist?",
    lesson: "A misspelled variable is a ReferenceError: there's no binding called nam.",
  },
  {
    name: "Venus",
    code: "const moons = ['Io', 'Europa', 'Ganymede'];\nfor (let i = 0; i <= moons.length; i++) {\n  console.log(moons[i]);\n}\n",
    expected: ["Io", "Europa", "Ganymede"],
    hint: "Indexes run from 0 to length - 1. What does moons[3] give you?",
    lesson: "An off-by-one loop: with <= the last pass reads past the end and prints undefined.",
  },
  {
    name: "Earth",
    code: "const pilot = { name: 'Bob', age: 30 };\nconsole.log(pilot.name + ' is ' + pilot.Age);\n",
    expected: ["Bob is 30"],
    hint: "Property names are case-sensitive.",
    lesson: "Reading a property that doesn't exist gives undefined, not an error, so typos in property names hide.",
  },
  {
    name: "Mars",
    code: "function double(n) {\n  n * 2;\n}\nconsole.log(double(4));\n",
    expected: ["8"],
    hint: "What does a function give back when it has no return statement?",
    lesson: "A function without return gives back undefined. Arrow functions with braces need return too.",
  },
  {
    name: "Jupiter",
    code: "const fuel = 40;\nif (fuel = 100) {\n  console.log('Full tank');\n} else {\n  console.log('Refuel');\n}\n",
    expected: ["Refuel"],
    hint: "One = assigns a value. === compares two values.",
    lesson: "if (fuel = 100) assigns instead of comparing. With const it throws; with let it would always be true.",
  },
];

// eslint-disable-next-line react-refresh/only-export-components
export const isRepaired = (planet: Planet, out: RunOutput) => !out.error && deepEqual(out.logs, planet.expected);

const clock = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

/** Ticks on its own so the editor doesn't re-render every second. */
const Stopwatch = ({ since }: { since: number }) => {
  const [now, setNow] = useState(since);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="font-mono tabular-nums">{clock(now - since)}</span>;
};

const Output = ({ title, lines, error, tone }: { title: string; lines: string[]; error?: string; tone?: "bad" | "good" }) => (
  <div className="min-w-0 space-y-1.5">
    <p className="text-sm text-muted-foreground">{title}</p>
    <pre className={cn(
      "min-h-[3.25rem] overflow-x-auto rounded-xl border bg-background/50 px-4 py-3 font-mono text-[0.8rem] leading-relaxed",
      tone === "bad" ? "border-destructive/50" : tone === "good" ? "border-emerald-400/50" : "border-border/60",
    )}>
      {lines.length || error ? lines.join("\n") : <span className="text-muted-foreground">(nothing printed)</span>}
      {error && <span className="block text-red-300">{error}</span>}
    </pre>
  </div>
);

type Phase = { at: "intro" } | { at: "playing"; level: number; since: number } | { at: "won"; ms: number };

export const PlanetDebugger = ({ challenge, done, claiming, onPass }: {
  challenge: GameChallenge;
  done: boolean;
  claiming: boolean;
  onPass: () => void;
}) => {
  const [phase, setPhase] = useState<Phase>({ at: "intro" });
  const [code, setCode] = useState(planets[0].code);
  const [output, setOutput] = useState<RunOutput | null>(null);
  const [fixed, setFixed] = useState(false);
  const [hint, setHint] = useState(false);
  const [running, setRunning] = useState(false);
  const busy = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const repaired = useRef<HTMLParagraphElement>(null);

  // After each step, move focus to the new heading or result so keyboard and screen reader users follow along.
  useEffect(() => {
    if (phase.at !== "intro") (phase.at === "playing" && fixed ? repaired : heading).current?.focus();
  }, [phase, fixed]);

  const goTo = (level: number, since: number) => {
    setPhase({ at: "playing", level, since });
    setCode(planets[level].code);
    setOutput(null);
    setFixed(false);
    setHint(false);
  };

  if (phase.at === "intro" || phase.at === "won") {
    const won = phase.at === "won";
    return (
      <div className="glass-panel space-y-6 rounded-2xl p-5 sm:p-8">
        <PlanetTrack current={won ? planets.length : -1} />
        <div className="space-y-2">
          <h2 ref={heading} tabIndex={-1} className="text-2xl font-extrabold outline-none sm:text-3xl">
            {won ? `All five planets repaired in ${clock(phase.ms)}` : challenge.title}
          </h2>
          <p className="max-w-prose leading-relaxed text-foreground/80">
            {won
              ? "Typos, off-by-one loops, missing returns and stray assignments. You'll spot them faster in real code now."
              : "Five planets, five classic JavaScript bugs. Fix each snippet so it prints the expected output. Any fix that prints it counts, and there's no time limit."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {won && !done && (
            <Button size="lg" onClick={onPass} disabled={claiming}>{claiming ? "Saving…" : `Claim +${challenge.xpReward} XP`}</Button>
          )}
          <Button size="lg" variant={won && !done ? "outline" : "default"} onClick={() => goTo(0, Date.now())}>
            {won ? "Play again" : "Start repairs"}
          </Button>
          {done && <p className="text-sm text-muted-foreground">You've already claimed the XP for this game.</p>}
          {!done && !won && <p className="text-sm text-muted-foreground">+{challenge.xpReward} XP when every planet is repaired</p>}
        </div>
      </div>
    );
  }

  const planet = planets[phase.level];
  const last = phase.level === planets.length - 1;

  const check = async () => {
    if (busy.current) return;
    busy.current = true;
    setRunning(true);
    try {
      const out = await runLogsSandboxed(code, planet.call);
      setOutput(out);
      if (isRepaired(planet, out)) setFixed(true);
    } finally {
      busy.current = false;
      setRunning(false);
    }
  };

  return (
    <div className="glass-panel space-y-6 rounded-2xl p-5 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PlanetTrack current={phase.level} fixed={fixed} />
        <p className="text-sm text-muted-foreground">Time <Stopwatch since={phase.since} /></p>
      </div>

      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">Planet {phase.level + 1} of {planets.length}</p>
        <h2 ref={heading} tabIndex={-1} className="text-2xl font-extrabold outline-none">{planet.name}</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Output title="It should print" lines={planet.expected} />
          {planet.call && (
            <p className="text-xs leading-relaxed text-muted-foreground">
              Then the game calls {planet.call.split("; ").map((c, i) => (
                <span key={c}>{i > 0 && " and "}<code className="whitespace-nowrap font-mono text-foreground/85">{c}</code></span>
              ))}
            </p>
          )}
        </div>
        <Output title={output ? "Your code printed" : "Run the code to see what it prints"} lines={output?.logs ?? []} error={output?.error}
          tone={output ? (fixed ? "good" : "bad") : undefined} />
      </div>

      {fixed ? (
        <div className="space-y-4 rounded-xl border border-emerald-400/40 bg-emerald-400/5 p-4 sm:p-5">
          <p ref={repaired} tabIndex={-1} className="font-semibold outline-none">
            <Check className="mr-1.5 inline h-4 w-4 text-emerald-300" aria-hidden />{planet.name} repaired.
          </p>
          <p className="text-sm leading-relaxed text-foreground/80">{planet.lesson}</p>
          <Button onClick={() => (last ? setPhase({ at: "won", ms: Date.now() - phase.since }) : goTo(phase.level + 1, phase.since))}>
            {last ? "See your time" : `On to ${planets[phase.level + 1].name}`}
          </Button>
        </div>
      ) : (
        <>
          <CodeArea value={code} onChange={setCode} onRun={check} label={`${planet.name} code`} className="min-h-[180px]" />
          <div className="flex flex-wrap gap-3">
            <Button onClick={check} disabled={running}><Play aria-hidden />{running ? "Running…" : "Run the fix"}</Button>
            {hint ? (
              <p className="flex items-center gap-2 text-sm text-foreground/80"><Lightbulb className="h-4 w-4 shrink-0 text-[hsl(var(--glow-completed))]" aria-hidden />{planet.hint}</p>
            ) : (
              <Button variant="outline" onClick={() => setHint(true)}><Lightbulb aria-hidden />Show a hint</Button>
            )}
          </div>
          {output && <p role="status" className="sr-only">{output.error ? `Error: ${output.error}` : "Output doesn't match yet."}</p>}
        </>
      )}
    </div>
  );
};

/** One dot per planet, drawn like the galaxy map's stars: filled = repaired, ring = current, dim = still broken. */
const PlanetTrack = ({ current, fixed = false }: { current: number; fixed?: boolean }) => (
  <ol className="flex items-center gap-2" aria-label="Planets">
    {planets.map((p, i) => {
      const repaired = i < current || (i === current && fixed);
      return (
        <li key={p.name} className="grid h-4 w-4 place-items-center" title={p.name}>
          <span className={cn(
            "rounded-full",
            repaired ? "h-3.5 w-3.5 bg-[hsl(var(--glow-completed))] shadow-[0_0_10px_hsl(var(--glow-completed)/0.7)]"
              : i === current ? "h-3.5 w-3.5 border-2 border-foreground" : "h-1.5 w-1.5 bg-muted-foreground",
          )} />
          <span className="sr-only">{p.name}: {repaired ? "repaired" : i === current ? "current" : "broken"}</span>
        </li>
      );
    })}
  </ol>
);
