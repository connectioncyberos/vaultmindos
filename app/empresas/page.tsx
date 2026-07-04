import Link from "next/link";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getCurrentUser } from "@/lib/auth/session";
import { getOrganizationForUser } from "@/lib/academy/queries";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Aguardando aprovação",
  APPROVED: "Aprovada",
  REJECTED: "Cadastro recusado",
};

const STATUS_CLASS: Record<string, string> = {
  PENDING: "border-amber-800 bg-amber-950/30 text-amber-300",
  APPROVED: "border-emerald-800 bg-emerald-950/30 text-emerald-300",
  REJECTED: "border-red-900/50 bg-red-950/40 text-red-200",
};

/** /empresas — dashboard da empresa parceira (Fase 2). */
export default async function EmpresasPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/empresas");

  const result = await getOrganizationForUser(user.id);

  if (!result) {
    return (
      <>
        <Header />
        <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-12">
          <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">Empresas parceiras</p>
          <h1 className="text-3xl font-bold leading-tight text-neutral-100">Matrícula patrocinada pra sua equipe</h1>
          <p className="text-base leading-relaxed text-neutral-400">
            Cadastre sua empresa como parceira do VaultMindOS Academy para patrocinar a formação de
            colaboradores. O cadastro passa por uma aprovação simples da nossa equipe antes de ficar
            ativo.
          </p>
          <Link
            href="/empresas/cadastro"
            className="w-fit rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Cadastrar minha empresa
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  const { organization, membership } = result;

  return (
    <>
      <Header />
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-12">
        <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">Empresas parceiras</p>
        <h1 className="text-3xl font-bold leading-tight text-neutral-100">{organization.name}</h1>

        <span
          className={`w-fit rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wide ${STATUS_CLASS[organization.status]}`}
        >
          {STATUS_LABEL[organization.status]}
        </span>

        <p className="text-sm text-neutral-400">
          Seu papel: <code>{membership.role}</code>
        </p>

        {organization.status === "PENDING" && (
          <p className="rounded-md border border-amber-900/50 bg-amber-950/20 p-3 text-sm text-amber-200">
            Recebemos o cadastro de <strong>{organization.name}</strong>. Nossa equipe revisa e aprova
            em até alguns dias úteis — você recebe acesso ao painel de matrícula patrocinada assim que
            for aprovado.
          </p>
        )}

        {organization.status === "REJECTED" && (
          <p className="rounded-md border border-red-900/50 bg-red-950/40 p-3 text-sm text-red-200">
            O cadastro não foi aprovado desta vez. Fale com{" "}
            <Link href="/contato" className="underline">
              nossa equipe
            </Link>{" "}
            se quiser entender o motivo ou reenviar com mais informações.
          </p>
        )}

        {organization.status === "APPROVED" && (
          <p className="rounded-md border border-neutral-800 bg-neutral-900 p-4 text-sm text-neutral-400">
            Empresa aprovada. A tela de matrícula patrocinada e progresso da equipe (convidar
            colaboradores, acompanhar formação) é a próxima etapa da Fase 2 — ainda em construção.
          </p>
        )}
      </div>
      <Footer />
    </>
  );
}
