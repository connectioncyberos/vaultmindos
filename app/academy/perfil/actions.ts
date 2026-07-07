"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";

/**
 * Atualiza os campos de candidato do perfil (Fase 2 — Portal de
 * Empregabilidade). Documento de identidade tem TIPO variável (não só
 * CPF) por decisão de nível universal — ver blueprint seção 14.
 */
export async function updateCandidateProfileAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/academy/perfil");

  const fullName = String(formData.get("full_name") ?? "").trim() || null;
  const identityDocTypeRaw = String(formData.get("identity_doc_type") ?? "").trim();
  const identityDocType = ["CPF", "PASSPORT", "NATIONAL_ID", "OTHER"].includes(identityDocTypeRaw)
    ? identityDocTypeRaw
    : null;
  const identityDocValue = String(formData.get("identity_doc_value") ?? "").trim() || null;
  const careerObjective = String(formData.get("career_objective") ?? "").trim() || null;
  const isFirstJobSeeker = formData.get("is_first_job_seeker") === "on";

  const supabase = createClient();
  const { error } = await supabase
    .from("users_profile")
    .update({
      full_name: fullName,
      identity_doc_type: identityDocType,
      identity_doc_value: identityDocValue,
      career_objective: careerObjective,
      is_first_job_seeker: isFirstJobSeeker,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    console.error("Erro ao atualizar perfil de candidato:", error.message);
    redirect(`/academy/perfil?erro=${encodeURIComponent("Não foi possível salvar o perfil. Tente de novo.")}`);
  }

  revalidatePath("/academy/perfil");
  redirect("/academy/perfil?salvo=1");
}

/**
 * Grava a autoavaliação (1-5) de uma competência. Upsert simples — o
 * candidato pode reavaliar a qualquer momento conforme evolui nos cursos.
 */
export async function upsertCompetencyRatingAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/academy/perfil");

  const competencyId = String(formData.get("competency_id") ?? "");
  const rating = Number(formData.get("rating") ?? 0);
  if (!competencyId || rating < 1 || rating > 5) return;

  const supabase = createClient();
  const { error } = await supabase.from("candidate_competency_ratings").upsert(
    {
      user_id: user.id,
      competency_id: competencyId,
      rating,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id, competency_id" },
  );

  if (error) {
    console.error("Erro ao salvar autoavaliação de competência:", error.message);
  }

  revalidatePath("/academy/perfil");
}
