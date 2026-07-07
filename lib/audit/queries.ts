import { createClient } from "@/lib/supabase/server";

export type AuditLogEntry = {
  id: string;
  actor_id: string | null;
  actor_label: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  actorName: string | null; // resolvido via users_profile, quando actor_id existe
};

/**
 * Últimos eventos de auditoria (Prioridade 4). Mesma estratégia de duas
 * consultas + Map do resto do projeto (getPaymentsForAdmin,
 * getUserEnrollments) em vez de embed aninhado do PostgREST.
 * RLS (`audit_log_select_admin`, migration 009) já restringe a admin —
 * este helper não reforça isso de novo, quem chama (a página) que
 * garante o gate de role antes de renderizar.
 */
export async function getRecentAuditLog(limit = 100): Promise<AuditLogEntry[]> {
  const supabase = createClient();

  const { data: rows } = await supabase
    .from("audit_log")
    .select("id, actor_id, actor_label, action, entity_type, entity_id, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  const entries = (rows ?? []) as Omit<AuditLogEntry, "actorName">[];
  if (entries.length === 0) return [];

  const actorIds = [...new Set(entries.map((e) => e.actor_id).filter((id): id is string => !!id))];
  const nameByActor = new Map<string, string | null>();

  if (actorIds.length > 0) {
    const { data: profileRows } = await supabase
      .from("users_profile")
      .select("id, full_name")
      .in("id", actorIds);

    (profileRows ?? []).forEach((row) => {
      const r = row as Record<string, unknown>;
      nameByActor.set(r.id as string, (r.full_name as string | null) ?? null);
    });
  }

  return entries.map((entry) => ({
    ...entry,
    actorName: entry.actor_id ? (nameByActor.get(entry.actor_id) ?? `Usuário ${entry.actor_id.slice(0, 8)}`) : null,
  }));
}
