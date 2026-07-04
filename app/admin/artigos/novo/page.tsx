import { ArticleForm } from "@/components/admin/ArticleForm";
import { getAllCategoriesForAdmin, getAllEntitiesForAdmin, getAllTagsForAdmin } from "@/lib/admin/queries";
import { createArticleAction } from "../actions";

/** /admin/artigos/novo — criar artigo. */
export default async function NovoArtigoPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const [categories, tags, entities] = await Promise.all([
    getAllCategoriesForAdmin(),
    getAllTagsForAdmin(),
    getAllEntitiesForAdmin(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">CMS</p>
      <h1 className="text-3xl font-bold leading-tight text-neutral-100">Novo artigo</h1>

      <ArticleForm
        action={createArticleAction}
        categories={categories}
        tags={tags}
        entities={entities}
        errorMessage={searchParams?.error}
      />
    </div>
  );
}
