import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, BookOpen, Check, Code, Gamepad2, Lock, Star } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { CodeEditor } from "@/components/CodeEditor";
import { QuizChallenge } from "@/components/QuizChallenge";
import { CheatSheet } from "@/components/CheatSheet";
import { PlanetDebugger } from "@/components/games/PlanetDebugger";
import { Button } from "@/components/ui/button";
import { useProgress } from "@/hooks/useProgress";
import { skillById, trackById, tracks, unlocksOf } from "@/content/skills";
import { challengeById, challengesForSkill, checkIdFor, type Challenge } from "@/content/challenges";
import { cheatSheets } from "@/content/cheatsheets";

const icons = { quiz: Star, code: Code, game: Gamepad2 };

const Learn = () => {
  const [params, setParams] = useSearchParams();
  const skillId = params.get("skill");
  const challengeId = params.get("challenge");
  const skill = skillId ? skillById.get(skillId) : undefined;

  if (!skill) return <PickSkill />;
  const challenge = challengeId ? challengeById.get(challengeId) : undefined;
  const open = (id: string | null) => setParams(id ? { skill: skill.id, challenge: id } : { skill: skill.id });

  return challenge && challenge.skillId === skill.id
    ? <ChallengeView key={challenge.id} challenge={challenge} onBack={() => open(null)} />
    : <SkillView skillId={skill.id} onOpen={open} />;
};

const PickSkill = () => {
  const { skills } = useProgress();
  return (
    <PageShell title="Learn" subtitle="Pick a star you've unlocked. Each one has a skill check, and many have code challenges too.">
      <div className="grid gap-10 md:grid-cols-2">
        {tracks.map((t) => (
          <section key={t.id}>
            <h2 className="mb-3 text-xl font-bold" style={{ color: `hsl(${t.hue})` }}>{t.name}</h2>
            <ul className="divide-y rounded-xl border">
              {skills.filter((s) => s.track === t.id).map((s) => (
                <li key={s.id}>
                  <Link to={`/learn?skill=${s.id}`} className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-card/60">
                    <span className={s.unlocked ? "" : "text-muted-foreground"}>{s.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {s.mastered ? <Check className="h-4 w-4 text-[hsl(var(--glow-completed))]" aria-label="Mastered" /> : !s.unlocked ? <Lock className="h-4 w-4" aria-label="Locked" /> : `${challengesForSkill(s.id).length} challenge${challengesForSkill(s.id).length === 1 ? "" : "s"}`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </PageShell>
  );
};

const SkillView = ({ skillId, onOpen }: { skillId: string; onOpen: (id: string) => void }) => {
  const { skills, doneChallenges } = useProgress();
  const [sheet, setSheet] = useState(false);
  const skill = skills.find((s) => s.id === skillId)!;
  const track = trackById.get(skill.track)!;
  const list = challengesForSkill(skill.id);

  return (
    <PageShell title={skill.name} subtitle={skill.description}>
      <div className="mb-8 flex flex-wrap gap-3">
        <Button asChild variant="outline"><Link to="/learn"><ArrowLeft className="mr-2 h-4 w-4" />All skills</Link></Button>
        {cheatSheets[skill.id] && (
          <Button variant="outline" onClick={() => setSheet(!sheet)}><BookOpen className="mr-2 h-4 w-4" />{sheet ? "Hide" : "Show"} cheat sheet</Button>
        )}
      </div>
      {sheet && <div className="mb-8"><CheatSheet data={cheatSheets[skill.id]} /></div>}

      {!skill.unlocked ? (
        <p className="glass-panel rounded-xl p-6">
          <Lock className="mr-2 inline h-4 w-4" />
          Master {skill.requires.filter((r) => !skills.find((s) => s.id === r)?.mastered).map((r) => skillById.get(r)!.name).join(" and ")} first.
        </p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {list.map((c) => {
            const Icon = icons[c.type];
            const done = doneChallenges.has(c.id);
            return (
              <li key={c.id}>
                <button
                  onClick={() => onOpen(c.id)}
                  className="glass-panel flex h-full w-full flex-col gap-2 rounded-xl p-5 text-left transition-colors hover:border-[hsl(var(--track))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  style={{ ["--track" as string]: track.hue }}
                >
                  <span className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="flex items-center gap-2"><Icon className="h-4 w-4" />{c.id === checkIdFor(skill.id) ? "Skill check" : c.type === "code" ? "Code" : "Game"}</span>
                    {done ? <span className="flex items-center gap-1 text-[hsl(var(--glow-completed))]"><Check className="h-4 w-4" />Done</span> : <span>+{c.xpReward} XP</span>}
                  </span>
                  <span className="text-lg font-semibold">{c.title}</span>
                  <span className="text-sm text-muted-foreground">{c.description}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </PageShell>
  );
};

const ChallengeView = ({ challenge, onBack }: { challenge: Challenge; onBack: () => void }) => {
  const { skills, loading, doneChallenges, completeChallenge, submitQuiz } = useProgress();
  // Snapshot of mastery before this attempt, so "newly unlocked" is computed against it.
  const [celebrate, setCelebrate] = useState<{ xp: number; before: Set<string> } | null>(null);
  const skill = skills.find((s) => s.id === challenge.skillId)!;

  if (loading) return <PageShell title={skill.name}><p className="text-muted-foreground">Loading your progress…</p></PageShell>;
  if (!skill.unlocked && !celebrate)
    return <PageShell title={challenge.title}><Button onClick={onBack}>This skill is locked. Go back</Button></PageShell>;

  const saved = (xp: number, what: string) =>
    xp > 0 ? toast.success(`${what}`, { description: `+${xp} XP` }) : toast(`${what}`, { description: "Already completed, so no new XP." });
  const failed = (e: Error) => toast.error("Couldn't save your progress", { description: e.message });

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
          : unlocked.length ? `+${celebrate.xp} XP. New stars unlocked: ${unlocked.map((s) => s.name).join(", ")}.`
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
      <Button variant="ghost" onClick={onBack} className="mb-4 -ml-3 text-muted-foreground"><ArrowLeft className="mr-2 h-4 w-4" />{skill.name} challenges</Button>
      {challenge.type === "quiz" && (
        <QuizChallenge
          challenge={challenge}
          onSubmit={(answers) => submitQuiz.mutateAsync({ challengeId: challenge.id, answers })}
          onPassed={(r) => {
            if (r.mastered) setCelebrate({ xp: r.xp_awarded, before: new Set(skills.filter((s) => s.mastered).map((s) => s.id)) });
            else saved(r.xp_awarded, `${challenge.title} passed`);
          }}
        />
      )}
      {challenge.type === "code" && (
        <CodeEditor
          challenge={challenge}
          done={doneChallenges.has(challenge.id)}
          onPass={() => completeChallenge.mutate(challenge.id, { onSuccess: (r) => saved(r.xpAwarded ? challenge.xpReward : 0, `${challenge.title} complete`), onError: failed })}
        />
      )}
      {challenge.type === "game" && (
        <PlanetDebugger
          challenge={challenge}
          onPass={() => completeChallenge.mutate(challenge.id, { onSuccess: (r) => saved(r.xpAwarded ? challenge.xpReward : 0, `${challenge.title} complete`), onError: failed })}
        />
      )}
    </PageShell>
  );
};

export default Learn;
