// All reads and writes of learning progress. Writes go through RLS-checked inserts
// (code challenges, games) or server functions (quizzes, resets); XP and streaks are
// computed in Postgres and read back from the leaderboard view.
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { skillStates } from "@/lib/progress";

export interface Stats {
  xp: number;
  level: number;
  skills_mastered: number;
  challenges_done: number;
  streak: number;
  best_streak: number;
  rank: number;
  username: string;
}

export interface QuizResult {
  score: number;
  total: number;
  passed: boolean;
  mastered: boolean;
  xp_awarded: number;
}

export interface AnswerFeedback {
  correct: boolean;
  answer: string;
  explanation: string;
}

type Row = { xp: number | null; level: number | null; skills_mastered: number | null; challenges_done: number | null;
  streak: number | null; best_streak: number | null; rank: number | null; username: string | null };

/** View columns are typed nullable by the generator; they never are for a real player. */
export const toStats = (r: Row | null): Stats => ({
  xp: r?.xp ?? 0,
  level: r?.level ?? 1,
  skills_mastered: r?.skills_mastered ?? 0,
  challenges_done: r?.challenges_done ?? 0,
  streak: r?.streak ?? 0,
  best_streak: r?.best_streak ?? 0,
  rank: r?.rank ?? 0,
  username: r?.username ?? "",
});

const EMPTY_STATS = toStats(null);

export const useProgress = () => {
  const { user } = useAuth();
  const uid = user?.id;
  const qc = useQueryClient();

  const completions = useQuery({
    queryKey: ["completions", uid],
    enabled: !!uid,
    queryFn: async () => {
      const [s, c] = await Promise.all([
        supabase.from("skill_completions").select("skill_id, completed_at").eq("user_id", uid!),
        supabase.from("challenge_completions").select("challenge_id, completed_at").eq("user_id", uid!),
      ]);
      if (s.error) throw s.error;
      if (c.error) throw c.error;
      return { skills: s.data, challenges: c.data };
    },
  });

  const stats = useQuery({
    queryKey: ["stats", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase.from("leaderboard").select("*").eq("user_id", uid!).maybeSingle();
      if (error) throw error;
      return toStats(data);
    },
  });

  const refresh = () => qc.invalidateQueries();

  /** Code challenges and games. Already-completed is fine (unique violation ignored). */
  const completeChallenge = useMutation({
    mutationFn: async (challengeId: string) => {
      const { error } = await supabase.from("challenge_completions").insert({ challenge_id: challengeId });
      if (error && error.code !== "23505") throw error;
      return { xpAwarded: !error };
    },
    onSuccess: refresh,
  });

  /** Graded in Postgres; passing a skill check masters the skill. */
  const submitQuiz = useMutation({
    mutationFn: async ({ challengeId, answers }: { challengeId: string; answers: string[] }) => {
      const { data, error } = await supabase.rpc("submit_quiz", { p_challenge_id: challengeId, p_answers: answers });
      if (error) throw error;
      return data as unknown as QuizResult;
    },
    onSuccess: refresh,
  });

  /** Resets the skill and every skill built on it. Returns the ids that were reset. */
  const resetSkill = useMutation({
    mutationFn: async (skillId: string) => {
      const { data, error } = await supabase.rpc("reset_skill", { p_skill_id: skillId });
      if (error) throw error;
      return data ?? [];
    },
    onSuccess: refresh,
  });

  const resetAll = useMutation({
    mutationFn: async () => {
      // challenge rows first isn't required, but keeps the stats trigger to two refreshes
      const a = await supabase.from("challenge_completions").delete().eq("user_id", uid!);
      if (a.error) throw a.error;
      const b = await supabase.from("skill_completions").delete().eq("user_id", uid!);
      if (b.error) throw b.error;
    },
    onSuccess: refresh,
  });

  const mastered = useMemo(() => new Set(completions.data?.skills.map((s) => s.skill_id)), [completions.data]);
  const doneChallenges = useMemo(() => new Set(completions.data?.challenges.map((c) => c.challenge_id)), [completions.data]);
  const skills = useMemo(() => skillStates(mastered), [mastered]);

  return {
    /** true until the first load of this user's progress has finished */
    loading: !uid || completions.isPending || stats.isPending,
    error: completions.error ?? stats.error,
    retry: refresh,
    skills,
    mastered,
    doneChallenges,
    history: completions.data,
    stats: stats.data ?? EMPTY_STATS,
    completeChallenge,
    submitQuiz,
    resetSkill,
    resetAll,
  };
};

/** Instant per-question feedback. Stateless on the server; the final grade comes from submitQuiz. */
export const checkAnswer = async (challengeId: string, index: number, answer: string): Promise<AnswerFeedback> => {
  const { data, error } = await supabase.rpc("check_answer", { p_challenge_id: challengeId, p_index: index, p_answer: answer });
  if (error) throw error;
  return data as unknown as AnswerFeedback;
};

/** Top players, kept live: any stats change anywhere refetches (debounced). */
export const useLeaderboard = (limit = 50) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [live, setLive] = useState(false);

  useEffect(() => {
    if (!user) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const channel = supabase
      .channel(`leaderboard-${limit}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "player_stats" }, () => {
        clearTimeout(timer);
        timer = setTimeout(() => qc.invalidateQueries({ queryKey: ["leaderboard"] }), 1500);
      })
      .subscribe((status) => setLive(status === "SUBSCRIBED"));
    return () => {
      clearTimeout(timer);
      setLive(false);
      supabase.removeChannel(channel);
    };
  }, [user, qc, limit]);

  const query = useQuery({
    queryKey: ["leaderboard", limit],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leaderboard")
        .select("user_id, username, xp, level, skills_mastered, streak, rank")
        .gt("xp", 0)
        .order("xp", { ascending: false })
        .order("user_id")
        .limit(limit);
      if (error) throw error;
      return data;
    },
  });
  /** true while the Realtime subscription is connected */
  return { ...query, live };
};

/** A public profile by username: stats + mastery + activity dates. */
export const usePublicProfile = (username: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile", username.toLowerCase()],
    enabled: !!user && !!username,
    queryFn: async () => {
      // Only real usernames reach the query: PostgREST's ilike also treats * as a wildcard,
      // so /u/a* would otherwise show whoever matches first.
      if (!/^[A-Za-z0-9_-]{3,20}$/.test(username)) return null;
      // ilike for case-insensitive match; _ is a wildcard but also legal in names
      const pattern = username.replace(/_/g, "\\_");
      const { data: row, error } = await supabase.from("leaderboard").select("*").ilike("username", pattern).maybeSingle();
      if (error) throw error;
      if (!row?.user_id) return null;
      const [s, c] = await Promise.all([
        supabase.from("skill_completions").select("skill_id, completed_at").eq("user_id", row.user_id),
        supabase.from("challenge_completions").select("challenge_id, completed_at").eq("user_id", row.user_id),
      ]);
      if (s.error) throw s.error;
      if (c.error) throw c.error;
      return { userId: row.user_id, stats: toStats(row), skills: s.data, challenges: c.data };
    },
  });
};

export const useUsername = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (username: string) => {
      const { error } = await supabase.from("profiles").update({ username }).eq("id", user!.id);
      if (error)
        throw error.code === "23505" ? new Error("That name is taken") : error.code === "23514" ? new Error("Use 3–20 letters, numbers, _ or -") : error;
    },
    onSuccess: () => qc.invalidateQueries(),
  });
};
