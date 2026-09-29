import { describe, expect, it } from "vitest";
import { skills, skillById } from "./skills";
import { resources } from "./resources";

describe("reading lists", () => {
  it.each(skills.map((s) => [s.id]))("%s has 2-3 distinct https links", (id) => {
    const list = resources[id] ?? [];
    expect(list.length).toBeGreaterThanOrEqual(2);
    expect(list.length).toBeLessThanOrEqual(3);
    for (const r of list) {
      expect(new URL(r.url).protocol, r.url).toBe("https:");
      expect(r.title.trim(), r.url).not.toBe("");
      expect(r.source.trim(), r.url).not.toBe("");
    }
    expect(new Set(list.map((r) => r.url)).size).toBe(list.length);
  });

  it("only lists real skills", () => {
    expect(Object.keys(resources).filter((id) => !skillById.has(id))).toEqual([]);
  });
});
