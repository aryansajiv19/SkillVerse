import { expect, test } from "@playwright/test";
import {
  celebration,
  claimButton,
  codeEditor,
  expectDashboardXp,
  masterSkill,
  questionCount,
  runTests,
  settled,
  skillCheckUrl,
  skipIntro,
  star,
  takeQuiz,
  testResult,
  toast,
} from "./helpers";

test.beforeEach(({ page }) => skipIntro(page));

test("passing the HTML skill check lights its star and unlocks CSS and JavaScript", async ({ page }) => {
  await page.goto(skillCheckUrl("html"));
  await takeQuiz(page, "html-check");

  await expect(celebration(page, "html")).toBeVisible();
  const summary = page.getByText("+130 XP");
  await expect(summary).toContainText(/unlocked/i);
  await expect(summary).toContainText("CSS");
  await expect(summary).toContainText("JavaScript");

  await page.getByRole("link", { name: "Back to the galaxy" }).click();
  await expect(star(page, "html", "mastered")).toBeVisible();
  await expect(star(page, "css", "available")).toBeVisible();
  await expect(star(page, "javascript", "available")).toBeVisible();
});

test("failing a skill check offers another try and records nothing", async ({ page }) => {
  const total = questionCount("html-check");
  await page.goto(skillCheckUrl("html"));
  await takeQuiz(page, "html-check", [0, 1]);

  await expect(page.getByRole("heading", { name: `${total - 2}/${total} correct` })).toBeVisible();
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByText(`Question 1 of ${total}`)).toBeVisible();

  await expectDashboardXp(page, 0);
  await page.goto("/");
  await settled(page);
  await expect(star(page, "html", "available")).toBeVisible();
});

test("code challenge: failing tests show what came back, passing code can be claimed for XP", async ({ page }) => {
  await masterSkill(page, "html"); // JavaScript needs HTML
  await page.goto("/learn?skill=javascript&challenge=js-1");

  await codeEditor(page).fill("function add(a, b) {\n  return a - b;\n}\n");
  await runTests(page);
  await expect(testResult(page, "add(2, 3) → 5")).toContainText("got -1");
  await expect(claimButton(page)).toBeHidden();

  await codeEditor(page).fill("function add(a, b) {\n  return a + b;\n}\n");
  await runTests(page);
  await expect(testResult(page, "add(2, 3) → 5")).not.toContainText("got");
  await claimButton(page).click();
  await expect(toast(page, "+50 XP")).toBeVisible();

  await expectDashboardXp(page, 130 + 50);
});
