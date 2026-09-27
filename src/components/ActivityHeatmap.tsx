import { useMemo } from "react";
import { activityCalendar, HEAT_LEVELS, HEAT_WEEKS, type HeatDay } from "@/lib/progress";
import { cn } from "@/lib/utils";

// One-hue ramp on the mastered gold, dim to bright. Checked against the panel surface:
// lightness is monotone and the dimmest step clears 2.8:1, so a single completion is visible.
const FILL = [
  "hsl(var(--foreground) / 0.07)",
  "hsl(40 55% 30%)",
  "hsl(42 70% 42%)",
  "hsl(44 85% 56%)",
  "hsl(var(--glow-completed))",
];

const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
const fullDate = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
const cellTitle = (d: HeatDay) =>
  `${d.count ? plural(d.count, "completion") : "No completions"} on ${fullDate(d.date)}`;

/** GitHub-style calendar of the last 26 weeks. Pass one ISO timestamp per completion. */
export const ActivityHeatmap = ({ timestamps, className }: { timestamps: string[]; className?: string }) => {
  const cal = useMemo(() => activityCalendar(timestamps), [timestamps]);
  const summary = cal.total
    ? `${plural(cal.total, "completion")} on ${plural(cal.activeDays, "day")} in the last ${HEAT_WEEKS} weeks`
    : `No completions in the last ${HEAT_WEEKS} weeks`;
  const busiest = cal.weeks
    .flat()
    .reduce<HeatDay | null>((best, d) => (d && d.count > (best?.count ?? 0) ? d : best), null);
  const label =
    busiest && cal.activeDays > 1
      ? `${summary}. Busiest day: ${fullDate(busiest.date)}, with ${plural(busiest.count, "completion")}.`
      : `${summary}.`;
  // Week columns shrink to fit (about 10px cells on a phone); the day labels only show from sm up.
  // Tailwind needs literal class names, so 26 here is HEAT_WEEKS.
  const columns = "grid grid-cols-[repeat(26,minmax(0,1fr))] sm:grid-cols-[1.75rem_repeat(26,minmax(0,1fr))]";

  return (
    <figure className={cn("max-w-[40rem]", className)}>
      <p aria-hidden className="mb-3 text-sm text-muted-foreground">
        {summary}
      </p>
      <div role="img" aria-label={label}>
        <div className={cn(columns, "mb-1 gap-x-[2px] text-[11px] leading-none text-muted-foreground sm:gap-x-[3px]")}>
          {cal.months.map((m) => (
            <span
              key={m.week}
              className="whitespace-nowrap [grid-column-start:var(--col)] sm:[grid-column-start:var(--col-sm)]"
              style={{ ["--col" as string]: m.week + 1, ["--col-sm" as string]: m.week + 2 }}
            >
              {m.label}
            </span>
          ))}
        </div>
        <div className={cn(columns, "gap-[2px] sm:gap-[3px]")}>
          <div className="hidden grid-rows-7 gap-[2px] text-[11px] leading-none text-muted-foreground sm:grid sm:gap-[3px]">
            {DAY_LABELS.map((d, i) => (
              <span key={i} className="flex items-center">
                {d}
              </span>
            ))}
          </div>
          {cal.weeks.map((week, w) => (
            <div key={w} className="grid grid-rows-7 gap-[2px] sm:gap-[3px]">
              {week.map((d, i) =>
                d ? (
                  <span
                    key={d.date}
                    title={cellTitle(d)}
                    className={cn(
                      "aspect-square rounded-[2px] hover:ring-1 hover:ring-foreground/70",
                      d.date === cal.today && "outline outline-1 outline-offset-1 outline-foreground",
                    )}
                    style={{ background: FILL[d.level] }}
                  />
                ) : (
                  <span key={i} className="aspect-square" />
                ),
              )}
            </div>
          ))}
        </div>
      </div>
      <figcaption
        aria-hidden
        className="mt-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-xs text-muted-foreground"
      >
        <span className="flex items-center gap-1.5">
          Less
          {FILL.map((fill, i) => (
            <span key={i} title={HEAT_LEVELS[i]} className="h-2.5 w-2.5 rounded-[2px]" style={{ background: fill }} />
          ))}
          More
        </span>
        <span>Days in UTC</span>
      </figcaption>
    </figure>
  );
};
