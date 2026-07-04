import Link from "next/link";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getCurrentUser } from "@/lib/auth/session";
import { getOrganizationForUser } from "@/lib/academy/queries";
import { registerOrganizationAction } from "../actions";

/** /empresas/cadastro — form de auto-cadastro (Fase 2, pendente de aprovação do admin). */
export default async function EmpresaCadastroPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/empresas/cadastro");

  const existing = await getOrganizationForUser(user.id);
  if (existing) redirect("/empresas");

  const erro = searchParams?.error;

  return (
    <>
      <Header />
      <div className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-12">
        <Link href="/empresas" className="text-sm text-neutral-400 hover:text-emerald-400">
          ← Empresas parceiras
        </Link>
        <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">Empresas parceiras</p>
        <h1 className="text-3xl font-bold leading-tight text-neutral-100">Cadastrar empresa</h1>
        <p className="text-base leading-relaxed text-neutral-400">
          Depois de enviado, o cadastro fica pendente até nossa equipe aprovar. Você é registrado
          como responsável (RH/gestor) dessa empresa.
        </p>

        {erro && (
          <p className="rounded-md border border-red-900/50 bg-red-950/40 p-3 text-sm text-red-200">
            {erro}
          </p>
        )}

        <form action={registerOrganizationAction} className="flex flex-col gap-4 rounded-xl border border-neutral-800 bg-neutral-900/60 p-6">
          <label className="flex flex-col gap-1.5 text-xs font-medium uppercase tracking-wide text-neutral-500">
            Nome da empresa
            <input
              type="text"
              name="name"
              required
              className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm normal-case tracking-normal text-neutral-100 focus:border-emerald-500 focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-medium uppercase tracking-wide text-neutral-500">
            CNPJ (opcional)
            <input
              type="text"
              name="cnpj"
              placeholder="00.000.000/0000-00"
              className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm normal-case tracking-normal text-neutral-100 focus:border-emerald-500 focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-medium uppercase tracking-wide text-neutral-500">
            Setor de atuação (opcional)
            <input
              type="text"
              name="sector"
              placeholder="Ex.: Segurança & Automação"
              className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm normal-case tracking-normal text-neutral-100 focus:border-emerald-500 focus:outline-none"
            />
          </label>

          <button
            type="submit"
            className="mt-2 w-fit rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Enviar cadastro
          </button>
        </form>
      </div>
      <Footer />
    </>
  );
}
