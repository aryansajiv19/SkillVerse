import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ShootingStars } from "@/components/ShootingStars";
import { Navigation } from "@/components/Navigation";
import { usePageTitle } from "@/components/PageShell";
import { SkillStar } from "@/components/SkillStar";
import { SkillPanel } from "@/components/SkillPanel";
import { ConstellationLines } from "@/components/ConstellationLines";
import { IntroDialog } from "@/components/map/IntroDialog";
import { Hud, TrackFocus, ZoomControls } from "@/components/map/MapControls";
import { usePanZoom } from "@/components/map/usePanZoom";
import { useReducedMotion } from "@/components/map/useReducedMotion";
import { GALAXY, WORLD, atWorld, boundsOf, trackBounds, worldPos, type Insets } from "@/components/map/geometry";
import { useProgress } from "@/hooks/useProgress";
import { levelProgress } from "@/lib/progress";
import { tracks, unlocksOf, type TrackId } from "@/content/skills";
import { cn } from "@/lib/utils";

// three.js is the heaviest thing on the page, so the stars render first and the sky fades in after.
const ThreeGalaxyCanvas = lazy(() => import("@/components/galaxy/ThreeGalaxyCanvas").then((m) => ({ default: m.ThreeGalaxyCanvas })));

const SKY = "radial-gradient(ellipse at 50% 40%, hsl(232 55% 13%) 0%, hsl(232 60% 8%) 45%, hsl(235 70% 4%) 100%)";

const INTRO_KEY = "skillverse:intro-seen";
const seenIntro = () => {
  try {
    return localStorage.getItem(INTRO_KEY) === "1";
  } catch {
    return false;
  }
};

// Each constellation's name sits off the outer corner of its own cluster.
const CONSTELLATIONS = tracks.map((t) => {
  const b = trackBounds.get(t.id)!;
  const left = b.x0 + b.x1 < WORLD.w;
  const top = b.y0 + b.y1 < WORLD.h;
  return {
    track: t,
    left,
    transform: atWorld(
      { x: left ? b.x0 : b.x1, y: top ? b.y0 : b.y1 },
      `translate(${left ? "-12px" : "calc(12px - 100%)"}, ${top ? "calc(-100% - 30px)" : "34px"})`,
    ),
  };
});

/**
 * Screen edges kept clear of stars: the fixed nav, the bottom controls and the tutor button,
 * and the zoom column (a right margin on wide screens; part of the bottom band on phones,
 * where the map is wider than the screen and would slide under a side column).
 */
const safeInsets = (vw: number, vh: number, controls: (HTMLElement | null)[]): Insets => {
  const phone = vw < 640;
  const tops = controls.filter((el, i) => el && (phone || i === 0)).map((el) => el!.getBoundingClientRect().top);
  return {
    top: 72,
    right: phone ? 16 : 80,
    bottom: Math.max(92, ...tops.map((t) => vh - t + 12)),
    left: phone ? 16 : 24,
  };
};

interface LitSequence {
  id: string;
  targets: string[];
  phase: "frame" | "ignite";
  landed: Set<string>;
  message: string;
}

const Index = () => {
  usePageTitle("Galaxy");
  const { skills, stats, loading } = useProgress();
  const reduced = useReducedMotion();
  const [params, setParams] = useSearchParams();
  const litParam = params.get("lit");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focus, setFocus] = useState<TrackId | null>(null);
  // Arriving from a first mastery means they've been here before; don't cover the moment.
  const [intro, setIntro] = useState(() => !litParam && !seenIntro());
  const [lit, setLit] = useState<LitSequence | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const stackRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<HTMLDivElement>(null);
  const getSafe = useCallback((vw: number, vh: number) => safeInsets(vw, vh, [stackRef.current, zoomRef.current]), []);
  const { viewportRef, groupRef, onKeyDown, show, fit, reveal, zoomBy, contains, ZOOM_STEP } = usePanZoom({ getSafe, reduced, watch: stackRef });

  const lastSelected = useRef<string | null>(null);
  const introFocus = useRef<string | null>(null);
  const litTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const litStarted = useRef(false);

  const focusStar = useCallback(
    (id: string) => viewportRef.current?.querySelector<HTMLElement>(`[data-star="${id}"]`)?.focus({ preventScroll: true }),
    [viewportRef],
  );
  const clearLitParam = useCallback(
    () =>
      setParams(
        (p) => {
          const next = new URLSearchParams(p);
          next.delete("lit");
          return next;
        },
        { replace: true },
      ),
    [setParams],
  );
  // After the lit moment, land on the star, unless the user has already moved focus elsewhere.
  const settleOn = useCallback(
    (id: string) => {
      const a = document.activeElement;
      if (!a || a === document.body || viewportRef.current?.contains(a)) focusStar(id);
    },
    [focusStar, viewportRef],
  );

  // The "lit" moment after a first-time mastery: frame the star, ignite it, then draw its
  // constellation lines out to the stars it just unlocked.
  useEffect(() => {
    if (!litParam || litStarted.current || loading || intro) return;
    const skill = skills.find((s) => s.id === litParam);
    if (skill && !skill.mastered) {
      // Progress may still be refetching after the quiz; give it a moment before giving up.
      const t = setTimeout(() => {
        litStarted.current = true;
        clearLitParam();
      }, 4000);
      return () => clearTimeout(t);
    }
    litStarted.current = true;
    if (!skill) return clearLitParam();

    const targets = unlocksOf(skill.id)
      .map((u) => skills.find((s) => s.id === u.id)!)
      .filter((s) => s.unlocked && !s.mastered);
    const message = `${skill.name} is lit.${targets.length ? ` Unlocked: ${targets.map((t) => t.name).join(", ")}.` : ""}`;
    const box = boundsOf([skill, ...targets]);

    if (reduced) {
      show(box, 0, 1.1);
      clearLitParam();
      settleOn(skill.id);
      setAnnouncement(message);
      return;
    }
    setLit({ id: skill.id, targets: targets.map((t) => t.id), phase: "frame", landed: new Set(), message });
    show(box, 900, 1.1);
    litTimers.current.push(
      setTimeout(() => {
        setLit((l) => l && { ...l, phase: "ignite" });
        setAnnouncement(message);
      }, 950),
    );
  }, [litParam, loading, intro, skills, reduced, show, clearLitParam, settleOn]);

  // Ends once every line has landed and the new stars have faded in.
  useEffect(() => {
    if (lit?.phase !== "ignite" || lit.landed.size < lit.targets.length) return;
    const id = lit.id;
    const t = setTimeout(() => {
      setLit(null);
      clearLitParam();
      settleOn(id);
    }, lit.targets.length ? 700 : 1100);
    return () => clearTimeout(t);
  }, [lit, clearLitParam, settleOn]);

  useEffect(() => () => litTimers.current.forEach(clearTimeout), []);

  // While the sequence plays, show the lit star and its new neighbours as they were before.
  const display = useMemo(
    () =>
      !lit
        ? skills
        : skills.map((s) =>
            s.id === lit.id && lit.phase === "frame" ? { ...s, mastered: false }
            : lit.targets.includes(s.id) && !lit.landed.has(s.id) ? { ...s, unlocked: false }
            : s,
          ),
    [skills, lit],
  );

  const focusTrack = (track: TrackId | null) => {
    setFocus(track);
    const box = track ? trackBounds.get(track)! : GALAXY;
    if (contains(box)) return;
    if (track) show(box, 450);
    else fit(450);
  };

  const closeIntro = (track: TrackId | null) => {
    setIntro(false);
    try {
      localStorage.setItem(INTRO_KEY, "1");
    } catch {
      /* private mode: show the intro again next time */
    }
    const inTrack = display.filter((s) => s.track === track);
    introFocus.current = (inTrack.find((s) => s.unlocked && !s.mastered) ?? inTrack[0])?.id ?? null;
    if (track) focusTrack(track);
  };

  const selected = skills.find((s) => s.id === selectedId) ?? null;
  const lvl = levelProgress(stats.xp);

  return (
    <div className="relative h-[100dvh] overflow-hidden">
      <div aria-hidden className="fixed inset-0 -z-20" style={{ background: SKY }} />
      <Suspense fallback={null}>
        <ThreeGalaxyCanvas />
      </Suspense>
      <ShootingStars />
      {/* Keeps the nav legible when the map is panned under it. */}
      <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-30 h-[72px] bg-gradient-to-b from-background/80 to-transparent" />
      <Navigation />
      <main>
        <h1 className="sr-only">Skill galaxy</h1>

        <div
          ref={viewportRef}
          role="region"
          aria-label="Skill map"
          aria-describedby="map-help"
          tabIndex={0}
          onKeyDown={onKeyDown}
          className="absolute inset-0 cursor-grab touch-none select-none overflow-hidden outline-none focus-visible:shadow-[inset_0_0_0_2px_hsl(var(--ring))] data-[dragging]:cursor-grabbing"
          style={{ overflow: "clip" }}
        >
          <ConstellationLines
            ref={groupRef}
            skills={display}
            focus={focus}
            beams={
              lit?.phase === "ignite" && lit.targets.length
                ? { from: lit.id, to: lit.targets, landed: lit.landed, onLand: (id) => setLit((l) => l && { ...l, landed: new Set(l.landed).add(id) }) }
                : null
            }
          />
          {CONSTELLATIONS.map(({ track, left, transform }) => (
            <div
              key={track.id}
              aria-hidden
              className={cn(
                "pointer-events-none absolute left-0 top-0 whitespace-nowrap transition-opacity duration-300",
                !left && "text-right",
                focus && focus !== track.id && "opacity-25",
              )}
              style={{ transform }}
            >
              {/* Fades out when zoomed far out, where the names would crowd the stars. */}
              <div style={{ opacity: "clamp(0, calc((var(--k) - 0.24) * 16), 1)" }}>
                <div className="font-display text-2xl font-bold opacity-85" style={{ color: `hsl(${track.hue})` }}>{track.constellation}</div>
                <div className="text-xs text-muted-foreground">{track.name}</div>
              </div>
            </div>
          ))}
          {tracks.map((t) => (
            <div key={t.id} role="group" aria-label={t.name} className="pointer-events-none absolute inset-0">
              {display
                .filter((s) => s.track === t.id)
                .map((s) => (
                  <SkillStar
                    key={s.id}
                    skill={s}
                    dimmed={!!focus && focus !== s.track}
                    ignite={lit?.phase === "ignite" && lit.id === s.id}
                    appear={!!lit?.landed.has(s.id)}
                    onSelect={() => {
                      lastSelected.current = s.id;
                      setSelectedId(s.id);
                    }}
                    onFocus={() => reveal(worldPos(s))}
                  />
                ))}
            </div>
          ))}
        </div>
        <p id="map-help" className="sr-only">
          Drag to pan, scroll or pinch to zoom. With the map focused, arrow keys pan, plus and minus zoom, and 0 shows the whole galaxy.
        </p>
        <p aria-live="polite" className="sr-only">{announcement}</p>

        {/* Centred over the tutor button (bottom-right, 56px, 24px in). */}
        <div ref={zoomRef} className="absolute bottom-[92px] right-[30px] z-40">
          <ZoomControls onZoomIn={() => zoomBy(ZOOM_STEP)} onZoomOut={() => zoomBy(1 / ZOOM_STEP)} onFit={() => fit()} />
        </div>

        {/* Stays clear of the tutor button and wraps to two rows when narrow, so nothing overlaps. */}
        <div ref={stackRef} className="pointer-events-none absolute bottom-6 left-4 right-24 z-40 flex flex-wrap items-center gap-2 sm:left-6 [&>*]:pointer-events-auto">
          <TrackFocus value={focus} onChange={focusTrack} />
          <Hud level={lvl.level} pct={lvl.pct} toNext={lvl.toNext} lit={skills.filter((s) => s.mastered).length} total={skills.length} streak={stats.streak} />
        </div>
      </main>

      <IntroDialog
        open={intro}
        onChoose={closeIntro}
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          if (introFocus.current) focusStar(introFocus.current);
          else viewportRef.current?.focus({ preventScroll: true });
        }}
      />

      <SkillPanel
        skill={selected}
        onClose={() => setSelectedId(null)}
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          if (lastSelected.current) focusStar(lastSelected.current);
        }}
      />
    </div>
  );
};

export default Index;
