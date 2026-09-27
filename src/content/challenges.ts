// What the app imports. The data is generated from content/challenges.ts without answers.
import { challenges } from "./challenges.gen";

export * from "./types";
export { challenges };

export const challengeById = new Map(challenges.map((c) => [c.id, c]));
export const challengesForSkill = (skillId: string) => challenges.filter((c) => c.skillId === skillId);
