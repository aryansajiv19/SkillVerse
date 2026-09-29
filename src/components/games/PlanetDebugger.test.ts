import { describe, expect, it } from "vitest";
import { captureLogs } from "@/lib/runner";
import { isRepaired, planets } from "./PlanetDebugger";

// Different, reasonable fixes for each planet. All of them must pass: the game grades behaviour, not text.
const fixes: Record<string, string[]> = {
  Mercury: [
    "function greet(name) {\n  console.log('Hello ' + name);\n}",
    'function greet(name) {\n  console.log("Hello " + name);\n}',
    "const greet = (name) => console.log(`Hello ${name}`);",
  ],
  Venus: [
    "const moons = ['Io', 'Europa', 'Ganymede'];\nfor (let i = 0; i < moons.length; i++) {\n  console.log(moons[i]);\n}",
    "const moons = ['Io', 'Europa', 'Ganymede'];\nfor (const moon of moons) console.log(moon);",
    "const moons = ['Io', 'Europa', 'Ganymede'];\nmoons.forEach((m) => console.log(m));",
  ],
  Earth: [
    "const pilot = { name: 'Bob', age: 30 };\nconsole.log(pilot.name + ' is ' + pilot.age);",
    "const pilot = { name: 'Bob', age: 30 };\nconsole.log(`${pilot.name} is ${pilot.age}`);",
  ],
  Mars: [
    "function double(n) {\n  return n * 2;\n}\nconsole.log(double(4));",
    "const double = (n) => n * 2;\nconsole.log(double(4));",
  ],
  Jupiter: [
    "const fuel = 40;\nif (fuel === 100) {\n  console.log('Full tank');\n} else {\n  console.log('Refuel');\n}",
    "const fuel = 40;\nconsole.log(fuel >= 100 ? 'Full tank' : 'Refuel');",
  ],
};

describe("Planet Debugger", () => {
  it.each(planets.map((p) => [p.name, p] as const))("%s starts broken", (_name, p) => {
    expect(isRepaired(p, captureLogs(p.code, p.call))).toBe(false);
  });

  it.each(planets.flatMap((p) => (fixes[p.name] ?? []).map((code, i) => [p.name, i + 1, p, code] as const)))(
    "%s accepts fix #%i",
    (_name, _i, p, code) => expect(isRepaired(p, captureLogs(code, p.call))).toBe(true),
  );

  it("has a fix for every planet, so the game can be won", () => {
    expect(planets.every((p) => fixes[p.name]?.length)).toBe(true);
  });

  it("rejects hard-coding the greeting", () => {
    const mercury = planets[0];
    expect(isRepaired(mercury, captureLogs("function greet() { console.log('Hello Ada') }", mercury.call))).toBe(false);
  });
});
