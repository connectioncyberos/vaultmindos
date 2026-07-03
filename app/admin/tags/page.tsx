import { getAllTagsForAdmin } from "@/lib/admin/queries";
import { createTagAction, deleteTagAction } from "./actions";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";

/** /admin/tags — CRUD simples de tags. */
export default async function AdminTagsPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const tags = await getAllTagsForAdmin();

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">CMS</p>
      <h1 className="text-3xl font-bold leading-tight text-neutral-900">Tags</h1>

      {searchParams?.error && (
        <p className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900">
          {searchParams.error}
        </p>
      )}

      <form action={createTagAction} className="flex flex-wrap items-end gap-3 rounded-md border border-neutral-200 p-4">
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
        <button type="submit" className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white">
          Adicionar
        </button>
      </form>

      {tags.length === 0 ? (
        <p className="text-sm text-neutral-600">Nenhuma tag ainda.</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500">
              <th className="py-2">Nome</th>
              <th className="py-2">Slug</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {tags.map((tag) => (
              <tr key={tag.id} className="border-b border-neutral-100">
                <td className="py-2 pr-2 text-neutral-900">{tag.name}</td>
                <td className="py-2 pr-2 text-neutral-600">{tag.slug}</td>
                <td className="py-2 text-right">
                  <form action={deleteTagAction}>
                    <input type="hidden" name="id" value={tag.id} />
                    <ConfirmSubmitButton
                      confirmMessage={`Excluir a tag "${tag.name}"?`}
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
