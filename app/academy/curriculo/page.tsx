import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { getResumeData } from "@/lib/candidate/queries";
import { PrintButton } from "@/components/academy/PrintButton";

/**
 * /academy/curriculo — construtor de currículo (Fase 2, v1 sem IA).
 * Junta perfil + autoavaliação de competências + certificados emitidos
 * no VaultMindOS num layout que já nasce pronto pra impressão (classes
 * `print:` viram preto no branco — currículo escuro impresso gastaria
 * tinta à toa e ficaria pouco profissional). Sem lib de PDF nova: o
 * candidato usa Ctrl+P / "Salvar como PDF" do próprio navegador.
 */
export default async function CurriculoPage() {
  const user = (await getCurrentUser())!;
  const resume = await getResumeData(user.id, user.email);

  const incompleto = !resume.profile?.fullName || !resume.profile?.careerObjective;

  return (
    <div className="flex flex-col gap-6 print:gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">Academy · Empregabilidade</p>
          <h1 className="text-3xl font-bold leading-tight text-neutral-100">Meu currículo</h1>
        </div>
        <PrintButton />
      </div>

      {incompleto && (
        <p className="print:hidden rounded-md border border-amber-900/50 bg-amber-950/20 p-3 text-sm text-amber-200">
          Seu perfil está incompleto — complete nome e objetivo de carreira em{" "}
          <Link href="/academy/perfil" className="underline">
            Perfil
          </Link>{" "}
          pra um currículo melhor.
        </p>
      )}

      <div className="rounded-md border border-neutral-800 bg-neutral-900 p-6 print:border-0 print:bg-white print:p-0 print:text-black">
        <h2 className="text-2xl font-bold text-neutral-100 print:text-black">
          {resume.profile?.fullName ?? "Nome não informado"}
        </h2>
        <p className="mt-1 text-sm text-neutral-400 print:text-neutral-700">
          {resume.email}
          {resume.profile?.identityDocValue ? ` · ${resume.profile.identityDocValue}` : ""}
        </p>

        {resume.profile?.careerObjective && (
          <div className="mt-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 print:text-neutral-600">
              Objetivo
            </h3>
            <p className="mt-1 text-sm text-neutral-300 print:text-black">{resume.profile.careerObjective}</p>
          </div>
        )}

        {resume.profile?.isFirstJobSeeker && (
          <p className="mt-3 text-sm italic text-neutral-400 print:text-neutral-700">
            Em busca da primeira oportunidade profissional — motivado(a) a aprender e contribuir desde o
            primeiro dia.
          </p>
        )}

        {resume.topCompetencies.length > 0 && (
          <div className="mt-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 print:text-neutral-600">
              Competências
            </h3>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {resume.topCompetencies.map((c, i) => (
                <span
                  key={i}
                  className="rounded-full bg-neutral-800 px-2.5 py-1 text-xs text-neutral-300 print:border print:border-neutral-400 print:bg-white print:text-black"
                >
                  {c.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {resume.certificates.length > 0 && (
          <div className="mt-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 print:text-neutral-600">
              Formação — VaultMindOS Academy
            </h3>
            <ul className="mt-1 flex flex-col gap-1">
              {resume.certificates.map((c, i) => (
                <li key={i} className="text-sm text-neutral-300 print:text-black">
                  {c.courseTitle}{" "}
                  <span className="text-neutral-500 print:text-neutral-600">
                    — concluído em {new Date(c.issuedAt).toLocaleDateString("pt-BR")} (cert. {c.code})
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {resume.topCompetencies.length === 0 && resume.certificates.length === 0 && (
          <p className="mt-5 text-sm text-neutral-500 print:text-neutral-600">
            Ainda sem competências autoavaliadas ou cursos concluídos — complete seu{" "}
            <Link href="/academy/perfil" className="underline">
              perfil
            </Link>{" "}
            e trilhas pra enriquecer seu currículo.
          </p>
        )}
      </div>
    </div>
  );
}
