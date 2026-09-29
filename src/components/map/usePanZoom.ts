import { useEffect, useLayoutEffect, useMemo, useRef, type KeyboardEvent, type RefObject } from "react";
import {
  K_READABLE, centerOn, clamp, clampView, defaultView, fitScale, isVisible, safeCenter, zoomAt, zoomLimits,
  type Box, type Insets, type Point, type View,
} from "./geometry";

const easeOut = (t: number) => 1 - (1 - t) ** 3;
const easeInOut = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);
const ZOOM_STEP = 1.25;

/**
 * Pan and zoom for the galaxy map, driven outside React: the view is written to CSS
 * variables (--tx, --ty, --k) on the viewport and a transform on the SVG line group,
 * so dragging never re-renders the stars.
 */
export const usePanZoom = ({ getSafe, reduced, watch, getHome }: {
  /** Screen insets kept clear of stars: fixed nav, bottom controls, zoom buttons. */
  getSafe: (vw: number, vh: number) => Insets;
  reduced: boolean;
  /** When the galaxy overflows the screen at a readable zoom, the world points to start on, e.g. the learner's next stars. */
  getHome?: () => Point[];
  /** Re-measure the safe area when this element resizes (the bottom controls). */
  watch?: RefObject<HTMLElement>;
}) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<SVGGElement>(null);
  const view = useRef<View>({ x: 0, y: 0, k: 1 });
  const size = useRef({ w: 0, h: 0 });
  const safe = useRef<Insets>({ top: 0, right: 0, bottom: 0, left: 0 });
  // Still showing the default fit, so a resize should re-fit rather than hold position.
  const fitted = useRef(true);
  const raf = useRef(0);
  // Where an in-flight animation is heading, so reveal() doesn't fight it.
  const goal = useRef<View | null>(null);
  const opts = useRef({ getSafe, reduced, getHome });
  opts.current = { getSafe, reduced, getHome };

  const api = useMemo(() => {
    const measure = () => {
      const el = viewportRef.current;
      if (!el) return;
      size.current = { w: el.clientWidth, h: el.clientHeight };
      safe.current = opts.current.getSafe(size.current.w, size.current.h);
    };
    const limits = () => zoomLimits(size.current.w, size.current.h, safe.current);

    const apply = (v: View) => {
      const { kMin, kMax } = limits();
      const c = clampView(v, size.current.w, size.current.h, kMin, kMax);
      view.current = c;
      const el = viewportRef.current;
      el?.style.setProperty("--tx", `${c.x}px`);
      el?.style.setProperty("--ty", `${c.y}px`);
      el?.style.setProperty("--k", String(c.k));
      groupRef.current?.setAttribute("transform", `translate(${c.x} ${c.y}) scale(${c.k})`);
    };

    const stop = () => {
      cancelAnimationFrame(raf.current);
      goal.current = null;
    };

    // Zooms geometrically while moving the world point at the safe-area centre in a straight
    // line, so a zoom-and-pan doesn't swing out sideways.
    const animateTo = (target: View, ms: number, ease = easeInOut) => {
      stop();
      const { w, h } = size.current;
      const { kMin, kMax } = limits();
      const to = clampView(target, w, h, kMin, kMax);
      if (opts.current.reduced || ms <= 0) return apply(to);
      goal.current = to;
      const from = view.current;
      const c = safeCenter(w, h, safe.current);
      const a = { x: (c.x - from.x) / from.k, y: (c.y - from.y) / from.k };
      const b = { x: (c.x - to.x) / to.k, y: (c.y - to.y) / to.k };
      const t0 = performance.now();
      const step = (now: number) => {
        const p = Math.min(1, (now - t0) / ms);
        const e = ease(p);
        const k = from.k * (to.k / from.k) ** e;
        apply({ k, x: c.x - (a.x + (b.x - a.x) * e) * k, y: c.y - (a.y + (b.y - a.y) * e) * k });
        if (p < 1) raf.current = requestAnimationFrame(step);
        else goal.current = null;
      };
      raf.current = requestAnimationFrame(step);
    };

    const fitView = () => defaultView(size.current.w, size.current.h, safe.current, opts.current.getHome?.());

    return {
      measure,
      apply,
      stop,
      /** Show the whole galaxy (on phones: as much as stays readable). */
      fit: (ms = 280) => {
        fitted.current = true;
        animateTo(fitView(), ms);
      },
      /** Re-apply the default view (e.g. once progress has loaded), unless the user has moved the map. */
      refit: () => {
        if (fitted.current) animateTo(fitView(), 0);
      },
      /** Centre `box`, zooming to fit it but never past `maxK` or below a readable zoom. */
      show: (box: Box, ms: number, maxK = view.current.k) => {
        fitted.current = false;
        const { w, h } = size.current;
        const k = clamp(fitScale(box, w, h, safe.current), Math.min(K_READABLE, view.current.k), maxK);
        animateTo(centerOn(box, k, w, h, safe.current), ms);
      },
      /** Pan just enough to bring a world point inside the safe area, if it's outside. */
      reveal: (p: Point, ms = 200) => {
        const { w, h } = size.current;
        const s = safe.current;
        const v = goal.current ?? view.current;
        const sx = v.x + p.x * v.k;
        const sy = v.y + p.y * v.k;
        const dx = sx < s.left + 56 ? s.left + 56 - sx : sx > w - s.right - 56 ? w - s.right - 56 - sx : 0;
        const dy = sy < s.top + 40 ? s.top + 40 - sy : sy > h - s.bottom - 48 ? h - s.bottom - 48 - sy : 0;
        if (!dx && !dy) return;
        fitted.current = false;
        animateTo({ ...v, x: v.x + dx, y: v.y + dy }, ms, easeOut);
      },
      zoomBy: (factor: number, ms = 200) => {
        fitted.current = false;
        const c = safeCenter(size.current.w, size.current.h, safe.current);
        const { kMin, kMax } = limits();
        // From the goal, so quick repeated clicks compound instead of restarting mid-zoom.
        animateTo(zoomAt(goal.current ?? view.current, factor, c, kMin, kMax), ms, easeOut);
      },
      zoomAt: (factor: number, at: Point) => {
        fitted.current = false;
        const { kMin, kMax } = limits();
        apply(zoomAt(view.current, factor, at, kMin, kMax));
      },
      panBy: (dx: number, dy: number) => {
        fitted.current = false;
        apply({ ...view.current, x: view.current.x + dx, y: view.current.y + dy });
      },
      /** Is all of `box`, labels included, on screen right now? */
      contains: (box: Box) => isVisible(box, view.current, size.current.w, size.current.h, safe.current),
      fitView,
    };
  }, []);

  useLayoutEffect(() => {
    api.measure();
    api.apply(api.fitView());
  }, [api]);

  // Resizes: re-fit while untouched, otherwise hold the centre of the screen.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const old = { ...size.current };
      api.measure();
      const { w, h } = size.current;
      if (fitted.current) api.apply(api.fitView());
      else api.apply({ ...view.current, x: view.current.x + (w - old.w) / 2, y: view.current.y + (h - old.h) / 2 });
    });
    ro.observe(el);
    if (watch?.current) ro.observe(watch.current);
    return () => ro.disconnect();
  }, [api, watch]);

  // Pointer drag, pinch and wheel. Native listeners: wheel must be non-passive to stop page zoom.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const pointers = new Map<number, Point>();
    let gesture: { view: View; at: Point; span: number } | null = null;
    let dragged = false;
    let suppressClick = false;

    const local = (e: { clientX: number; clientY: number }): Point => {
      const r = el.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const centroid = (ps: Point[]) => ({ x: ps.reduce((s, p) => s + p.x, 0) / ps.length, y: ps.reduce((s, p) => s + p.y, 0) / ps.length });
    const span = (ps: Point[]) => (ps.length > 1 ? Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y) : 0);
    const begin = () => {
      const ps = [...pointers.values()];
      gesture = { view: { ...view.current }, at: centroid(ps), span: span(ps) };
    };

    const down = (e: PointerEvent) => {
      if (e.pointerType === "mouse") {
        if (e.button !== 0) return;
        pointers.clear(); // a mouseup outside the window never reached us
      }
      api.stop();
      if (!pointers.size) dragged = false;
      pointers.set(e.pointerId, local(e));
      begin();
    };
    const move = (e: PointerEvent) => {
      if (!pointers.has(e.pointerId) || !gesture) return;
      pointers.set(e.pointerId, local(e));
      const ps = [...pointers.values()];
      const at = centroid(ps);
      if (!dragged) {
        const slop = e.pointerType === "mouse" ? 4 : 8;
        if (ps.length < 2 && Math.hypot(at.x - gesture.at.x, at.y - gesture.at.y) < slop) return;
        dragged = true;
        el.dataset.dragging = "";
        // Capture only once it's a drag, so a plain tap still clicks the star under it.
        pointers.forEach((_, id) => el.hasPointerCapture(id) || el.setPointerCapture(id));
      }
      const g = gesture;
      const { kMin, kMax } = zoomLimits(size.current.w, size.current.h, safe.current);
      const k = g.span ? clamp((g.view.k * span(ps)) / g.span, kMin, kMax) : g.view.k;
      // Keep the world point that was under the fingers under the fingers.
      const wx = (g.at.x - g.view.x) / g.view.k;
      const wy = (g.at.y - g.view.y) / g.view.k;
      fitted.current = false;
      api.apply({ k, x: at.x - wx * k, y: at.y - wy * k });
    };
    const up = (e: PointerEvent) => {
      if (!pointers.delete(e.pointerId)) return;
      if (pointers.size) return begin();
      gesture = null;
      delete el.dataset.dragging;
      if (dragged && e.type === "pointerup") {
        // The click that follows this pointerup belongs to the drag, not to a star.
        suppressClick = true;
        setTimeout(() => (suppressClick = false));
      }
    };
    const click = (e: MouseEvent) => {
      if (!suppressClick) return;
      e.preventDefault();
      e.stopPropagation();
    };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      api.stop();
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? size.current.h : 1;
      const dx = e.deltaX * unit;
      const dy = e.deltaY * unit;
      // Sideways trackpad swipes pan; wheel and pinch (ctrlKey) zoom around the cursor.
      if (!e.ctrlKey && Math.abs(dx) > Math.abs(dy)) return api.panBy(-dx, 0);
      api.zoomAt(Math.exp(-dy * (e.ctrlKey ? 0.01 : 0.0015)), local(e));
    };
    // overflow:clip isn't everywhere yet; if focusing a star scrolls the viewport, undo it.
    const scroll = () => {
      el.scrollLeft = 0;
      el.scrollTop = 0;
    };

    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("click", click, true);
    el.addEventListener("wheel", wheel, { passive: false });
    el.addEventListener("scroll", scroll);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      el.removeEventListener("click", click, true);
      el.removeEventListener("wheel", wheel);
      el.removeEventListener("scroll", scroll);
    };
  }, [api]);

  useEffect(() => api.stop, [api]);

  /** + / - / 0 anywhere in the map; arrow keys pan (Shift for bigger steps). No animation: keyboard. */
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const step = e.shiftKey ? 240 : 80;
    const actions: Record<string, () => void> = {
      "+": () => api.zoomBy(ZOOM_STEP, 0),
      "=": () => api.zoomBy(ZOOM_STEP, 0),
      "-": () => api.zoomBy(1 / ZOOM_STEP, 0),
      _: () => api.zoomBy(1 / ZOOM_STEP, 0),
      "0": () => api.fit(0),
      ArrowLeft: () => api.panBy(step, 0),
      ArrowRight: () => api.panBy(-step, 0),
      ArrowUp: () => api.panBy(0, step),
      ArrowDown: () => api.panBy(0, -step),
    };
    const act = actions[e.key];
    if (!act) return;
    e.preventDefault();
    api.stop();
    act();
  };

  return { viewportRef, groupRef, onKeyDown, ...api, ZOOM_STEP };
};
