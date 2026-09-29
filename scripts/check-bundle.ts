// Run after `npm run build`: fails if any quiz explanation (which reveals the answer)
// made it into the browser bundle.
import { readdirSync, readFileSync } from "node:fs";
import { buildCatalog } from "./catalog.ts";

const dir = new URL("../dist/assets/", import.meta.url);
const bundle = readdirSync(dir).filter((f) => f.endsWith(".js")).map((f) => readFileSync(new URL(f, dir), "utf8")).join("\n");
const leaked = buildCatalog().answers.filter((a) => bundle.includes(a.explanation.slice(0, 40)));

if (leaked.length) {
  console.error(`✗ ${leaked.length} quiz explanations found in dist/: ${leaked.slice(0, 3).map((a) => `${a.challengeId}#${a.idx}`).join(", ")}`);
  process.exit(1);
}
console.log(`✓ no answers in the bundle (${buildCatalog().answers.length} checked)`);
