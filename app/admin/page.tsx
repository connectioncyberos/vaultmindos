import Link from "next/link";
import { getArticleCountsByStatus } from "@/lib/admin/queries";

/**
 * /admin — dashboard do CMS (Modulo 7). O gate de sessao/papel ja
 * aconteceu em app/admin/layout.tsx; esta pagina so renderiza pra
 * quem chegou aqui com acesso liberado.
 */
export default async function AdminDashboardPage() {
  const counts = await getArticleCountsByStatus();

  return (
    <div className="flex flex-col gap-6">
      {/* Contexto */}
      <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">CMS</p>

      {/* Titulo Principal */}
      <h1 className="text-3xl font-bold leading-tight text-neutral-100">Dashboard</h1>

      {/* Descricao */}
      <p className="text-base leading-relaxed text-neutral-400">
        Visão geral do conteúdo do VaultMindOS.
      </p>

      {/* Conteudo — contadores */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-md border border-neutral-800 p-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Publicados</p>
          <p className="mt-1 text-2xl font-bold text-neutral-100">{counts.published}</p>
        </div>
        <div className="rounded-md border border-neutral-800 p-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Rascunhos</p>
          <p className="mt-1 text-2xl font-bold text-neutral-100">{counts.draft}</p>
        </div>
        <div className="rounded-md border border-neutral-800 p-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Arquivados</p>
          <p className="mt-1 text-2xl font-bold text-neutral-100">{counts.archived}</p>
        </div>
      </section>

      {/* Acoes Secundarias */}
      <section className="flex flex-wrap gap-3 border-t border-neutral-800 pt-6">
        <Link
          href="/admin/artigos/novo"
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        >
          Novo artigo
        </Link>
        <Link
          href="/admin/artigos"
          className="rounded-md border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-100"
        >
          Ver todos os artigos
        </Link>
      </section>
    </div>
  );
}
