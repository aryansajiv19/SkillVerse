import { expect, test } from "@playwright/test";
import { backToGalaxy, notFoundHeading, skipIntro, star } from "./helpers";

test("an unknown address says so and links back to the galaxy", async ({ page }) => {
  await skipIntro(page);
  await page.goto("/no-such-star");
  await expect(notFoundHeading(page)).toBeVisible();

  await backToGalaxy(page);
  await expect(page).toHaveURL("/");
  await expect(star(page, "html", "available")).toBeVisible();
});
