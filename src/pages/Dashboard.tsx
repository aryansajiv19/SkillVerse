import { Link } from "react-router-dom";
import { Flame } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { useProgress } from "@/hooks/useProgress";
import { achievements, levelProgress, nextUp } from "@/lib/progress";
import { skillById, trackById, tracks } from "@/content/skills";
import { challengeById, checkIdFor } from "@/content/challenges";
import { cn } from "@/lib/utils";

const Dashboard = () => {
  const { skills, mastered, stats, history } = useProgress();
  const lvl = levelProgress(stats.xp);
  const upNext = nextUp(skills).slice(0, 4);
  const badges = achievements(stats, mastered);

  const activity = [
    ...(history?.skills ?? []).map((s) => ({ at: s.completed_at, text: `Mastered ${skillById.get(s.skill_id)?.name}` })),
    ...(history?.challenges ?? [])
      .filter((c) => !c.challenge_id.endsWith("-check"))
      .map((c) => ({ at: c.completed_at, text: `Completed ${challengeById.get(c.challenge_id)?.title}` })),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 8);

  return (
    <PageShell title={stats.username || "Dashboard"} subtitle={stats.xp ? `Ranked #${stats.rank} on the leaderboard.` : "Master your first skill to get on the leaderboard."}>
      <section className="glass-panel mb-10 grid gap-6 rounded-2xl p-6 sm:grid-cols-[1.4fr_1fr_1fr_1fr] sm:p-8">
        <div>
          <p className="font-display text-4xl font-extrabold">Level {lvl.level}</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-[hsl(var(--glow-completed))]" style={{ width: `${lvl.pct}%` }} />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{lvl.toNext} XP to level {lvl.level + 1}</p>
        </div>
        <Stat value={stats.xp} label="total XP" />
        <Stat value={`${stats.skills_mastered}/${skills.length}`} label="stars lit" />
        <Stat value={<span className="flex items-center gap-2">{stats.streak}<Flame className="h-6 w-6 text-[hsl(var(--glow-completed))]" /></span>} label="day streak" />
      </section>

      <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
        <section>
          <h2 className="mb-4 text-2xl font-bold">Up next</h2>
          {upNext.length ? (
            <ul className="grid gap-3 sm:grid-cols-2">
              {upNext.map((s) => (
                <li key={s.id}>
                  <Link
                    to={`/learn?skill=${s.id}&challenge=${checkIdFor(s.id)}`}
                    className="glass-panel block h-full rounded-xl p-5 transition-colors hover:border-[hsl(var(--track))]"
                    style={{ ["--track" as string]: trackById.get(s.track)!.hue }}
                  >
                    <span className="text-sm" style={{ color: `hsl(${trackById.get(s.track)!.hue})` }}>{trackById.get(s.track)!.name}</span>
                    <span className="mt-1 block text-lg font-semibold">{s.name}</span>
                    <span className="mt-1 block text-sm text-muted-foreground">Take the skill check</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">Every star is lit. You've mastered the whole galaxy.</p>
          )}

          <h2 className="mb-4 mt-10 text-2xl font-bold">Constellations</h2>
          <ul className="space-y-4">
            {tracks.map((t) => {
              const inTrack = skills.filter((s) => s.track === t.id);
              const done = inTrack.filter((s) => s.mastered).length;
              return (
                <li key={t.id}>
                  <div className="mb-1.5 flex justify-between text-sm">
                    <span>{t.name}</span>
                    <span className="text-muted-foreground">{done}/{inTrack.length}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full" style={{ width: `${(done / inTrack.length) * 100}%`, background: `hsl(${t.hue})` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="space-y-10">
          <section>
            <h2 className="mb-4 text-2xl font-bold">Achievements</h2>
            <ul className="grid grid-cols-2 gap-3">
              {badges.map((a) => (
                <li key={a.id} className={cn("rounded-xl border p-4", !a.earned && "opacity-40")}>
                  <span className="text-2xl" aria-hidden>{a.icon}</span>
                  <p className="mt-1 font-semibold">{a.name}</p>
                  <p className="text-xs text-muted-foreground">{a.description}</p>
                  <span className="sr-only">{a.earned ? "Earned" : "Not earned yet"}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold">Recent activity</h2>
            {activity.length ? (
              <ul className="space-y-2 text-sm">
                {activity.map((a) => (
                  <li key={a.at + a.text} className="flex justify-between gap-4">
                    <span>{a.text}</span>
                    <time className="shrink-0 text-muted-foreground" dateTime={a.at}>{new Date(a.at).toLocaleDateString()}</time>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Nothing yet. <Link to="/" className="underline">Pick a star</Link> to begin.</p>
            )}
          </section>
        </div>
      </div>
    </PageShell>
  );
};

const Stat = ({ value, label }: { value: React.ReactNode; label: string }) => (
  <div>
    <p className="font-display text-4xl font-extrabold">{value}</p>
    <p className="mt-1 text-sm text-muted-foreground">{label}</p>
  </div>
);

export default Dashboard;
