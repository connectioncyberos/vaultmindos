import type { SupabaseClient } from "@supabase/supabase-js";

export type AuditEntityType =
  | "organization"
  | "payment"
  | "job_posting"
  | "job_match"
  | "scholarship_coupon"
  | "scholarship_grant"
  | "course";

export type AuditEvent = {
  actorId?: string | null;
  actorLabel?: string | null;
  action: string;
  entityType: AuditEntityType;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
};

/**
 * Auditoria mínima (Prioridade 4 do cronograma pós-análise Enterprise —
 * ver docs/blueprint/vaultmindos-cronograma-implementacao-v1.md).
 *
 * Aceita qualquer client Supabase (RLS-scoped normal, ou service role
 * nos caminhos server-only como o webhook do Mercado Pago) — quem chama
 * decide qual client usar, igual ao resto do projeto.
 *
 * Deliberadamente "fire and forget com log de erro": uma falha ao
 * gravar auditoria não pode derrubar a ação de negócio em si (aprovar
 * empresa, reconciliar pagamento, etc.) — só registra no console do
 * servidor pra investigação.
 */
export async function logAuditEvent(supabase: SupabaseClient, event: AuditEvent): Promise<void> {
  const { error } = await supabase.from("audit_log").insert({
    actor_id: event.actorId ?? null,
    actor_label: event.actorLabel ?? null,
    action: event.action,
    entity_type: event.entityType,
    entity_id: event.entityId ?? null,
    metadata: event.metadata ?? null,
  });

  if (error) {
    console.error(`Erro ao gravar audit_log (${event.action}):`, error.message);
  }
}
