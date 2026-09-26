import type { SkillState } from "@/lib/progress";
import { skillById, trackById } from "@/content/skills";

// One line per prerequisite edge. Solid when both ends are mastered,
// brighter dashes when the edge leads to a star you can take next.
export const ConstellationLines = ({ skills, focus }: { skills: SkillState[]; focus: string | null }) => {
  const byId = new Map(skills.map((s) => [s.id, s]));
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
      {skills.flatMap((to) =>
        to.requires.map((reqId) => {
          const from = byId.get(reqId) ?? { ...skillById.get(reqId)!, mastered: false };
          const lit = from.mastered && to.mastered;
          const path = from.mastered && !to.mastered;
          const hue = trackById.get(to.track)!.hue;
          const dim = focus && focus !== to.track && focus !== from.track;
          return (
            <line
              key={`${reqId}-${to.id}`}
              x1={`${from.x}%`} y1={`${from.y}%`} x2={`${to.x}%`} y2={`${to.y}%`}
              stroke={lit || path ? `hsl(${hue})` : "hsl(var(--muted-foreground))"}
              strokeOpacity={dim ? 0.06 : lit ? 0.8 : path ? 0.55 : 0.18}
              strokeWidth={lit ? 1.5 : 1}
              strokeDasharray={lit ? undefined : "3 5"}
              className="transition-[stroke-opacity] duration-500"
            />
          );
        }),
      )}
    </svg>
  );
};
