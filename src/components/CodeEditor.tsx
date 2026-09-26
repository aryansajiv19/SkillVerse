import { useState } from "react";
import { Check, Lightbulb, Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { CodeChallenge, CodeTest } from "@/content/challenges";
import { checkCss, checkHtml, runJsSandboxed, type TestResult } from "@/lib/runner";

const run = (c: CodeChallenge, code: string): Promise<TestResult[]> => {
  const of = <L extends CodeTest["lang"]>(lang: L) => c.tests.filter((t): t is Extract<CodeTest, { lang: L }> => t.lang === lang);
  try {
    if (c.lang === "js") return runJsSandboxed(code, of("js"));
    if (c.lang === "html") return Promise.resolve(checkHtml(code, of("html")));
    return Promise.resolve(checkCss(code, of("css")));
  } catch (e) {
    return Promise.resolve([{ label: "Parse error", pass: false, detail: String(e) }]);
  }
};

export const CodeEditor = ({ challenge, done, onPass }: { challenge: CodeChallenge; done: boolean; onPass: () => void }) => {
  const [code, setCode] = useState(challenge.starterCode);
  const [results, setResults] = useState<TestResult[] | null>(null);
  const [running, setRunning] = useState(false);
  const [hints, setHints] = useState(0);
  const allPass = !!results?.length && results.every((r) => r.pass);

  const onRun = async () => {
    setRunning(true);
    setResults(await run(challenge, code));
    setRunning(false);
  };

  return (
    <div className="glass-panel space-y-5 rounded-2xl p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold">{challenge.title}</h2>
          <p className="mt-1 text-muted-foreground">{challenge.description}</p>
        </div>
        <span className="rounded-full border px-3 py-1 text-sm">+{challenge.xpReward} XP</span>
      </div>

      <Textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Tab") {
            e.preventDefault();
            const t = e.currentTarget, { selectionStart: a, selectionEnd: b } = t;
            setCode(code.slice(0, a) + "  " + code.slice(b));
            requestAnimationFrame(() => t.setSelectionRange(a + 2, a + 2));
          }
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onRun();
        }}
        spellCheck={false}
        aria-label="Code editor"
        className="min-h-[260px] resize-y bg-background/70 font-mono text-sm leading-relaxed"
      />

      <div className="flex flex-wrap gap-3">
        <Button onClick={onRun} disabled={running}>
          <Play className="mr-2 h-4 w-4" />{running ? "Running…" : "Run tests"}
        </Button>
        <Button variant="outline" onClick={() => setHints((h) => h + 1)} disabled={hints >= challenge.hints.length}>
          <Lightbulb className="mr-2 h-4 w-4" />Hint ({hints}/{challenge.hints.length})
        </Button>
        <span className="self-center text-xs text-muted-foreground">⌘/Ctrl + Enter to run</span>
      </div>

      {hints > 0 && (
        <ol className="list-decimal space-y-1 rounded-xl border p-4 pl-8 text-sm text-muted-foreground">
          {challenge.hints.slice(0, hints).map((h) => <li key={h}>{h}</li>)}
        </ol>
      )}

      {results && (
        <ul className="space-y-1.5 rounded-xl border p-4 font-mono text-sm" aria-live="polite">
          {results.map((r) => (
            <li key={r.label} className="flex gap-2">
              {r.pass ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /> : <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />}
              <span>
                {r.label}
                {r.detail && <span className="text-muted-foreground"> ({r.detail})</span>}
              </span>
            </li>
          ))}
        </ul>
      )}

      {allPass && (done ? (
        <p className="text-sm text-muted-foreground">All tests pass. You've already claimed this one.</p>
      ) : (
        <Button size="lg" onClick={onPass}>All tests pass. Claim +{challenge.xpReward} XP</Button>
      ))}
    </div>
  );
};
