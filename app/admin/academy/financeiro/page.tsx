import { getCurrentUser } from "@/lib/auth/session";
import { getPaidCourses } from "@/lib/academy/queries";
import { getPaymentsForAdmin, computeTotals } from "@/lib/payments/queries";
import type { PaymentStatus } from "@/lib/payments/types";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const STATUS_LABEL: Record<PaymentStatus, string> = {
  APPROVED: "Aprovado",
  PENDING: "Pendente",
  REJECTED: "Recusado",
  CANCELLED: "Cancelado",
};

const STATUS_CLASS: Record<PaymentStatus, string> = {
  APPROVED: "border-emerald-800 bg-emerald-950/30 text-emerald-300",
  PENDING: "border-amber-900/50 bg-amber-950/20 text-amber-200",
  REJECTED: "border-red-900/50 bg-red-950/40 text-red-200",
  CANCELLED: "border-neutral-700 bg-neutral-900 text-neutral-400",
};

/**
 * /admin/academy/financeiro — painel financeiro (Fase 2). Mesma regra da
 * fila de empresas: o layout de /admin já libera CMS_ROLES (admin/editor/
 * author), mas ver receita/pagamentos é decisão de negócio — restrito a
 * role === "admin" aqui dentro, igual app/admin/academy/empresas/page.tsx.
 */
export default async function AdminFinanceiroPage({
  searchParams,
}: {
  searchParams: { curso?: string };
}) {
  const user = await getCurrentUser();
  const souAdmin = user?.role === "admin";

  if (!souAdmin) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold leading-tight text-neutral-100">Financeiro</h1>
        <p className="rounded-md border border-red-900/50 bg-red-950/40 p-3 text-sm text-red-200">
          Só o admin pode acessar o painel financeiro.
        </p>
      </div>
    );
  }

  const cursos = await getPaidCourses();
  const cursoFiltro = searchParams?.curso
    ? cursos.find((c) => c.slug === searchParams.curso)
    : undefined;

  const pagamentos = await getPaymentsForAdmin(cursoFiltro?.id);
  const totais = computeTotals(pagamentos);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">CMS · Academy</p>
        <h1 className="text-3xl font-bold leading-tight text-neutral-100">Financeiro</h1>
        <p className="text-base leading-relaxed text-neutral-400">
          Receita, vendas e status de cada pagamento (Mercado Pago Checkout Pro).
        </p>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-md border border-neutral-800 bg-neutral-900 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Receita aprovada{cursoFiltro ? ` — ${cursoFiltro.title}` : ""}
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-400">{BRL.format(totais.revenueCents / 100)}</p>
        </div>
        <div className="rounded-md border border-neutral-800 bg-neutral-900 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Vendas aprovadas</p>
          <p className="mt-1 text-2xl font-bold text-neutral-100">{totais.approvedCount}</p>
        </div>
        <div className="rounded-md border border-neutral-800 bg-neutral-900 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Ticket médio</p>
          <p className="mt-1 text-2xl font-bold text-neutral-100">{BRL.format(totais.averageTicketCents / 100)}</p>
        </div>
      </section>

      <section className="flex flex-wrap items-center gap-2">
        <a
          href="/admin/academy/financeiro"
          className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
            !cursoFiltro
              ? "border-emerald-600 bg-emerald-950/30 text-emerald-300"
              : "border-neutral-700 text-neutral-300 hover:border-emerald-500"
          }`}
        >
          Todos os cursos
        </a>
        {cursos.map((curso) => (
          <a
            key={curso.id}
            href={`/admin/academy/financeiro?curso=${curso.slug}`}
            className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
              cursoFiltro?.id === curso.id
                ? "border-emerald-600 bg-emerald-950/30 text-emerald-300"
                : "border-neutral-700 text-neutral-300 hover:border-emerald-500"
            }`}
          >
            {curso.title} · {BRL.format((curso.price_cents ?? 0) / 100)}
          </a>
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-neutral-100">
            Pagamentos {pagamentos.length > 0 && `(${pagamentos.length})`}
          </h2>
          {pagamentos.length > 0 && (
            <a
              href={`/admin/academy/financeiro/export${cursoFiltro ? `?curso=${cursoFiltro.slug}` : ""}`}
              className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm font-medium text-neutral-300 hover:border-emerald-500 hover:text-emerald-400"
            >
              Exportar CSV
            </a>
          )}
        </div>
        {pagamentos.length === 0 ? (
          <p className="text-sm text-neutral-400">Nenhum pagamento registrado ainda.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-neutral-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-900 text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Curso</th>
                  <th className="px-4 py-3">Aluno</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {pagamentos.map((pagamento) => (
                  <tr key={pagamento.id} className="text-neutral-300">
                    <td className="px-4 py-3">{pagamento.courseTitle}</td>
                    <td className="px-4 py-3">{pagamento.studentName}</td>
                    <td className="px-4 py-3">{BRL.format(pagamento.amount_cents / 100)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[pagamento.status]}`}
                      >
                        {STATUS_LABEL[pagamento.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-500">
                      {new Date(pagamento.created_at).toLocaleString("pt-BR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
