import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getCurrentUser } from "@/lib/auth/session";
import { getOrganizationForUser, getActiveSectors, getAllCompetencies } from "@/lib/academy/queries";
import { getJobPostingsForOrg, getJobMatchesForPosting } from "@/lib/jobs/queries";
import { createJobPostingAction, updateJobPostingStatusAction, updateJobMatchStatusAction } from "./actions";

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Aberta",
  PAUSED: "Pausada",
  CLOSED: "Encerrada",
};

const MATCH_STATUS_LABEL: Record<string, string> = {
  SUGGESTED: "Interessado",
  CONTACTED: "Contatado",
  HIRED: "Contratado",
  REJECTED: "Recusado",
};

/**
 * /empresas/vagas — publicação de vagas e pipeline de candidatos (Fase
 * 3, empresa parceira aprovada). Reaproveita o schema job_postings /
 * job_posting_competencies / job_matches, existente desde a migration
 * 001 mas nunca implementado até agora.
 */
export default async function EmpresaVagasPage({
  searchParams,
}: {
  searchParams: { erro?: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/empresas/vagas");

  const result = await getOrganizationForUser(user.id);

  if (!result || result.organization.status !== "APPROVED") {
    return (
      <>
        <Header />
        <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-12">
          <h1 className="text-3xl font-bold leading-tight text-neutral-100">Vagas</h1>
          <p className="rounded-md border border-amber-900/50 bg-amber-950/20 p-3 text-sm text-amber-200">
            Sua empresa precisa estar aprovada como parceira antes de publicar vagas. Confira o status em{" "}
            <a href="/empresas" className="underline">
              /empresas
            </a>
            .
          </p>
        </div>
        <Footer />
      </>
    );
  }

  const podeGerenciar = ["RESPONSAVEL_RH", "GESTOR_AREA"].includes(result.membership.role);

  const [vagas, sectors, competencies] = await Promise.all([
    getJobPostingsForOrg(result.organization.id),
    getActiveSectors(),
    getAllCompetencies(),
  ]);

  const matchesByPosting = await Promise.all(vagas.map((v) => getJobMatchesForPosting(v.id)));

  return (
    <>
      <Header />
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-12">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">
            {result.organization.name}
          </p>
          <h1 className="text-3xl font-bold leading-tight text-neutral-100">Vagas</h1>
        </div>

        {searchParams?.erro && (
          <p className="rounded-md border border-red-900/50 bg-red-950/40 p-3 text-sm text-red-200">
            {searchParams.erro}
          </p>
        )}

        {podeGerenciar && (
          <form
            action={createJobPostingAction}
            className="flex flex-col gap-4 rounded-md border border-neutral-800 bg-neutral-900 p-5"
          >
            <h2 className="text-lg font-semibold text-neutral-100">Publicar nova vaga</h2>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium uppercase tracking-wide text-neutral-500" htmlFor="title">
                Título
              </label>
              <input
                id="title"
                name="title"
                required
                className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium uppercase tracking-wide text-neutral-500" htmlFor="sector_id">
                Setor (opcional)
              </label>
              <select
                id="sector_id"
                name="sector_id"
                className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100"
              >
                <option value="">Sem setor específico</option>
                {sectors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            {competencies.length > 0 && (
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Competências exigidas
                </span>
                <div className="flex flex-wrap gap-2">
                  {competencies.map((c) => (
                    <label
                      key={c.id}
                      className="flex items-center gap-1.5 rounded-full border border-neutral-700 px-3 py-1 text-xs text-neutral-300"
                    >
                      <input type="checkbox" name="competency_ids" value={c.id} className="h-3 w-3" />
                      {c.name}
                    </label>
                  ))}
                </div>
              </div>
            )}
            <button
              type="submit"
              className="w-fit rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
            >
              Publicar vaga
            </button>
          </form>
        )}

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-neutral-100">Vagas publicadas ({vagas.length})</h2>
          {vagas.length === 0 ? (
            <p className="text-sm text-neutral-400">Nenhuma vaga publicada ainda.</p>
          ) : (
            vagas.map((vaga, i) => (
              <div key={vaga.id} className="rounded-md border border-neutral-800 bg-neutral-900 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-semibold text-neutral-100">{vaga.title}</p>
                  <span className="rounded-full border border-neutral-700 px-2 py-0.5 text-xs text-neutral-400">
                    {STATUS_LABEL[vaga.status]}
                  </span>
                </div>

                {podeGerenciar && (
                  <div className="mt-2 flex gap-2">
                    {vaga.status !== "OPEN" && (
                      <form action={updateJobPostingStatusAction}>
                        <input type="hidden" name="job_posting_id" value={vaga.id} />
                        <input type="hidden" name="status" value="OPEN" />
                        <button className="text-xs text-emerald-400 hover:underline">Reabrir</button>
                      </form>
                    )}
                    {vaga.status !== "PAUSED" && (
                      <form action={updateJobPostingStatusAction}>
                        <input type="hidden" name="job_posting_id" value={vaga.id} />
                        <input type="hidden" name="status" value="PAUSED" />
                        <button className="text-xs text-amber-300 hover:underline">Pausar</button>
                      </form>
                    )}
                    {vaga.status !== "CLOSED" && (
                      <form action={updateJobPostingStatusAction}>
                        <input type="hidden" name="job_posting_id" value={vaga.id} />
                        <input type="hidden" name="status" value="CLOSED" />
                        <button className="text-xs text-red-300 hover:underline">Encerrar</button>
                      </form>
                    )}
                  </div>
                )}

                <div className="mt-3 flex flex-col gap-1.5">
                  <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                    Candidatos ({matchesByPosting[i].length})
                  </p>
                  {matchesByPosting[i].length === 0 ? (
                    <p className="text-sm text-neutral-500">Ninguém demonstrou interesse ainda.</p>
                  ) : (
                    matchesByPosting[i].map((match) => (
                      <div
                        key={match.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-neutral-950 px-3 py-2"
                      >
                        <span className="text-sm text-neutral-200">{match.candidateName}</span>
                        {podeGerenciar ? (
                          <form action={updateJobMatchStatusAction} className="flex items-center gap-2">
                            <input type="hidden" name="job_match_id" value={match.id} />
                            <select
                              name="status"
                              defaultValue={match.status}
                              className="rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs text-neutral-200"
                            >
                              {Object.entries(MATCH_STATUS_LABEL).map(([value, label]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              ))}
                            </select>
                            <button type="submit" className="text-xs text-emerald-400 hover:underline">
                              Salvar
                            </button>
                          </form>
                        ) : (
                          <span className="text-xs text-neutral-400">{MATCH_STATUS_LABEL[match.status]}</span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))
          )}
        </section>
      </div>
      <Footer />
    </>
  );
}
