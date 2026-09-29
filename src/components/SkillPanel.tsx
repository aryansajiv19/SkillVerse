import { useRef, useState, type RefObject } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ArrowUpRight, Check } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet";
import { Button } from "./ui/button";
import { constellationStates, learningPath, type SkillState } from "@/lib/progress";
import { ConstellationList } from "./ConstellationList";
import { lessonTopics } from "@/content/lessons";
import { resources } from "@/content/resources";
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
        // Light backdrop: the learning path stays visible on the map behind the panel.
        overlayClassName="bg-background/25"
        // The sheet's close button is its last child: give it a 44px hit area (the icon stays 16px).
        className="glass-panel flex w-full flex-col gap-8 overflow-y-auto border-l sm:max-w-md [&>button:last-child]:right-2 [&>button:last-child]:top-2 [&>button:last-child]:grid [&>button:last-child]:h-11 [&>button:last-child]:w-11 [&>button:last-child]:place-items-center"
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
  const path = learningPath(skill.id, mastered);
  const topics = lessonTopics[skill.id] ?? [];
  const reading = resources[skill.id] ?? [];
  const partOf = constellationStates(mastered).filter((c) => c.stars.includes(skill.id));

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

      {path.length > 1 && (
        <section aria-labelledby="path-heading">
          <h3 id="path-heading" className="mb-1 text-sm font-semibold text-muted-foreground">Your learning path</h3>
          <p className="mb-3 text-sm text-muted-foreground">Lit up on the map. Learn these in order to reach {skill.name}.</p>
          <ol className="space-y-1.5">
            {path.map((id, i) => {
              const s = skillById.get(id)!;
              return (
                <li key={id}>
                  <Link to={`/learn?skill=${id}`} className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[hsl(var(--glow-completed))] text-xs font-bold text-background">{i + 1}</span>
                    <span className={id === skill.id ? "font-semibold" : ""}>{s.name}</span>
                    <span className="ml-auto text-xs" style={{ color: `hsl(${trackById.get(s.track)!.hue})` }}>{trackById.get(s.track)!.name}</span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {topics.length > 0 && (
        <section aria-labelledby="learn-heading">
          <h3 id="learn-heading" className="mb-2 text-sm font-semibold text-muted-foreground">What you'll learn</h3>
          <ul className="space-y-1.5 text-sm">
            {topics.map((t) => (
              <li key={t} className="flex gap-2.5"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--track))]" aria-hidden style={{ ["--track" as string]: track.hue }} />{t}</li>
            ))}
          </ul>
        </section>
      )}

      {reading.length > 0 && (
        <section aria-labelledby="study-heading">
          <h3 id="study-heading" className="mb-2 text-sm font-semibold text-muted-foreground">Study</h3>
          <ul className="space-y-2">
            {reading.map((r) => (
              <li key={r.url}>
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="group flex items-start justify-between gap-3 rounded-lg border border-border/60 px-3 py-2.5 text-sm transition-colors hover:border-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <span><span className="font-medium">{r.title}</span><span className="block text-xs text-muted-foreground">{r.source}</span></span>
                  <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground" aria-hidden />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {partOf.length > 0 && (
        <section aria-labelledby="constellation-heading">
          <h3 id="constellation-heading" className="mb-1 text-sm font-semibold text-muted-foreground">Constellations</h3>
          <p className="mb-3 text-sm text-muted-foreground">Every learning path is a constellation. Light all its stars and it forms on your map.</p>
          <ConstellationList items={partOf} compact />
        </section>
      )}

      {(extras.length > 0 || unlocksOf(skill.id).length > 0) && (
        <p className="text-sm text-muted-foreground">
          {extras.length > 0 && <>{extras.length} practice {extras.length === 1 ? "exercise" : "exercises"} ({extras.filter((c) => doneChallenges.has(c.id)).length} done). </>}
          {unlocksOf(skill.id).length > 0 && <>Leads to {unlocksOf(skill.id).map((s) => s.name).join(", ")}.</>}
        </p>
      )}

      <div className="mt-auto space-y-3 border-t pt-6 max-sm:[&_:is(a,button)]:h-11">
        {!skill.unlocked ? (
          <>
            <Button asChild size="lg" className="w-full">
              <Link to={`/learn?skill=${path[0]}`}>Start with {skillById.get(path[0])!.name}</Link>
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              {skill.name} unlocks once you've mastered {missing.map((id) => skillById.get(id)!.name).join(" and ")}. You can read its lesson now.
            </p>
            <Button asChild variant="outline" className="w-full"><Link to={`/learn?skill=${skill.id}`}>Preview the {skill.name} lesson</Link></Button>
          </>
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
                  <Link to={`/learn?skill=${skill.id}`}>Review the lesson</Link>
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
              <Link to={`/learn?skill=${skill.id}`}>Start the lesson</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to={`/learn?skill=${skill.id}&challenge=${checkIdFor(skill.id)}`}>Already know it? Take the skill check</Link>
            </Button>
          </>
        )}
      </div>
    </>
  );
};
