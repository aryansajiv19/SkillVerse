// WCAG 2.x contrast of the theme tokens in index.css and the track hues. Change a token,
// and this says whether text on it is still readable.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { tracks } from "@/content/skills";

const css = readFileSync(new URL("./index.css", import.meta.url), "utf8");

type Hsl = [number, number, number];

const parse = (triplet: string): Hsl => {
  const m = triplet.match(/^([\d.]+)\s+([\d.]+)%\s+([\d.]+)%$/);
  if (!m) throw new Error(`not an HSL triplet: ${triplet}`);
  return [+m[1], +m[2], +m[3]];
};

const token = (name: string) => {
  const m = css.match(new RegExp(`--${name}:\\s*([^;]+);`));
  if (!m) throw new Error(`--${name} not found in index.css`);
  return parse(m[1].trim());
};

const luminance = ([h, s, l]: Hsl) => {
  const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
  const channel = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = l / 100 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(0) + 0.7152 * channel(8) + 0.0722 * channel(4);
};

const contrast = (a: Hsl, b: Hsl) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const TEXT = 4.5; // AA, normal-size text
const UI = 3; // AA, component edges and focus indicators

const pairs: [string, Hsl, Hsl, number][] = [
  ["foreground on background", token("foreground"), token("background"), TEXT],
  ["foreground on card", token("foreground"), token("card"), TEXT],
  ["foreground on muted", token("foreground"), token("muted"), TEXT],
  ["muted-foreground on background", token("muted-foreground"), token("background"), TEXT],
  ["muted-foreground on card", token("muted-foreground"), token("card"), TEXT],
  ["muted-foreground on muted", token("muted-foreground"), token("muted"), TEXT],
  ["primary button text", token("primary-foreground"), token("primary"), TEXT],
  ["destructive button text", token("destructive-foreground"), token("destructive"), TEXT],
  ["destructive text on background", token("destructive"), token("background"), TEXT],
  ["destructive text on card", token("destructive"), token("card"), TEXT],
  ["gold (mastered) on background", token("glow-completed"), token("background"), TEXT],
  ["gold (mastered) on card", token("glow-completed"), token("card"), TEXT],
  ["focus ring on background", token("ring"), token("background"), UI],
  ["focus ring on card", token("ring"), token("card"), UI],
  ["input edge on background", token("input"), token("background"), UI],
  ["input edge on card", token("input"), token("card"), UI],
  ...tracks.flatMap((t): [string, Hsl, Hsl, number][] => [
    [`${t.name} hue on background`, parse(t.hue), token("background"), TEXT],
    [`${t.name} hue on card`, parse(t.hue), token("card"), TEXT],
  ]),
];

describe("theme contrast (WCAG AA)", () => {
  it("computes known ratios", () => {
    expect(contrast([0, 0, 100], [0, 0, 0])).toBeCloseTo(21, 5);
    expect(contrast([0, 0, 50], [0, 0, 50])).toBe(1);
  });

  it.each(pairs)("%s", (_, fg, bg, min) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(min);
  });
});
