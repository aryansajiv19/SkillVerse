import { expect, test } from "@playwright/test";
import { skipIntro, star } from "./helpers";

test("an unknown address says so and links back to the galaxy", async ({ page }) => {
  await skipIntro(page);
  await page.goto("/no-such-star");
  await expect(page.getByRole("heading", { level: 1, name: "Lost in space" })).toBeVisible();

  await page.getByRole("link", { name: "Back to the galaxy" }).click();
  await expect(page).toHaveURL("/");
  await expect(star(page, "html", "available")).toBeVisible();
});
