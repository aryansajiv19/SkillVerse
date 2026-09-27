// Runs learner code against a challenge's tests.
// JS runs in a throwaway Web Worker (no DOM, no localStorage, killed on timeout);
// HTML and CSS are parsed with the browser's own parsers, never rendered.
import type { CodeTest, HtmlCheck } from "@/content/types";

export interface TestResult {
  label: string;
  pass: boolean;
  detail?: string;
}

/** What a snippet printed, and the error that stopped it, if any. */
export interface RunOutput {
  logs: string[];
  error?: string;
}

type JsTest = Extract<CodeTest, { lang: "js" }>;
type HtmlTest = Extract<CodeTest, { lang: "html" }>;
type CssTest = Extract<CodeTest, { lang: "css" }>;

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

/** Like JSON.stringify, but keeps undefined, NaN and keys whose value is undefined visible. */
export const fmt = (v: unknown): string => {
  if (typeof v === "string") return JSON.stringify(v);
  if (typeof v === "function") return "[function]";
  if (Array.isArray(v)) return `[${v.map(fmt).join(", ")}]`;
  if (v && typeof v === "object") {
    const entries = Object.entries(v).map(([k, x]) => `${IDENTIFIER.test(k) ? k : JSON.stringify(k)}: ${fmt(x)}`);
    return entries.length ? `{ ${entries.join(", ")} }` : "{}";
  }
  return String(v);
};

const errorText = (e: unknown) => (e instanceof Error ? String(e) : `threw ${fmt(e)}`);

export const deepEqual = (a: unknown, b: unknown): boolean => {
  if (a === b || (Number.isNaN(a) && Number.isNaN(b))) return true;
  if (typeof a !== "object" || typeof b !== "object" || !a || !b) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a), kb = Object.keys(b);
  return ka.length === kb.length && ka.every((k) => Object.hasOwn(b, k) && deepEqual((a as never)[k], (b as never)[k]));
};

const sandboxConsole = (logs: string[]) => {
  const log = (...args: unknown[]) => void logs.push(args.map((a) => (typeof a === "string" ? a : fmt(a))).join(" "));
  return { ...console, log, info: log, warn: log, error: log, debug: log };
};

/** Runs `code` once and returns an evaluator that can see its top-level declarations. */
const load = (code: string, logs: string[]) =>
  // Direct eval inside the returned closure sees the learner's declarations.
  new Function("console", `${code}\n;return (__expr) => eval(__expr);`)(sandboxConsole(logs)) as (expr: string) => unknown;

const labelOf = (t: JsTest) => t.label ?? `${t.expr} → ${fmt(t.expected)}`;

/** Synchronous; call through runJsSandboxed in the browser. */
export const runJs = (code: string, tests: JsTest[]): TestResult[] => {
  let evaluate: (expr: string) => unknown;
  try {
    evaluate = load(code, []);
  } catch (e) {
    return tests.map((t) => ({ label: labelOf(t), pass: false, detail: errorText(e) }));
  }
  return tests.map((t) => {
    const label = labelOf(t);
    try {
      const got = evaluate(t.expr);
      if (deepEqual(got, t.expected)) return { label, pass: true };
      return { label, pass: false, detail: t.label ? `expected ${fmt(t.expected)}, got ${fmt(got)}` : `got ${fmt(got)}` };
    } catch (e) {
      return { label, pass: false, detail: errorText(e) };
    }
  });
};

/** Runs `code`, then the expression `call` if given, collecting console output. Call through runLogsSandboxed in the browser. */
export const captureLogs = (code: string, call?: string): RunOutput => {
  const logs: string[] = [];
  try {
    const evaluate = load(code, logs);
    if (call) evaluate(call);
    return { logs };
  } catch (e) {
    return { logs, error: errorText(e) };
  }
};

const inWorker = <T>(message: object, fail: (why: string) => T, timeoutMs: number) =>
  new Promise<T>((resolve) => {
    const worker = new Worker(new URL("./runner.worker.ts", import.meta.url), { type: "module" });
    const finish = (value: T) => {
      clearTimeout(timer);
      worker.terminate();
      resolve(value);
    };
    const timer = setTimeout(() => finish(fail(`Timed out after ${timeoutMs / 1000}s. Is there an infinite loop?`)), timeoutMs);
    worker.onmessage = (e: MessageEvent<T>) => finish(e.data);
    // Fires when the worker script can't load, e.g. an old tab asking for a file a redeploy removed.
    worker.onerror = () => finish(fail("The test runner failed to load. Reload the page and try again."));
    worker.postMessage(message);
  });

export const runJsSandboxed = (code: string, tests: JsTest[], timeoutMs = 2000) =>
  inWorker<TestResult[]>({ code, tests }, (detail) => tests.map((t) => ({ label: labelOf(t), pass: false, detail })), timeoutMs);

export const runLogsSandboxed = (code: string, call?: string, timeoutMs = 2000) =>
  inWorker<RunOutput>({ code, call }, (error) => ({ logs: [], error }), timeoutMs);

// ───────────── HTML ─────────────

const text = (el: Element | null) => el?.textContent?.replace(/\s+/g, " ").trim() ?? "";
const BUTTON_INPUTS = new Set(["submit", "button", "reset", "image", "hidden"]);

const tagOf = (el: Element) => {
  const type = el.getAttribute("type");
  return `<${el.localName}${type ? ` type="${type}"` : ""}>`;
};

/** A simplified accessible name: aria-labelledby, aria-label, then <label>s or the button's own text. */
const nameOf = (el: HTMLElement) => {
  const doc = el.ownerDocument;
  const referenced = (el.getAttribute("aria-labelledby") ?? "").split(/\s+/).filter(Boolean)
    .map((id) => text(doc.getElementById(id))).join(" ").trim();
  const labels = "labels" in el ? [...((el as HTMLInputElement).labels ?? [])].map(text).join(" ").trim() : "";
  const own = el instanceof HTMLInputElement ? (el.type === "submit" ? el.value.trim() || "Submit" : "")
    : el instanceof HTMLButtonElement ? `${text(el)} ${[...el.querySelectorAll("img")].map((i) => i.alt).join(" ")}`.trim()
    : "";
  return referenced || el.getAttribute("aria-label")?.trim() || labels || own;
};

/** Each returns what's wrong, or null when the document passes. */
const htmlChecks: Record<HtmlCheck, (doc: Document) => string | null> = {
  "labelled-controls": (doc) => {
    const controls = [...doc.querySelectorAll<HTMLElement>("input, select, textarea")]
      .filter((el) => !(el instanceof HTMLInputElement && BUTTON_INPUTS.has(el.type)));
    if (!controls.length) return "no inputs found";
    const unnamed = controls.filter((el) => !nameOf(el)).map(tagOf);
    return unnamed.length ? `${unnamed.join(", ")} ${unnamed.length === 1 ? "has" : "have"} no label` : null;
  },
  "submit-button": (doc) =>
    [...doc.querySelectorAll<HTMLButtonElement | HTMLInputElement>("button, input")]
      .some((el) => el.type === "submit" && el.form && !el.closest("[hidden]") && nameOf(el))
      ? null : "no visible submit button with text inside the form",
  "img-alt": (doc) => {
    const missing = [...doc.querySelectorAll("img")].filter((img) => !img.getAttribute("alt")?.trim()).length;
    return missing ? `${missing} image${missing === 1 ? " has" : "s have"} no alt text` : null;
  },
  "no-click-handlers": (doc) => {
    const fake = [...doc.querySelectorAll("[onclick]")].find((el) => !el.matches("button, input, select, textarea, summary, a[href]"));
    return fake ? `${tagOf(fake)} has onclick but isn't a button` : null;
  },
};

export const checkHtml = (code: string, tests: HtmlTest[]): TestResult[] => {
  const doc = new DOMParser().parseFromString(code, "text/html");
  return tests.map((t) => {
    if ("selector" in t) return { label: t.label, pass: !!doc.querySelector(t.selector) };
    const problem = htmlChecks[t.check](doc);
    return problem ? { label: t.label, pass: false, detail: problem } : { label: t.label, pass: true };
  });
};

// ───────────── CSS ─────────────

/** "a, b:is(c, d)" → ["a", "b:is(c, d)"]: only top-level commas separate selectors. */
const splitSelectors = (list: string) => {
  const out: string[] = [];
  let depth = 0, start = 0;
  for (let i = 0; i < list.length; i++) {
    const ch = list[i];
    if (ch === "(" || ch === "[") depth++;
    else if (ch === ")" || ch === "]") depth--;
    else if (ch === "," && !depth) {
      out.push(list.slice(start, i).trim());
      start = i + 1;
    }
  }
  return [...out, list.slice(start).trim()];
};

/** The value the cascade gives `prop` on `selector` across `rules`: !important beats normal, later beats earlier. */
export const resolveProp = (rules: CSSStyleRule[], selector: string, prop: string) => {
  let value = "", important = false;
  for (const r of rules) {
    const v = r.style.getPropertyValue(prop).trim();
    if (!v || !splitSelectors(r.selectorText).includes(selector)) continue;
    const imp = r.style.getPropertyPriority(prop) === "important";
    if (imp || !important) [value, important] = [v, imp];
  }
  return value;
};

// Browsers serialize `0` as `0px`, so treat them alike.
const normCss = (v: string) => v.toLowerCase().replace(/\s+/g, " ").replace(/\s*([(),])\s*/g, "$1").replace(/\b0px\b/g, "0").trim();
const NOT_AN_AMOUNT = /^(normal|auto|initial|inherit|unset|revert|revert-layer)$/;

export const cssValueMatches = (value: string, want: string[] | "non-zero") => {
  const v = normCss(value);
  if (!v) return false;
  return want === "non-zero" ? !NOT_AN_AMOUNT.test(v) && parseFloat(v) !== 0 : want.some((w) => normCss(w) === v);
};

export const checkCss = (code: string, tests: CssTest[]): TestResult[] => {
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(code);
  const rules = [...sheet.cssRules].filter((r): r is CSSStyleRule => r instanceof CSSStyleRule);
  return tests.map((t) => {
    const found = [t.prop].flat().map((p) => [p, resolveProp(rules, t.selector, p)] as const);
    if (found.some(([, v]) => cssValueMatches(v, t.value))) return { label: t.label, pass: true };
    const set = found.filter(([, v]) => v).map(([p, v]) => `${p}: ${v}`);
    return { label: t.label, pass: false, detail: set.length ? `found ${set.join("; ")}` : "not set" };
  });
};
