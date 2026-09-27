import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Flame, Minus, Plus, Scan } from "lucide-react";
import { tracks, trackById, type TrackId } from "@/content/skills";
import { cn } from "@/lib/utils";

/** Chips from sm up; a native select on phones, where five chips don't fit. */
export const TrackFocus = ({ value, onChange }: { value: TrackId | null; onChange: (track: TrackId | null) => void }) => (
  <>
    <div role="group" aria-label="Focus a track" className="glass-panel hidden gap-1 rounded-full p-1 sm:flex">
      <Chip active={!value} onClick={() => onChange(null)}>All</Chip>
      {tracks.map((t) => (
        <Chip key={t.id} active={value === t.id} hue={t.hue} onClick={() => onChange(value === t.id ? null : t.id)}>
          {t.name}
        </Chip>
      ))}
    </div>
    <label className="glass-panel relative flex h-10 items-center rounded-full sm:hidden">
      <span className="sr-only">Focus a track</span>
      <select
        value={value ?? ""}
        onChange={(e) => onChange((e.target.value || null) as TrackId | null)}
        className="h-full appearance-none rounded-full bg-transparent pl-4 pr-9 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [color-scheme:dark]"
        style={{ color: value ? `hsl(${trackById.get(value)!.hue})` : undefined }}
      >
        <option value="" className="bg-card text-foreground">All tracks</option>
        {tracks.map((t) => (
          <option key={t.id} value={t.id} className="bg-card text-foreground">{t.name}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-muted-foreground" aria-hidden />
    </label>
  </>
);

const Chip = ({ active, hue, onClick, children }: { active: boolean; hue?: string; onClick: () => void; children: ReactNode }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={cn(
      "h-8 whitespace-nowrap rounded-full px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      active ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
    )}
    style={active && hue ? { background: `hsl(${hue})` } : undefined}
  >
    {children}
  </button>
);

export const Hud = ({ level, pct, toNext, lit, total, streak }: {
  level: number;
  pct: number;
  toNext: number;
  lit: number;
  total: number;
  streak: number;
}) => (
  <Link
    to="/dashboard"
    className="glass-panel flex h-10 items-center gap-2.5 whitespace-nowrap rounded-full px-4 text-sm transition-colors hover:border-foreground/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:gap-4 sm:px-5"
  >
    <span className="font-display font-bold">Level {level}</span>
    <span aria-hidden className="h-1.5 w-10 overflow-hidden rounded-full bg-muted sm:w-24">
      <span className="block h-full rounded-full bg-[hsl(var(--glow-completed))]" style={{ width: `${pct}%` }} />
    </span>
    <span className="sr-only">{toNext} XP to level {level + 1}.</span>
    <span className="text-muted-foreground">
      {lit}/{total}<span className="max-sm:sr-only"> stars</span>
    </span>
    {streak > 0 && (
      <span className="flex items-center gap-1 text-[hsl(var(--glow-completed))]">
        <Flame className="h-4 w-4" aria-hidden />
        {streak}
        <span className="sr-only"> day streak</span>
      </span>
    )}
  </Link>
);

export const ZoomControls = ({ onZoomIn, onZoomOut, onFit }: { onZoomIn: () => void; onZoomOut: () => void; onFit: () => void }) => (
  <div role="group" aria-label="Zoom" className="glass-panel flex flex-col gap-0.5 rounded-full p-1">
    <ZoomButton label="Zoom in" keys="+" onClick={onZoomIn}><Plus /></ZoomButton>
    <ZoomButton label="Zoom out" keys="-" onClick={onZoomOut}><Minus /></ZoomButton>
    <ZoomButton label="Show the whole galaxy" keys="0" onClick={onFit}><Scan /></ZoomButton>
  </div>
);

const ZoomButton = ({ label, keys, onClick, children }: { label: string; keys: string; onClick: () => void; children: ReactNode }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    title={`${label} (${keys})`}
    className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition-[color,background-color,transform] duration-150 hover:bg-foreground/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95 [&_svg]:h-4 [&_svg]:w-4"
  >
    {children}
  </button>
);
