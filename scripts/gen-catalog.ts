// npm run db:catalog: regenerate the public catalog and the database catalog.
// CI fails if either committed file is stale.
import { writeFileSync } from "node:fs";
import { buildCatalog, catalogSql, publicModule } from "./catalog.ts";

const built = buildCatalog();
writeFileSync(new URL("../supabase/catalog.sql", import.meta.url), catalogSql(built));
writeFileSync(new URL("../src/content/challenges.gen.ts", import.meta.url), publicModule(built));
console.log(`catalog: ${built.skills.length} skills, ${built.publicChallenges.length} challenges, ${built.answers.length} answers`);
