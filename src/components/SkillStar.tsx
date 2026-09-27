import { useEffect, useLayoutEffect, useRef } from "react";
import type { SkillState } from "@/lib/progress";
import { trackById } from "@/content/skills";
import { atWorld, worldPos } from "@/components/map/geometry";
import { cn } from "@/lib/utils";

const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";

export const SkillStar = ({ skill, dimmed, ignite, appear, onSelect, onFocus }: {
  skill: SkillState;
  dimmed: boolean;
  /** Play the one-off "lit" burst (first-time mastery). */
  ignite?: boolean;
  /** Fade the dot in: this star was just unlocked. */
  appear?: boolean;
  onSelect: () => void;
  onFocus?: () => void;
}) => {
  const hue = trackById.get(skill.track)!.hue;
  const state = skill.mastered ? "mastered" : skill.unlocked ? "available" : "locked";
  const dot = useRef<HTMLSpanElement>(null);
  const flash = useRef<HTMLSpanElement>(null);
  const ring = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ignite) return;
    const anims = [
      flash.current?.animate([{ transform: "scale(0.4)", opacity: 1 }, { transform: "scale(2.8)", opacity: 0 }], { duration: 900, easing: EASE_OUT }),
      ring.current?.animate([{ transform: "scale(0.6)", opacity: 1 }, { transform: "scale(4.2)", opacity: 0 }], { duration: 1100, delay: 60, easing: EASE_OUT, fill: "backwards" }),
      dot.current?.animate([{ transform: "scale(1)" }, { transform: "scale(1.9)", offset: 0.3 }, { transform: "scale(1)" }], { duration: 650, easing: EASE_OUT }),
    ];
    return () => anims.forEach((a) => a?.cancel());
  }, [ignite]);

  useLayoutEffect(() => {
    if (!appear) return;
    const a = dot.current?.animate([{ transform: "scale(0.4)", opacity: 0 }, { transform: "scale(1)", opacity: 1 }], { duration: 320, easing: EASE_OUT });
    return () => a?.cancel();
  }, [appear]);

  return (
    <button
      type="button"
      data-star={skill.id}
      onClick={onSelect}
      onFocus={onFocus}
      aria-label={`${skill.name}, ${state}`}
      className="group pointer-events-auto absolute left-0 top-0 flex flex-col items-center outline-none"
      // The dot's centre (20px down) sits exactly on the star's map position, so lines meet it.
      style={{ transform: atWorld(worldPos(skill), "translate(-50%, -20px)"), ["--track" as string]: hue }}
    >
      <span className="relative grid h-10 w-10 place-items-center">
        {ignite && (
          <>
            <span ref={flash} aria-hidden className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle,hsl(45_100%_90%),hsl(var(--glow-completed)/0.7)_30%,transparent_68%)] opacity-0" />
            <span ref={ring} aria-hidden className="pointer-events-none absolute inset-2 rounded-full border-[1.5px] border-[hsl(45_100%_85%)] opacity-0 shadow-[0_0_10px_hsl(var(--glow-completed)/0.8),inset_0_0_6px_hsl(var(--glow-completed)/0.6)]" />
          </>
        )}
        <span
          ref={dot}
          className={cn(
            "rounded-full transition-[opacity,transform] duration-300 [@media(hover:hover)]:group-hover:scale-125 group-focus-visible:scale-125",
            state === "mastered" && "h-4 w-4 bg-[hsl(var(--track))] shadow-[0_0_18px_4px_hsl(var(--track)/0.6),inset_0_0_5px_hsl(var(--foreground))]",
            state === "available" && "h-4 w-4 border-2 border-[hsl(var(--track))] bg-background shadow-[0_0_12px_hsl(var(--track)/0.55)]",
            state === "locked" && "h-2 w-2 bg-muted-foreground opacity-50",
            dimmed && "opacity-20",
          )}
        />
      </span>
      {/* Dimming only touches the dot: labels keep AA contrast. The halo keeps them legible over lines. */}
      <span
        className={cn(
          "-mt-1 whitespace-nowrap rounded px-1 text-xs font-medium leading-4 [text-shadow:0_0_4px_hsl(var(--background)),0_0_8px_hsl(var(--background))] group-focus-visible:ring-2 group-focus-visible:ring-ring",
          state === "locked" || dimmed ? "text-muted-foreground" : "text-foreground",
        )}
      >
        {skill.name}
      </span>
    </button>
  );
};
