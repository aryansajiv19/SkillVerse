import { describe, expect, it } from "vitest";
import { skills, tracks, skillById } from "@/content/skills";
import { checkIdFor, type CodeChallenge } from "@/content/types";
import { challenges as publicChallenges } from "@/content/challenges";
import { runJs } from "@/lib/runner";
import { challenges } from "./challenges";
import { buildCatalog, normalizeAnswer } from "../scripts/catalog";

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

  it("ship to the browser without answers or explanations", () => {
    const json = JSON.stringify(publicChallenges);
    expect(json).not.toMatch(/"correctAnswer"|"explanation"|"alsoAccept"/);
    expect(publicChallenges.map((c) => c.id)).toEqual(challenges.map((c) => c.id));
  });

  it("keep the right answer attached to the same option text after shuffling", () => {
    const { publicChallenges: shipped, answers } = buildCatalog();
    for (const a of answers) {
      const src = challenges.find((c) => c.id === a.challengeId);
      const out = shipped.find((c) => c.id === a.challengeId);
      if (src?.type !== "quiz" || out?.type !== "quiz") throw new Error(a.challengeId);
      const q = src.questions[a.idx];
      if (q.type === "fill-in-blank") expect(a.accepted).toContain(normalizeAnswer(q.correctAnswer as string));
      else expect(out.questions[a.idx].options![Number(a.accepted[0])]).toBe(q.options![q.correctAnswer as number]);
    }
  });

  it("spread correct options across positions, so 'always pick A' fails", () => {
    const { publicChallenges: shipped, answers } = buildCatalog();
    const positions = answers.filter((a) => {
      const c = shipped.find((x) => x.id === a.challengeId);
      return c?.type === "quiz" && c.questions[a.idx].type === "multiple-choice";
    }).map((a) => Number(a.accepted[0]));
    const share = Math.max(...[0, 1, 2, 3].map((p) => positions.filter((x) => x === p).length)) / positions.length;
    expect(share).toBeLessThan(0.4);
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
  "typescript-1": `function isUser(value) {
    return typeof value === 'object' && value !== null && typeof value.name === 'string' && typeof value.age === 'number';
  }`,
  "react-1": `function todosReducer(todos, action) {
    switch (action.type) {
      case 'added': return [...todos, { id: action.id, text: action.text, done: false }];
      case 'toggled': return todos.map((t) => (t.id === action.id ? { ...t, done: !t.done } : t));
      case 'deleted': return todos.filter((t) => t.id !== action.id);
      default: return todos;
    }
  }`,
  "rest-apis-1": `function paginate(items, page, perPage) {
    const totalPages = Math.ceil(items.length / perPage);
    const start = (page - 1) * perPage;
    return { data: items.slice(start, start + perPage), page, totalPages, nextPage: page < totalPages ? page + 1 : null };
  }`,
  "data-viz-1": `function histogram(values, min, max, bins) {
    const counts = new Array(bins).fill(0);
    const width = (max - min) / bins;
    for (const v of values) if (v >= min && v <= max) counts[Math.min(Math.floor((v - min) / width), bins - 1)]++;
    return counts;
  }`,
  "ml-basics-1": `function mse(actual, predicted) {
    if (actual.length !== predicted.length) throw new Error('lengths differ');
    return actual.reduce((sum, y, i) => sum + (y - predicted[i]) ** 2, 0) / actual.length;
  }`,
  "deep-learning-1": `function softmax(logits) {
    const max = Math.max(...logits);
    const exps = logits.map((x) => Math.exp(x - max));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map((e) => e / sum);
  }`,
  "llm-apps-1": `function chunk(text, size, overlap) {
    const chunks = [];
    for (let start = 0; start < text.length; start += size - overlap) {
      chunks.push(text.slice(start, start + size));
      if (start + size >= text.length) break;
    }
    return chunks;
  }`,
  "ci-cd-1": `function bump(version, part) {
    const [major, minor, patch] = version.split('.').map(Number);
    if (part === 'major') return \`\${major + 1}.0.0\`;
    if (part === 'minor') return \`\${major}.\${minor + 1}.0\`;
    return \`\${major}.\${minor}.\${patch + 1}\`;
  }`,
  "cloud-1": `function isAllowed(policy, action, resource) {
    const matches = (pattern, value) => (pattern.endsWith('*') ? value.startsWith(pattern.slice(0, -1)) : pattern === value);
    const hits = policy.filter((s) => s.actions.some((a) => matches(a, action)) && s.resources.some((r) => matches(r, resource)));
    return hits.some((s) => s.effect === 'Allow') && !hits.some((s) => s.effect === 'Deny');
  }`,
  "linux-1": `const toSymbolic = (mode) =>
    [...mode].map((d) => (d & 4 ? 'r' : '-') + (d & 2 ? 'w' : '-') + (d & 1 ? 'x' : '-')).join('')`,
};

// Plausible wrong answers: each must fail at least one test, or the tests are too weak.
const wrongAnswers: [id: string, why: string, code: string][] = [
  ["express-1", "keeps the ':' in param names", `function matchRoute(pattern, path) {
    const pp = pattern.split('/'), parts = path.split('/');
    if (pp.length !== parts.length) return null;
    const params = {};
    for (let i = 0; i < pp.length; i++) {
      if (pp[i].startsWith(':')) params[pp[i]] = parts[pp[i]];
      else if (pp[i] !== parts[i]) return null;
    }
    return params;
  }`],
  ["typescript-1", "forgets that typeof null is 'object'",
    "const isUser = (v) => typeof v === 'object' && typeof v.name === 'string' && typeof v.age === 'number'"],
  ["react-1", "mutates the old state", `function todosReducer(todos, action) {
    if (action.type === 'added') { todos.push({ id: action.id, text: action.text, done: false }); return [...todos]; }
    if (action.type === 'toggled') { const t = todos.find((t) => t.id === action.id); t.done = !t.done; return [...todos]; }
    if (action.type === 'deleted') return todos.filter((t) => t.id !== action.id);
    return todos;
  }`],
  ["rest-apis-1", "treats page as 0-based", `function paginate(items, page, perPage) {
    const totalPages = Math.ceil(items.length / perPage);
    return { data: items.slice(page * perPage, page * perPage + perPage), page, totalPages, nextPage: page < totalPages ? page + 1 : null };
  }`],
  ["data-viz-1", "drops the max value off the end", `function histogram(values, min, max, bins) {
    const counts = new Array(bins).fill(0);
    for (const v of values) if (v >= min && v <= max) counts[Math.floor((v - min) / ((max - min) / bins))]++;
    return counts;
  }`],
  ["ml-basics-1", "forgets to square", "const mse = (a, p) => a.reduce((s, y, i) => s + (y - p[i]), 0) / a.length"],
  ["deep-learning-1", "overflows on large logits", `function softmax(logits) {
    const exps = logits.map(Math.exp), sum = exps.reduce((a, b) => a + b, 0);
    return exps.map((e) => e / sum);
  }`],
  ["llm-apps-1", "emits a final chunk that's already covered", `function chunk(text, size, overlap) {
    const out = [];
    for (let i = 0; i < text.length; i += size - overlap) out.push(text.slice(i, i + size));
    return out;
  }`],
  ["ci-cd-1", "joins strings instead of adding numbers", `function bump(version, part) {
    const [a, b, c] = version.split('.');
    return part === 'major' ? (a + 1) + '.0.0' : part === 'minor' ? a + '.' + (b + 1) + '.0' : a + '.' + b + '.' + (c + 1);
  }`],
  ["cloud-1", "lets an Allow beat a Deny", `function isAllowed(policy, action, resource) {
    const m = (p, v) => (p.endsWith('*') ? v.startsWith(p.slice(0, -1)) : p === v);
    return policy.some((s) => s.effect === 'Allow' && s.actions.some((a) => m(a, action)) && s.resources.some((r) => m(r, resource)));
  }`],
  ["linux-1", "reads the bits in the wrong order",
    "const toSymbolic = (mode) => [...mode].map((d) => (d & 1 ? 'r' : '-') + (d & 2 ? 'w' : '-') + (d & 4 ? 'x' : '-')).join('')"],
];

describe("code challenges", () => {
  const code = challenges.filter((c): c is CodeChallenge => c.type === "code");

  it.each(code.map((c) => [c.id, c] as const))("%s has 2-4 hints and at least 3 tests", (_id, c) => {
    expect(c.hints.length).toBeGreaterThanOrEqual(2);
    expect(c.hints.length).toBeLessThanOrEqual(4);
    expect(c.tests.length).toBeGreaterThanOrEqual(3);
    expect(c.tests.every((t) => t.lang === c.lang)).toBe(true);
  });
});

describe("JS challenges", () => {
  const jsChallenges = challenges.filter((c): c is CodeChallenge => c.type === "code" && c.lang === "js");

  it("have no orphaned reference solutions", () => {
    expect(Object.keys(solutions).filter((id) => !jsChallenges.some((c) => c.id === id))).toEqual([]);
  });

  it.each(jsChallenges.map((c) => [c.id, c] as const))("%s is solvable", (id, c) => {
    expect(solutions[id], "missing reference solution").toBeDefined();
    const results = runJs(solutions[id], c.tests as never);
    expect(results.filter((r) => !r.pass)).toEqual([]);
  });

  it.each(jsChallenges.map((c) => [c.id, c] as const))("%s rejects the starter code", (_id, c) => {
    expect(runJs(c.starterCode, c.tests as never).every((r) => r.pass)).toBe(false);
  });

  it.each(wrongAnswers)("%s rejects an answer that %s", (id, _why, code) => {
    const c = jsChallenges.find((x) => x.id === id);
    expect(c, id).toBeDefined();
    expect(runJs(code, c!.tests as never).every((r) => r.pass)).toBe(false);
  });
});
