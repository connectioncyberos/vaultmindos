import type { Category, ContentType, Entity, Tag, ArticleStatus } from "@/lib/types/content";
import type { AdminArticleFull } from "@/lib/admin/queries";

const CONTENT_TYPES: { value: ContentType; label: string }[] = [
  { value: "artigo", label: "Artigo (Vault)" },
  { value: "glossario", label: "Glossário" },
  { value: "review", label: "Review" },
  { value: "comparativo", label: "Comparativo" },
  { value: "roadmap", label: "Roadmap" },
];

const STATUSES: { value: ArticleStatus; label: string }[] = [
  { value: "draft", label: "Rascunho" },
  { value: "published", label: "Publicado" },
  { value: "archived", label: "Arquivado" },
];

/**
 * Form de artigo (Modulo 7), reusado por /admin/artigos/novo e
 * /admin/artigos/[id]/editar. Form nativo (<form action={action}>),
 * sem "use client" — slug e auto-gerado no servidor a partir do
 * titulo quando deixado em branco (ver lib/utils/slugify.ts).
 */
export function ArticleForm({
  action,
  categories,
  tags,
  entities,
  initial,
  errorMessage,
}: {
  action: (formData: FormData) => void;
  categories: Category[];
  tags: Tag[];
  entities: Entity[];
  initial?: AdminArticleFull;
  errorMessage?: string;
}) {
  return (
    <form action={action} className="flex flex-col gap-5">
      {initial && <input type="hidden" name="id" value={initial.id} />}

      {errorMessage && (
        <p className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900">
          {errorMessage}
        </p>
      )}

      <label className="flex flex-col gap-1 text-sm text-neutral-700">
        Título
        <input
          type="text"
          name="title"
          required
          defaultValue={initial?.title}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-neutral-700">
        Slug (opcional — gerado do título se deixar em branco)
        <input
          type="text"
          name="slug"
          defaultValue={initial?.slug}
          placeholder="gerado-automaticamente"
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none"
        />
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm text-neutral-700">
          Tipo de conteúdo
          <select
            name="content_type"
            defaultValue={initial?.content_type ?? "artigo"}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
          >
            {CONTENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm text-neutral-700">
          Status
          <select
            name="status"
            defaultValue={initial?.status ?? "draft"}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm text-neutral-700">
          Domínio (categoria)
          <select
            name="category_id"
            defaultValue={initial?.category_id ?? ""}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
          >
            <option value="">— nenhum —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm text-neutral-700">
        Resumo (excerpt)
        <textarea
          name="excerpt"
          rows={2}
          defaultValue={initial?.excerpt ?? ""}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-neutral-700">
        Conteúdo
        <textarea
          name="content"
          rows={14}
          defaultValue={initial?.content ?? ""}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-neutral-700">
        URL da imagem de capa (opcional)
        <input
          type="url"
          name="cover_image_url"
          defaultValue={initial?.cover_image_url ?? ""}
          placeholder="https://..."
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none"
        />
      </label>

      {entities.length > 0 && (
        <fieldset className="flex flex-col gap-2 text-sm text-neutral-700">
          <legend className="mb-1 font-medium">Clusters (só relevante pra &ldquo;Artigo&rdquo;)</legend>
          <div className="flex flex-wrap gap-3">
            {entities.map((e) => (
              <label key={e.id} className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  name="entity_ids"
                  value={e.id}
                  defaultChecked={initial?.entityIds.includes(e.id)}
                />
                {e.name}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {tags.length > 0 && (
        <fieldset className="flex flex-col gap-2 text-sm text-neutral-700">
          <legend className="mb-1 font-medium">Tags</legend>
          <div className="flex flex-wrap gap-3">
            {tags.map((t) => (
              <label key={t.id} className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  name="tag_ids"
                  value={t.id}
                  defaultChecked={initial?.tagIds.includes(t.id)}
                />
                {t.name}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset className="flex flex-col gap-3 rounded-md border border-neutral-200 p-4">
        <legend className="px-1 text-sm font-medium text-neutral-700">SEO</legend>
        <label className="flex flex-col gap-1 text-sm text-neutral-700">
          SEO title
          <input
            type="text"
            name="seo_title"
            defaultValue={initial?.seo_title ?? ""}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-neutral-700">
          SEO description
          <textarea
            name="seo_description"
            rows={2}
            defaultValue={initial?.seo_description ?? ""}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none"
          />
        </label>
      </fieldset>

      <button
        type="submit"
        className="w-fit rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
      >
        {initial ? "Salvar alterações" : "Criar artigo"}
      </button>
    </form>
  );
}
