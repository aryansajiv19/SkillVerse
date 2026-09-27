// Map space: skill x/y (percent) are placed on a fixed 1600x1000 canvas, which is then
// panned and zoomed. Screen position of a world point p is `view.x + p.x * view.k`.
import { skills, tracks, type SkillDef, type TrackId } from "@/content/skills";

export const WORLD = { w: 1600, h: 1000 };
export const K_MAX = 2;
/** Below this zoom, neighbouring stars' labels start to touch. Portrait phones start here and pan sideways. */
export const K_READABLE = 0.3;

export interface Point { x: number; y: number }
export interface Box { x0: number; y0: number; x1: number; y1: number }
export interface View { x: number; y: number; k: number }
export interface Insets { top: number; right: number; bottom: number; left: number }

/** Screen room around star centres for labels, which stay the same size at every zoom. */
export const LABEL_ROOM: Insets = { top: 84, right: 56, bottom: 92, left: 56 };

export const worldPos = (s: Pick<SkillDef, "x" | "y">): Point => ({ x: (s.x / 100) * WORLD.w, y: (s.y / 100) * WORLD.h });

export const boundsOf = (list: Pick<SkillDef, "x" | "y">[]): Box => {
  const pts = list.map(worldPos);
  return {
    x0: Math.min(...pts.map((p) => p.x)),
    y0: Math.min(...pts.map((p) => p.y)),
    x1: Math.max(...pts.map((p) => p.x)),
    y1: Math.max(...pts.map((p) => p.y)),
  };
};

export const GALAXY = boundsOf(skills);
export const trackBounds = new Map<TrackId, Box>(tracks.map((t) => [t.id, boundsOf(skills.filter((s) => s.track === t.id))]));

export const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Largest zoom at which `box` (plus label room) fits inside the safe area. */
export const fitScale = (box: Box, vw: number, vh: number, safe: Insets) => {
  const aw = vw - safe.left - safe.right - LABEL_ROOM.left - LABEL_ROOM.right;
  const ah = vh - safe.top - safe.bottom - LABEL_ROOM.top - LABEL_ROOM.bottom;
  return Math.max(0.05, Math.min(aw / Math.max(box.x1 - box.x0, 1), ah / Math.max(box.y1 - box.y0, 1)));
};

/**
 * Default zoom for the whole galaxy. When it only fits by shrinking past readable (phones),
 * hold a readable zoom and let the map overflow sideways; but when height is the limit
 * (landscape phones), fit the stars themselves and let constellation names overflow.
 */
export const galaxyScale = (vw: number, vh: number, safe: Insets) => {
  const starsOnly = (vh - safe.top - safe.bottom - 64) / (GALAXY.y1 - GALAXY.y0);
  return clamp(fitScale(GALAXY, vw, vh, safe), clamp(starsOnly, 0.2, K_READABLE), K_MAX);
};

/** Zoom limits: out a little past the whole galaxy, in to K_MAX. */
export const zoomLimits = (vw: number, vh: number, safe: Insets) => ({
  kMin: Math.min(fitScale(GALAXY, vw, vh, safe), galaxyScale(vw, vh, safe)) * 0.9,
  kMax: K_MAX,
});

/** Centre of the safe area, nudged for label room that is uneven top to bottom. */
export const safeCenter = (vw: number, vh: number, safe: Insets): Point => ({
  x: safe.left + (vw - safe.left - safe.right) / 2,
  y: safe.top + (vh - safe.top - safe.bottom) / 2 + (LABEL_ROOM.top - LABEL_ROOM.bottom) / 2,
});

/** The view that centres `box` in the safe area at the given zoom. */
export const centerOn = (box: Box, k: number, vw: number, vh: number, safe: Insets): View => {
  const c = safeCenter(vw, vh, safe);
  return { k, x: c.x - ((box.x0 + box.x1) / 2) * k, y: c.y - ((box.y0 + box.y1) / 2) * k };
};

/** Keep the zoom in range and at least `margin` px of the galaxy on screen. */
export const clampView = (v: View, vw: number, vh: number, kMin: number, kMax: number): View => {
  const k = clamp(v.k, kMin, kMax);
  const m = Math.min(160, vw / 3, vh / 3);
  return {
    k,
    x: clamp(v.x, m - GALAXY.x1 * k, vw - m - GALAXY.x0 * k),
    y: clamp(v.y, m - GALAXY.y1 * k, vh - m - GALAXY.y0 * k),
  };
};

/** Zoom by `factor` keeping the world point under screen point `at` fixed. */
export const zoomAt = (v: View, factor: number, at: Point, kMin: number, kMax: number): View => {
  const k = clamp(v.k * factor, kMin, kMax);
  const r = k / v.k;
  return { k, x: at.x - (at.x - v.x) * r, y: at.y - (at.y - v.y) * r };
};

/** Is the world box (with label room) entirely inside the safe area at view `v`? */
export const isVisible = (box: Box, v: View, vw: number, vh: number, safe: Insets) =>
  v.x + box.x0 * v.k - LABEL_ROOM.left >= safe.left &&
  v.y + box.y0 * v.k - LABEL_ROOM.top >= safe.top &&
  v.x + box.x1 * v.k + LABEL_ROOM.right <= vw - safe.right &&
  v.y + box.y1 * v.k + LABEL_ROOM.bottom <= vh - safe.bottom;

/** CSS transform that places an element at a world point (reads the map's --tx, --ty, --k). */
export const atWorld = (p: Point, then = "") =>
  `translate(calc(var(--tx) + ${p.x}px * var(--k)), calc(var(--ty) + ${p.y}px * var(--k))) ${then}`;
