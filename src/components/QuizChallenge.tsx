import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFocusWhen } from "@/components/CodeEditor";
import { SKILL_MASTERY_XP, checkIdFor, type QuizChallenge as Quiz } from "@/content/challenges";
import { checkAnswer, type AnswerFeedback, type QuizResult } from "@/hooks/useProgress";
import { cn, errorMessage } from "@/lib/utils";

interface Props {
  challenge: Quiz;
  /** Grades on the server and records the result. */
  onSubmit: (answers: string[]) => Promise<QuizResult>;
  onPassed: (result: QuizResult) => void;
  /** Already passed, so passing again adds no XP. */
  done: boolean;
}

export const QuizChallenge = ({ challenge, onSubmit, onPassed, done }: Props) => {
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
  // The button pressed is replaced or hidden, so move focus to what it revealed.
  const feedbackBox = useFocusWhen<HTMLDivElement>(!!feedback);
  const hintText = useFocusWhen<HTMLParagraphElement>(hint);
  const group = useId();

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
      console.error(e);
      setProblem(errorMessage(e));
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
      <h2 className="text-2xl font-extrabold sm:text-3xl">{challenge.title}</h2>
      <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
        <span>Question {index + 1} of {total}</span>
        <span>{done ? "Refresher, no XP" : `+${reward} XP for passing`}</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-muted" aria-hidden>
        <div className="h-full bg-foreground transition-all" style={{ width: `${(index / total) * 100}%` }} />
      </div>

      <h3 ref={heading} tabIndex={-1} id="question" className="font-sans text-xl font-semibold leading-snug outline-none">{q.question}</h3>

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
              // Native radios, so Tab enters the group once and the arrow keys move the choice.
              // The input is invisible but covers the whole option, so clicks land on it.
              <label
                key={opt}
                className={cn(
                  "relative rounded-xl border px-4 py-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                  !feedback && (choice === i ? "border-foreground bg-foreground/10" : "hover:border-foreground/50"),
                  isAnswer && "border-emerald-400 bg-emerald-400/10",
                  feedback && choice === i && !isAnswer && "border-destructive bg-destructive/10",
                )}
              >
                <input type="radio" name={group} checked={choice === i} disabled={!!feedback} onChange={() => setChoice(i)}
                  className="absolute inset-0 cursor-pointer appearance-none rounded-xl opacity-0 disabled:cursor-default" />
                {opt}
              </label>
            );
          })}
        </div>
      )}

      {feedback && (
        <div ref={feedbackBox} tabIndex={-1} className={cn("rounded-xl border p-4 text-sm outline-none", feedback.correct ? "border-emerald-400/40" : "border-destructive/40")}>
          <p className="mb-1 font-semibold">{feedback.correct ? "Correct" : `Not quite. The answer is "${correctText}".`}</p>
          <p className="text-muted-foreground">{feedback.explanation}</p>
        </div>
      )}
      {problem && <p className="text-sm text-destructive" role="alert">{problem}</p>}

      <div className="flex items-center justify-between gap-3">
        {q.hint && !feedback ? (
          hint ? <p ref={hintText} tabIndex={-1} className="text-sm text-muted-foreground outline-none">{q.hint}</p> : <Button variant="ghost" size="sm" onClick={() => setHint(true)}>Show hint</Button>
        ) : <span />}
        {/* aria-disabled while busy (check and next guard it) so a keyboard user's focus stays on the button */}
        {feedback ? (
          <Button onClick={next} aria-disabled={busy}>{index < total - 1 ? "Next question" : busy ? "Grading…" : "Finish"}</Button>
        ) : (
          <Button onClick={check} disabled={!value} aria-disabled={busy}>{busy ? "Checking…" : "Check answer"}</Button>
        )}
      </div>
    </div>
  );
};
