import { forwardRef, useLayoutEffect, useRef } from "react";
import type { SkillState } from "@/lib/progress";
import { skillById, trackById } from "@/content/skills";
import { worldPos, type Point } from "@/components/map/geometry";

/** Lines being drawn out of a freshly lit star, toward the stars it just unlocked. */
export interface Beams {
  from: string;
  to: string[];
  /** targets whose beam has arrived; their regular line shows from then on */
  landed: Set<string>;
  onLand: (id: string) => void;
}

// One line per prerequisite edge, in map units (the parent sets the group's transform).
// Solid when both ends are mastered, brighter dashes when the edge leads to a star you can
// take next. Strokes don't scale with zoom.
export const ConstellationLines = forwardRef<SVGGElement, { skills: SkillState[]; focus: string | null; beams?: Beams | null; path?: Set<string> | null }>(
  ({ skills, focus, beams, path: route }, groupRef) => {
    const byId = new Map(skills.map((s) => [s.id, s]));
    return (
      <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
        <g ref={groupRef}>
          {skills.flatMap((to) =>
            to.requires.map((reqId) => {
              if (beams && beams.from === reqId && beams.to.includes(to.id) && !beams.landed.has(to.id)) return null;
              const from = byId.get(reqId) ?? { ...skillById.get(reqId)!, mastered: false };
              const lit = from.mastered && to.mastered;
              const path = from.mastered && to.unlocked && !to.mastered;
              const hue = trackById.get(to.track)!.hue;
              // With a star selected, only the edges along its learning path stay visible.
              const onRoute = !!route && route.has(from.id) && route.has(to.id);
              const dim = route ? !onRoute : focus && focus !== to.track && focus !== from.track;
              const a = worldPos(from);
              const b = worldPos(to);
              return (
                <line
                  key={`${reqId}-${to.id}`}
                  x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                  vectorEffect="non-scaling-stroke"
                  strokeWidth={lit || onRoute ? 1.8 : 1}
                  strokeDasharray={lit ? undefined : "3 5"}
                  // style, not attributes: presentation attributes can't use var()
                  style={{
                    stroke: lit || path || onRoute ? `hsl(${hue})` : "hsl(var(--muted-foreground))",
                    strokeOpacity: dim ? 0.06 : lit || onRoute ? 0.9 : path ? 0.6 : 0.3,
                  }}
                  className="transition-[stroke-opacity] duration-300"
                />
              );
            }),
          )}
          {beams?.to.map((id, i) => {
            const target = skillById.get(id)!;
            return (
              <Beam
                key={id}
                from={worldPos(skillById.get(beams.from)!)}
                to={worldPos(target)}
                hue={trackById.get(target.track)!.hue}
                delay={260 + i * 140}
                onLand={() => beams.onLand(id)}
              />
            );
          })}
        </g>
      </svg>
    );
  },
);
ConstellationLines.displayName = "ConstellationLines";

/** A solid line that draws itself from `from` to `to` (stroke-dashoffset), then fades out. */
const Beam = ({ from, to, hue, delay, onLand }: { from: Point; to: Point; hue: string; delay: number; onLand: () => void }) => {
  const ref = useRef<SVGLineElement>(null);
  const land = useRef(onLand);
  land.current = onLand;

  // Layout effect: the dash has to be in place before the first paint, or the full line flashes.
  useLayoutEffect(() => {
    const el = ref.current!;
    // Non-scaling strokes dash in screen pixels, so measure the line on screen.
    const len = Math.hypot(to.x - from.x, to.y - from.y) * (el.getCTM()?.a ?? 1);
    el.style.strokeDasharray = `${len} ${len}`;
    const draw = el.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], {
      duration: 650,
      delay,
      easing: "cubic-bezier(0.77, 0, 0.175, 1)",
      fill: "both",
    });
    let fade: Animation | undefined;
    draw.onfinish = () => {
      land.current();
      fade = el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 600, easing: "ease-out", fill: "forwards" });
    };
    return () => {
      draw.cancel();
      fade?.cancel();
    };
  }, [from.x, from.y, to.x, to.y, delay]);

  return (
    <line
      ref={ref}
      x1={from.x} y1={from.y} x2={to.x} y2={to.y}
      vectorEffect="non-scaling-stroke"
      stroke={`hsl(${hue})`}
      strokeWidth={2}
      strokeLinecap="round"
      style={{ filter: `drop-shadow(0 0 3px hsl(${hue}))` }}
    />
  );
};
