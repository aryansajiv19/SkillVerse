// Pure progress rules. XP itself is computed by the database (leaderboard view).
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
  icon: string;
  earned: boolean;
}

export const achievements = (stats: { skills_mastered: number; streak: number; level: number }, mastered: Set<string>): Achievement[] => [
  { id: "first", name: "First Light", description: "Master your first skill", icon: "✦", earned: stats.skills_mastered >= 1 },
  { id: "five", name: "Star Cluster", description: "Master 5 skills", icon: "✺", earned: stats.skills_mastered >= 5 },
  { id: "streak", name: "Orbit Keeper", description: "Keep a 7-day streak", icon: "☄", earned: stats.streak >= 7 },
  { id: "level5", name: "Rising Star", description: "Reach level 5", icon: "★", earned: stats.level >= 5 },
  ...tracks.map((t) => ({
    id: `track-${t.id}`,
    name: `${t.constellation} Complete`,
    description: `Master every ${t.name} skill`,
    icon: "✧",
    earned: skills.filter((s) => s.track === t.id).every((s) => mastered.has(s.id)),
  })),
];
