import { Flame } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { useLeaderboard, useProgress } from "@/hooks/useProgress";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const medal = ["text-[hsl(var(--glow-completed))]", "text-slate-300", "text-amber-600"];

const Leaderboard = () => {
  const { user } = useAuth();
  const { stats } = useProgress();
  const { data, isLoading, error } = useLeaderboard();
  const meInTop = data?.some((r) => r.user_id === user?.id);

  return (
    <PageShell title="Leaderboard" subtitle="Every learner, ranked by XP." width="max-w-4xl">
      {error ? (
        <p className="text-destructive">Couldn't load the leaderboard: {error.message}</p>
      ) : isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : !data?.length ? (
        <p className="text-muted-foreground">No one's on the board yet. Master a skill and take first place.</p>
      ) : (
        <div className="glass-panel overflow-x-auto rounded-2xl">
          <table className="w-full text-left text-sm">
            <thead className="text-muted-foreground">
              <tr className="border-b">
                <th scope="col" className="px-5 py-3 font-medium">Rank</th>
                <th scope="col" className="px-5 py-3 font-medium">Learner</th>
                <th scope="col" className="px-5 py-3 text-right font-medium">Level</th>
                <th scope="col" className="px-5 py-3 text-right font-medium">Stars</th>
                <th scope="col" className="px-5 py-3 text-right font-medium">Streak</th>
                <th scope="col" className="px-5 py-3 text-right font-medium">XP</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r) => {
                const me = r.user_id === user?.id;
                return (
                  <tr key={r.user_id} className={cn("border-b last:border-0", me && "bg-foreground/5")}>
                    <td className={cn("px-5 py-3 font-display text-lg font-bold", medal[r.rank! - 1])}>#{r.rank}</td>
                    <td className="px-5 py-3 font-medium">
                      {r.username}
                      {me && <span className="ml-2 rounded-full border px-2 py-0.5 text-xs text-muted-foreground">you</span>}
                    </td>
                    <td className="px-5 py-3 text-right">{r.level}</td>
                    <td className="px-5 py-3 text-right">{r.skills_mastered}</td>
                    <td className="px-5 py-3 text-right">
                      {r.streak ? <span className="inline-flex items-center gap-1">{r.streak}<Flame className="h-3.5 w-3.5 text-[hsl(var(--glow-completed))]" /></span> : "–"}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold">{r.xp}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {data && !meInTop && (
        <p className="mt-6 text-sm text-muted-foreground">
          {stats.xp ? `You're #${stats.rank} with ${stats.xp} XP.` : "You're not on the board yet. Master a skill to join."}
        </p>
      )}
    </PageShell>
  );
};

export default Leaderboard;
