import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/components/map/useReducedMotion";

interface ShootingStar {
  x: number;
  y: number;
  speed: number;
  length: number;
  opacity: number;
  comet?: boolean;
}

/**
 * An occasional meteor across the sky. While you keep a streak going, a comet crosses too:
 * slower, gold, and its tail grows with the streak. Nothing at all with reduced motion.
 */
export const ShootingStars = ({ streak = 0 }: { streak?: number }) => {
  const reduced = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (reduced || !canvas || !ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const spawn = (): ShootingStar => ({
      x: Math.random() * window.innerWidth,
      y: -50,
      speed: 3 + Math.random() * 5,
      length: 30 + Math.random() * 80,
      opacity: 0.3 + Math.random() * 0.5,
    });
    const comet = (): ShootingStar => ({
      x: Math.random() * window.innerWidth * 0.5,
      y: -80,
      speed: 1.6,
      length: Math.min(90 + streak * 25, 320),
      opacity: 0.85,
      comet: true,
    });

    // With a streak, every third visitor is the comet, starting with the first.
    let spawned = 0;
    const next = () => (streak >= 2 && spawned++ % 3 === 0 ? comet() : spawn());
    let stars = [next()];
    let lastSpawn = performance.now();
    let nextGap = 4000 + Math.random() * 6000;
    let frame = 0;
    let idle: ReturnType<typeof setTimeout> | undefined;

    const animate = (now: number) => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      if (now - lastSpawn > nextGap) {
        stars.push(next());
        lastSpawn = now;
        nextGap = 4000 + Math.random() * 6000;
      }
      stars = stars.filter((s) => {
        s.x += s.speed;
        s.y += s.speed * 0.8;
        if (s.x > window.innerWidth + 100 || s.y > window.innerHeight + 100) return false;

        // Starlight (the page's foreground), fading along the tail.
        // Comets burn gold (the mastery colour) with a wider tail.
        const tail = ctx.createLinearGradient(s.x, s.y, s.x - s.length, s.y - s.length * 0.8);
        tail.addColorStop(0, s.comet ? `rgba(255, 236, 190, ${s.opacity})` : `rgba(230, 236, 255, ${s.opacity})`);
        tail.addColorStop(0.5, s.comet ? `rgba(255, 196, 90, ${s.opacity * 0.35})` : `rgba(170, 190, 255, ${s.opacity * 0.4})`);
        tail.addColorStop(1, s.comet ? "rgba(255, 170, 60, 0)" : "rgba(120, 140, 255, 0)");
        ctx.strokeStyle = tail;
        ctx.lineWidth = s.comet ? 3 : 1.5;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - s.length, s.y - s.length * 0.8);
        ctx.stroke();

        ctx.shadowBlur = 10;
        ctx.shadowColor = "rgba(200, 215, 255, 0.8)";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.comet ? 2.5 : 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${s.opacity})`;
        ctx.fill();
        ctx.shadowBlur = 0;
        return true;
      });
      // Between meteors, sleep until the next one is due instead of clearing an empty canvas every frame.
      if (stars.length) frame = requestAnimationFrame(animate);
      else idle = setTimeout(() => (frame = requestAnimationFrame(animate)), lastSpawn + nextGap - performance.now());
    };
    frame = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(frame);
      clearTimeout(idle);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [reduced, streak]);

  if (reduced) return null;
  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-10 h-full w-full"
      style={{ mixBlendMode: "screen" }}
    />
  );
};
