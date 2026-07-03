import { createClient } from "@/lib/supabase/server";
import type { ArticleStatus, Category, ContentType, Entity, Tag } from "@/lib/types/content";

/**
 * Camada de acesso a dados do CMS (Modulo 7). Diferente de
 * lib/content/queries.ts (portal publico, so status='published'),
 * aqui as consultas trazem TODO artigo, de qualquer status — depende
 * da policy "cms manage articles" (docs/database/cms-write-policies-v1.sql)
 * pra RLS liberar a leitura pra quem tem role admin/editor/author.
 */

export type AdminArticleRow = {
  id: string;
  slug: string;
  title: string;
  status: ArticleStatus;
  content_type: ContentType;
  category_id: string | null;
  category_name: string | null;
  updated_at: string;
};

export async function listArticlesForAdmin(): Promise<AdminArticleRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("articles")
    .select("id, slug, title, status, content_type, category_id, updated_at")
    .order("updated_at", { ascending: false });

  const rows = data ?? [];
  const categoryIds = Array.from(
    new Set(rows.map((r) => r.category_id as string | null).filter(Boolean)),
  ) as string[];

  const categoryNameById = new Map<string, string>();
  if (categoryIds.length > 0) {
    const { data: cats } = await supabase
      .from("categories")
      .select("id, name")
      .in("id", categoryIds);
    (cats ?? []).forEach((c) => categoryNameById.set(c.id as string, c.name as string));
  }

  return rows.map((r) => ({
    id: r.id as string,
    slug: r.slug as string,
    title: r.title as string,
    status: r.status as ArticleStatus,
    content_type: r.content_type as ContentType,
    category_id: (r.category_id as string | null) ?? null,
    category_name: r.category_id ? categoryNameById.get(r.category_id as string) ?? null : null,
    updated_at: r.updated_at as string,
  }));
}

export type AdminArticleFull = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  status: ArticleStatus;
  content_type: ContentType;
  category_id: string | null;
  cover_image_url: string | null;
  tagIds: string[];
  entityIds: string[];
  seo_title: string | null;
  seo_description: string | null;
};

export async function getArticleForEdit(id: string): Promise<AdminArticleFull | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("articles")
    .select(
      "id, slug, title, excerpt, content, status, content_type, category_id, cover_image_url",
    )
    .eq("id", id)
    .maybeSingle();

  if (!data) return null;

  const [tagsRes, entitiesRes, seoRes] = await Promise.all([
    supabase.from("article_tags").select("tag_id").eq("article_id", id),
    supabase.from("article_entities").select("entity_id").eq("article_id", id),
    supabase
      .from("seo_metadata")
      .select("seo_title, seo_description")
      .eq("article_id", id)
      .maybeSingle(),
  ]);

  return {
    id: data.id as string,
    slug: data.slug as string,
    title: data.title as string,
    excerpt: (data.excerpt as string | null) ?? null,
    content: (data.content as string | null) ?? null,
    status: data.status as ArticleStatus,
    content_type: data.content_type as ContentType,
    category_id: (data.category_id as string | null) ?? null,
    cover_image_url: (data.cover_image_url as string | null) ?? null,
    tagIds: (tagsRes.data ?? []).map((r) => r.tag_id as string),
    entityIds: (entitiesRes.data ?? []).map((r) => r.entity_id as string),
    seo_title: seoRes.data?.seo_title ?? null,
    seo_description: seoRes.data?.seo_description ?? null,
  };
}

export async function getAllCategoriesForAdmin(): Promise<Category[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("id, slug, name, description")
    .order("name", { ascending: true });
  return (data ?? []) as Category[];
}

export async function getAllTagsForAdmin(): Promise<Tag[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("tags").select("id, slug, name").order("name", { ascending: true });
  return (data ?? []) as Tag[];
}

export async function getAllEntitiesForAdmin(): Promise<Entity[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("entities")
    .select("id, slug, name, type, description")
    .order("name", { ascending: true });
  return (data ?? []) as Entity[];
}

export async function getArticleCountsByStatus(): Promise<Record<ArticleStatus, number>> {
  const supabase = await createClient();
  const { data } = await supabase.from("articles").select("status");
  const counts: Record<ArticleStatus, number> = { draft: 0, published: 0, archived: 0 };
  (data ?? []).forEach((r) => {
    const status = r.status as ArticleStatus;
    counts[status] = (counts[status] ?? 0) + 1;
  });
  return counts;
}

export async function getSeoOverview(): Promise<
  { id: string; slug: string; title: string; status: ArticleStatus; seo_title: string | null; seo_description: string | null }[]
> {
  const supabase = await createClient();
  const { data: articles } = await supabase
    .from("articles")
    .select("id, slug, title, status")
    .order("updated_at", { ascending: false });

  const rows = articles ?? [];
  const ids = rows.map((r) => r.id as string);
  const seoByArticle = new Map<string, { seo_title: string | null; seo_description: string | null }>();

  if (ids.length > 0) {
    const { data: seoRows } = await supabase
      .from("seo_metadata")
      .select("article_id, seo_title, seo_description")
      .in("article_id", ids);
    (seoRows ?? []).forEach((r) =>
      seoByArticle.set(r.article_id as string, {
        seo_title: r.seo_title as string | null,
        seo_description: r.seo_description as string | null,
      }),
    );
  }

  return rows.map((r) => ({
    id: r.id as string,
    slug: r.slug as string,
    title: r.title as string,
    status: r.status as ArticleStatus,
    seo_title: seoByArticle.get(r.id as string)?.seo_title ?? null,
    seo_description: seoByArticle.get(r.id as string)?.seo_description ?? null,
  }));
}
