import { describe, expect, it } from "vitest";
import { rankMatch } from "./command";

describe("command palette ranking", () => {
  it("prefers names, then word starts, then keywords", () => {
    expect(rankMatch("React", "rea")).toBe(1);
    expect(rankMatch("Deep Learning", "learn")).toBe(0.9);
    expect(rankMatch("Node.js", "js")).toBe(0.9);
    expect(rankMatch("Express", "backend", ["Backend", "Orion"])).toBe(0.7);
    expect(rankMatch("Account", "sign", ["settings", "sign in"])).toBe(0.7);
    expect(rankMatch("PostgreSQL", "sql")).toBe(0.5);
  });

  it("ignores letters scattered across keywords", () => {
    expect(rankMatch("Dashboard", "rea", ["progress", "streak"])).toBe(0);
    expect(rankMatch("Account", "rea", ["reset", "name"])).toBe(0);
    expect(rankMatch("Auth", "h")).toBe(0);
  });
});
