import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { intro, settled, skillCheckUrl, skipIntro, star } from "./helpers";

interface Target {
  path: string;
  label?: string;
  /** Visible once the page has rendered its real content. */
  ready: (page: Page) => Locator;
  firstVisit?: boolean;
  /** A known violation someone is fixing. Delete once it's gone. */
  fixme?: string;
}

const h1 = (page: Page) => page.getByRole("heading", { level: 1 });

const targets: Target[] = [
  { path: "/", label: "intro", ready: intro, firstVisit: true },
  { path: "/", label: "map", ready: (page) => star(page, "html", "available") },
  { path: "/learn", ready: h1 },
  {
    path: "/dashboard",
    ready: h1,
    // color-contrast (serious): unearned achievement cards are dimmed with opacity-40 (src/pages/Dashboard.tsx),
    // so their titles reach 3.36:1 and descriptions 1.99:1 against the navy background; AA needs 4.5:1.
    fixme: "color-contrast on unearned achievement cards (opacity-40)",
  },
  { path: "/leaderboard", ready: h1 },
  { path: "/settings", ready: h1 },
  { path: "/about", ready: h1 },
  { path: skillCheckUrl("html"), label: "skill check", ready: (page) => page.getByRole("radiogroup") },
];

for (const { path, label, ready, firstVisit, fixme } of targets) {
  test(`${path}${label ? ` (${label})` : ""} has no serious or critical WCAG 2.1 AA violations`, async ({ page }) => {
    test.fixme(!!fixme, fixme);
    if (!firstVisit) await skipIntro(page);
    await page.goto(path);
    await expect(ready(page).first()).toBeVisible();
    await settled(page);

    const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    const blocking = violations
      .filter((v) => v.impact === "serious" || v.impact === "critical")
      .map((v) => `${v.id} (${v.impact}, ${v.nodes.length} elements): ${v.help}\n    ${v.nodes.slice(0, 5).map((n) => n.target.join(" ")).join("\n    ")}`);
    expect(blocking, blocking.join("\n")).toEqual([]);
  });
}
