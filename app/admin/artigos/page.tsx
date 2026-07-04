import Link from "next/link";
import { listArticlesForAdmin } from "@/lib/admin/queries";
import { deleteArticleAction } from "./actions";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";

const STATUS_LABEL: Record<string, string> = {
  draft: "Rascunho",
  published: "Publicado",
  archived: "Arquivado",
};

const STATUS_CLASS: Record<string, string> = {
  draft: "bg-neutral-800 text-neutral-300",
  published: "bg-emerald-500/20 text-emerald-400",
  archived: "bg-neutral-800 text-neutral-500",
};

/** /admin/artigos — lista de todos os artigos, qualquer status. */
export default async function AdminArtigosPage() {
  const artigos = await listArticlesForAdmin();

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">CMS</p>
      <h1 className="text-3xl font-bold leading-tight text-neutral-100">Artigos</h1>

      <div className="flex justify-end">
        <Link
          href="/admin/artigos/novo"
          className="w-fit rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        >
          Novo artigo
        </Link>
      </div>

      {artigos.length === 0 ? (
        <p className="text-sm text-neutral-400">Nenhum artigo ainda.</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-neutral-800 text-left text-xs uppercase tracking-wide text-neutral-500">
              <th className="py-2">Título</th>
              <th className="py-2">Status</th>
              <th className="py-2">Domínio</th>
              <th className="py-2">Atualizado</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {artigos.map((artigo) => (
              <tr key={artigo.id} className="border-b border-neutral-900">
                <td className="py-2 pr-2 text-neutral-100">{artigo.title}</td>
                <td className="py-2 pr-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_CLASS[artigo.status]}`}>
                    {STATUS_LABEL[artigo.status]}
                  </span>
                </td>
                <td className="py-2 pr-2 text-neutral-400">{artigo.category_name ?? "—"}</td>
                <td className="py-2 pr-2 text-neutral-400">
                  {new Date(artigo.updated_at).toLocaleDateString("pt-BR")}
                </td>
                <td className="py-2 text-right">
                  <div className="flex justify-end gap-3">
                    <Link href={`/admin/artigos/${artigo.id}/editar`} className="text-emerald-400 underline">
                      Editar
                    </Link>
                    <form action={deleteArticleAction}>
                      <input type="hidden" name="id" value={artigo.id} />
                      <ConfirmSubmitButton
                        confirmMessage={`Excluir "${artigo.title}"? Essa ação não pode ser desfeita.`}
                        className="text-red-400 underline"
                      >
                        Excluir
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
