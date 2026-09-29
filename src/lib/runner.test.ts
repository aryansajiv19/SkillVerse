import { afterEach, describe, expect, it, vi } from "vitest";
import { captureLogs, cssValueMatches, deepEqual, fmt, resolveProp, runJs, runJsSandboxed } from "./runner";

const t = (expr: string, expected: unknown, label?: string) => ({ lang: "js" as const, expr, expected, label });

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

  it("explains a top-level return instead of failing inside the runner", () => {
    expect(runJs("return 1", [t("1", 1)])[0].detail).toBe("Error: Your code has a return statement outside a function");
  });

  it("reports a thrown value it can't format", () => {
    expect(captureLogs("const o = {}; o.o = o; throw o;").error).toBe("threw [object Object]");
  });

  it("isolates runtime errors per test", () => {
    const r = runJs("const f = (x) => x.length", [t("f('ab')", 2), t("f(null)", 0)]);
    expect(r.map((x) => x.pass)).toEqual([true, false]);
  });

  it("shows keys whose value is undefined, so {} and { '': undefined } read differently", () => {
    const r = runJs("const parse = () => ({ '': undefined })", [t("parse()", {})]);
    expect(r[0].detail).toBe('got { "": undefined }');
  });

  it("uses a test's own label, and says what was expected when it fails", () => {
    const r = runJs("const f = () => [1, 2]", [t("f()", [1], "returns one item")]);
    expect(r[0]).toEqual({ label: "returns one item", pass: false, detail: "expected [1], got [1, 2]" });
  });

  it("keeps the learner's console.log out of the real console", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    runJs("console.log('hi'); const one = 1", [t("one", 1)]);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe("fmt", () => {
  it.each([
    [undefined, "undefined"],
    [NaN, "NaN"],
    ["a", '"a"'],
    [[1, "b", null], '[1, "b", null]'],
    [{ a: 1, "b-c": undefined }, '{ a: 1, "b-c": undefined }'],
    [{}, "{}"],
  ])("%j → %s", (v, out) => expect(fmt(v)).toBe(out));
});

describe("captureLogs", () => {
  it("collects console.log lines, including ones from a call after the code", () => {
    expect(captureLogs("function hi(n) { console.log('Hello', n) }\nhi('Ada')", "hi('Lin')")).toEqual({ logs: ["Hello Ada", "Hello Lin"] });
  });

  it("formats logged values the way the console would show them", () => {
    expect(captureLogs("console.log(undefined, 3, 'x', [1])").logs).toEqual(["undefined 3 x [1]"]);
  });

  it("reports the error and keeps the lines logged before it", () => {
    expect(captureLogs("console.log(1); missing()")).toEqual({ logs: ["1"], error: "ReferenceError: missing is not defined" });
  });
});

describe("deepEqual", () => {
  it.each([
    [[1, "a", { b: null }], [1, "a", { b: null }], true],
    [{ a: 1 }, { a: 1, b: 2 }, false],
    [[], {}, false],
    [null, {}, false],
    [NaN, NaN, true],
    // same key count, wrong key names: undefined values must not paper over the difference
    [{ x: undefined }, { id: "42" }, false],
    [{ ":id": undefined, ":postId": undefined }, { id: "7", postId: "9" }, false],
  ])("%j vs %j → %s", (a, b, eq) => expect(deepEqual(a, b)).toBe(eq));
});

describe("runJsSandboxed", () => {
  class FakeWorker {
    static last: FakeWorker;
    onmessage: ((e: MessageEvent) => void) | null = null;
    onerror: ((e: Event) => void) | null = null;
    terminated = false;
    constructor() { FakeWorker.last = this; }
    postMessage() {}
    terminate() { this.terminated = true; }
  }
  const tests = [t("add(1, 2)", 3)];

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("blames the runner, not the learner, when the worker fails to load", async () => {
    vi.stubGlobal("Worker", FakeWorker);
    const done = runJsSandboxed("", tests);
    FakeWorker.last.onerror!(new Event("error"));
    expect(await done).toEqual([{ label: "add(1, 2) → 3", pass: false, detail: "The test runner failed to load. Reload the page and try again." }]);
    expect(FakeWorker.last.terminated).toBe(true);
  });

  it("labels timeouts the same way as results", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("Worker", FakeWorker);
    const done = runJsSandboxed("while (true) {}", tests, 50);
    vi.advanceTimersByTime(50);
    expect(await done).toEqual([{ label: "add(1, 2) → 3", pass: false, detail: "Timed out after 0.05s. Is there an infinite loop?" }]);
  });
});

describe("css cascade", () => {
  const rule = (selectorText: string, decls: Record<string, string>) => ({
    selectorText,
    style: {
      getPropertyValue: (p: string) => decls[p]?.replace(" !important", "") ?? "",
      getPropertyPriority: (p: string) => (decls[p]?.endsWith("!important") ? "important" : ""),
    },
  }) as unknown as CSSStyleRule;

  it("lets a later rule for the same selector win", () => {
    expect(resolveProp([rule(".c", { display: "flex" }), rule(".c", { display: "block" })], ".c", "display")).toBe("block");
  });

  it("ignores rules that don't set the property, like an untouched starter block", () => {
    expect(resolveProp([rule(".c", { display: "flex" }), rule(".c", {})], ".c", "display")).toBe("flex");
  });

  it("matches a selector inside a selector list", () => {
    expect(resolveProp([rule(".wrap, .c", { display: "grid" })], ".c", "display")).toBe("grid");
    expect(resolveProp([rule(":is(.a, .b) .c", { display: "grid" })], ".b", "display")).toBe("");
  });

  it("lets !important beat a later normal declaration", () => {
    expect(resolveProp([rule(".c", { display: "flex !important" }), rule(".c", { display: "block" })], ".c", "display")).toBe("flex");
  });

  it("returns '' when nothing sets it", () => {
    expect(resolveProp([rule(".other", { display: "flex" })], ".c", "display")).toBe("");
  });
});

describe("cssValueMatches", () => {
  it("compares values ignoring case, spacing and 0 vs 0px", () => {
    const cols = ["repeat(3, 1fr)", "1fr 1fr 1fr", "repeat(3, minmax(0, 1fr))"];
    expect(cssValueMatches("repeat(3, minmax(0px, 1fr))", cols)).toBe(true);
    expect(cssValueMatches("REPEAT(3,1fr)", cols)).toBe(true);
    expect(cssValueMatches("repeat(2, 1fr)", cols)).toBe(false);
    expect(cssValueMatches("", cols)).toBe(false);
  });

  it("treats 'non-zero' as any real, non-zero amount", () => {
    for (const v of ["1rem", "8px", "calc(1rem + 2px)", "var(--gap)", "2%"]) expect(cssValueMatches(v, "non-zero"), v).toBe(true);
    for (const v of ["", "0", "0px", "0rem", "normal", "initial"]) expect(cssValueMatches(v, "non-zero"), v).toBe(false);
  });
});
