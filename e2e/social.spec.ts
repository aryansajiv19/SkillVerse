import { expect, test } from "@playwright/test";
import { expectDashboardXp, expectDisplayName, masterSkill, myLeaderboardRow, rename, toast, uniqueName } from "./helpers";

test("the leaderboard lists the learner and the dashboard shows their XP", async ({ page }) => {
  const name = uniqueName();
  await rename(page, name);
  await expect(toast(page, "Name saved")).toBeVisible();
  await masterSkill(page, "html");

  await expectDashboardXp(page, 130);

  // ponytail: assumes fewer than 50 players tie or beat 130 XP (always true on CI's fresh database).
  await page.goto("/leaderboard");
  const row = myLeaderboardRow(page);
  await expect(row).toContainText(name);
  await expect(row).toContainText("130");
});

test("renaming works, and a name another learner has is rejected", async ({ page, browser, baseURL }) => {
  const mine = uniqueName();
  await rename(page, mine);
  await expect(toast(page, "Name saved")).toBeVisible();
  await expectDisplayName(page, mine);

  const taken = uniqueName();
  const other = await browser.newContext({ baseURL });
  const otherPage = await other.newPage();
  await rename(otherPage, taken);
  await expect(toast(otherPage, "Name saved")).toBeVisible();
  await other.close();

  await rename(page, taken);
  await expect(toast(page, "That name is taken")).toBeVisible();
  await expectDisplayName(page, mine);
});
