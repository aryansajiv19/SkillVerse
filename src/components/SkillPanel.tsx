import { useRef, useState, type RefObject } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Check, Lock } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet";
import { Button } from "./ui/button";
import type { SkillState } from "@/lib/progress";
import { skillById, trackById, unlocksOf } from "@/content/skills";
import { challengesForSkill, checkIdFor } from "@/content/challenges";
import { useProgress } from "@/hooks/useProgress";

export const SkillPanel = ({
  skill,
  onClose,
  onCloseAutoFocus,
}: {
  skill: SkillState | null;
  onClose: () => void;
  /** The panel has no trigger element, so the caller says where focus goes back to. */
  onCloseAutoFocus?: (e: Event) => void;
}) => {
  const title = useRef<HTMLHeadingElement>(null);
  // Keep showing the last skill while the sheet slides out, instead of an empty panel.
  const shown = useRef(skill);
  if (skill) shown.current = skill;
  return (
    <Sheet open={!!skill} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        className="glass-panel flex w-full flex-col gap-8 overflow-y-auto border-l sm:max-w-md"
        // Start on the title, not the first button: for a mastered skill that would be "Reset skill".
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          title.current?.focus();
        }}
        onCloseAutoFocus={onCloseAutoFocus}
      >
        {shown.current && <PanelBody key={shown.current.id} skill={shown.current} title={title} />}
      </SheetContent>
    </Sheet>
  );
};

const PanelBody = ({ skill, title }: { skill: SkillState; title: RefObject<HTMLHeadingElement> }) => {
  const { mastered, doneChallenges, resetSkill } = useProgress();
  const [confirming, setConfirming] = useState(false);
  // Everything that would reset with this skill: mastered skills that (transitively) require it.
  const dependents = (() => {
    const out = new Set<string>();
    const walk = (id: string) => unlocksOf(id).forEach((s) => !out.has(s.id) && mastered.has(s.id) && (out.add(s.id), walk(s.id)));
    walk(skill.id);
    return [...out].map((id) => skillById.get(id)!.name);
  })();
  const track = trackById.get(skill.track)!;
  const extras = challengesForSkill(skill.id).filter((c) => c.type !== "quiz");
  const missing = skill.requires.filter((r) => !mastered.has(r));

  const reset = () =>
    resetSkill.mutate(skill.id, {
      onSuccess: (ids) => {
        // The confirm buttons unmount with the mastered state; keep focus inside the panel.
        setConfirming(false);
        title.current?.focus();
        toast(`${ids.length > 1 ? `${ids.length} skills` : skill.name} reset`, {
          description: "Take the skill check again whenever you're ready.",
        });
      },
      onError: (e: Error) => toast.error(e.message),
    });

  return (
    <>
      <SheetHeader className="space-y-3 text-left">
        <p
          className="text-sm font-medium"
          style={{ color: `hsl(${track.hue})` }}
        >
          {track.constellation}, {track.name}
        </p>
        <SheetTitle ref={title} tabIndex={-1} className="break-words pr-6 text-4xl font-extrabold outline-none">
          {skill.name}
        </SheetTitle>
        <SheetDescription className="text-base leading-relaxed text-foreground/80">
          {skill.description}
        </SheetDescription>
      </SheetHeader>

      {skill.requires.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
            Needs
          </h3>
          <ul className="flex flex-wrap gap-2">
            {skill.requires.map((id) => (
              <li
                key={id}
                className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm"
              >
                {mastered.has(id) ? (
                  <Check className="h-3.5 w-3.5 text-[hsl(var(--glow-completed))]" />
                ) : (
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                {skillById.get(id)!.name}
              </li>
            ))}
          </ul>
        </section>
      )}

      {unlocksOf(skill.id).length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
            Leads to
          </h3>
          <p className="text-sm">
            {unlocksOf(skill.id)
              .map((s) => s.name)
              .join(", ")}
          </p>
        </section>
      )}

      {extras.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
            Practice
          </h3>
          <ul className="space-y-2">
            {extras.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="flex items-center gap-2">
                  {doneChallenges.has(c.id) && (
                    <Check className="h-3.5 w-3.5 text-[hsl(var(--glow-completed))]" />
                  )}
                  {c.title}
                </span>
                <span className="text-muted-foreground">+{c.xpReward} XP</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-auto space-y-3 border-t pt-6">
        {!skill.unlocked ? (
          <p className="text-sm text-muted-foreground">
            Master {missing.map((id) => skillById.get(id)!.name).join(" and ")}{" "}
            to unlock this star.
          </p>
        ) : skill.mastered ? (
          <>
            <p className="text-sm">You've mastered {skill.name}.</p>
            {confirming ? (
              <div className="space-y-3 rounded-xl border border-destructive/40 p-4" role="alertdialog" aria-labelledby="reset-q">
                <p id="reset-q" className="text-sm">
                  Reset {skill.name}{dependents.length ? ` and ${dependents.join(", ")}, which build on it` : ""}? Your XP for them goes too.
                </p>
                <div className="flex gap-3">
                  <Button variant="destructive" className="flex-1" onClick={reset} disabled={resetSkill.isPending}>Reset</Button>
                  <Button variant="outline" className="flex-1" onClick={() => setConfirming(false)} autoFocus>Keep it</Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <Button asChild variant="outline" className="flex-1">
                  <Link to={`/learn?skill=${skill.id}`}>Practice</Link>
                </Button>
                <Button variant="ghost" className="flex-1 text-muted-foreground" onClick={() => setConfirming(true)}>
                  Reset skill
                </Button>
              </div>
            )}
          </>
        ) : (
          <>
            <Button asChild size="lg" className="w-full">
              <Link
                to={`/learn?skill=${skill.id}&challenge=${checkIdFor(skill.id)}`}
              >
                Take the skill check
              </Link>
            </Button>
            {extras.length > 0 && (
              <Button asChild variant="outline" className="w-full">
                <Link to={`/learn?skill=${skill.id}`}>Practice first</Link>
              </Button>
            )}
            <p className="text-center text-xs text-muted-foreground">
              Already know it? The skill check takes about a minute.
            </p>
          </>
        )}
      </div>
    </>
  );
};
