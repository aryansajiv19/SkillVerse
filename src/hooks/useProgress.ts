import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { skillStates } from "@/lib/progress";
import { checkIdFor } from "@/content/challenges";

const EMPTY_STATS = { xp: 0, level: 1, skills_mastered: 0, streak: 0, rank: 0, username: "" };

// Duplicate inserts (already completed) are fine; everything else is a real error.
const insertIgnoringDupes = async (q: PromiseLike<{ error: { code: string } | null }>) => {
  const { error } = await q;
  if (error && error.code !== "23505") throw error;
};

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
      // View columns are typed nullable; they never are for a real profile row.
      return {
        xp: data?.xp ?? 0,
        level: data?.level ?? 1,
        skills_mastered: data?.skills_mastered ?? 0,
        streak: data?.streak ?? 0,
        rank: data?.rank ?? 0,
        username: data?.username ?? "",
      };
    },
  });

  const refresh = () => qc.invalidateQueries();

  const completeChallenge = useMutation({
    mutationFn: (challengeId: string) =>
      insertIgnoringDupes(supabase.from("challenge_completions").insert({ challenge_id: challengeId })),
    onSuccess: refresh,
  });

  /** Passing a skill's check masters the skill. */
  const passSkillCheck = useMutation({
    mutationFn: async (skillId: string) => {
      await insertIgnoringDupes(supabase.from("challenge_completions").insert({ challenge_id: checkIdFor(skillId) }));
      await insertIgnoringDupes(supabase.from("skill_completions").insert({ skill_id: skillId }));
    },
    onSuccess: refresh,
  });

  const unmaster = useMutation({
    mutationFn: async (skillId: string) => {
      const a = await supabase.from("skill_completions").delete().eq("user_id", uid!).eq("skill_id", skillId);
      if (a.error) throw a.error;
      const b = await supabase.from("challenge_completions").delete().eq("user_id", uid!).eq("challenge_id", checkIdFor(skillId));
      if (b.error) throw b.error;
    },
    onSuccess: refresh,
  });

  const reset = useMutation({
    mutationFn: async () => {
      const a = await supabase.from("skill_completions").delete().eq("user_id", uid!);
      if (a.error) throw a.error;
      const b = await supabase.from("challenge_completions").delete().eq("user_id", uid!);
      if (b.error) throw b.error;
    },
    onSuccess: refresh,
  });

  const mastered = useMemo(() => new Set(completions.data?.skills.map((s) => s.skill_id)), [completions.data]);
  const doneChallenges = useMemo(() => new Set(completions.data?.challenges.map((c) => c.challenge_id)), [completions.data]);
  const skills = useMemo(() => skillStates(mastered), [mastered]);

  return {
    loading: !uid || completions.isLoading,
    error: completions.error ?? stats.error,
    skills,
    mastered,
    doneChallenges,
    history: completions.data,
    stats: stats.data ?? EMPTY_STATS,
    completeChallenge,
    passSkillCheck,
    unmaster,
    reset,
  };
};

export const useLeaderboard = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["leaderboard"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("leaderboard").select("*").gt("xp", 0).order("rank").limit(50);
      if (error) throw error;
      return data;
    },
  });
};

export const useUsername = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (username: string) => {
      const { error } = await supabase.from("profiles").update({ username }).eq("id", user!.id);
      if (error) throw error.code === "23505" ? new Error("That name is taken") : error.code === "23514" ? new Error("3–20 letters, numbers, _ or -") : error;
    },
    onSuccess: () => qc.invalidateQueries(),
  });
};
