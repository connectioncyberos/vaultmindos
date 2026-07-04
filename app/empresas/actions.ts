"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getOrganizationForUser } from "@/lib/academy/queries";

/**
 * Auto-cadastro de empresa parceira (Fase 2 — decisão do fundador:
 * auto-cadastro com aprovação manual do admin, sem cobrança nesta
 * fase). Quem preenche o form vira automaticamente RESPONSAVEL_RH da
 * organização recém-criada; ela nasce com status PENDING (default da
 * coluna, migration 003) e só aparece pros alunos/RH depois que um
 * admin aprova em /admin/academy/empresas.
 */
export async function registerOrganizationAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/empresas/cadastro");

  const existing = await getOrganizationForUser(user.id);
  if (existing) redirect("/empresas");

  const name = String(formData.get("name") ?? "").trim();
  const cnpj = String(formData.get("cnpj") ?? "").trim() || null;
  const sector = String(formData.get("sector") ?? "").trim() || null;

  if (!name) {
    redirect(`/empresas/cadastro?error=${encodeURIComponent("Nome da empresa é obrigatório.")}`);
  }

  const supabase = createClient();

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({ name, cnpj, sector, requested_by: user.id })
    .select("id")
    .single();

  if (orgError || !org) {
    const msg = orgError?.code === "23505" ? "Já existe uma empresa cadastrada com esse CNPJ." : "Não foi possível cadastrar a empresa.";
    redirect(`/empresas/cadastro?error=${encodeURIComponent(msg)}`);
  }

  const { error: memberError } = await supabase.from("organization_members").insert({
    organization_id: org!.id,
    user_id: user.id,
    role: "RESPONSAVEL_RH",
  });

  if (memberError) {
    console.error("Erro ao vincular responsável à empresa:", memberError.message);
  }

  redirect("/empresas");
}
