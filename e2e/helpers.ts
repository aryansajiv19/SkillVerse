// Every locator the specs use lives here, so a UI redesign means editing this file, not the specs.
// Specs do still assert on copy (toast text, test output, skill names), so a copy change can touch a spec.
// Locators go by role, accessible name and visible text only.
import { expect, type Locator, type Page } from "@playwright/test";
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

export const pageHeading = (page: Page) => page.getByRole("heading", { level: 1 });
export const notFoundHeading = (page: Page) => page.getByRole("heading", { level: 1, name: "Lost in space" });
/** The link out of the celebration and not-found pages. */
export const backToGalaxy = (page: Page) => page.getByRole("link", { name: "Back to the galaxy" }).click();

// ── Galaxy

export const intro = (page: Page) => page.getByRole("heading", { name: "Learn by lighting up a galaxy." });
export const dismissIntro = (page: Page) => page.getByRole("button", { name: "Show me the whole map" }).click();

export type StarState = "available" | "mastered" | "locked";
export const star = (page: Page, skillId: string, state: StarState) =>
  page.getByRole("button", { name: `${skillName(skillId)}, ${state}`, exact: true });

/** The side panel that opens when a star is clicked. */
export const skillPanel = (page: Page, skillId: string) =>
  page.getByRole("dialog", { name: skillName(skillId), exact: true });

/** Asks to reset a skill from its open panel and returns the confirmation. */
export const askToReset = async (page: Page, skillId: string) => {
  await skillPanel(page, skillId).getByRole("button", { name: "Reset skill" }).click();
  return page.getByRole("alertdialog");
};
export const confirmReset = (confirm: Locator) => confirm.getByRole("button", { name: "Reset", exact: true }).click();

// ── Quizzes

export const challengeUrl = (skillId: string, challengeId: string) => `/learn?skill=${skillId}&challenge=${challengeId}`;
export const skillCheckUrl = (skillId: string) => challengeUrl(skillId, checkIdFor(skillId));

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
export const quizOptions = (page: Page) => page.getByRole("radiogroup");
export const questionProgress = (page: Page, n: number, total: number) => page.getByText(`Question ${n} of ${total}`);
/** The score shown when a quiz ends without a pass. */
export const quizScore = (page: Page, correct: number, total: number) =>
  page.getByRole("heading", { name: `${correct}/${total} correct` });
export const retryQuiz = (page: Page) => page.getByRole("button", { name: "Try again" }).click();

/** The "<skill> is lit." screen shown after passing a skill check. */
export const celebration = (page: Page, skillId: string) =>
  page.getByRole("heading", { name: `${skillName(skillId)} is lit.`, exact: true });
/** The celebration line with the XP earned and the stars it unlocked. */
export const celebrationSummary = (page: Page, xp: number) => page.getByText(`+${xp} XP`);

/** Masters a skill by passing its skill check through the UI. Its prerequisites must be mastered already. */
export const masterSkill = async (page: Page, skillId: string) => {
  await page.goto(skillCheckUrl(skillId));
  await takeQuiz(page, checkIdFor(skillId));
  await expect(celebration(page, skillId)).toBeVisible();
};

// ── Code challenges

/** The code textarea is labelled by language, e.g. "JS editor". */
export const codeEditor = (page: Page) => page.getByRole("textbox", { name: /editor$/i });
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

/**
 * Where the leaderboard shows the current user: their marked row (with name and XP) when they're in the
 * top 50, otherwise the line under the table. Tests share one database, so either can be the right one.
 */
export const myLeaderboardEntry = (page: Page, name: string, xp: number) =>
  page
    .getByRole("row")
    .filter({ has: page.getByText("you", { exact: true }) })
    .filter({ hasText: name })
    .filter({ has: page.getByRole("cell", { name: String(xp), exact: true }) })
    .or(page.getByText(new RegExp(`^You're #\\d+ with ${xp} XP\\.$`)));

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

/** Inline validation shown under the display-name field on the Account page. */
export const nameFieldMessage = (page: Page) => page.locator("#username-help");
