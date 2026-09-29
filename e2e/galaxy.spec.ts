import { expect, test } from "@playwright/test";
import { askToReset, confirmReset, dismissIntro, expectDashboardXp, intro, masterSkill, skipIntro, star, toast } from "./helpers";

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
  const confirm = await askToReset(page, "html");
  await expect(confirm).toContainText("CSS");
  await confirmReset(confirm);
  await expect(toast(page, "2 skills reset")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(star(page, "html", "available")).toBeVisible();
  await expect(star(page, "css", "locked")).toBeVisible();
  await expectDashboardXp(page, 0);
});

test("selecting a locked star lays out its learning path on the map and in the panel", async ({ page }) => {
  await skipIntro(page);
  await page.goto("/");
  await star(page, "react", "locked").click();

  const path = page.getByRole("list").filter({ has: page.getByRole("link", { name: /React/ }) }).first();
  await expect(page.getByRole("heading", { name: "Your learning path" })).toBeVisible();
  await expect(path.getByRole("listitem")).toHaveText([/HTML/, /JavaScript/, /CSS/, /React/]);
  // The panel is modal, so the map is hidden from the accessibility tree while it is open.
  await expect(page.locator("[data-star=html]")).toHaveAttribute("aria-label", "HTML, available, step 1 of your path");
  await expect(page.getByRole("link", { name: "Start with HTML" })).toBeVisible();
});
