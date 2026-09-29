// Captures the README screenshots and demo video from a running app.
// Usage: node scripts/capture-media.ts [baseUrl=http://localhost:8080]
// Writes docs/media/*.png and docs/media/flow.webm (convert with ffmpeg, see README).
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium, type Page } from "@playwright/test";
import { buildCatalog } from "./catalog.ts";

const BASE = process.argv[2] ?? "http://localhost:8080";
const OUT = fileURLToPath(new URL("../docs/media/", import.meta.url));
mkdirSync(OUT, { recursive: true });

const { publicChallenges, answers } = buildCatalog();
const correct = (checkId: string) =>
  answers.filter((a) => a.challengeId === checkId).sort((x, y) => x.idx - y.idx).map((a) => a.accepted[0]);

/** Pass skill checks through the real RPC as the page's own guest session. */
const master = (page: Page, skills: string[]) =>
  page.evaluate(
    async ({ skills, keys }) => {
      const raw = Object.entries(localStorage).find(([k]) => k.endsWith("-auth-token"))![1];
      const { access_token } = JSON.parse(raw);
      const env = (window as unknown as { __SV_ENV__?: { url: string; key: string } }).__SV_ENV__;
      for (const s of skills) {
        const r = await fetch(`${env!.url}/rest/v1/rpc/submit_quiz`, {
          method: "POST",
          headers: { apikey: env!.key, Authorization: `Bearer ${access_token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ p_challenge_id: `${s}-check`, p_answers: keys[s] }),
        });
        if (!r.ok) throw new Error(`${s}: ${r.status} ${await r.text()}`);
      }
    },
    { skills, keys: Object.fromEntries(skills.map((s) => [s, correct(`${s}-check`)])) },
  );

const settle = (page: Page, ms = 2500) => page.waitForTimeout(ms);

const browser = await chromium.launch();

// Desktop: a learner a few skills in.
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await ctx.addInitScript(() => localStorage.setItem("skillverse:intro-seen", "1"));
const page = await ctx.newPage();
await page.goto(BASE);
await page.waitForFunction(() => Object.keys(localStorage).some((k) => k.endsWith("-auth-token")));
await page.evaluate(({ url, key }) => ((window as never as { __SV_ENV__: object }).__SV_ENV__ = { url, key }), {
  url: process.env.VITE_SUPABASE_URL!,
  key: process.env.VITE_SUPABASE_PUBLISHABLE_KEY!,
});
await master(page, ["html", "css", "javascript", "git", "linux", "python"]);

const shots: [string, string][] = [
  ["galaxy", "/"],
  ["skill", "/learn?skill=react"],
  ["leaderboard", "/leaderboard"],
  ["profile", "/u/ada_lovelace"],
  ["dashboard", "/dashboard"],
  ["about", "/about#architecture"],
];
for (const [name, path] of shots) {
  await page.goto(BASE + path);
  await settle(page);
  await page.screenshot({ path: `${OUT}${name}.png` });
}

// A far-away star selected: its learning path lit on the map, and the lesson preview.
await page.goto(BASE);
await settle(page);
await page.getByRole("button", { name: /^LLM Apps, locked/ }).click();
await settle(page, 1500);
await page.screenshot({ path: `${OUT}path.png` });

// A lesson page: path, what you'll learn, assignment.
await page.goto(`${BASE}/learn?skill=react`);
await settle(page, 2000);
await page.screenshot({ path: `${OUT}lesson.png` });

// Skill check mid-question, with feedback showing.
await page.goto(`${BASE}/learn?skill=typescript&challenge=typescript-check`);
await settle(page, 1500);
const q0 = publicChallenges.find((c) => c.id === "typescript-check");
if (q0?.type === "quiz") {
  const right = q0.questions[0].options![Number(correct("typescript-check")[0])];
  await page.getByRole("radio", { name: right }).click();
  await page.getByRole("button", { name: "Check answer" }).click();
  await settle(page, 1200);
}
await page.screenshot({ path: `${OUT}skill-check.png` });

// Code challenge with a failing run.
await page.goto(`${BASE}/learn?skill=javascript&challenge=js-3`);
await settle(page, 1500);
await page.getByRole("textbox", { name: /editor$/i }).fill("function fizzBuzz(n) {\n  return [1, 2, 'Fizz'];\n}\n");
await page.getByRole("button", { name: "Run tests" }).click();
await settle(page, 1500);
await page.screenshot({ path: `${OUT}code-challenge.png` });

// Phone.
const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, storageState: await ctx.storageState() });
const p2 = await phone.newPage();
await p2.goto(BASE);
await settle(p2);
await p2.screenshot({ path: `${OUT}mobile.png` });
await phone.close();

// Demo flow video: open a star, pass its check, watch it ignite.
const vctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, recordVideo: { dir: OUT, size: { width: 1280, height: 800 } }, storageState: await ctx.storageState() });
const v = await vctx.newPage();
await v.goto(BASE);
await settle(v, 2500);
await v.getByRole("button", { name: /^TypeScript, available/ }).click();
await settle(v, 1200);
await v.getByRole("link", { name: /Take the skill check/ }).click();
await settle(v, 1200);
const quiz = publicChallenges.find((c) => c.id === "typescript-check");
if (quiz?.type !== "quiz") throw new Error("no quiz");
const key = correct("typescript-check");
for (let i = 0; i < quiz.questions.length; i++) {
  const q = quiz.questions[i];
  if (q.type === "fill-in-blank") await v.getByRole("textbox").fill(key[i]);
  else await v.getByRole("radio", { name: q.options![Number(key[i])], exact: true }).click();
  await settle(v, 500);
  await v.getByRole("button", { name: "Check answer" }).click();
  await settle(v, 1300);
  await v.getByRole("button", { name: i < quiz.questions.length - 1 ? "Next question" : "Finish" }).click();
  await settle(v, 900);
}
await settle(v, 1500);
await v.getByRole("link", { name: "Back to the galaxy" }).click();
await settle(v, 5000);
const video = v.video();
await vctx.close();
console.log("video:", await video?.path());

await ctx.close();
await browser.close();
console.log("media written to", OUT);
