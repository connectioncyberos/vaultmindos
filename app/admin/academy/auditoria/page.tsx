import { getCurrentUser } from "@/lib/auth/session";
import { getRecentAuditLog } from "@/lib/audit/queries";

const ACTION_LABEL: Record<string, string> = {
  "organization.approve": "Empresa aprovada",
  "organization.reject": "Empresa rejeitada",
  "payment.status_changed": "Status de pagamento alterado",
  "job_posting.create": "Vaga publicada",
  "job_posting.status_changed": "Status de vaga alterado",
  "job_match.status_changed": "Status de candidatura alterado",
};

const ENTITY_LABEL: Record<string, string> = {
  organization: "Empresa",
  payment: "Pagamento",
  job_posting: "Vaga",
  job_match: "Candidatura",
};

/**
 * /admin/academy/auditoria — trilha de eventos críticos de negócio
 * (Prioridade 4 do cronograma pós-análise Enterprise). Não é log de
 * aplicação/infra (isso é Vercel/observabilidade, fora de escopo) — é
 * rastreabilidade de quem fez o quê: aprovação/rejeição de empresa,
 * mudança de status de pagamento, publicação de vaga, avanço de
 * candidato no pipeline. Mesma regra de acesso do painel financeiro:
 * role === "admin" checado aqui dentro, não só no layout de /admin.
 */
export default async function AdminAuditoriaPage() {
  const user = await getCurrentUser();
  const souAdmin = user?.role === "admin";

  if (!souAdmin) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold leading-tight text-neutral-100">Auditoria</h1>
        <p className="rounded-md border border-red-900/50 bg-red-950/40 p-3 text-sm text-red-200">
          Só o admin pode acessar o log de auditoria.
        </p>
      </div>
    );
  }

  const eventos = await getRecentAuditLog(200);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">CMS · Academy</p>
        <h1 className="text-3xl font-bold leading-tight text-neutral-100">Auditoria</h1>
        <p className="text-base leading-relaxed text-neutral-400">
          Últimos 200 eventos críticos de negócio: aprovação de empresa, mudança de status de
          pagamento, publicação de vaga e avanço de candidato no pipeline.
        </p>
      </div>

      {eventos.length === 0 ? (
        <p className="text-sm text-neutral-400">Nenhum evento registrado ainda.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-neutral-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-900 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">Evento</th>
                <th className="px-4 py-3">Entidade</th>
                <th className="px-4 py-3">Autor</th>
                <th className="px-4 py-3">Detalhes</th>
                <th className="px-4 py-3">Quando</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {eventos.map((evento) => (
                <tr key={evento.id} className="align-top text-neutral-300">
                  <td className="px-4 py-3 font-medium text-neutral-100">
                    {ACTION_LABEL[evento.action] ?? evento.action}
                  </td>
                  <td className="px-4 py-3 text-neutral-400">
                    {ENTITY_LABEL[evento.entity_type] ?? evento.entity_type}
                    {evento.entity_id ? (
                      <span className="ml-1 text-xs text-neutral-600">{evento.entity_id.slice(0, 8)}</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">{evento.actorName ?? evento.actor_label ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-neutral-500">
                    {evento.metadata ? JSON.stringify(evento.metadata) : "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {new Date(evento.created_at).toLocaleString("pt-BR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
