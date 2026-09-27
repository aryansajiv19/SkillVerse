import { describe, expect, it } from "vitest";
import { skills } from "@/content/skills";
import { GALAXY, K_READABLE, centerOn, clampView, galaxyScale, isVisible, worldPos, zoomAt, type Insets } from "./geometry";

const safe: Insets = { top: 72, right: 80, bottom: 92, left: 24 };

describe("map geometry", () => {
  it("fits every star inside the safe area on a laptop screen", () => {
    const k = galaxyScale(1280, 800, safe);
    const v = centerOn(GALAXY, k, 1280, 800, safe);
    expect(isVisible(GALAXY, v, 1280, 800, safe)).toBe(true);
    for (const s of skills) {
      const p = worldPos(s);
      expect(v.x + p.x * k).toBeGreaterThan(safe.left);
      expect(v.y + p.y * k).toBeLessThan(800 - safe.bottom);
    }
  });

  it("holds a readable zoom on a portrait phone instead of shrinking the galaxy to fit", () => {
    expect(galaxyScale(375, 812, { top: 72, right: 16, bottom: 220, left: 16 })).toBe(K_READABLE);
  });

  it("fits the stars by height on a landscape phone", () => {
    const k = galaxyScale(812, 375, safe);
    expect(k).toBeLessThan(K_READABLE);
    expect((GALAXY.y1 - GALAXY.y0) * k).toBeLessThanOrEqual(375 - safe.top - safe.bottom);
  });

  it("zooms around the given point", () => {
    const v = { x: 40, y: -20, k: 0.8 };
    const at = { x: 500, y: 300 };
    const z = zoomAt(v, 1.5, at, 0.1, 2);
    const before = { x: (at.x - v.x) / v.k, y: (at.y - v.y) / v.k };
    const after = { x: (at.x - z.x) / z.k, y: (at.y - z.y) / z.k };
    expect(after.x).toBeCloseTo(before.x);
    expect(after.y).toBeCloseTo(before.y);
    expect(zoomAt(v, 10, at, 0.1, 2).k).toBe(2);
  });

  it("never lets the galaxy be dragged off screen", () => {
    const v = clampView({ x: -99999, y: 99999, k: 1 }, 1280, 800, 0.1, 2);
    expect(v.x + GALAXY.x1 * v.k).toBeGreaterThan(0);
    expect(v.y + GALAXY.y0 * v.k).toBeLessThan(800);
  });
});
