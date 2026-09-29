import { Link } from "react-router-dom";
import { Flame } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { LoadError, Skeleton } from "@/components/social/states";
import { useLeaderboard, useProgress } from "@/hooks/useProgress";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const medal = ["text-[hsl(var(--glow-completed))]", "text-slate-300", "text-amber-600"];
const cell = "px-3 py-3 sm:px-5";
const wideOnly = "hidden sm:table-cell";

interface RowData {
  rank: number | null;
  username: string | null;
  level: number | null;
  skills_mastered: number | null;
  streak: number | null;
  xp: number | null;
}

const Row = ({ r, mine }: { r: RowData; mine: boolean }) => (
  <tr className={cn("border-b last:border-0", mine && "bg-[hsl(var(--glow-completed)/0.07)]")}>
    <td
      className={cn(
        cell,
        "font-display text-lg font-bold",
        medal[r.rank! - 1],
        mine && "shadow-[inset_3px_0_0_hsl(var(--glow-completed))]",
      )}
    >
      #{r.rank}
    </td>
    <td className={cn(cell, "w-full max-w-0 font-medium")}>
      <span className="flex min-w-0 items-center gap-2">
        <Link to={`/u/${encodeURIComponent(r.username!)}`} className="truncate underline-offset-4 hover:underline">
          {r.username}
        </Link>
        {mine && <span className="hidden rounded-full border px-2 py-0.5 text-xs font-normal text-muted-foreground sm:inline">you</span>}
      </span>
      <span className="block text-xs font-normal text-muted-foreground sm:hidden">
        {mine && "You · "}Level {r.level}
        {r.streak ? `, ${r.streak}-day streak` : ""}
      </span>
    </td>
    <td className={cn(cell, wideOnly, "text-right")}>{r.level}</td>
    <td className={cn(cell, "text-right")}>{r.skills_mastered}</td>
    <td className={cn(cell, wideOnly, "text-right")}>
      {r.streak ? (
        <span className="inline-flex items-center gap-1">
          {r.streak}
          <Flame aria-hidden className="h-3.5 w-3.5 text-[hsl(var(--glow-completed))]" />
        </span>
      ) : (
        <span className="text-muted-foreground">0</span>
      )}
    </td>
    <td className={cn(cell, "text-right font-semibold tabular-nums")}>{r.xp!.toLocaleString()}</td>
  </tr>
);

const LiveStatus = ({ live }: { live: boolean }) => (
  <span className="ml-3 inline-flex items-center gap-2 whitespace-nowrap align-middle text-sm">
    <span aria-hidden className="relative flex h-2 w-2">
      {live && (
        <span className="absolute inset-0 rounded-full bg-emerald-400 opacity-60 motion-safe:animate-ping [animation-duration:2s]" />
      )}
      <span className={cn("relative h-2 w-2 rounded-full", live ? "bg-emerald-400" : "bg-muted-foreground")} />
    </span>
    {live ? "Live" : "Connecting"}
    <span className="sr-only">
      {live ? ": rankings update as learners earn XP." : ": live updates are reconnecting."}
    </span>
  </span>
);

const Leaderboard = () => {
  const { user } = useAuth();
  const me = useProgress();
  const { data, isPending, error, refetch, live } = useLeaderboard();
  // Outside the top rows: your own row goes under the table, after a gap.
  const showMe = !!data && !me.loading && me.stats.xp > 0 && !data.some((r) => r.user_id === user?.id);

  return (
    <PageShell
      title="Leaderboard"
      subtitle={
        <>
          The top 50 learners, ranked by XP.
          <LiveStatus live={live} />
        </>
      }
      width="max-w-4xl"
    >
      {error && !data ? (
        <LoadError what="the leaderboard" error={error} onRetry={() => refetch()} />
      ) : isPending ? (
        <div role="status" aria-busy="true" aria-label="Loading the leaderboard" className="glass-panel space-y-4 rounded-2xl p-5">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-8 rounded-lg" />
          ))}
        </div>
      ) : !data.length ? (
        <p className="text-muted-foreground">
          No one's on the board yet. Earn XP to take first place:{" "}
          <Link to="/" className="text-foreground underline underline-offset-4">
            pass a skill check or finish a challenge
          </Link>
          .
        </p>
      ) : (
        <div className="glass-panel overflow-hidden rounded-2xl">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">
              Top {data.length} learners by XP{showMe ? ", then your position" : ""}
            </caption>
            <thead className="text-muted-foreground">
              <tr className="border-b">
                <th scope="col" className={cn(cell, "font-medium")}>
                  Rank
                </th>
                <th scope="col" className={cn(cell, "font-medium")}>
                  Learner
                </th>
                <th scope="col" className={cn(cell, wideOnly, "text-right font-medium")}>
                  Level
                </th>
                <th scope="col" className={cn(cell, "text-right font-medium")}>
                  Stars
                </th>
                <th scope="col" className={cn(cell, wideOnly, "text-right font-medium")}>
                  Streak
                </th>
                <th scope="col" className={cn(cell, "text-right font-medium")}>
                  XP
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((r) => (
                <Row key={r.user_id} r={r} mine={r.user_id === user?.id} />
              ))}
            </tbody>
            {showMe && (
              <tbody className="border-t border-dashed border-muted-foreground/40">
                <Row r={me.stats} mine />
              </tbody>
            )}
          </table>
        </div>
      )}

      {!!data?.length && !me.loading && !me.stats.xp && (
        <p className="mt-6 text-sm text-muted-foreground">
          You're not on the board yet. Earn XP to join:{" "}
          <Link to="/" className="text-foreground underline underline-offset-4">
            pass a skill check or finish a challenge
          </Link>
          .
        </p>
      )}
    </PageShell>
  );
};

export default Leaderboard;
