"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";

/**
 * Salva a resposta + autoavaliação de confiança de uma pergunta da
 * simulação de entrevista (Fase 2, v1 sem IA). Upsert por
 * (user_id, question_slug) — o candidato pode reescrever a resposta
 * quantas vezes quiser conforme pratica.
 */
export async function saveInterviewAnswerAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/academy/entrevista");

  const questionSlug = String(formData.get("question_slug") ?? "");
  const answer = String(formData.get("answer") ?? "").trim() || null;
  const confidenceRaw = formData.get("confidence_rating");
  if (!questionSlug) return;

  const supabase = createClient();

  // O botão "Salvar resposta" (genérico) não manda `confidence_rating` —
  // só os botões numerados (1-5) mandam. Sem isso, salvar só o texto
  // apagaria a confiança já escolhida antes. Por isso, se não veio no
  // formulário, mantém o valor que já estava salvo em vez de zerar.
  let confidenceRating: number | null;
  if (confidenceRaw) {
    confidenceRating = Number(confidenceRaw);
  } else {
    const { data: existing } = await supabase
      .from("interview_practice_answers")
      .select("confidence_rating")
      .eq("user_id", user.id)
      .eq("question_slug", questionSlug)
      .maybeSingle();
    confidenceRating = (existing?.confidence_rating as number | null) ?? null;
  }

  const { error } = await supabase.from("interview_practice_answers").upsert(
    {
      user_id: user.id,
      question_slug: questionSlug,
      answer,
      confidence_rating: confidenceRating,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id, question_slug" },
  );

  if (error) {
    console.error("Erro ao salvar resposta da simulação de entrevista:", error.message);
  }

  revalidatePath("/academy/entrevista");
}
