// node scripts/og-image.ts: renders public/og.png (1200x630 social card) and
// public/apple-touch-icon.png from HTML with Playwright. Needs network for the Google Fonts.
// The mini map is drawn from the real skill graph, so it stays in sync with src/content.
import { chromium } from "@playwright/test";
import { skills, trackById } from "../src/content/skills.ts";

const NAVY = "#0A0E29";
const GOLD = "#FFDB70";
// Mastered / available on the card, to show all three star states.
const lit = new Set(["html", "css", "git", "linux", "python", "sql"]);

const W = 460;
const H = 400;
const at = (s: { x: number; y: number }) => [(s.x / 100) * W, (s.y / 100) * H];

const lines = skills.flatMap((s) =>
  s.requires.map((r) => {
    const [x1, y1] = at(skills.find((o) => o.id === r)!);
    const [x2, y2] = at(s);
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="hsl(${trackById.get(s.track)!.hue} / 0.35)" stroke-width="1.5"/>`;
  }),
);

const stars = skills.map((s) => {
  const [x, y] = at(s);
  const hue = trackById.get(s.track)!.hue;
  const unlocked = s.requires.every((r) => lit.has(r));
  if (lit.has(s.id)) return `<circle cx="${x}" cy="${y}" r="7" fill="hsl(${hue})" filter="url(#glow)"/>`;
  if (unlocked) return `<circle cx="${x}" cy="${y}" r="6.5" fill="${NAVY}" stroke="hsl(${hue})" stroke-width="2.5"/>`;
  return `<circle cx="${x}" cy="${y}" r="3" fill="hsl(229 25% 64% / 0.6)"/>`;
});

const star = (size: number) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 32 32"><path d="M16 3Q17.7 14.3 29 16Q17.7 17.7 16 29Q14.3 17.7 3 16Q14.3 14.3 16 3Z" fill="${GOLD}"/></svg>`;

const fonts = `<link href="https://fonts.googleapis.com/css2?family=Figtree:wght@500&family=Plus+Jakarta+Sans:wght@800&display=block" rel="stylesheet">`;

const card = `<!doctype html><html><head>${fonts}<style>
  * { margin: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; overflow: hidden; color: hsl(228 100% 95%); font-family: Figtree, sans-serif;
    background: radial-gradient(circle at 78% 45%, hsl(240 50% 16%), transparent 60%), linear-gradient(hsl(232 59% 8%), hsl(250 45% 11%)); }
  .copy { position: absolute; left: 80px; top: 0; bottom: 0; width: 600px; display: flex; flex-direction: column; justify-content: center; }
  h1 { font: 800 72px/1 "Plus Jakarta Sans", sans-serif; letter-spacing: -0.02em; display: flex; align-items: center; }
  h1 svg { flex-shrink: 0; margin: 0 -3px; }
  p { margin-top: 28px; font-size: 36px; line-height: 1.2; font-weight: 500; }
  small { display: block; margin-top: 24px; font-size: 24px; text-wrap: balance; color: hsl(229 25% 64%); }
  .map { position: absolute; right: 50px; top: 115px; }
</style></head><body>
  <div class="copy">
    <h1>Skill${star(52)}Verse</h1>
    <p>A star map of what to learn next</p>
    <small>Pass a skill check to light a star and unlock the ones it connects to.</small>
  </div>
  <svg class="map" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs><filter id="glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="4" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
    ${lines.join("")}${stars.join("")}
  </svg>
</body></html>`;

const icon = `<!doctype html><html><body style="margin:0;width:180px;height:180px;background:${NAVY};display:grid;place-items:center">${star(128)}</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(card, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: "public/og.png" });
await page.setViewportSize({ width: 180, height: 180 });
await page.setContent(icon);
await page.screenshot({ path: "public/apple-touch-icon.png" });
await browser.close();
console.log("✓ public/og.png, public/apple-touch-icon.png");
