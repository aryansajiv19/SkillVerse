import { expect, test } from "@playwright/test";
import { dismissIntro, expectDashboardXp, intro, masterSkill, skillPanel, skipIntro, star, toast } from "./helpers";

test("first visit shows the intro, and dismissing it reveals the map", async ({ page }) => {
  await page.goto("/");
  await expect(intro(page)).toBeVisible();

  await dismissIntro(page);
  await expect(intro(page)).toBeHidden();
  await expect(star(page, "html", "available")).toBeVisible();
  await expect(star(page, "css", "locked")).toBeVisible();

  await page.reload();
  await expect(star(page, "html", "available")).toBeVisible();
  await expect(intro(page)).toBeHidden();
});

test("resetting HTML from its panel also resets CSS, which builds on it", async ({ page }) => {
  await skipIntro(page);
  await masterSkill(page, "html");
  await masterSkill(page, "css");

  await page.goto("/");
  await star(page, "html", "mastered").click();
  const panel = skillPanel(page, "html");
  await panel.getByRole("button", { name: "Reset skill" }).click();
  const confirm = panel.getByRole("alertdialog");
  await expect(confirm).toContainText("CSS");
  await confirm.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(toast(page, "2 skills reset")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(star(page, "html", "available")).toBeVisible();
  await expect(star(page, "css", "locked")).toBeVisible();
  await expectDashboardXp(page, 0);
});
