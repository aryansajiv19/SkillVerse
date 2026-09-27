import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { intro, pageHeading, quizOptions, settled, skillCheckUrl, skipIntro, star } from "./helpers";

interface Target {
  path: string;
  label?: string;
  /** Visible once the page has rendered its real content. */
  ready: (page: Page) => Locator;
  firstVisit?: boolean;
  /** Axe rules with a known failure here, keyed to the reason. The main scan skips them; each gets its own fixme test. Delete once fixed. */
  known?: Record<string, string>;
}

const targets: Target[] = [
  { path: "/", label: "intro", ready: intro, firstVisit: true },
  { path: "/", label: "map", ready: (page) => star(page, "html", "available") },
  { path: "/learn", ready: pageHeading },
  {
    path: "/dashboard",
    ready: pageHeading,
    known: {
      // Titles reach 3.36:1 and descriptions 1.99:1 against the navy background; AA needs 4.5:1.
      "color-contrast": "unearned achievement cards are dimmed with opacity-40 (src/pages/Dashboard.tsx)",
    },
  },
  { path: "/leaderboard", ready: pageHeading },
  { path: "/settings", ready: pageHeading },
  { path: "/about", ready: pageHeading },
  { path: skillCheckUrl("html"), label: "skill check", ready: quizOptions },
];

/** Opens the target and fails on any serious or critical violation `configure` lets axe report. */
const expectNoBlockingViolations = async (page: Page, target: Target, configure: (axe: AxeBuilder) => AxeBuilder) => {
  if (!target.firstVisit) await skipIntro(page);
  await page.goto(target.path);
  await expect(target.ready(page).first()).toBeVisible();
  await settled(page);

  const { violations } = await configure(new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"])).analyze();
  const blocking = violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => `${v.id} (${v.impact}, ${v.nodes.length} elements): ${v.help}\n    ${v.nodes.slice(0, 5).map((n) => n.target.join(" ")).join("\n    ")}`);
  expect(blocking, blocking.join("\n")).toEqual([]);
};

for (const target of targets) {
  const name = `${target.path}${target.label ? ` (${target.label})` : ""}`;
  const known = Object.entries(target.known ?? {});

  test(`${name} has no serious or critical WCAG 2.1 AA violations`, ({ page }) =>
    expectNoBlockingViolations(page, target, (axe) => axe.disableRules(known.map(([rule]) => rule))));

  for (const [rule, reason] of known)
    test(`${name} passes ${rule}`, async ({ page }) => {
      test.fixme(true, reason);
      await expectNoBlockingViolations(page, target, (axe) => axe.withRules([rule]));
    });
}
