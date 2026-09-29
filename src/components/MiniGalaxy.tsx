import { useId, useMemo } from "react";
import { skillStates } from "@/lib/progress";
import { skills as catalog, trackById, tracks } from "@/content/skills";

// Skill x/y are percentages of the full map, which is drawn on a roughly 16:10 screen.
const W = 160;
const H = 100;
const pos = (s: { x: number; y: number }) => ({ x: (s.x / 100) * W, y: (s.y / 100) * H });

// Each constellation name sits in the corner nearest its stars.
const labels = tracks.map((t) => {
  const own = catalog.filter((s) => s.track === t.id);
  const left = own.reduce((n, s) => n + s.x, 0) / own.length < 50;
  const top = own.reduce((n, s) => n + s.y, 0) / own.length < 50;
  return { ...t, x: left ? 3 : W - 3, y: top ? 7 : H - 3, anchor: left ? ("start" as const) : ("end" as const) };
});

/** Read-only overview of the galaxy: lit stars in their track colour, the rest dim. */
export const MiniGalaxy = ({
  mastered,
  title,
  className,
}: {
  mastered: Set<string>;
  title: string;
  className?: string;
}) => {
  const id = useId();
  const states = useMemo(() => skillStates(mastered), [mastered]);
  const byId = new Map(states.map((s) => [s.id, s]));
  const lit = states.filter((s) => s.mastered);
  const desc = lit.length
    ? `${lit.length} of ${states.length} stars lit: ${lit.map((s) => s.name).join(", ")}.`
    : `No stars lit yet, 0 of ${states.length}.`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby={`${id}-t ${id}-d`} className={className}>
      <title id={`${id}-t`}>{title}</title>
      <desc id={`${id}-d`}>{desc}</desc>

      {labels.map((t) => (
        <text
          key={t.id}
          x={t.x}
          y={t.y}
          textAnchor={t.anchor}
          fontSize={4.5}
          fill={`hsl(${t.hue})`}
          className="font-display font-bold"
        >
          {t.constellation}
        </text>
      ))}

      {states.flatMap((to) =>
        to.requires.map((reqId) => {
          const from = byId.get(reqId)!;
          const on = from.mastered && to.mastered;
          const a = pos(from);
          const b = pos(to);
          return (
            <line
              key={`${reqId}-${to.id}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={on ? `hsl(${trackById.get(to.track)!.hue})` : "hsl(var(--muted-foreground))"}
              strokeOpacity={on ? 0.75 : 0.25}
              strokeWidth={on ? 0.5 : 0.35}
              strokeDasharray={on ? undefined : "1 1.5"}
            />
          );
        }),
      )}

      {states.map((s) => {
        const { x, y } = pos(s);
        const hue = `hsl(${trackById.get(s.track)!.hue})`;
        const state = s.mastered ? "mastered" : s.unlocked ? "available" : "locked";
        return (
          <g key={s.id}>
            <title>{`${s.name}, ${state}`}</title>
            {state === "mastered" && (
              <>
                <circle cx={x} cy={y} r={3.6} fill={hue} fillOpacity={0.2} />
                <circle cx={x} cy={y} r={1.6} fill={hue} />
                <circle cx={x} cy={y} r={0.6} fill="white" fillOpacity={0.85} />
              </>
            )}
            {state === "available" && (
              <circle
                cx={x}
                cy={y}
                r={1.3}
                fill="hsl(var(--background))"
                stroke={hue}
                strokeWidth={0.4}
                strokeOpacity={0.8}
              />
            )}
            {state === "locked" && (
              <circle cx={x} cy={y} r={0.7} fill="hsl(var(--muted-foreground))" fillOpacity={0.6} />
            )}
            {/* invisible, larger hover target for the tooltip */}
            <circle cx={x} cy={y} r={4} fill="transparent" />
          </g>
        );
      })}
    </svg>
  );
};
