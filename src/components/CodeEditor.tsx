import { useId, useRef, useState, type ReactNode } from "react";
import { Check, Circle, Lightbulb, Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { CodeChallenge, CodeTest } from "@/content/challenges";
import { checkCss, checkHtml, runJsSandboxed, type TestResult } from "@/lib/runner";
import { cn } from "@/lib/utils";

const labelOf = (t: CodeTest) => (t.lang === "js" ? t.label ?? t.expr : t.label);

const run = (c: CodeChallenge, code: string): Promise<TestResult[]> => {
  const of = <L extends CodeTest["lang"]>(lang: L) => c.tests.filter((t): t is Extract<CodeTest, { lang: L }> => t.lang === lang);
  try {
    if (c.lang === "js") return runJsSandboxed(code, of("js"));
    if (c.lang === "html") return Promise.resolve(checkHtml(code, of("html")));
    return Promise.resolve(checkCss(code, of("css")));
  } catch (e) {
    return Promise.resolve(c.tests.map((t) => ({ label: labelOf(t), pass: false, detail: String(e) })));
  }
};

const Kbd = ({ children }: { children: ReactNode }) => (
  <kbd className="rounded border border-border bg-muted/60 px-1.5 py-0.5 font-sans text-[0.7rem] text-foreground/90">{children}</kbd>
);

/**
 * A textarea for code. Tab indents, but Esc then Tab moves focus on as usual and
 * Shift+Tab always moves back, so keyboard users can always leave (WCAG 2.1.2).
 */
export const CodeArea = ({ value, onChange, onRun, label, className }: {
  value: string;
  onChange: (code: string) => void;
  onRun: () => void;
  label: string;
  className?: string;
}) => {
  const helpId = useId();
  const leaving = useRef(false);
  return (
    <div className="space-y-2">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          const escaped = leaving.current;
          leaving.current = e.key === "Escape";
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            onRun();
          } else if (e.key === "Tab" && !e.shiftKey && !escaped && !e.altKey && !e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            const t = e.currentTarget, { selectionStart: a, selectionEnd: b } = t;
            // insertText keeps the browser's undo history; the fallback is for browsers that refuse it
            if (!document.execCommand("insertText", false, "  ")) {
              onChange(value.slice(0, a) + "  " + value.slice(b));
              requestAnimationFrame(() => t.setSelectionRange(a + 2, a + 2));
            }
          }
        }}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        aria-label={label}
        aria-describedby={helpId}
        className={cn("min-h-[240px] resize-y bg-background/70 font-mono text-sm leading-relaxed [tab-size:2]", className)}
      />
      <p id={helpId} className="text-xs leading-relaxed text-muted-foreground">
        <Kbd>Tab</Kbd> indents. Press <Kbd>Esc</Kbd> then <Kbd>Tab</Kbd> to leave the editor. <Kbd>⌘</Kbd>/<Kbd>Ctrl</Kbd> + <Kbd>Enter</Kbd> runs your code.
      </p>
    </div>
  );
};

const difficultyLabel = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" };

export const CodeEditor = ({ challenge, done, claiming, onPass }: {
  challenge: CodeChallenge;
  done: boolean;
  claiming: boolean;
  onPass: () => void;
}) => {
  const [code, setCode] = useState(challenge.starterCode);
  const [results, setResults] = useState<TestResult[] | null>(null);
  const [running, setRunning] = useState(false);
  const busy = useRef(false);
  const [hints, setHints] = useState(0);
  const testsId = useId();
  const passed = results?.filter((r) => r.pass).length ?? 0;
  const allPass = !!results?.length && passed === results.length;
  const rows = results ?? challenge.tests.map((t): TestResult => ({ label: labelOf(t), pass: false }));

  const onRun = async () => {
    // Ctrl+Enter can fire again before React re-renders, so guard with a ref, not state
    if (busy.current) return;
    busy.current = true;
    setRunning(true);
    try {
      setResults(await run(challenge, code));
    } finally {
      busy.current = false;
      setRunning(false);
    }
  };

  return (
    <div className="glass-panel space-y-6 rounded-2xl p-5 sm:p-8">
      <div className="space-y-2">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span>{difficultyLabel[challenge.difficulty]}</span>
          <span aria-hidden>·</span>
          {done ? (
            <span className="flex items-center gap-1 text-[hsl(var(--glow-completed))]"><Check className="h-4 w-4" aria-hidden />Done</span>
          ) : (
            <span>+{challenge.xpReward} XP</span>
          )}
        </p>
        <h2 className="text-2xl font-extrabold sm:text-3xl">{challenge.title}</h2>
        <p className="max-w-prose leading-relaxed text-foreground/80">{challenge.description}</p>
      </div>

      <CodeArea value={code} onChange={setCode} onRun={onRun} label={`${challenge.lang.toUpperCase()} editor`} />

      <div className="flex flex-wrap gap-3">
        <Button onClick={onRun} disabled={running}>
          <Play aria-hidden />{running ? "Running…" : "Run tests"}
        </Button>
        <Button variant="outline" onClick={() => setHints((h) => h + 1)} disabled={hints >= challenge.hints.length}>
          <Lightbulb aria-hidden />{hints ? `Hint ${hints} of ${challenge.hints.length}` : "Show a hint"}
        </Button>
      </div>

      {hints > 0 && (
        <ol className="list-decimal space-y-1.5 rounded-xl border border-border/60 bg-background/30 p-4 pl-9 text-sm leading-relaxed text-foreground/80">
          {challenge.hints.slice(0, hints).map((h) => <li key={h}>{h}</li>)}
        </ol>
      )}

      <section aria-labelledby={testsId} className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 id={testsId} className="text-lg font-bold">Tests</h3>
          <p role="status" className={cn("text-sm", allPass ? "text-emerald-300" : "text-muted-foreground")}>
            {running ? "Running…" : results ? `${passed} of ${results.length} passing` : "Not run yet"}
          </p>
        </div>
        <ul className="divide-y divide-border/50 rounded-xl border border-border/60 bg-background/30">
          {rows.map((r, i) => (
            <li key={i} className="flex gap-3 px-4 py-2.5">
              {!results ? <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/60" aria-hidden />
                : r.pass ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
                : <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden />}
              <span className="min-w-0 break-words font-mono text-[0.8rem] leading-relaxed">
                <span className="sr-only">{!results ? "Not run: " : r.pass ? "Passed: " : "Failed: "}</span>
                {r.label}
                {r.detail && <span className="block font-sans text-sm text-muted-foreground">{r.detail}</span>}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {allPass && (done ? (
        <p className="text-sm text-muted-foreground">All tests pass. You've already claimed the XP for this one.</p>
      ) : (
        <Button size="lg" onClick={onPass} disabled={claiming}>{claiming ? "Saving…" : `Claim +${challenge.xpReward} XP`}</Button>
      ))}
    </div>
  );
};
