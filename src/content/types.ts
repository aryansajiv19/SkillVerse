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

export type CodeTest =
  | { lang: "js"; expr: string; expected: unknown }
  | { lang: "html"; selector: string; label: string }
  | { lang: "css"; selector: string; prop: string; value: string[]; label: string };

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
