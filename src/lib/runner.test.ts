import { describe, expect, it } from "vitest";
import { deepEqual, runJs } from "./runner";

const t = (expr: string, expected: unknown) => ({ lang: "js" as const, expr, expected });

describe("runJs", () => {
  it("passes correct code", () => {
    expect(runJs("function sq(x) { return x * x }", [t("sq(3)", 9)])).toEqual([{ label: "sq(3) → 9", pass: true }]);
  });

  it("reports what it got on failure", () => {
    expect(runJs("function sq(x) { return x + x }", [t("sq(3)", 9)])[0]).toMatchObject({ pass: false, detail: "got 6" });
  });

  it("fails every test on a syntax error instead of throwing", () => {
    const r = runJs("function (", [t("1", 1), t("2", 2)]);
    expect(r.every((x) => !x.pass && x.detail?.includes("SyntaxError"))).toBe(true);
  });

  it("isolates runtime errors per test", () => {
    const r = runJs("const f = (x) => x.length", [t("f('ab')", 2), t("f(null)", 0)]);
    expect(r.map((x) => x.pass)).toEqual([true, false]);
  });
});

describe("deepEqual", () => {
  it.each([
    [[1, "a", { b: null }], [1, "a", { b: null }], true],
    [{ a: 1 }, { a: 1, b: 2 }, false],
    [[], {}, false],
    [null, {}, false],
    [NaN, NaN, true],
  ])("%j vs %j → %s", (a, b, eq) => expect(deepEqual(a, b)).toBe(eq));
});
