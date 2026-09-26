// The skill graph. Single source of truth: the server-side copy in
// supabase/catalog.sql is generated from this file (npm run db:catalog).

export type TrackId = "frontend" | "backend" | "data" | "devops";

export interface Track {
  id: TrackId;
  name: string;
  constellation: string;
  blurb: string;
  /** HSL triplet, used as `hsl(var(--track))` */
  hue: string;
}

export interface SkillDef {
  id: string;
  name: string;
  track: TrackId;
  description: string;
  requires: string[];
  /** position on the galaxy map, in % of the viewport */
  x: number;
  y: number;
}

export const tracks: Track[] = [
  { id: "frontend", name: "Frontend", constellation: "Lyra", blurb: "Build what users see and touch.", hue: "280 85% 70%" },
  { id: "backend", name: "Backend", constellation: "Orion", blurb: "Servers, APIs and the data behind them.", hue: "190 90% 60%" },
  { id: "data", name: "Data & AI", constellation: "Cygnus", blurb: "Turn data into models and LLM apps.", hue: "150 70% 55%" },
  { id: "devops", name: "DevOps & Cloud", constellation: "Draco", blurb: "Ship, run and scale software.", hue: "35 95% 62%" },
];

export const skills: SkillDef[] = [
  // Frontend — top left
  { id: "html", name: "HTML", track: "frontend", x: 10, y: 46, requires: [],
    description: "Semantic structure of the web: documents, forms, tables and links." },
  { id: "css", name: "CSS", track: "frontend", x: 18, y: 34, requires: ["html"],
    description: "Selectors, the box model, flexbox, grid and responsive layouts." },
  { id: "javascript", name: "JavaScript", track: "frontend", x: 25, y: 47, requires: ["html"],
    description: "The language of the browser: functions, arrays, objects, async and the DOM." },
  { id: "a11y", name: "Accessibility", track: "frontend", x: 6, y: 25, requires: ["html", "css"],
    description: "Build for everyone: alt text, labels, focus order, contrast and ARIA." },
  { id: "tailwind", name: "Tailwind", track: "frontend", x: 16, y: 18, requires: ["css"],
    description: "Utility-first styling for fast, consistent UI." },
  { id: "typescript", name: "TypeScript", track: "frontend", x: 34, y: 38, requires: ["javascript"],
    description: "Static types for JavaScript: interfaces, unions, generics and narrowing." },
  { id: "react", name: "React", track: "frontend", x: 28, y: 24, requires: ["javascript", "css"],
    description: "Components, props, state, effects and hooks." },
  { id: "nextjs", name: "Next.js", track: "frontend", x: 40, y: 17, requires: ["react", "typescript"],
    description: "Full-stack React: routing, server components, data fetching and deployment." },

  // Backend — top right
  { id: "nodejs", name: "Node.js", track: "backend", x: 56, y: 42, requires: ["javascript"],
    description: "JavaScript on the server: modules, the event loop, streams and npm." },
  { id: "express", name: "Express", track: "backend", x: 63, y: 30, requires: ["nodejs"],
    description: "Minimal web framework for Node: routing, middleware and error handling." },
  { id: "rest-apis", name: "REST APIs", track: "backend", x: 73, y: 20, requires: ["express"],
    description: "Resources, HTTP verbs, status codes, pagination and versioning." },
  { id: "sql", name: "SQL", track: "backend", x: 88, y: 44, requires: [],
    description: "Query relational data: SELECT, JOIN, GROUP BY and indexes." },
  { id: "postgres", name: "PostgreSQL", track: "backend", x: 92, y: 30, requires: ["sql"],
    description: "The database most startups pick: constraints, transactions, JSONB and RLS." },
  { id: "auth", name: "Auth", track: "backend", x: 85, y: 15, requires: ["rest-apis", "postgres"],
    description: "Sessions, JWTs, OAuth and hashing passwords the right way." },
  { id: "fastapi", name: "FastAPI", track: "backend", x: 74, y: 40, requires: ["python", "rest-apis"],
    description: "Typed Python APIs with automatic validation and OpenAPI docs." },

  // Data & AI — bottom right
  { id: "python", name: "Python", track: "data", x: 60, y: 72, requires: [],
    description: "Readable, batteries-included language for scripting, data and ML." },
  { id: "pandas", name: "pandas", track: "data", x: 69, y: 62, requires: ["python"],
    description: "DataFrames: load, clean, filter, group and join tabular data." },
  { id: "data-viz", name: "Data Viz", track: "data", x: 81, y: 57, requires: ["pandas"],
    description: "Pick the right chart and tell an honest story with data." },
  { id: "ml-basics", name: "ML Basics", track: "data", x: 75, y: 76, requires: ["pandas", "sql"],
    description: "Train/test splits, regression, classification, overfitting and metrics." },
  { id: "deep-learning", name: "Deep Learning", track: "data", x: 88, y: 68, requires: ["ml-basics"],
    description: "Neural networks, gradient descent, embeddings and transformers." },
  { id: "llm-apps", name: "LLM Apps", track: "data", x: 90, y: 84, requires: ["ml-basics", "rest-apis"],
    description: "Prompting, RAG, tool calling and evaluating model output." },

  // DevOps & Cloud — bottom left
  { id: "git", name: "Git", track: "devops", x: 12, y: 62, requires: [],
    description: "Commits, branches, merging, rebasing and pull requests." },
  { id: "linux", name: "Linux", track: "devops", x: 6, y: 77, requires: [],
    description: "The shell, files and permissions, processes and pipes." },
  { id: "docker", name: "Docker", track: "devops", x: 19, y: 82, requires: ["linux"],
    description: "Images, containers, volumes and multi-stage builds." },
  { id: "ci-cd", name: "CI/CD", track: "devops", x: 28, y: 68, requires: ["git", "docker"],
    description: "Automate tests and deploys on every push." },
  { id: "kubernetes", name: "Kubernetes", track: "devops", x: 33, y: 85, requires: ["docker"],
    description: "Pods, deployments, services and scaling containers." },
  { id: "cloud", name: "Cloud", track: "devops", x: 42, y: 72, requires: ["linux"],
    description: "Compute, storage, networking and IAM on a major cloud." },
  { id: "iac", name: "Terraform", track: "devops", x: 46, y: 86, requires: ["cloud"],
    description: "Infrastructure as code: plan, apply and state." },
];

export const skillById = new Map(skills.map((s) => [s.id, s]));
export const trackById = new Map(tracks.map((t) => [t.id, t]));

/** Reverse edges: which skills list `id` as a requirement. */
export const unlocksOf = (id: string) => skills.filter((s) => s.requires.includes(id));
