import type { ConstellationState } from "@/lib/progress";
import { cn } from "@/lib/utils";

/** Learning paths as constellations: gold once formed, otherwise how many of their stars are lit. */
export const ConstellationList = ({ items, compact }: { items: ConstellationState[]; compact?: boolean }) => (
  <ul className={cn(compact ? "space-y-2" : "space-y-3")}>
    {items.map((c) => (
      <li key={c.id}>
        <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
          <span>
            <span className={cn("font-semibold", c.formed && "text-[hsl(var(--glow-completed))]")}>{c.name}</span>
            <span className="text-muted-foreground">, {c.figure.replace("The", "the")}. {c.path}</span>
          </span>
          <span className={cn("shrink-0", c.formed ? "text-[hsl(var(--glow-completed))]" : "text-muted-foreground")}>
            {c.formed ? "Formed" : `${c.done}/${c.stars.length}`}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[hsl(var(--glow-completed)/0.15)]">
          <div className="h-full rounded-full bg-[hsl(var(--glow-completed))]" style={{ width: `${(c.done / c.stars.length) * 100}%` }} />
        </div>
      </li>
    ))}
  </ul>
);
