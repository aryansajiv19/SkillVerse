import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Flame } from "lucide-react";
import { ThreeGalaxyCanvas } from "@/components/galaxy/ThreeGalaxyCanvas";
import { ShootingStars } from "@/components/ShootingStars";
import { Navigation } from "@/components/Navigation";
import { SkillStar } from "@/components/SkillStar";
import { SkillPanel } from "@/components/SkillPanel";
import { ConstellationLines } from "@/components/ConstellationLines";
import { Button } from "@/components/ui/button";
import { useProgress } from "@/hooks/useProgress";
import { levelProgress } from "@/lib/progress";
import { tracks, type TrackId } from "@/content/skills";
import { cn } from "@/lib/utils";

const INTRO_KEY = "skillverse:intro-seen";
const seenIntro = () => {
  try {
    return localStorage.getItem(INTRO_KEY) === "1";
  } catch {
    return false;
  }
};

const Index = () => {
  const { skills, stats } = useProgress();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focus, setFocus] = useState<TrackId | null>(null);
  const [intro, setIntro] = useState(!seenIntro());
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => setMouse({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const closeIntro = (track: TrackId | null) => {
    setFocus(track);
    setIntro(false);
    try {
      localStorage.setItem(INTRO_KEY, "1");
    } catch {
      /* private mode: show the intro again next time */
    }
  };

  const selected = skills.find((s) => s.id === selectedId) ?? null;
  const lvl = levelProgress(stats.xp);
  const masteredCount = skills.filter((s) => s.mastered).length;

  return (
    <div className="relative h-screen overflow-hidden">
      <ThreeGalaxyCanvas mousePosition={mouse} />
      <ShootingStars />
      <Navigation />

      {/* The map scrolls sideways on narrow screens instead of squashing stars together */}
      <div className="absolute inset-0 overflow-x-auto overflow-y-hidden">
        <div className="relative h-full min-w-[960px]">
          <ConstellationLines skills={skills} focus={focus} />
          {tracks.map((t, i) => (
            <div
              key={t.id}
              aria-hidden
              className={cn(
                "pointer-events-none absolute select-none transition-opacity duration-500",
                i % 2 ? "right-6 text-right" : "left-6",
                i < 2 ? "top-[9%]" : "bottom-[3%]",
                focus && focus !== t.id && "opacity-20",
              )}
            >
              <div className="font-display text-2xl font-bold opacity-80" style={{ color: `hsl(${t.hue})` }}>{t.constellation}</div>
              <div className="text-xs text-muted-foreground">{t.name}</div>
            </div>
          ))}
          {skills.map((s) => (
            <SkillStar key={s.id} skill={s} dimmed={!!focus && focus !== s.track} onSelect={() => setSelectedId(s.id)} />
          ))}
        </div>
      </div>

      {/* Track focus */}
      <div role="group" aria-label="Focus a track" className="glass-panel absolute bottom-20 left-1/2 z-40 flex -translate-x-1/2 gap-1 rounded-full p-1 sm:bottom-6 sm:left-6 sm:translate-x-0">
        <FocusButton active={!focus} onClick={() => setFocus(null)}>All</FocusButton>
        {tracks.map((t) => (
          <FocusButton key={t.id} active={focus === t.id} onClick={() => setFocus(focus === t.id ? null : t.id)} hue={t.hue}>
            {t.name}
          </FocusButton>
        ))}
      </div>

      {/* HUD */}
      <Link
        to="/dashboard"
        className="glass-panel absolute bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-4 rounded-full px-5 py-2.5 text-sm sm:left-auto sm:right-24 sm:translate-x-0"
      >
        <span className="font-display font-bold">Level {lvl.level}</span>
        <span className="h-1.5 w-24 overflow-hidden rounded-full bg-muted" aria-label={`${lvl.toNext} XP to level ${lvl.level + 1}`}>
          <span className="block h-full rounded-full bg-[hsl(var(--glow-completed))]" style={{ width: `${lvl.pct}%` }} />
        </span>
        <span className="text-muted-foreground">{masteredCount}/{skills.length} stars</span>
        {stats.streak > 0 && (
          <span className="flex items-center gap-1 text-[hsl(var(--glow-completed))]">
            <Flame className="h-4 w-4" aria-hidden />{stats.streak}
          </span>
        )}
      </Link>

      {intro && (
        <div className="absolute inset-0 z-[60] flex items-end bg-background/70 p-4 backdrop-blur-sm sm:items-center sm:p-12">
          <div className="max-w-xl space-y-6">
            <h1 className="text-5xl font-extrabold leading-[1.05] sm:text-6xl">Learn by lighting up a galaxy.</h1>
            <p className="text-lg text-foreground/80">
              Every star is a skill. Pass its skill check to light it up and unlock the stars it connects to.
              Your progress saves as you go. No sign-up needed.
            </p>
            <div>
              <p className="mb-3 text-sm text-muted-foreground">Where do you want to start?</p>
              <div className="grid grid-cols-2 gap-2">
                {tracks.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => closeIntro(t.id)}
                    className="rounded-xl border bg-card/60 p-4 text-left transition-colors hover:border-[hsl(var(--track))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    style={{ ["--track" as string]: t.hue }}
                  >
                    <span className="block font-display text-lg font-bold" style={{ color: `hsl(${t.hue})` }}>{t.name}</span>
                    <span className="text-sm text-muted-foreground">{t.blurb}</span>
                  </button>
                ))}
              </div>
            </div>
            <Button variant="ghost" onClick={() => closeIntro(null)} className="px-0 text-muted-foreground hover:bg-transparent hover:text-foreground">
              Show me the whole map
            </Button>
          </div>
        </div>
      )}

      <SkillPanel skill={selected} onClose={() => setSelectedId(null)} />
    </div>
  );
};

const FocusButton = ({ active, hue, onClick, children }: { active: boolean; hue?: string; onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    aria-pressed={active}
    className={cn(
      "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      active ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
    )}
    style={active && hue ? { background: `hsl(${hue})` } : undefined}
  >
    {children}
  </button>
);

export default Index;
