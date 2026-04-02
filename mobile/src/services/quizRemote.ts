import { supabase } from "../lib/supabase";

export type QuizRunSummary = {
  last: { score: number; maxScore: number; createdAt: string } | null;
  totalRuns: number;
};

export async function fetchQuizRunSummary(userId: string): Promise<QuizRunSummary> {
  const [lastRes, countRes] = await Promise.all([
    supabase
      .from("quiz_runs")
      .select("score, max_score, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("quiz_runs").select("id", { count: "exact", head: true }).eq("user_id", userId)
  ]);

  if (lastRes.error) throw lastRes.error;
  if (countRes.error) throw countRes.error;

  const row = lastRes.data as { score: number; max_score: number; created_at: string } | null;
  const last =
    row != null && typeof row.score === "number"
      ? { score: row.score, maxScore: row.max_score, createdAt: row.created_at }
      : null;

  return { last, totalRuns: countRes.count ?? 0 };
}

export async function insertQuizRun(params: {
  userId: string;
  score: number;
  maxScore: number;
  questionCount: number;
  isPremium: boolean;
}): Promise<void> {
  const { error } = await supabase.from("quiz_runs").insert({
    user_id: params.userId,
    score: params.score,
    max_score: params.maxScore,
    question_count: params.questionCount,
    is_premium: params.isPremium
  });
  if (error) throw error;
}
