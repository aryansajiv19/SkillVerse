import { useMemo, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { Flame, Share2 } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";
import { ActivityHeatmap } from "@/components/ActivityHeatmap";
import { MiniGalaxy } from "@/components/MiniGalaxy";
import { AchievementList } from "@/components/social/AchievementList";
import { LoadError, Skeleton } from "@/components/social/states";
import { Button } from "@/components/ui/button";
import { usePublicProfile, type Stats } from "@/hooks/useProgress";
import { useAuth } from "@/lib/auth";
import { achievements, completionTimes } from "@/lib/progress";
import { skills, tracks } from "@/content/skills";

const share = async (stats: Stats) => {
  const url = `${window.location.origin}/u/${encodeURIComponent(stats.username)}`;
  if (navigator.share) {
    try {
      await navigator.share({
        title: `${stats.username} on SkillVerse`,
        text: `${stats.skills_mastered} of ${skills.length} stars lit`,
        url,
      });
      return;
    } catch (e) {
      if ((e as Error).name === "AbortError") return; // closed the share sheet
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    toast.success("Link copied");
  } catch {
    toast.error(`Couldn't copy the link: ${url}`);
  }
};

const Profile = () => {
  const { username = "" } = useParams();
  const { user } = useAuth();
  const { data, isPending, error, refetch } = usePublicProfile(username);
  const mastered = useMemo(() => new Set(data?.skills.map((s) => s.skill_id)), [data]);
  const times = useMemo(() => (data ? completionTimes(data.skills, data.challenges) : []), [data]);

  if (isPending)
    return (
      <PageShell title={username} nameTitle>
        <div role="status" aria-busy="true" aria-label="Loading profile" className="space-y-10">
          <Skeleton className="h-20 max-w-3xl" />
          <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
            <Skeleton className="h-[26rem]" />
            <Skeleton className="h-[26rem]" />
          </div>
        </div>
      </PageShell>
    );

  if (error && data === undefined)
    return (
      <PageShell title={username} nameTitle>
        <LoadError what="this profile" error={error} onRetry={() => refetch()} />
      </PageShell>
    );

  if (!data)
    return (
      <PageShell
        title={`No learner called ${username}`}
        subtitle="Check the spelling. If they changed their name, links to the old one stop working."
      >
        <Button asChild>
          <Link to="/leaderboard">Browse the leaderboard</Link>
        </Button>
      </PageShell>
    );

  const { stats } = data;
  const isMe = data.userId === user?.id;
  const badges = achievements(stats, mastered);
  const firstStar = data.skills.map((s) => s.completed_at).sort()[0];

  return (
    <PageShell
      title={stats.username}
      nameTitle
      subtitle={
        firstStar
          ? `First star lit on ${new Date(firstStar).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.`
          : "No stars lit yet."
      }
    >
      <div className="mb-12 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-5 min-[420px]:grid-cols-3 sm:flex sm:flex-wrap sm:gap-x-10">
          <StatItem label="Level" value={stats.level} />
          <StatItem label="XP" value={stats.xp.toLocaleString()} />
          <StatItem label="Rank" value={stats.xp ? `#${stats.rank}` : "None"} />
          <StatItem label="Stars lit" value={`${stats.skills_mastered}/${skills.length}`} />
          <StatItem
            label="Streak"
            value={
              <span className="inline-flex items-center gap-1">
                {stats.streak}
                <Flame aria-hidden className="h-5 w-5 text-[hsl(var(--glow-completed))]" />
              </span>
            }
          />
          <StatItem label="Best streak" value={stats.best_streak} />
        </dl>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          {isMe && (
            <p className="text-sm text-muted-foreground">
              This is you.{" "}
              <Link to="/settings" className="text-foreground underline underline-offset-4">
                Rename in Account
              </Link>
            </p>
          )}
          <Button variant="outline" onClick={() => share(stats)}>
            <Share2 aria-hidden />
            Share profile
          </Button>
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div className="min-w-0 space-y-10">
          <Section id="galaxy" title="Galaxy">
            <div className="glass-panel rounded-2xl p-4 sm:p-6">
              <MiniGalaxy mastered={mastered} title={`${stats.username}'s galaxy`} className="w-full" />
            </div>
          </Section>
          <Section id="activity" title="Activity">
            <div className="glass-panel rounded-2xl p-4 sm:p-6">
              <ActivityHeatmap timestamps={times} />
            </div>
          </Section>
        </div>

        <div className="min-w-0 space-y-10">
          <Section id="mastered" title="Mastered skills">
            {mastered.size === 0 ? (
              <p className="text-muted-foreground">None yet. Every passed skill check lights a star here.</p>
            ) : (
              <ul className="space-y-5">
                {tracks.map((t) => {
                  const inTrack = skills.filter((s) => s.track === t.id);
                  const lit = inTrack.filter((s) => mastered.has(s.id));
                  return (
                    <li key={t.id} style={{ ["--track" as string]: t.hue }}>
                      <p className="mb-2 flex items-center gap-2 text-sm">
                        <span aria-hidden className="h-2 w-2 rounded-full bg-[hsl(var(--track))]" />
                        <span className="font-semibold">{t.name}</span>
                        <span className="text-muted-foreground">
                          {lit.length} of {inTrack.length}
                        </span>
                      </p>
                      {lit.length ? (
                        <ul className="flex flex-wrap gap-2">
                          {lit.map((s) => (
                            <li key={s.id}>
                              <Link
                                to={`/learn?skill=${s.id}`}
                                className="block rounded-full border border-[hsl(var(--track)/0.4)] px-3 py-1 text-sm transition-colors hover:border-[hsl(var(--track))] hover:bg-[hsl(var(--track)/0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              >
                                {s.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">None yet</p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>

          <Section
            id="achievements"
            title="Achievements"
            aside={`${badges.filter((b) => b.earned).length} of ${badges.length}`}
          >
            <AchievementList items={badges} />
          </Section>
        </div>
      </div>
    </PageShell>
  );
};

const StatItem = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="flex flex-col-reverse">
    <dt className="mt-1 text-sm text-muted-foreground">{label}</dt>
    <dd className="font-display text-2xl font-extrabold sm:text-3xl">{value}</dd>
  </div>
);

const Section = ({
  id,
  title,
  aside,
  children,
}: {
  id: string;
  title: string;
  aside?: string;
  children: ReactNode;
}) => (
  <section aria-labelledby={id}>
    <h2 id={id} className="mb-4 flex items-baseline gap-3 text-2xl font-bold">
      {title}
      {aside && <span className="font-sans text-base font-normal text-muted-foreground">{aside}</span>}
    </h2>
    {children}
  </section>
);

export default Profile;
