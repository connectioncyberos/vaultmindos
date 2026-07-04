import { getCurrentUser } from "@/lib/auth/session";
import { getOrganizationsByStatus } from "@/lib/academy/queries";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { approveOrganizationAction, rejectOrganizationAction } from "./actions";

/**
 * /admin/academy/empresas — fila de aprovação de empresas parceiras
 * (Fase 2). O layout de /admin já garante CMS_ROLES (admin/editor/
 * author), mas aprovar empresa é decisão de negócio, não editorial —
 * por isso a página em si é restrita a role === "admin".
 */
export default async function AdminEmpresasPage() {
  const user = await getCurrentUser();
  const souAdmin = user?.role === "admin";

  if (!souAdmin) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold leading-tight text-neutral-100">Empresas parceiras</h1>
        <p className="rounded-md border border-red-900/50 bg-red-950/40 p-3 text-sm text-red-200">
          Só o admin pode acessar a fila de aprovação de empresas.
        </p>
      </div>
    );
  }

  const [pendentes, aprovadas, rejeitadas] = await Promise.all([
    getOrganizationsByStatus("PENDING"),
    getOrganizationsByStatus("APPROVED"),
    getOrganizationsByStatus("REJECTED"),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">CMS · Academy</p>
        <h1 className="text-3xl font-bold leading-tight text-neutral-100">Empresas parceiras</h1>
        <p className="text-base leading-relaxed text-neutral-400">
          Aprove ou rejeite empresas que se auto-cadastraram para matrícula patrocinada (Fase 2).
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-neutral-100">
          Pendentes {pendentes.length > 0 && `(${pendentes.length})`}
        </h2>
        {pendentes.length === 0 ? (
          <p className="text-sm text-neutral-400">Nenhum cadastro pendente.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {pendentes.map((org) => (
              <li
                key={org.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-neutral-800 bg-neutral-900 p-4"
              >
                <div>
                  <p className="font-semibold text-neutral-100">{org.name}</p>
                  <p className="text-xs text-neutral-500">
                    {org.cnpj ?? "sem CNPJ"} · {org.sector ?? "setor não informado"} · cadastrada em{" "}
                    {new Date(org.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <form action={approveOrganizationAction}>
                    <input type="hidden" name="id" value={org.id} />
                    <button
                      type="submit"
                      className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500"
                    >
                      Aprovar
                    </button>
                  </form>
                  <form action={rejectOrganizationAction}>
                    <input type="hidden" name="id" value={org.id} />
                    <ConfirmSubmitButton
                      confirmMessage={`Rejeitar o cadastro de "${org.name}"?`}
                      className="rounded-md border border-red-900/50 px-3 py-1.5 text-sm font-medium text-red-300 hover:bg-red-950/40"
                    >
                      Rejeitar
                    </ConfirmSubmitButton>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-neutral-100">Aprovadas ({aprovadas.length})</h2>
        {aprovadas.length === 0 ? (
          <p className="text-sm text-neutral-400">Nenhuma empresa aprovada ainda.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {aprovadas.map((org) => (
              <li key={org.id} className="rounded-md border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm text-neutral-300">
                {org.name} <span className="text-neutral-500">— {org.cnpj ?? "sem CNPJ"}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {rejeitadas.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-neutral-100">Rejeitadas ({rejeitadas.length})</h2>
          <ul className="flex flex-col gap-2">
            {rejeitadas.map((org) => (
              <li key={org.id} className="rounded-md border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm text-neutral-500">
                {org.name}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
