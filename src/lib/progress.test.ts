import { describe, expect, it } from "vitest";
import { achievements, isUnlocked, levelProgress, nextUp, skillStates } from "./progress";
import { skillById, skills } from "@/content/skills";

describe("unlocking", () => {
  it("roots are unlocked from the start", () => {
    const roots = skillStates(new Set()).filter((s) => s.unlocked).map((s) => s.id);
    expect(roots.sort()).toEqual(["git", "html", "linux", "python", "sql"]);
  });

  it("needs every prerequisite", () => {
    const react = skillById.get("react")!;
    expect(isUnlocked(react, new Set(["html", "javascript"]))).toBe(false);
    expect(isUnlocked(react, new Set(["html", "javascript", "css"]))).toBe(true);
  });

  it("nextUp excludes mastered and locked skills", () => {
    const ids = nextUp(skillStates(new Set(["html"]))).map((s) => s.id);
    expect(ids).toContain("css");
    expect(ids).not.toContain("html");
    expect(ids).not.toContain("react");
  });
});

describe("levels", () => {
  it.each([
    [0, 1, 500],
    [499, 1, 1],
    [500, 2, 500],
    [1234, 3, 266],
  ])("%i XP → level %i, %i to next", (xp, level, toNext) => {
    expect(levelProgress(xp)).toMatchObject({ level, toNext });
  });
});

describe("achievements", () => {
  it("awards track completion only when the whole track is mastered", () => {
    const frontend = skills.filter((s) => s.track === "frontend").map((s) => s.id);
    const earned = (m: string[]) =>
      achievements({ skills_mastered: m.length, streak: 0, level: 1 }, new Set(m)).find((a) => a.id === "track-frontend")!.earned;
    expect(earned(frontend.slice(1))).toBe(false);
    expect(earned(frontend)).toBe(true);
  });
});
