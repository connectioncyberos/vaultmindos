import { getCurrentUser } from "@/lib/auth/session";
import { getOpenJobPostingsForCandidate, getMyJobMatches } from "@/lib/jobs/queries";
import { expressInterestAction } from "./actions";

const MATCH_STATUS_LABEL: Record<string, string> = {
  SUGGESTED: "Interesse registrado",
  CONTACTED: "Empresa entrou em contato",
  HIRED: "Contratado",
  REJECTED: "Não seguiu desta vez",
};

/**
 * /academy/vagas — vitrine de vagas abertas (Fase 3 — Portal de
 * Empregabilidade). Match calculado contra a autoavaliação de
 * competências do candidato (/academy/perfil) — v1 sem IA, ver
 * blueprint seção 14. Layout de /academy/* já garante login.
 */
export default async function VagasPage() {
  const user = (await getCurrentUser())!;
  const [vagas, minhasCandidaturas] = await Promise.all([
    getOpenJobPostingsForCandidate(user.id),
    getMyJobMatches(user.id),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">Academy · Empregabilidade</p>
        <h1 className="text-3xl font-bold leading-tight text-neutral-100">Vagas abertas</h1>
        <p className="text-base leading-relaxed text-neutral-400">
          O percentual de match é calculado a partir da sua autoavaliação de competências em{" "}
          <span className="text-neutral-300">Perfil</span>. Quanto mais completa, mais preciso.
        </p>
      </div>

      {minhasCandidaturas.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-neutral-100">Minhas candidaturas</h2>
          <ul className="flex flex-col gap-2">
            {minhasCandidaturas.map((m) => (
              <li
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-neutral-800 bg-neutral-900 px-4 py-2.5"
              >
                <span className="text-sm text-neutral-200">
                  {m.jobTitle} <span className="text-neutral-500">— {m.organizationName}</span>
                </span>
                <span className="text-xs text-neutral-400">{MATCH_STATUS_LABEL[m.status]}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {vagas.length === 0 ? (
        <p className="text-sm text-neutral-400">Nenhuma vaga aberta no momento — volte em breve.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {vagas.map((vaga) => (
            <li key={vaga.id} className="rounded-md border border-neutral-800 bg-neutral-900 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-neutral-100">{vaga.title}</p>
                  <p className="text-xs text-neutral-500">
                    {vaga.organizationName}
                    {vaga.sectorName ? ` · ${vaga.sectorName}` : ""}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${
                    vaga.matchScore >= 70
                      ? "border-emerald-700 bg-emerald-950/30 text-emerald-300"
                      : vaga.matchScore >= 40
                        ? "border-amber-800 bg-amber-950/20 text-amber-200"
                        : "border-neutral-700 bg-neutral-950 text-neutral-400"
                  }`}
                >
                  {vaga.matchScore}% de match
                </span>
              </div>

              {vaga.requiredCompetencyNames.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {vaga.requiredCompetencyNames.map((name, i) => (
                    <span key={i} className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-400">
                      {name}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-4">
                {vaga.alreadyExpressedInterest ? (
                  <span className="text-sm text-emerald-400">✓ Interesse registrado</span>
                ) : (
                  <form action={expressInterestAction}>
                    <input type="hidden" name="job_posting_id" value={vaga.id} />
                    <button
                      type="submit"
                      className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
                    >
                      Tenho interesse
                    </button>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
