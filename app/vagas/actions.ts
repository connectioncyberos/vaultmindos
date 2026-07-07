"use server";

// Arquivo superado — a implementação real e usada de verdade está em
// app/academy/vagas/actions.ts (rota movida pra dentro do layout
// autenticado da Academy). Mantido aqui só porque esta sessão não
// consegue apagar arquivos; não é importado por nenhuma rota.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";

/**
 * Candidato demonstra interesse numa vaga aberta (Fase 3 — Portal de
 * Empregabilidade). Cria a linha em `job_matches` com status inicial
 * SUGGESTED (default da coluna). RLS (migration 007) só permite inserir
 * com user_id = auth.uid() — o RH da empresa é quem avança o status
 * depois (CONTACTED/HIRED/REJECTED), via /empresas/vagas.
 *
 * A constraint unique(job_posting_id, user_id) evita duplicar em clique
 * repetido — trata esse erro como "já demonstrou interesse", não falha.
 */
export async function expressInterestAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/vagas");

  const jobPostingId = String(formData.get("job_posting_id") ?? "");
  if (!jobPostingId) return;

  const supabase = createClient();
  const { error } = await supabase.from("job_matches").insert({
    job_posting_id: jobPostingId,
    user_id: user.id,
  });

  if (error && !error.message.includes("job_matches_unique_posting_user")) {
    console.error("Erro ao demonstrar interesse na vaga:", error.message);
  }

  revalidatePath("/vagas");
}
