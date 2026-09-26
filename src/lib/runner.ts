// Runs learner code against a challenge's tests.
// JS runs in a throwaway Web Worker (no DOM, no localStorage, killed on timeout);
// HTML and CSS are parsed with the browser's own parsers, never rendered.
import type { CodeTest } from "@/content/challenges";

export interface TestResult {
  label: string;
  pass: boolean;
  detail?: string;
}

type JsTest = Extract<CodeTest, { lang: "js" }>;

const fmt = (v: unknown) => (v === undefined ? "undefined" : JSON.stringify(v));

export const deepEqual = (a: unknown, b: unknown): boolean => {
  if (Object.is(a, b)) return true;
  if (typeof a !== "object" || typeof b !== "object" || !a || !b) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a), kb = Object.keys(b);
  return ka.length === kb.length && ka.every((k) => deepEqual((a as never)[k], (b as never)[k]));
};

/** Synchronous; call through runJsSandboxed in the browser. */
export const runJs = (code: string, tests: JsTest[]): TestResult[] => {
  let evaluate: (expr: string) => unknown;
  try {
    // Direct eval inside the returned closure sees the learner's declarations.
    evaluate = new Function(`${code}\n;return (__expr) => eval(__expr);`)();
  } catch (e) {
    return tests.map((t) => ({ label: `${t.expr} → ${fmt(t.expected)}`, pass: false, detail: String(e) }));
  }
  return tests.map((t) => {
    const label = `${t.expr} → ${fmt(t.expected)}`;
    try {
      const got = evaluate(t.expr);
      const pass = deepEqual(got, t.expected);
      return { label, pass, detail: pass ? undefined : `got ${fmt(got)}` };
    } catch (e) {
      return { label, pass: false, detail: e instanceof Error ? e.message : String(e) };
    }
  });
};

export const runJsSandboxed = (code: string, tests: JsTest[], timeoutMs = 2000) =>
  new Promise<TestResult[]>((resolve) => {
    const worker = new Worker(new URL("./runner.worker.ts", import.meta.url), { type: "module" });
    const timer = setTimeout(() => {
      worker.terminate();
      resolve(tests.map((t) => ({ label: t.expr, pass: false, detail: "Timed out. Infinite loop?" })));
    }, timeoutMs);
    worker.onmessage = (e: MessageEvent<TestResult[]>) => {
      clearTimeout(timer);
      worker.terminate();
      resolve(e.data);
    };
    worker.postMessage({ code, tests });
  });

export const checkHtml = (code: string, tests: Extract<CodeTest, { lang: "html" }>[]): TestResult[] => {
  const doc = new DOMParser().parseFromString(code, "text/html");
  return tests.map((t) => ({ label: t.label, pass: !!doc.querySelector(t.selector) }));
};

export const checkCss = (code: string, tests: Extract<CodeTest, { lang: "css" }>[]): TestResult[] => {
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(code);
  const rules = [...sheet.cssRules].filter((r): r is CSSStyleRule => r instanceof CSSStyleRule);
  return tests.map((t) => {
    const value = rules.find((r) => r.selectorText === t.selector)?.style.getPropertyValue(t.prop).trim() ?? "";
    const pass = t.value.includes("*") ? value !== "" : t.value.includes(value);
    return { label: t.label, pass, detail: pass ? undefined : value ? `found "${value}"` : "not set" };
  });
};
