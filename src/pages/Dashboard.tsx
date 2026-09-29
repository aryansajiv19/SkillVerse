import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Flame } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { ActivityHeatmap } from "@/components/ActivityHeatmap";
import { MiniGalaxy } from "@/components/MiniGalaxy";
import { AchievementList } from "@/components/social/AchievementList";
import { LoadError, Skeleton } from "@/components/social/states";
import { useProgress } from "@/hooks/useProgress";
import { achievements, completionTimes, levelProgress, nextUp } from "@/lib/progress";
import { skillById, trackById, tracks } from "@/content/skills";
import { challengeById, checkIdFor } from "@/content/challenges";

const Dashboard = () => {
  const { loading, error, retry, skills, mastered, stats, history } = useProgress();
  // A failed background refetch keeps showing the last good data; only a failed first load shows the error.
  const failed = error && (!history || !stats.username) ? error : null;
  const lvl = levelProgress(stats.xp);
  const upNext = nextUp(skills).slice(0, 4);
  const badges = achievements(stats, mastered);
  const times = useMemo(() => (history ? completionTimes(history.skills, history.challenges) : []), [history]);

  const activity = [
    ...(history?.skills ?? []).map((s) => ({
      at: s.completed_at,
      text: `Mastered ${skillById.get(s.skill_id)?.name}`,
    })),
    ...(history?.challenges ?? [])
      .filter((c) => !c.challenge_id.endsWith("-check"))
      .map((c) => ({ at: c.completed_at, text: `Completed ${challengeById.get(c.challenge_id)?.title}` })),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 8);

  const subtitle =
    loading || failed ? undefined : (
      <>
        {stats.xp
          ? `Ranked #${stats.rank} on the leaderboard. `
          : "Earn XP to get on the leaderboard: pass a skill check or finish a challenge. "}
        <Link
          to={`/u/${encodeURIComponent(stats.username)}`}
          className="text-foreground underline underline-offset-4 hover:text-[hsl(var(--glow-completed))]"
        >
          View your public profile
        </Link>
      </>
    );

  return (
    <PageShell title={stats.username || "Dashboard"} documentTitle="Dashboard" nameTitle={!!stats.username} subtitle={subtitle}>
      {failed ? (
        <LoadError what="your progress" error={failed} onRetry={retry} />
      ) : loading ? (
        <div role="status" aria-busy="true" aria-label="Loading your progress" className="space-y-10">
          <Skeleton className="h-40" />
          <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        </div>
      ) : (
        <>
          <section
            aria-label="Stats"
            className="glass-panel mb-10 grid grid-cols-2 gap-6 rounded-2xl p-6 sm:grid-cols-4 sm:p-8 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]"
          >
            <div className="col-span-2 sm:col-span-4 lg:col-span-1">
              <p className="font-display text-4xl font-extrabold">Level {lvl.level}</p>
              <div
                role="progressbar"
                aria-label={`Progress to level ${lvl.level + 1}`}
                aria-valuenow={lvl.into}
                aria-valuemin={0}
                aria-valuemax={lvl.into + lvl.toNext}
                className="mt-3 h-2 overflow-hidden rounded-full bg-[hsl(var(--glow-completed)/0.15)]"
              >
                <div className="h-full rounded-full bg-[hsl(var(--glow-completed))]" style={{ width: `${lvl.pct}%` }} />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {lvl.toNext} XP to level {lvl.level + 1}
              </p>
            </div>
            <Stat value={stats.xp.toLocaleString()} label="total XP" />
            <Stat value={`${stats.skills_mastered}/${skills.length}`} label="stars lit" />
            <Stat
              value={
                <span className="flex items-center gap-1.5">
                  {stats.streak}
                  <Flame aria-hidden className="h-6 w-6 text-[hsl(var(--glow-completed))]" />
                </span>
              }
              label="day streak"
            />
            <Stat value={stats.best_streak} label="best streak" />
          </section>

          <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
            <div className="min-w-0 space-y-10">
              <section aria-labelledby="up-next">
                <h2 id="up-next" className="mb-4 text-2xl font-bold">
                  Up next
                </h2>
                {upNext.length ? (
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {upNext.map((s) => {
                      const track = trackById.get(s.track)!;
                      return (
                        <li key={s.id}>
                          <Link
                            to={`/learn?skill=${s.id}&challenge=${checkIdFor(s.id)}`}
                            className="glass-panel block h-full rounded-xl p-5 transition-colors hover:border-[hsl(var(--track))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            style={{ ["--track" as string]: track.hue }}
                          >
                            <span className="text-sm" style={{ color: `hsl(${track.hue})` }}>
                              {track.name}
                            </span>
                            <span className="mt-1 block text-lg font-semibold">{s.name}</span>
                            <span className="mt-1 block text-sm text-muted-foreground">Take the skill check</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">Every star is lit. You've mastered the whole galaxy.</p>
                )}
              </section>

              <section aria-labelledby="activity">
                <h2 id="activity" className="mb-4 text-2xl font-bold">
                  Activity
                </h2>
                <div className="glass-panel rounded-2xl p-4 sm:p-6">
                  <ActivityHeatmap timestamps={times} />
                </div>
              </section>

              <section aria-labelledby="recent">
                <h2 id="recent" className="mb-4 text-2xl font-bold">
                  Recent activity
                </h2>
                {activity.length ? (
                  <ul className="space-y-2 text-sm">
                    {activity.map((a) => (
                      <li key={a.at + a.text} className="flex justify-between gap-4">
                        <span>{a.text}</span>
                        <time className="shrink-0 text-muted-foreground" dateTime={a.at}>
                          {new Date(a.at).toLocaleDateString()}
                        </time>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nothing yet.{" "}
                    <Link to="/" className="text-foreground underline underline-offset-4">
                      Pick a star
                    </Link>{" "}
                    to begin.
                  </p>
                )}
              </section>
            </div>

            <div className="min-w-0 space-y-10">
              <section aria-labelledby="constellations">
                <div className="mb-4 flex items-baseline justify-between gap-4">
                  <h2 id="constellations" className="text-2xl font-bold">
                    Constellations
                  </h2>
                  <Link
                    to="/"
                    className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
                  >
                    Open the map
                  </Link>
                </div>
                <div className="glass-panel rounded-2xl p-4 sm:p-5">
                  <MiniGalaxy mastered={mastered} title="Your galaxy" className="w-full" />
                  <ul className="mt-4 space-y-3">
                    {tracks.map((t) => {
                      const inTrack = skills.filter((s) => s.track === t.id);
                      const done = inTrack.filter((s) => s.mastered).length;
                      return (
                        <li key={t.id}>
                          <div className="mb-1.5 flex justify-between text-sm">
                            <span>{t.name}</span>
                            <span className="text-muted-foreground">
                              {done}/{inTrack.length}
                            </span>
                          </div>
                          <div
                            className="h-1.5 overflow-hidden rounded-full"
                            style={{ background: `hsl(${t.hue} / 0.15)` }}
                          >
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${(done / inTrack.length) * 100}%`, background: `hsl(${t.hue})` }}
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </section>

              <section aria-labelledby="achievements">
                <h2 id="achievements" className="mb-4 flex items-baseline gap-3 text-2xl font-bold">
                  Achievements
                  <span className="font-sans text-base font-normal text-muted-foreground">
                    {badges.filter((b) => b.earned).length} of {badges.length}
                  </span>
                </h2>
                <AchievementList items={badges} />
              </section>
            </div>
          </div>
        </>
      )}
    </PageShell>
  );
};

const Stat = ({ value, label }: { value: React.ReactNode; label: string }) => (
  <div>
    <p className="font-display text-3xl font-extrabold lg:text-4xl">{value}</p>
    <p className="mt-1 text-sm text-muted-foreground">{label}</p>
  </div>
);

export default Dashboard;
