import { expect, test } from "@playwright/test";
import { expectDashboardXp, expectDisplayName, masterSkill, myLeaderboardEntry, rename, toast, uniqueName, nameFieldMessage } from "./helpers";

test("the dashboard shows the learner's XP and the leaderboard ranks them", async ({ page }) => {
  const name = uniqueName();
  await rename(page, name);
  await expect(toast(page, "Name saved")).toBeVisible();
  await masterSkill(page, "html");

  await expectDashboardXp(page, 130);

  await page.goto("/leaderboard");
  await expect(myLeaderboardEntry(page, name, 130)).toBeVisible();
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
  await expect(nameFieldMessage(page)).toHaveText("That name is taken");
  await expectDisplayName(page, mine);
});
