import type { Achievement } from "@/lib/progress";
import { cn } from "@/lib/utils";

/** Earned badges are gold. Locked ones get a dashed empty ring and a "Locked" tag; no text is faded. */
export const AchievementList = ({ items, className }: { items: Achievement[]; className?: string }) => (
  <ul className={cn("grid gap-x-6 gap-y-4", className)}>
    {items.map((a) => (
      <li key={a.id} className="flex items-start gap-3">
        <span
          aria-hidden
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-full border",
            a.earned
              ? "border-[hsl(var(--glow-completed)/0.5)] bg-[hsl(var(--glow-completed)/0.12)] text-[hsl(var(--glow-completed))]"
              : "border-dashed border-muted-foreground/40 text-muted-foreground",
          )}
        >
          <a.icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-x-2 font-semibold">
            {a.name}
            {a.earned ? (
              <span className="sr-only">, earned</span>
            ) : (
              <span className="rounded-full border px-1.5 py-px text-[11px] font-medium leading-4 text-muted-foreground">
                Locked
              </span>
            )}
          </p>
          <p className="text-sm text-muted-foreground">{a.description}</p>
        </div>
      </li>
    ))}
  </ul>
);
