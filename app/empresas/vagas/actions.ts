"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getOrganizationForUser } from "@/lib/academy/queries";
import { logAuditEvent } from "@/lib/audit/log";

/**
 * Empresa parceira (RH/gestor) publica uma vaga (Fase 3). RLS
 * (`job_postings_write_org_hr`, já existia desde a migration 001) só
 * permite se `is_org_hr(organization_id)` — checado aqui de novo antes
 * do insert só pra devolver uma mensagem clara em vez de deixar a RLS
 * estourar um erro genérico pro usuário.
 */
export async function createJobPostingAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/empresas/vagas");

  const result = await getOrganizationForUser(user.id);
  if (!result || result.organization.status !== "APPROVED") {
    redirect("/empresas/vagas?erro=" + encodeURIComponent("Sua empresa precisa estar aprovada para publicar vagas."));
  }
  if (!["RESPONSAVEL_RH", "GESTOR_AREA"].includes(result.membership.role)) {
    redirect("/empresas/vagas?erro=" + encodeURIComponent("Seu papel na empresa não permite publicar vagas."));
  }

  const title = String(formData.get("title") ?? "").trim();
  const sectorId = String(formData.get("sector_id") ?? "").trim() || null;
  const competencyIds = formData.getAll("competency_ids").map(String).filter(Boolean);
  if (!title) redirect("/empresas/vagas?erro=" + encodeURIComponent("Informe o título da vaga."));

  const supabase = createClient();
  const { data: posting, error } = await supabase
    .from("job_postings")
    .insert({ organization_id: result!.organization.id, title, sector_id: sectorId })
    .select("id")
    .single();

  if (error || !posting) {
    console.error("Erro ao criar vaga:", error?.message);
    redirect("/empresas/vagas?erro=" + encodeURIComponent("Não foi possível criar a vaga. Tente de novo."));
  }

  if (competencyIds.length > 0) {
    const rows = competencyIds.map((competencyId) => ({ job_posting_id: posting!.id, competency_id: competencyId }));
    const { error: jpcError } = await supabase.from("job_posting_competencies").insert(rows);
    if (jpcError) console.error("Erro ao vincular competências da vaga:", jpcError.message);
  }

  await logAuditEvent(supabase, {
    actorId: user.id,
    action: "job_posting.create",
    entityType: "job_posting",
    entityId: posting.id,
    metadata: { title, organizationId: result!.organization.id },
  });

  revalidatePath("/empresas/vagas");
  redirect("/empresas/vagas");
}

/** Pausa, reabre ou encerra uma vaga já publicada. */
export async function updateJobPostingStatusAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/empresas/vagas");

  const jobPostingId = String(formData.get("job_posting_id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!jobPostingId || !["OPEN", "PAUSED", "CLOSED"].includes(status)) return;

  const supabase = createClient();
  const { error } = await supabase.from("job_postings").update({ status }).eq("id", jobPostingId);
  if (error) {
    console.error("Erro ao atualizar status da vaga:", error.message);
  } else {
    await logAuditEvent(supabase, {
      actorId: user.id,
      action: "job_posting.status_changed",
      entityType: "job_posting",
      entityId: jobPostingId,
      metadata: { to: status },
    });
  }

  revalidatePath("/empresas/vagas");
}

/** RH avança um candidato no pipeline (contatado / contratado / recusado). */
export async function updateJobMatchStatusAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/empresas/vagas");

  const jobMatchId = String(formData.get("job_match_id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!jobMatchId || !["SUGGESTED", "CONTACTED", "HIRED", "REJECTED"].includes(status)) return;

  const supabase = createClient();
  const { error } = await supabase.from("job_matches").update({ status }).eq("id", jobMatchId);
  if (error) {
    console.error("Erro ao atualizar status do candidato:", error.message);
  } else {
    await logAuditEvent(supabase, {
      actorId: user.id,
      action: "job_match.status_changed",
      entityType: "job_match",
      entityId: jobMatchId,
      metadata: { to: status },
    });
  }

  revalidatePath("/empresas/vagas");
}
