// Every selector the specs use lives here, so a UI redesign means editing this file, not the specs.
// Selectors go by role, accessible name and visible text only.
import { expect, type Page } from "@playwright/test";
import { buildCatalog } from "../scripts/catalog.ts";
import { skillById } from "../src/content/skills.ts";
import { checkIdFor, type QuizChallenge } from "../src/content/types.ts";

// ── Answer key: the public (shuffled) quiz plus the private answers, built the same way the DB seed is.
const { publicChallenges, answers } = buildCatalog();

const quizById = (id: string) => {
  const quiz = publicChallenges.find((c): c is QuizChallenge => c.id === id && c.type === "quiz");
  if (!quiz) throw new Error(`No quiz ${id}`);
  return quiz;
};

/** What the learner would click or type to answer question `idx` correctly. */
const correctAnswer = (quiz: QuizChallenge, idx: number) => {
  const accepted = answers.find((a) => a.challengeId === quiz.id && a.idx === idx)!.accepted[0];
  const q = quiz.questions[idx];
  return q.type === "fill-in-blank" ? accepted : q.options![Number(accepted)];
};

const wrongAnswer = (quiz: QuizChallenge, idx: number) => {
  const q = quiz.questions[idx];
  const right = correctAnswer(quiz, idx);
  return q.type === "fill-in-blank" ? "definitely not it" : q.options!.find((o) => o !== right)!;
};

const skillName = (id: string) => skillById.get(id)!.name;

// ── App state

/** Marks the first-visit intro as seen, for tests that aren't about it. Call before the first goto. */
export const skipIntro = (page: Page) =>
  page.addInitScript(() => localStorage.setItem("skillverse:intro-seen", "1"));

/** Waits until the page has finished loading this guest's progress. */
export const settled = (page: Page) => page.waitForLoadState("networkidle");

// ── Galaxy

export const intro = (page: Page) => page.getByRole("heading", { name: "Learn by lighting up a galaxy." });
export const dismissIntro = (page: Page) => page.getByRole("button", { name: "Show me the whole map" }).click();

export type StarState = "available" | "mastered" | "locked";
export const star = (page: Page, skillId: string, state: StarState) =>
  page.getByRole("button", { name: `${skillName(skillId)}, ${state}`, exact: true });

/** The side panel that opens when a star is clicked. */
export const skillPanel = (page: Page, skillId: string) =>
  page.getByRole("dialog", { name: skillName(skillId), exact: true });

// ── Quizzes

export const skillCheckUrl = (skillId: string) => `/learn?skill=${skillId}&challenge=${checkIdFor(skillId)}`;

/** Answers every question through the UI. Questions whose index is in `wrong` get a wrong answer. */
export const takeQuiz = async (page: Page, challengeId: string, wrong: number[] = []) => {
  const quiz = quizById(challengeId);
  for (const [i, q] of quiz.questions.entries()) {
    await expect(page.getByRole("heading", { name: q.question, exact: true })).toBeVisible();
    const answer = wrong.includes(i) ? wrongAnswer(quiz, i) : correctAnswer(quiz, i);
    if (q.type === "fill-in-blank") await page.getByRole("textbox", { name: q.question, exact: true }).fill(answer);
    else await page.getByRole("radio", { name: answer, exact: true }).click();
    await page.getByRole("button", { name: "Check answer" }).click();
    await page.getByRole("button", { name: i < quiz.questions.length - 1 ? "Next question" : "Finish" }).click();
  }
};

export const questionCount = (challengeId: string) => quizById(challengeId).questions.length;

/** The "<skill> is lit." screen shown after passing a skill check. */
export const celebration = (page: Page, skillId: string) =>
  page.getByRole("heading", { name: `${skillName(skillId)} is lit.`, exact: true });

/** Masters a skill by passing its skill check through the UI. Its prerequisites must be mastered already. */
export const masterSkill = async (page: Page, skillId: string) => {
  await page.goto(skillCheckUrl(skillId));
  await takeQuiz(page, checkIdFor(skillId));
  await expect(celebration(page, skillId)).toBeVisible();
};

// ── Code challenges

export const codeEditor = (page: Page) => page.getByRole("textbox", { name: "Code editor" });
export const runTests = (page: Page) => page.getByRole("button", { name: "Run tests" }).click();
/** One line of test output, found by the test's label, e.g. "add(2, 3) → 5". */
export const testResult = (page: Page, label: string) => page.getByRole("listitem").filter({ hasText: label });
export const claimButton = (page: Page) => page.getByRole("button", { name: /Claim \+\d+ XP/ });

// ── Feedback

export const toast = (page: Page, text: string | RegExp) =>
  page.getByRole("region", { name: /notifications/i }).getByText(text);

// ── Dashboard, leaderboard, account

/** Asserts the XP total on the dashboard. */
export const expectDashboardXp = async (page: Page, xp: number) => {
  await page.goto("/dashboard");
  await settled(page);
  await expect(page.getByText("total XP", { exact: true }).locator("..")).toHaveText(new RegExp(`^${xp}\\s*total XP$`));
};

/** The leaderboard row the app marks as the current user. */
export const myLeaderboardRow = (page: Page) =>
  page.getByRole("row").filter({ has: page.getByText("you", { exact: true }) });

/** Submits a new display name on the account page. Check the outcome with `toast`. */
export const rename = async (page: Page, name: string) => {
  await page.goto("/settings");
  await settled(page);
  await page.getByRole("textbox", { name: "Display name" }).fill(name);
  await page.getByRole("button", { name: "Save name" }).click();
};

/** The name the app shows for the current user. */
export const expectDisplayName = async (page: Page, name: string) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { level: 1, name, exact: true })).toBeVisible();
};

/** 3–20 chars of [A-Za-z0-9_-], unique per call. */
export const uniqueName = () => `e2e_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
