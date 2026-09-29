// Every complete learning path forms a constellation. Each one is a career path, named
// after a real constellation, defined by the stars it ends on: its stars are those goals
// plus everything they need, so a path can cross the galaxy's regions.

export interface ConstellationDef {
  id: string;
  /** The real constellation it's named after. */
  name: string;
  figure: string;
  /** What finishing the path makes you. */
  path: string;
  goals: string[];
  /** The star its name is written under on the map. */
  anchor: string;
}

export const constellations: ConstellationDef[] = [
  { id: "sagittarius", name: "Sagittarius", figure: "The Archer", path: "Full-stack developer", goals: ["nextjs", "auth"], anchor: "rest-apis" },
  { id: "lyra", name: "Lyra", figure: "The Lyre", path: "Frontend developer", goals: ["nextjs", "a11y", "tailwind"], anchor: "tailwind" },
  { id: "orion", name: "Orion", figure: "The Hunter", path: "Backend developer", goals: ["auth", "fastapi"], anchor: "auth" },
  { id: "cygnus", name: "Cygnus", figure: "The Swan", path: "AI engineer", goals: ["llm-apps", "deep-learning"], anchor: "llm-apps" },
  { id: "pyxis", name: "Pyxis", figure: "The Compass", path: "Data analyst", goals: ["data-viz", "postgres"], anchor: "data-viz" },
  { id: "draco", name: "Draco", figure: "The Dragon", path: "DevOps engineer", goals: ["ci-cd", "kubernetes", "iac"], anchor: "iac" },
  { id: "argo", name: "Argo", figure: "The Ship", path: "Backend to production", goals: ["ci-cd", "express"], anchor: "ci-cd" },
];
