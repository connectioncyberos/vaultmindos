import { getCurrentUser } from "@/lib/auth/session";
import { getCandidateProfile, getCompetencyRatings } from "@/lib/candidate/queries";
import { getAllCompetencies, hasCompletedNivelamento } from "@/lib/academy/queries";
import { updateCandidateProfileAction, upsertCompetencyRatingAction } from "./actions";

const DOC_TYPE_LABEL: Record<string, string> = {
  CPF: "CPF (Brasil)",
  PASSPORT: "Passaporte",
  NATIONAL_ID: "Documento nacional de identidade",
  OTHER: "Outro",
};

/**
 * /academy/perfil — Perfil de candidato (Fase 2, Portal de Empregabilidade).
 * Documento de identidade tem tipo variável (não só CPF) — decisão de
 * nível universal, ver blueprint seção 14. Autoavaliação de competências
 * alimenta o cálculo de match de vaga (Fase 3) e o construtor de currículo.
 */
export default async function PerfilCandidatoPage({
  searchParams,
}: {
  searchParams: { salvo?: string; erro?: string };
}) {
  const user = (await getCurrentUser())!;

  const [profile, ratings, competencies, nivelamentoOk] = await Promise.all([
    getCandidateProfile(user.id),
    getCompetencyRatings(user.id),
    getAllCompetencies(),
    hasCompletedNivelamento(user.id),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">Academy · Empregabilidade</p>
        <h1 className="text-3xl font-bold leading-tight text-neutral-100">Perfil de candidato</h1>
        <p className="text-base leading-relaxed text-neutral-400">
          Esses dados alimentam seu currículo, a simulação de entrevista e o match com vagas de
          empresas parceiras.
        </p>
      </div>

      {searchParams?.salvo === "1" && (
        <p className="rounded-md border border-emerald-800 bg-emerald-950/30 p-3 text-sm text-emerald-300">
          Perfil salvo com sucesso.
        </p>
      )}
      {searchParams?.erro && (
        <p className="rounded-md border border-red-900/50 bg-red-950/40 p-3 text-sm text-red-200">
          {searchParams.erro}
        </p>
      )}

      {!nivelamentoOk && (
        <p className="rounded-md border border-amber-900/50 bg-amber-950/20 p-3 text-sm text-amber-200">
          Você ainda não concluiu o Treinamento de Nivelamento — algumas trilhas de especialização
          ficam liberadas só depois disso.
        </p>
      )}

      <form action={updateCandidateProfileAction} className="flex flex-col gap-4 rounded-md border border-neutral-800 bg-neutral-900 p-5">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium uppercase tracking-wide text-neutral-500" htmlFor="full_name">
            Nome completo
          </label>
          <input
            id="full_name"
            name="full_name"
            defaultValue={profile?.fullName ?? ""}
            className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium uppercase tracking-wide text-neutral-500" htmlFor="identity_doc_type">
              Tipo de documento
            </label>
            <select
              id="identity_doc_type"
              name="identity_doc_type"
              defaultValue={profile?.identityDocType ?? ""}
              className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100"
            >
              <option value="">Selecione</option>
              {Object.entries(DOC_TYPE_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium uppercase tracking-wide text-neutral-500" htmlFor="identity_doc_value">
              Número do documento
            </label>
            <input
              id="identity_doc_value"
              name="identity_doc_value"
              defaultValue={profile?.identityDocValue ?? ""}
              className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium uppercase tracking-wide text-neutral-500" htmlFor="career_objective">
            Objetivo de carreira
          </label>
          <textarea
            id="career_objective"
            name="career_objective"
            rows={3}
            defaultValue={profile?.careerObjective ?? ""}
            placeholder="Ex.: Buscar minha primeira oportunidade na área administrativa."
            className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-neutral-300">
          <input
            type="checkbox"
            name="is_first_job_seeker"
            defaultChecked={profile?.isFirstJobSeeker ?? false}
            className="h-4 w-4 rounded border-neutral-700 bg-neutral-950"
          />
          Estou buscando minha primeira oportunidade de trabalho
        </label>

        <button
          type="submit"
          className="w-fit rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        >
          Salvar perfil
        </button>
      </form>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-neutral-100">Autoavaliação de competências</h2>
        <p className="text-sm text-neutral-400">
          De 1 (iniciante) a 5 (domino bem). Sem certo ou errado — isso ajuda a calcular seu match com
          vagas depois.
        </p>
        {competencies.length === 0 ? (
          <p className="text-sm text-neutral-500">Nenhuma competência cadastrada no catálogo ainda.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {competencies.map((competency) => {
              const current = ratings.get(competency.id) ?? 0;
              return (
                <li
                  key={competency.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-neutral-800 bg-neutral-900 px-4 py-3"
                >
                  <span className="text-sm text-neutral-200">{competency.name}</span>
                  <form action={upsertCompetencyRatingAction} className="flex items-center gap-1">
                    <input type="hidden" name="competency_id" value={competency.id} />
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="submit"
                        name="rating"
                        value={value}
                        className={`h-7 w-7 rounded-full border text-xs font-medium ${
                          value <= current
                            ? "border-emerald-500 bg-emerald-600 text-white"
                            : "border-neutral-700 text-neutral-500 hover:border-emerald-500"
                        }`}
                      >
                        {value}
                      </button>
                    ))}
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
