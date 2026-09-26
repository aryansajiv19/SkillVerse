import { describe, expect, it } from "vitest";
import { skills, tracks, skillById } from "./skills";
import { challenges, checkIdFor, type CodeChallenge } from "./challenges";
import { runJs } from "@/lib/runner";

describe("skill graph", () => {
  it("has unique ids", () => {
    expect(new Set(skills.map((s) => s.id)).size).toBe(skills.length);
    expect(new Set(challenges.map((c) => c.id)).size).toBe(challenges.length);
  });

  it("only requires skills that exist, in known tracks", () => {
    const trackIds = new Set(tracks.map((t) => t.id));
    for (const s of skills) {
      expect(trackIds.has(s.track), s.id).toBe(true);
      for (const r of s.requires) expect(skillById.has(r), `${s.id} → ${r}`).toBe(true);
    }
  });

  it("is acyclic, so every skill is reachable", () => {
    const mastered = new Set<string>();
    let progressed = true;
    while (progressed) {
      progressed = false;
      for (const s of skills)
        if (!mastered.has(s.id) && s.requires.every((r) => mastered.has(r))) {
          mastered.add(s.id);
          progressed = true;
        }
    }
    expect(mastered.size).toBe(skills.length);
  });

  it("keeps every star on screen", () => {
    for (const s of skills) {
      expect(s.x, s.id).toBeGreaterThanOrEqual(4);
      expect(s.x, s.id).toBeLessThanOrEqual(96);
      expect(s.y, s.id).toBeGreaterThanOrEqual(12);
      expect(s.y, s.id).toBeLessThanOrEqual(90);
    }
  });
});

describe("challenges", () => {
  it("belong to real skills", () => {
    for (const c of challenges) expect(skillById.has(c.skillId), c.id).toBe(true);
  });

  it("give every skill exactly one skill check", () => {
    for (const s of skills) {
      const checks = challenges.filter((c) => c.skillId === s.id && c.type === "quiz");
      expect(checks.map((c) => c.id), s.id).toEqual([checkIdFor(s.id)]);
    }
  });

  it("have answerable questions", () => {
    for (const c of challenges) {
      if (c.type !== "quiz") continue;
      for (const q of c.questions) {
        if (q.type === "fill-in-blank") expect(typeof q.correctAnswer).toBe("string");
        else expect(q.options?.[q.correctAnswer as number], q.question).toBeDefined();
      }
    }
  });
});

// Reference solutions live here, not in the bundle. Proves every JS challenge is passable.
const solutions: Record<string, string> = {
  "js-1": "function add(a, b) { return a + b }",
  "js-2": "const reverse = (s) => [...s].reverse().join('')",
  "js-3": `function fizzBuzz(n) {
    return Array.from({ length: n }, (_, i) => (i + 1) % 15 === 0 ? 'FizzBuzz' : (i + 1) % 3 === 0 ? 'Fizz' : (i + 1) % 5 === 0 ? 'Buzz' : i + 1)
  }`,
  "nodejs-1": "const parseQuery = (qs) => Object.fromEntries(new URLSearchParams(qs))",
  "express-1": `function matchRoute(pattern, path) {
    const p = pattern.split('/'), s = path.split('/');
    if (p.length !== s.length) return null;
    const params = {};
    for (let i = 0; i < p.length; i++) {
      if (p[i].startsWith(':')) params[p[i].slice(1)] = s[i];
      else if (p[i] !== s[i]) return null;
    }
    return params;
  }`,
  "auth-1": "const isExpired = (p, now) => now >= p.exp * 1000",
  "pandas-1": `function groupMean(rows, key, field) {
    const acc = {};
    for (const r of rows) (acc[r[key]] ??= []).push(r[field]);
    return Object.fromEntries(Object.entries(acc).map(([k, v]) => [k, v.reduce((a, b) => a + b) / v.length]));
  }`,
};

describe("JS challenges", () => {
  const jsChallenges = challenges.filter((c): c is CodeChallenge => c.type === "code" && c.lang === "js");

  it.each(jsChallenges.map((c) => [c.id, c] as const))("%s is solvable", (id, c) => {
    expect(solutions[id], "missing reference solution").toBeDefined();
    const results = runJs(solutions[id], c.tests as never);
    expect(results.filter((r) => !r.pass)).toEqual([]);
  });

  it.each(jsChallenges.map((c) => [c.id, c] as const))("%s rejects the starter code", (_id, c) => {
    expect(runJs(c.starterCode, c.tests as never).every((r) => r.pass)).toBe(false);
  });
});
