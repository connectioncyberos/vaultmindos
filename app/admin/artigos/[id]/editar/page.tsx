import { notFound } from "next/navigation";
import { ArticleForm } from "@/components/admin/ArticleForm";
import {
  getAllCategoriesForAdmin,
  getAllEntitiesForAdmin,
  getAllTagsForAdmin,
  getArticleForEdit,
} from "@/lib/admin/queries";
import { updateArticleAction } from "../../actions";

/** /admin/artigos/[id]/editar — editar artigo existente. */
export default async function EditarArtigoPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const [artigo, categories, tags, entities] = await Promise.all([
    getArticleForEdit(params.id),
    getAllCategoriesForAdmin(),
    getAllTagsForAdmin(),
    getAllEntitiesForAdmin(),
  ]);

  if (!artigo) notFound();

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">CMS</p>
      <h1 className="text-3xl font-bold leading-tight text-neutral-100">Editar artigo</h1>

      <ArticleForm
        action={updateArticleAction}
        categories={categories}
        tags={tags}
        entities={entities}
        initial={artigo}
        errorMessage={searchParams?.error}
      />
    </div>
  );
}
