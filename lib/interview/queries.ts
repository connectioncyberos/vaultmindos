import { createClient } from "@/lib/supabase/server";

export interface InterviewAnswer {
  questionSlug: string;
  answer: string | null;
  confidenceRating: number | null;
  updatedAt: string;
}

/** Respostas já salvas do candidato — Map<question_slug, InterviewAnswer>. */
export async function getMyInterviewAnswers(userId: string): Promise<Map<string, InterviewAnswer>> {
  const supabase = createClient();
  const { data } = await supabase
    .from("interview_practice_answers")
    .select("question_slug, answer, confidence_rating, updated_at")
    .eq("user_id", userId);

  const map = new Map<string, InterviewAnswer>();
  (data ?? []).forEach((row) => {
    const r = row as Record<string, unknown>;
    map.set(r.question_slug as string, {
      questionSlug: r.question_slug as string,
      answer: (r.answer as string | null) ?? null,
      confidenceRating: (r.confidence_rating as number | null) ?? null,
      updatedAt: r.updated_at as string,
    });
  });
  return map;
}
