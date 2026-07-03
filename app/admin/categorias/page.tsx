import { getAllCategoriesForAdmin } from "@/lib/admin/queries";
import { createCategoryAction, deleteCategoryAction } from "./actions";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";

/** /admin/categorias — dominios de conhecimento (CRUD simples). */
export default async function AdminCategoriasPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const categorias = await getAllCategoriesForAdmin();

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">CMS</p>
      <h1 className="text-3xl font-bold leading-tight text-neutral-900">Categorias (Domínios)</h1>
      <p className="text-base leading-relaxed text-neutral-600">
        Os domínios de conhecimento do Vault (ex.: Inteligência Artificial, SEO). Clusters
        (entities) ainda não têm tela própria — gerencie via SQL por enquanto (ver{" "}
        <code>docs/database/seed-content-v1.sql</code>).
      </p>

      {searchParams?.error && (
        <p className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900">
          {searchParams.error}
        </p>
      )}

      <form action={createCategoryAction} className="flex flex-wrap items-end gap-3 rounded-md border border-neutral-200 p-4">
        <label className="flex flex-col gap-1 text-sm text-neutral-700">
          Nome
          <input
            type="text"
            name="name"
            required
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-neutral-700">
          Slug (opcional)
          <input
            type="text"
            name="slug"
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
          />
        </label>
        <label className="flex flex-1 min-w-[200px] flex-col gap-1 text-sm text-neutral-700">
          Descrição
          <input
            type="text"
            name="description"
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
          />
        </label>
        <button type="submit" className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white">
          Adicionar
        </button>
      </form>

      {categorias.length === 0 ? (
        <p className="text-sm text-neutral-600">Nenhuma categoria ainda.</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500">
              <th className="py-2">Nome</th>
              <th className="py-2">Slug</th>
              <th className="py-2">Descrição</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {categorias.map((categoria) => (
              <tr key={categoria.id} className="border-b border-neutral-100">
                <td className="py-2 pr-2 text-neutral-900">{categoria.name}</td>
                <td className="py-2 pr-2 text-neutral-600">{categoria.slug}</td>
                <td className="py-2 pr-2 text-neutral-600">{categoria.description ?? "—"}</td>
                <td className="py-2 text-right">
                  <form action={deleteCategoryAction}>
                    <input type="hidden" name="id" value={categoria.id} />
                    <ConfirmSubmitButton
                      confirmMessage={`Excluir "${categoria.name}"? Artigos ligados a ela ficam sem domínio.`}
                      className="text-red-700 underline"
                    >
                      Excluir
                    </ConfirmSubmitButton>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
