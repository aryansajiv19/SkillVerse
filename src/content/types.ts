// Public challenge shapes: what the browser is allowed to see.
// Answers and explanations exist only in content/ (authoring) and in the private
// answer key in Postgres. See scripts/catalog.ts.

export type Difficulty = "beginner" | "intermediate" | "advanced";

interface Base {
  id: string;
  skillId: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  xpReward: number;
}

export interface Question {
  question: string;
  type: "multiple-choice" | "fill-in-blank" | "true-false";
  options?: string[];
  hint?: string;
}

export interface QuizChallenge extends Base {
  type: "quiz";
  questions: Question[];
}

/**
 * Named HTML checks, implemented in src/lib/runner.ts (the catalog is JSON, so tests
 * can't carry functions).
 * - labelled-controls: every input, select and textarea has an accessible name
 *   (label[for], a wrapping label, aria-label or aria-labelledby), and there is at least one
 * - submit-button: a visible submit button with text inside a form
 * - img-alt: every img has non-empty alt text
 * - no-click-handlers: no onclick on elements that aren't natively interactive
 */
export type HtmlCheck = "labelled-controls" | "submit-button" | "img-alt" | "no-click-handlers";

export type CodeTest =
  /** `label` replaces the expression in the results list when the expression is long. */
  | { lang: "js"; expr: string; expected: unknown; label?: string }
  | { lang: "html"; selector: string; label: string }
  | { lang: "html"; check: HtmlCheck; label: string }
  /** Passes when any of `prop` resolves (through the cascade) to one of `value`, or to a non-zero amount. */
  | { lang: "css"; selector: string; prop: string | string[]; value: string[] | "non-zero"; label: string };

export interface CodeChallenge extends Base {
  type: "code";
  lang: "js" | "html" | "css";
  starterCode: string;
  hints: string[];
  tests: CodeTest[];
}

export interface GameChallenge extends Base {
  type: "game";
  gameType: "debugger";
}

export type Challenge = QuizChallenge | CodeChallenge | GameChallenge;

export const SKILL_MASTERY_XP = 100;
export const checkIdFor = (skillId: string) => `${skillId}-check`;
