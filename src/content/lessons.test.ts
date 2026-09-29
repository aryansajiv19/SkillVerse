import { describe, expect, it } from "vitest";
import { skills } from "./skills";
import { lessonTopics } from "./lessons";

describe("lessons", () => {
  it("give every skill at least three things you'll learn", () => {
    for (const s of skills) expect(lessonTopics[s.id]?.length ?? 0, s.id).toBeGreaterThanOrEqual(3);
  });
  it("have no outlines for skills that don't exist", () => {
    expect(Object.keys(lessonTopics).filter((id) => !skills.some((s) => s.id === id))).toEqual([]);
  });
});
