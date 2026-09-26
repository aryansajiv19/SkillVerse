import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { QuizChallenge as Quiz } from "@/content/challenges";
import { cn } from "@/lib/utils";

const PASS_RATIO = 0.7;

export const QuizChallenge = ({ challenge, onPass }: { challenge: Quiz; onPass: () => void }) => {
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [hint, setHint] = useState(false);

  const q = challenge.questions[index];
  const total = challenge.questions.length;
  const isCorrect =
    q.type === "fill-in-blank"
      ? text.trim().toLowerCase().replace(/[<>`]/g, "") === String(q.correctAnswer).toLowerCase()
      : choice === q.correctAnswer;
  const passed = score >= Math.ceil(total * PASS_RATIO);

  const submit = () => {
    if (answered || (q.type === "fill-in-blank" ? !text.trim() : choice === null)) return;
    setAnswered(true);
    if (isCorrect) setScore((s) => s + 1);
  };

  const next = () => {
    if (index < total - 1) {
      setIndex(index + 1);
      setChoice(null);
      setText("");
      setAnswered(false);
      setHint(false);
    } else {
      setFinished(true);
    }
  };

  const restart = () => {
    setIndex(0);
    setChoice(null);
    setText("");
    setAnswered(false);
    setScore(0);
    setFinished(false);
  };

  if (finished)
    return (
      <div className="glass-panel space-y-4 rounded-2xl p-8">
        <h2 className="text-3xl font-extrabold">{score}/{total} correct</h2>
        {passed ? (
          <>
            <p className="text-muted-foreground">That's a pass.</p>
            <Button size="lg" onClick={onPass}>Claim +{challenge.xpReward} XP</Button>
          </>
        ) : (
          <>
            <p className="text-muted-foreground">You need {Math.ceil(total * PASS_RATIO)} to pass. Read the explanations and try again.</p>
            <Button size="lg" onClick={restart}>Try again</Button>
          </>
        )}
      </div>
    );

  return (
    <div className="glass-panel space-y-6 rounded-2xl p-6 sm:p-8">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Question {index + 1} of {total}</span>
        <span>{challenge.title}</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-foreground transition-all" style={{ width: `${(index / total) * 100}%` }} />
      </div>

      <h2 className="font-sans text-xl font-semibold leading-snug">{q.question}</h2>

      {q.type === "fill-in-blank" ? (
        <Input
          autoFocus
          value={text}
          disabled={answered}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (answered ? next() : submit())}
          placeholder="Type your answer"
          aria-label="Your answer"
          className="h-12 text-lg"
        />
      ) : (
        <div role="radiogroup" className="grid gap-2">
          {q.options!.map((opt, i) => (
            <button
              key={opt}
              role="radio"
              aria-checked={choice === i}
              disabled={answered}
              onClick={() => setChoice(i)}
              className={cn(
                "rounded-xl border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                !answered && (choice === i ? "border-foreground bg-foreground/10" : "hover:border-foreground/50"),
                answered && i === q.correctAnswer && "border-emerald-400 bg-emerald-400/10",
                answered && choice === i && i !== q.correctAnswer && "border-destructive bg-destructive/10",
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {answered && (
        <div className={cn("rounded-xl border p-4 text-sm", isCorrect ? "border-emerald-400/40" : "border-destructive/40")} role="status">
          <p className="mb-1 font-semibold">{isCorrect ? "Correct" : `Not quite. The answer is ${q.type === "fill-in-blank" ? `"${q.correctAnswer}"` : q.options![q.correctAnswer as number]}.`}</p>
          <p className="text-muted-foreground">{q.explanation}</p>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        {q.hint && !answered ? (
          hint ? <p className="text-sm text-muted-foreground">{q.hint}</p> : <Button variant="ghost" size="sm" onClick={() => setHint(true)}>Show hint</Button>
        ) : <span />}
        {answered ? (
          <Button onClick={next}>{index < total - 1 ? "Next question" : "See result"}</Button>
        ) : (
          <Button onClick={submit} disabled={q.type === "fill-in-blank" ? !text.trim() : choice === null}>Check answer</Button>
        )}
      </div>
    </div>
  );
};
