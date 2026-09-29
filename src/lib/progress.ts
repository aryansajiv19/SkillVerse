// Pure progress rules. XP itself is computed by the database (leaderboard view).
import { Orbit, Sparkle, Sparkles, Star, type LucideIcon } from "lucide-react";
import { skills, tracks, type SkillDef } from "@/content/skills";

export const XP_PER_LEVEL = 500;

export interface SkillState extends SkillDef {
  mastered: boolean;
  unlocked: boolean;
}

export const isUnlocked = (skill: SkillDef, mastered: Set<string>) =>
  skill.requires.every((id) => mastered.has(id));

export const skillStates = (mastered: Set<string>): SkillState[] =>
  skills.map((s) => ({ ...s, mastered: mastered.has(s.id), unlocked: isUnlocked(s, mastered) }));

/** Unlocked but not yet mastered, in catalog order. */
export const nextUp = (states: SkillState[]) => states.filter((s) => s.unlocked && !s.mastered);

export const levelProgress = (xp: number) => {
  const into = xp % XP_PER_LEVEL;
  return { level: Math.floor(xp / XP_PER_LEVEL) + 1, into, toNext: XP_PER_LEVEL - into, pct: (into / XP_PER_LEVEL) * 100 };
};

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  earned: boolean;
}

/** Earned badges stay earned: the streak badge uses the best streak, not the current one. */
export const achievements = (
  stats: { skills_mastered: number; best_streak: number; level: number },
  mastered: Set<string>,
): Achievement[] => [
  { id: "first", name: "First Light", description: "Master your first skill", icon: Sparkle, earned: stats.skills_mastered >= 1 },
  { id: "five", name: "Star Cluster", description: "Master 5 skills", icon: Sparkles, earned: stats.skills_mastered >= 5 },
  { id: "streak", name: "Orbit Keeper", description: "Keep a 7-day streak", icon: Orbit, earned: stats.best_streak >= 7 },
  { id: "level5", name: "Rising Star", description: "Reach level 5", icon: Star, earned: stats.level >= 5 },
  ...tracks.map((t) => ({
    id: `track-${t.id}`,
    name: `${t.constellation} Complete`,
    description: `Master every ${t.name} skill`,
    icon: Sparkle,
    earned: skills.filter((s) => s.track === t.id).every((s) => mastered.has(s.id)),
  })),
];

/** One timestamp per thing a learner did: masteries plus code challenges and games.
 *  A passed skill check is counted once, as its mastery. */
export const completionTimes = (
  skillRows: { completed_at: string }[],
  challengeRows: { challenge_id: string; completed_at: string }[],
) => [
  ...skillRows.map((s) => s.completed_at),
  ...challengeRows.filter((c) => !c.challenge_id.endsWith("-check")).map((c) => c.completed_at),
];

// Activity calendar. Days are UTC, matching the streak the database computes.

export const HEAT_WEEKS = 26;
const DAY_MS = 86_400_000;

export type HeatLevel = 0 | 1 | 2 | 3 | 4;

export interface HeatDay {
  /** YYYY-MM-DD, UTC */
  date: string;
  count: number;
  level: HeatLevel;
}

export interface ActivityCalendar {
  /** One column per week, Sunday first; the last column holds today. Days after today are null. */
  weeks: (HeatDay | null)[][];
  /** Month names, on the first column whose Sunday falls in that month. */
  months: { week: number; label: string }[];
  today: string;
  total: number;
  activeDays: number;
}

/** Fixed thresholds rather than relative to the busiest day, so every profile reads the same way. */
export const HEAT_LEVELS = [
  "No completions",
  "1 completion",
  "2 completions",
  "3 to 4 completions",
  "5 or more completions",
];
export const heatLevel = (count: number): HeatLevel =>
  count <= 0 ? 0 : count <= 2 ? (count as 1 | 2) : count <= 4 ? 3 : 4;

const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const monthName = (ms: number) => new Date(ms).toLocaleString("en-US", { month: "short", timeZone: "UTC" });

export const activityCalendar = (timestamps: string[], now = new Date(), weeks = HEAT_WEEKS): ActivityCalendar => {
  const todayMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const startMs = todayMs - (now.getUTCDay() + 7 * (weeks - 1)) * DAY_MS;

  const counts = new Map<string, number>();
  for (const t of timestamps) {
    const ms = Date.parse(t);
    if (!(ms >= startMs && ms < todayMs + DAY_MS)) continue; // outside the window, or unparseable (NaN)
    const day = isoDay(ms);
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }

  const cols: (HeatDay | null)[][] = [];
  const months: ActivityCalendar["months"] = [];
  for (let w = 0; w < weeks; w++) {
    const sunday = startMs + w * 7 * DAY_MS;
    if (w === 0 || new Date(sunday).getUTCMonth() !== new Date(sunday - 7 * DAY_MS).getUTCMonth())
      months.push({ week: w, label: monthName(sunday) });
    cols.push(
      Array.from({ length: 7 }, (_, d) => {
        const ms = sunday + d * DAY_MS;
        if (ms > todayMs) return null;
        const date = isoDay(ms);
        const count = counts.get(date) ?? 0;
        return { date, count, level: heatLevel(count) };
      }),
    );
  }
  // The first label names a partial month; drop it when the next label would collide with it.
  if (months.length > 1 && months[1].week < 3) months.shift();

  let total = 0;
  for (const n of counts.values()) total += n;
  return { weeks: cols, months, today: isoDay(todayMs), total, activeDays: counts.size };
};

/**
 * The learning path to a skill: every prerequisite not yet mastered, in an order where each
 * skill comes after everything it needs, ending with the skill itself.
 */
export const learningPath = (skillId: string, mastered: Set<string>): string[] => {
  const order: string[] = [];
  const seen = new Set<string>();
  const visit = (id: string) => {
    if (seen.has(id) || (mastered.has(id) && id !== skillId)) return;
    seen.add(id);
    skills.find((s) => s.id === id)?.requires.forEach(visit);
    order.push(id);
  };
  visit(skillId);
  return order;
};
