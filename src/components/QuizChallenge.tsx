import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SKILL_MASTERY_XP, checkIdFor, type QuizChallenge as Quiz } from "@/content/challenges";
import { checkAnswer, type AnswerFeedback, type QuizResult } from "@/hooks/useProgress";
import { cn } from "@/lib/utils";

interface Props {
  challenge: Quiz;
  /** Grades on the server and records the result. */
  onSubmit: (answers: string[]) => Promise<QuizResult>;
  onPassed: (result: QuizResult) => void;
}

export const QuizChallenge = ({ challenge, onSubmit, onPassed }: Props) => {
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [hint, setHint] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);

  const q = challenge.questions[index];
  const total = challenge.questions.length;
  const isCheck = challenge.id === checkIdFor(challenge.skillId);
  const reward = challenge.xpReward + (isCheck ? SKILL_MASTERY_XP : 0);
  const value = q.type === "fill-in-blank" ? text.trim() : choice === null ? "" : String(choice);

  useEffect(() => heading.current?.focus(), [index, result]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setProblem(null);
    try {
      await fn();
    } catch (e) {
      setProblem(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const check = () => {
    if (!value || feedback || busy) return;
    run(async () => setFeedback(await checkAnswer(challenge.id, index, value)));
  };

  const next = () => {
    if (!feedback || busy) return;
    const all = [...answers, value];
    if (index < total - 1) {
      setAnswers(all);
      setIndex(index + 1);
      setChoice(null);
      setText("");
      setFeedback(null);
      setHint(false);
      return;
    }
    run(async () => {
      const r = await onSubmit(all);
      setResult(r);
      if (r.passed) onPassed(r);
    });
  };

  const restart = () => {
    setIndex(0);
    setChoice(null);
    setText("");
    setFeedback(null);
    setAnswers([]);
    setResult(null);
    setHint(false);
  };

  if (result && !result.passed)
    return (
      <div className="glass-panel space-y-4 rounded-2xl p-8">
        <h2 ref={heading} tabIndex={-1} className="text-3xl font-extrabold outline-none">{result.score}/{result.total} correct</h2>
        <p className="text-muted-foreground">You can miss one question and still pass. Read the explanations and try again.</p>
        <Button size="lg" onClick={restart}>Try again</Button>
      </div>
    );
  if (result) return null; // the page shows the celebration

  const correctText = feedback && (q.type === "fill-in-blank" ? feedback.answer : q.options![Number(feedback.answer)]);

  return (
    <div className="glass-panel space-y-6 rounded-2xl p-6 sm:p-8">
      <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
        <span>Question {index + 1} of {total}</span>
        <span>+{reward} XP for passing</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-muted" aria-hidden>
        <div className="h-full bg-foreground transition-all" style={{ width: `${(index / total) * 100}%` }} />
      </div>

      <h2 ref={heading} tabIndex={-1} id="question" className="font-sans text-xl font-semibold leading-snug outline-none">{q.question}</h2>

      {q.type === "fill-in-blank" ? (
        <Input
          autoFocus
          value={text}
          maxLength={200}
          readOnly={!!feedback}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (feedback ? next() : check())}
          placeholder="Type your answer"
          aria-labelledby="question"
          className="h-12 text-lg"
        />
      ) : (
        <div role="radiogroup" aria-labelledby="question" className="grid gap-2">
          {q.options!.map((opt, i) => {
            const isAnswer = feedback && String(i) === feedback.answer;
            return (
              <button
                key={opt}
                role="radio"
                aria-checked={choice === i}
                disabled={!!feedback}
                onClick={() => setChoice(i)}
                className={cn(
                  "rounded-xl border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default",
                  !feedback && (choice === i ? "border-foreground bg-foreground/10" : "hover:border-foreground/50"),
                  isAnswer && "border-emerald-400 bg-emerald-400/10",
                  feedback && choice === i && !isAnswer && "border-destructive bg-destructive/10",
                )}
              >
                {opt}
              </button>
            );
          })}
        </div>
      )}

      {feedback && (
        <div className={cn("rounded-xl border p-4 text-sm", feedback.correct ? "border-emerald-400/40" : "border-destructive/40")} role="status">
          <p className="mb-1 font-semibold">{feedback.correct ? "Correct" : `Not quite. The answer is "${correctText}".`}</p>
          <p className="text-muted-foreground">{feedback.explanation}</p>
        </div>
      )}
      {problem && <p className="text-sm text-destructive" role="alert">{problem}</p>}

      <div className="flex items-center justify-between gap-3">
        {q.hint && !feedback ? (
          hint ? <p className="text-sm text-muted-foreground">{q.hint}</p> : <Button variant="ghost" size="sm" onClick={() => setHint(true)}>Show hint</Button>
        ) : <span />}
        {feedback ? (
          <Button onClick={next} disabled={busy}>{index < total - 1 ? "Next question" : busy ? "Grading…" : "Finish"}</Button>
        ) : (
          <Button onClick={check} disabled={!value || busy}>{busy ? "Checking…" : "Check answer"}</Button>
        )}
      </div>
    </div>
  );
};
