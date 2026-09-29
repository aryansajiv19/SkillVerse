import { useId, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, ArrowUpRight, Check, Code, Gamepad2, Lock } from "lucide-react";
import { PageShell, usePageTitle } from "@/components/PageShell";
import { LoadError } from "@/components/social/states";
import { CodeEditor } from "@/components/CodeEditor";
import { QuizChallenge } from "@/components/QuizChallenge";
import { CheatSheet } from "@/components/CheatSheet";
import { PlanetDebugger } from "@/components/games/PlanetDebugger";
import { Button } from "@/components/ui/button";
import { useProgress } from "@/hooks/useProgress";
import type { SkillState } from "@/lib/progress";
import { cn } from "@/lib/utils";
import { skillById, trackById, tracks, unlocksOf } from "@/content/skills";
import { SKILL_MASTERY_XP, challengeById, challengesForSkill, checkIdFor, type Challenge } from "@/content/challenges";
import { cheatSheets } from "@/content/cheatsheets";
import { resources } from "@/content/resources";

const and = new Intl.ListFormat("en", { type: "conjunction" });
const names = (ids: string[]) => and.format(ids.map((id) => skillById.get(id)!.name));
const missingFor = (skill: SkillState, skills: SkillState[]) =>
  skill.requires.filter((r) => !skills.find((s) => s.id === r)?.mastered);
const stateOf = (s: SkillState) => (s.mastered ? "mastered" : s.unlocked ? "available" : "locked");
const challengeUrl = (c: Challenge) => `/learn?skill=${c.skillId}&challenge=${c.id}`;

/** What to show until the user's progress has loaded, or null once it has. Locked and mastered copy is only true after that. */
const progressGate = ({ loading, error, history, retry }: ReturnType<typeof useProgress>) =>
  // A failed background refetch keeps the last good data; only a failed first load blocks the page.
  error && !history ? <LoadError what="your progress" error={error} onRetry={retry} />
  : loading ? <p role="status" className="text-muted-foreground">Loading your progress…</p>
  : null;

const Learn = () => {
  const [params] = useSearchParams();
  const skill = skillById.get(params.get("skill") ?? "");
  const challenge = challengeById.get(params.get("challenge") ?? "");

  if (!skill) return <PickSkill />;
  return challenge?.skillId === skill.id
    ? <ChallengeView key={challenge.id} challenge={challenge} />
    : <SkillView key={skill.id} skillId={skill.id} />;
};

/** Drawn like the galaxy map: filled and glowing = mastered, hollow ring = available, small dim dot = locked. */
const StarMark = ({ skill, large }: { skill: SkillState; large?: boolean }) => {
  const state = stateOf(skill);
  return (
    <span aria-hidden className={cn("grid shrink-0 place-items-center", large ? "h-7 w-7" : "h-4 w-4")}
      style={{ ["--track" as string]: trackById.get(skill.track)!.hue }}>
      <span className={cn(
        "rounded-full",
        state !== "locked" && (large ? "h-5 w-5" : "h-3 w-3"),
        state === "mastered" && "bg-[hsl(var(--track))] shadow-[0_0_14px_3px_hsl(var(--track)/0.55),inset_0_0_4px_white]",
        state === "available" && "border-2 border-[hsl(var(--track))] shadow-[0_0_10px_hsl(var(--track)/0.4)]",
        state === "locked" && (large ? "h-2 w-2 bg-muted-foreground" : "h-1.5 w-1.5 bg-muted-foreground"),
      )} />
    </span>
  );
};

const PickSkill = () => {
  const progress = useProgress();
  const { skills } = progress;
  return (
    <PageShell title="Learn" subtitle="Every star has a skill check. Pass it to light the star and unlock the stars it leads to. Most have practice exercises and a reading list too.">
      {progressGate(progress) ?? <div className="grid gap-x-10 gap-y-12 md:grid-cols-2">
        {tracks.map((t) => {
          const inTrack = skills.filter((s) => s.track === t.id);
          return (
            <section key={t.id} aria-labelledby={`track-${t.id}`}>
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <h2 id={`track-${t.id}`} className="text-xl font-bold" style={{ color: `hsl(${t.hue})` }}>{t.name}</h2>
                <p className="text-sm text-muted-foreground">{t.constellation} · {inTrack.filter((s) => s.mastered).length} of {inTrack.length} lit</p>
              </div>
              <ul className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/70 bg-card/30">
                {inTrack.map((s) => {
                  const missing = missingFor(s, skills);
                  return (
                    <li key={s.id}>
                      <Link to={`/learn?skill=${s.id}`}
                        className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-card/70 focus-visible:bg-card/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
                        <StarMark skill={s} />
                        <span className={cn("font-medium", !s.unlocked && "text-muted-foreground")}>{s.name}</span>
                        <span className="ml-auto text-right text-sm text-muted-foreground">
                          {s.mastered ? <span className="text-[hsl(var(--glow-completed))]">Mastered</span>
                            : s.unlocked ? <span className="text-foreground/90">Ready for the skill check</span>
                            : <>Needs {names(missing)}</>}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>}
    </PageShell>
  );
};

const SkillView = ({ skillId }: { skillId: string }) => {
  const progress = useProgress();
  const { skills, doneChallenges } = progress;
  const gate = progressGate(progress);
  const [sheetOpen, setSheetOpen] = useState(false);
  const sheetId = useId();
  const skill = skills.find((s) => s.id === skillId)!;
  const track = trackById.get(skill.track)!;
  const check = challengeById.get(checkIdFor(skill.id));
  const practice = challengesForSkill(skill.id).filter((c) => c.type !== "quiz");
  const missing = missingFor(skill, skills);
  const isMastered = (id: string) => !!skills.find((s) => s.id === id)?.mastered;
  const later = unlocksOf(skill.id).filter((s) => !isMastered(s.id));
  // Passing only opens a skill whose other prerequisites are already mastered, like the celebration counts it.
  const opens = later.filter((s) => s.requires.every((r) => r === skill.id || isMastered(r)));
  const closer = later.filter((s) => !opens.includes(s));
  const reading = resources[skill.id] ?? [];
  const sheet = cheatSheets[skill.id];

  return (
    <PageShell title={skill.name} subtitle={skill.description}>
      <div className="-mt-4 mb-10 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <Link to="/learn" className="-ml-2 flex items-center gap-1.5 rounded-md px-2 py-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <ArrowLeft className="h-4 w-4" aria-hidden />All skills
        </Link>
        <span style={{ color: `hsl(${track.hue})` }}>{track.name} · {track.constellation}</span>
      </div>

      {gate ?? <>
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_19rem] xl:gap-16">
        <div className="space-y-12">
          <section aria-labelledby="check-heading" className="glass-panel rounded-2xl p-6 sm:p-8" style={{ ["--track" as string]: track.hue }}>
            <div className="flex items-center gap-3">
              <StarMark skill={skill} large />
              <h2 id="check-heading" className="text-2xl font-extrabold sm:text-3xl">Skill check</h2>
            </div>
            {check?.type === "quiz" && (
              skill.mastered ? (
                <>
                  <p className="mt-4 max-w-prose leading-relaxed text-foreground/85">
                    You passed it, so {skill.name} is lit on your map. Retake it any time as a refresher. It won't add XP.
                  </p>
                  <Button asChild variant="outline" size="lg" className="mt-6"><Link to={challengeUrl(check)}>Retake the skill check</Link></Button>
                </>
              ) : skill.unlocked ? (
                <>
                  <p className="mt-4 max-w-prose leading-relaxed text-foreground/85">
                    {check.questions.length} questions, about a minute. You can miss one. Pass it to light {skill.name}
                    {opens.length ? ` and open up ${names(opens.map((s) => s.id))}.` : "."}
                    {closer.length > 0 && ` It also gets you closer to ${names(closer.map((s) => s.id))}.`}
                  </p>
                  <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
                    <Button asChild size="lg"><Link to={challengeUrl(check)}>Take the skill check</Link></Button>
                    <span className="text-sm text-muted-foreground">+{check.xpReward + SKILL_MASTERY_XP} XP</span>
                  </div>
                </>
              ) : (
                <>
                  <p className="mt-4 max-w-prose leading-relaxed text-foreground/85">
                    <Lock className="mr-1.5 inline h-4 w-4 align-[-2px] text-muted-foreground" aria-hidden />
                    Locked. Master {names(missing)} first, then come back for this one. The reading list is open now if you want a head start.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    {missing.map((id) => (
                      <Button key={id} asChild variant="outline"><Link to={`/learn?skill=${id}`}>Go to {skillById.get(id)!.name}</Link></Button>
                    ))}
                  </div>
                </>
              )
            )}
          </section>

          <section aria-labelledby="practice-heading">
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <h2 id="practice-heading" className="text-2xl font-bold">Practice</h2>
              {practice.length > 0 && (
                <p className="text-sm text-muted-foreground">{practice.filter((c) => doneChallenges.has(c.id)).length} of {practice.length} done</p>
              )}
            </div>
            {practice.length ? (
              <ul className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/70 bg-card/30">
                {practice.map((c) => <PracticeRow key={c.id} challenge={c} done={doneChallenges.has(c.id)} locked={!skill.unlocked} />)}
              </ul>
            ) : (
              <p className="max-w-prose text-muted-foreground">
                No exercises for {skill.name} yet. The reading list covers what the skill check asks.
              </p>
            )}
          </section>
        </div>

        <aside aria-labelledby="reading-heading" className="space-y-8">
          <section>
            <h2 id="reading-heading" className="text-xl font-bold">{skill.mastered ? "Reading list" : "Before the skill check"}</h2>
            <p className="mt-1 text-sm text-muted-foreground">Free guides from trusted sources.</p>
            <ul className="mt-4 space-y-4">
              {reading.map((r) => (
                <li key={r.url}>
                  <a href={r.url} target="_blank" rel="noopener noreferrer"
                    className="group inline-flex items-start gap-1.5 rounded font-medium leading-snug underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    {r.title}
                    <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" aria-hidden />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                  <p className="text-sm text-muted-foreground">{r.source}</p>
                </li>
              ))}
            </ul>
          </section>
          {sheet && (
            <Button variant="outline" className="w-full" aria-expanded={sheetOpen} aria-controls={sheetId}
              onClick={() => {
                setSheetOpen(!sheetOpen);
                if (!sheetOpen) requestAnimationFrame(() => document.getElementById(sheetId)?.scrollIntoView({ block: "start" }));
              }}>
              {sheetOpen ? "Hide" : "Show"} the {skill.name} cheat sheet
            </Button>
          )}
        </aside>
      </div>

      {sheet && <div id={sheetId} hidden={!sheetOpen} className="mt-12 scroll-mt-24"><CheatSheet data={sheet} /></div>}
      </>}
    </PageShell>
  );
};

const PracticeRow = ({ challenge: c, done, locked }: { challenge: Challenge; done: boolean; locked: boolean }) => {
  const Icon = c.type === "game" ? Gamepad2 : Code;
  const body = (
    <>
      <Icon className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      <span className="min-w-0 flex-1">
        {/* Locked rows aren't links, so they show the whole description and dim only the title */}
        <span className={cn("block font-semibold", locked && "text-muted-foreground")}>{c.title}</span>
        <span className={cn("mt-0.5 block text-sm leading-relaxed text-muted-foreground", !locked && "line-clamp-2")}>{c.description}</span>
      </span>
      <span className="shrink-0 pt-0.5 text-sm">
        {done ? <span className="flex items-center gap-1 text-[hsl(var(--glow-completed))]"><Check className="h-4 w-4" aria-hidden />Done</span>
          : locked ? <Lock className="h-4 w-4 text-muted-foreground" aria-label="Locked" />
          : <span className="text-muted-foreground">+{c.xpReward} XP</span>}
      </span>
    </>
  );
  return (
    <li>
      {locked ? (
        <div className="flex gap-3 px-4 py-4 sm:px-5">{body}</div>
      ) : (
        <Link to={challengeUrl(c)}
          className="flex gap-3 px-4 py-4 transition-colors hover:bg-card/70 focus-visible:bg-card/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-5">
          {body}
        </Link>
      )}
    </li>
  );
};

const ChallengeView = ({ challenge }: { challenge: Challenge }) => {
  const progress = useProgress();
  const { skills, doneChallenges, completeChallenge, submitQuiz } = progress;
  // Snapshot of mastery before this attempt, so "newly unlocked" is computed against it.
  const [celebrate, setCelebrate] = useState<{ xp: number; before: Set<string> } | null>(null);
  const skill = skills.find((s) => s.id === challenge.skillId)!;
  // The h1 stays the skill name; the tab title names the exercise. Runs after PageShell's own title effect, so it wins.
  usePageTitle(`${challenge.title} · ${skill.name}`);
  const gate = progressGate(progress);
  const back = (
    <Link to={`/learn?skill=${skill.id}`} className="-ml-2 mb-6 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <ArrowLeft className="h-4 w-4" aria-hidden />Back to {skill.name}
    </Link>
  );

  if (gate && !celebrate) return <PageShell title={skill.name}>{back}{gate}</PageShell>;
  if (!skill.unlocked && !celebrate)
    return (
      <PageShell title={challenge.title} subtitle={`${skill.name} is locked. Master ${names(missingFor(skill, skills))} to unlock it.`}>
        {back}
      </PageShell>
    );

  const saved = (xp: number, what: string) =>
    xp > 0 ? toast.success(what, { description: `+${xp} XP` }) : toast(what, { description: "Already completed, so no new XP." });
  const failed = (e: Error) => toast.error("Couldn't save your progress", { description: e.message });
  const claim = () =>
    completeChallenge.mutate(challenge.id, { onSuccess: (r) => saved(r.xpAwarded ? challenge.xpReward : 0, `${challenge.title} complete`), onError: failed });

  if (celebrate) {
    const unlocked = unlocksOf(skill.id).filter(
      (s) => !celebrate.before.has(s.id) && s.requires.every((r) => r === skill.id || celebrate.before.has(r)),
    );
    const first = celebrate.xp > 0;
    return (
      <PageShell
        title={first ? `${skill.name} is lit.` : `${skill.name} is still lit.`}
        subtitle={
          !first ? "You'd already mastered this skill, so there's no new XP. Nice refresher, though."
          : unlocked.length ? `+${celebrate.xp} XP. New stars unlocked: ${and.format(unlocked.map((s) => s.name))}.`
          : `+${celebrate.xp} XP. Keep going to light up the rest of the constellation.`
        }
      >
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg"><Link to={first ? `/?lit=${skill.id}` : "/"}>Back to the galaxy</Link></Button>
          {unlocked[0] && <Button asChild size="lg" variant="outline"><Link to={`/learn?skill=${unlocked[0].id}`}>Start {unlocked[0].name}</Link></Button>}
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title={skill.name} width="max-w-3xl">
      {back}
      {/* On phones the tutor launcher floats ~136px above the bottom edge, above html's scroll-padding.
          The extra scroll margin makes a focused control scroll clear of it. */}
      <div className="max-sm:[&_:is(button,input,textarea)]:scroll-mb-20">
      {challenge.type === "quiz" && (
        <QuizChallenge
          challenge={challenge}
          done={doneChallenges.has(challenge.id)}
          onSubmit={(answers) => submitQuiz.mutateAsync({ challengeId: challenge.id, answers })}
          onPassed={(r) => {
            if (r.mastered) setCelebrate({ xp: r.xp_awarded, before: new Set(skills.filter((s) => s.mastered).map((s) => s.id)) });
            else saved(r.xp_awarded, `${challenge.title} passed`);
          }}
        />
      )}
      {challenge.type === "code" && (
        <CodeEditor challenge={challenge} done={doneChallenges.has(challenge.id)} claiming={completeChallenge.isPending} onPass={claim} />
      )}
      {challenge.type === "game" && (
        <PlanetDebugger challenge={challenge} done={doneChallenges.has(challenge.id)} claiming={completeChallenge.isPending} onPass={claim} />
      )}
      </div>
    </PageShell>
  );
};

export default Learn;
