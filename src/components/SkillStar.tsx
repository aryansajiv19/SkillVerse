import type { SkillState } from "@/lib/progress";
import { trackById } from "@/content/skills";
import { cn } from "@/lib/utils";

export const SkillStar = ({ skill, dimmed, onSelect }: { skill: SkillState; dimmed: boolean; onSelect: () => void }) => {
  const hue = trackById.get(skill.track)!.hue;
  const state = skill.mastered ? "mastered" : skill.unlocked ? "available" : "locked";

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={`${skill.name}, ${state}`}
      className={cn(
        "group absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2 rounded-full p-2 outline-none transition-opacity duration-500",
        dimmed && "opacity-15",
        state === "locked" && !dimmed && "opacity-55",
      )}
      style={{ left: `${skill.x}%`, top: `${skill.y}%`, ["--track" as string]: hue }}
    >
      <span className="relative grid h-5 w-5 place-items-center">
        {state === "available" && (
          <span className="absolute inset-[-6px] animate-ping rounded-full border border-[hsl(var(--track)/0.5)] [animation-duration:2.5s]" />
        )}
        <span
          className={cn(
            "rounded-full transition-transform duration-300 group-hover:scale-125 group-focus-visible:scale-125",
            state === "mastered" && "h-4 w-4 bg-[hsl(var(--track))] shadow-[0_0_18px_4px_hsl(var(--track)/0.7),inset_0_0_6px_white]",
            state === "available" && "h-4 w-4 border-2 border-[hsl(var(--track))] bg-background shadow-[0_0_12px_hsl(var(--track)/0.5)]",
            state === "locked" && "h-2 w-2 bg-muted-foreground",
          )}
        />
      </span>
      <span
        className={cn(
          "whitespace-nowrap rounded px-1 text-xs font-medium leading-none group-focus-visible:ring-2 group-focus-visible:ring-ring",
          state === "locked" ? "text-muted-foreground" : "text-foreground",
        )}
      >
        {skill.name}
      </span>
    </button>
  );
};
