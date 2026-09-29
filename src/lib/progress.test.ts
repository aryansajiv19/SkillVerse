import { describe, expect, it } from "vitest";
import {
  achievements,
  activityCalendar,
  completionTimes,
  HEAT_LEVELS,
  HEAT_WEEKS,
  heatLevel,
  isUnlocked,
  levelProgress,
  nextUp,
  skillStates,
} from "./progress";
import { skillById, skills } from "@/content/skills";

describe("unlocking", () => {
  it("roots are unlocked from the start", () => {
    const roots = skillStates(new Set())
      .filter((s) => s.unlocked)
      .map((s) => s.id);
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
      achievements({ skills_mastered: m.length, best_streak: 0, level: 1 }, new Set(m)).find(
        (a) => a.id === "track-frontend",
      )!.earned;
    expect(earned(frontend.slice(1))).toBe(false);
    expect(earned(frontend)).toBe(true);
  });

  it("keeps the streak badge after the streak breaks", () => {
    const streak = (best_streak: number) =>
      achievements({ skills_mastered: 0, best_streak, level: 1 }, new Set()).find((a) => a.id === "streak")!.earned;
    expect(streak(6)).toBe(false);
    expect(streak(7)).toBe(true);
  });
});

describe("completionTimes", () => {
  it("counts a passed skill check once, as the mastery", () => {
    const times = completionTimes(
      [{ completed_at: "2026-09-01T10:00:00Z" }],
      [
        { challenge_id: "html-check", completed_at: "2026-09-01T10:00:00Z" },
        { challenge_id: "html-1", completed_at: "2026-09-02T10:00:00Z" },
      ],
    );
    expect(times).toEqual(["2026-09-01T10:00:00Z", "2026-09-02T10:00:00Z"]);
  });
});

describe("activityCalendar", () => {
  const SUNDAY = new Date("2026-09-27T16:00:00Z");
  const days = (cal: ReturnType<typeof activityCalendar>) => cal.weeks.flat().filter((d) => d !== null);
  const day = (cal: ReturnType<typeof activityCalendar>, date: string) => days(cal).find((d) => d.date === date);

  it("is empty but complete with no activity", () => {
    const cal = activityCalendar([], SUNDAY);
    expect(cal.weeks).toHaveLength(HEAT_WEEKS);
    expect(cal.weeks.every((w) => w.length === 7)).toBe(true);
    expect(cal).toMatchObject({ total: 0, activeDays: 0, today: "2026-09-27" });
    expect(days(cal).every((d) => d.count === 0 && d.level === 0)).toBe(true);
  });

  it("aligns columns to Sunday-first weeks ending with today", () => {
    const sun = activityCalendar([], SUNDAY);
    expect(sun.weeks[0][0]!.date).toBe("2026-04-05");
    expect(sun.weeks.at(-1)!.map((d) => d?.date ?? null)).toEqual(["2026-09-27", null, null, null, null, null, null]);

    const wed = activityCalendar([], new Date("2026-09-23T08:00:00Z"));
    expect(wed.weeks[0][0]!.date).toBe("2026-03-29");
    expect(wed.weeks.at(-1)!.map((d) => d?.date ?? null)).toEqual([
      "2026-09-20",
      "2026-09-21",
      "2026-09-22",
      "2026-09-23",
      null,
      null,
      null,
    ]);

    const sat = activityCalendar([], new Date("2026-09-26T23:59:00Z"));
    expect(sat.weeks.at(-1)!.every((d) => d !== null)).toBe(true);
    expect(sat.weeks.at(-1)![6]!.date).toBe("2026-09-26");
    // every column starts on a Sunday, one week after the last
    for (const [i, w] of sat.weeks.entries()) {
      expect(new Date(w[0]!.date).getUTCDay()).toBe(0);
      if (i) expect(Date.parse(w[0]!.date) - Date.parse(sat.weeks[i - 1][0]!.date)).toBe(7 * 86_400_000);
    }
  });

  it("buckets by UTC day, whatever the offset", () => {
    const cal = activityCalendar(
      [
        "2026-09-25T23:59:59.999Z",
        "2026-09-26T00:00:00Z",
        "2026-09-26T01:30:00+05:30", // 20:00 UTC on the 25th
        "2026-09-26T12:00:00.123456+00:00", // PostgREST's microsecond format
        "2026-09-26T21:00:00-05:00", // 02:00 UTC on the 27th
      ],
      SUNDAY,
    );
    expect(day(cal, "2026-09-25")!.count).toBe(2);
    expect(day(cal, "2026-09-26")!.count).toBe(2);
    expect(day(cal, "2026-09-27")!.count).toBe(1);
    expect(cal).toMatchObject({ total: 5, activeDays: 3 });
  });

  it("takes today from the UTC date of now", () => {
    // 23:30 in New York on Sunday is already Monday in UTC: a new column starts
    const cal = activityCalendar([], new Date("2026-09-27T23:30:00-04:00"));
    expect(cal.today).toBe("2026-09-28");
    expect(
      cal.weeks
        .at(-1)!
        .map((d) => d?.date ?? null)
        .slice(0, 2),
    ).toEqual(["2026-09-27", "2026-09-28"]);
  });

  it("ignores activity outside the window and unparseable timestamps", () => {
    const cal = activityCalendar(
      ["2026-04-04T23:59:59Z", "2026-04-05T00:00:00Z", "2026-09-28T00:00:00Z", "not a date"],
      SUNDAY,
    );
    expect(cal).toMatchObject({ total: 1, activeDays: 1 });
    expect(day(cal, "2026-04-05")!.count).toBe(1);
  });

  it("maps counts onto five fixed levels", () => {
    expect([0, 1, 2, 3, 4, 5, 12].map(heatLevel)).toEqual([0, 1, 2, 3, 3, 4, 4]);
    expect(HEAT_LEVELS).toHaveLength(5);
    const cal = activityCalendar(Array(6).fill("2026-09-27T09:00:00Z"), SUNDAY);
    expect(day(cal, "2026-09-27")).toEqual({ date: "2026-09-27", count: 6, level: 4 });
  });

  it("labels each month once, skipping a partial first month that would collide", () => {
    // starts Sun 5 Apr: April gets column 0, and every later month its first Sunday
    expect(activityCalendar([], SUNDAY).months).toEqual([
      { week: 0, label: "Apr" },
      { week: 4, label: "May" },
      { week: 9, label: "Jun" },
      { week: 13, label: "Jul" },
      { week: 17, label: "Aug" },
      { week: 22, label: "Sep" },
    ]);
    // starts Sun 29 Mar: "Mar" would sit one column before "Apr", so it is dropped
    expect(activityCalendar([], new Date("2026-09-23T08:00:00Z")).months[0]).toEqual({ week: 1, label: "Apr" });
  });
});
