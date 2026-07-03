import { createClient } from "@/lib/supabase/server";
import type {
  ArticleDetail,
  ArticleSummary,
  Category,
  ContentType,
  Entity,
} from "@/lib/types/content";

/**
 * Camada de acesso a dados do Portal Publico (Modulo 6).
 *
 * Escolha deliberada: consultas em varias etapas simples em vez de
 * embeds/joins aninhados do PostgREST (`select("*, categorias(...)")`).
 * Custa alguns round-trips a mais, mas mantem cada `.select()` plano e
 * facil de revisar sem precisar rodar o compilador pra confirmar os
 * tipos — trade-off aceitavel no volume de trafego de um MVP.
 */

function mapCategory(row: unknown): Category | null {
  if (!row) return null;
  const r = row as Record<string, unknown>;
  return {
    id: r.id as string,
    slug: r.slug as string,
    name: r.name as string,
    description: (r.description as string | null) ?? null,
  };
}

function mapEntity(row: unknown): Entity {
  const r = row as Record<string, unknown>;
  return {
    id: r.id as string,
    slug: r.slug as string,
    name: r.name as string,
    type: (r.type as string | null) ?? null,
    description: (r.description as string | null) ?? null,
  };
}

function mapArticleSummary(row: unknown, category: Category | null): ArticleSummary {
  const r = row as Record<string, unknown>;
  return {
    id: r.id as string,
    slug: r.slug as string,
    title: r.title as string,
    excerpt: (r.excerpt as string | null) ?? null,
    status: r.status as ArticleSummary["status"],
    content_type: r.content_type as ContentType,
    cover_image_url: (r.cover_image_url as string | null) ?? null,
    published_at: (r.published_at as string | null) ?? null,
    category,
  };
}

async function fetchCategoriesByIds(ids: string[]): Promise<Map<string, Category>> {
  const map = new Map<string, Category>();
  if (ids.length === 0) return map;
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("id, slug, name, description")
    .in("id", Array.from(new Set(ids)));
  (data ?? []).forEach((row) => {
    const cat = mapCategory(row);
    if (cat) map.set(cat.id, cat);
  });
  return map;
}

/** Preenche `entitySlug` (primeiro cluster encontrado) em cada artigo — usado so pra montar links de listagem fora do contexto de um cluster. */
async function attachPrimaryEntitySlug(articles: ArticleSummary[]): Promise<ArticleSummary[]> {
  const ids = articles.map((a) => a.id);
  if (ids.length === 0) return articles;

  const supabase = await createClient();
  const { data: linkRows } = await supabase
    .from("article_entities")
    .select("article_id, entity_id")
    .in("article_id", ids);

  const entityIdByArticle = new Map<string, string>();
  (linkRows ?? []).forEach((row) => {
    const articleId = row.article_id as string;
    if (!entityIdByArticle.has(articleId)) {
      entityIdByArticle.set(articleId, row.entity_id as string);
    }
  });

  const entityIds = Array.from(new Set(entityIdByArticle.values()));
  if (entityIds.length === 0) return articles;

  const { data: entityRows } = await supabase
    .from("entities")
    .select("id, slug")
    .in("id", entityIds);

  const slugByEntityId = new Map<string, string>();
  (entityRows ?? []).forEach((row) => slugByEntityId.set(row.id as string, row.slug as string));

  return articles.map((article) => {
    const entityId = entityIdByArticle.get(article.id);
    const entitySlug = entityId ? slugByEntityId.get(entityId) ?? null : null;
    return { ...article, entitySlug };
  });
}

/** Todo artigo publicado, de qualquer content_type — usado por app/sitemap.ts (Modulo 8). */
export async function getAllPublishedArticlesForSitemap(): Promise<ArticleSummary[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("articles")
    .select("id, slug, title, excerpt, status, content_type, cover_image_url, published_at, category_id")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  const rows = data ?? [];
  const categories = await fetchCategoriesByIds(
    rows.map((r) => r.category_id as string).filter(Boolean),
  );
  const summaries = rows.map((row) =>
    mapArticleSummary(row, categories.get(row.category_id as string) ?? null),
  );
  return attachPrimaryEntitySlug(summaries);
}

/** Todos os dominios (categories) — usados no Header e na home. */
export async function getAllCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("id, slug, name, description")
    .order("name", { ascending: true });
  return (data ?? []).map((row) => mapCategory(row)!).filter(Boolean);
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("id, slug, name, description")
    .eq("slug", slug)
    .maybeSingle();
  return mapCategory(data);
}

export async function getEntityBySlug(slug: string): Promise<Entity | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("entities")
    .select("id, slug, name, type, description")
    .eq("slug", slug)
    .maybeSingle();
  return data ? mapEntity(data) : null;
}

/** Ultimos artigos publicados de qualquer dominio — usado na home. */
export async function getRecentPublishedArticles(limit = 6): Promise<ArticleSummary[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("articles")
    .select("id, slug, title, excerpt, status, content_type, cover_image_url, published_at, category_id")
    .eq("status", "published")
    .eq("content_type", "artigo")
    .order("published_at", { ascending: false })
    .limit(limit);

  const rows = data ?? [];
  const categories = await fetchCategoriesByIds(
    rows.map((r) => r.category_id as string).filter(Boolean),
  );
  const summaries = rows.map((row) =>
    mapArticleSummary(row, categories.get(row.category_id as string) ?? null),
  );
  return attachPrimaryEntitySlug(summaries);
}

/** Clusters (entities) que tem pelo menos um artigo publicado neste dominio. */
export async function getClustersForCategory(categoryId: string): Promise<Entity[]> {
  const supabase = await createClient();

  const { data: articleRows } = await supabase
    .from("articles")
    .select("id")
    .eq("category_id", categoryId)
    .eq("status", "published");

  const articleIds = (articleRows ?? []).map((r) => r.id as string);
  if (articleIds.length === 0) return [];

  const { data: linkRows } = await supabase
    .from("article_entities")
    .select("entity_id")
    .in("article_id", articleIds);

  const entityIds = Array.from(new Set((linkRows ?? []).map((r) => r.entity_id as string)));
  if (entityIds.length === 0) return [];

  const { data: entityRows } = await supabase
    .from("entities")
    .select("id, slug, name, type, description")
    .in("id", entityIds);

  return (entityRows ?? []).map(mapEntity);
}

/** Artigos publicados de um dominio (sem filtrar por cluster). */
export async function getArticlesByCategory(
  categoryId: string,
  limit = 20,
): Promise<ArticleSummary[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("articles")
    .select("id, slug, title, excerpt, status, content_type, cover_image_url, published_at, category_id")
    .eq("category_id", categoryId)
    .eq("status", "published")
    .eq("content_type", "artigo")
    .order("published_at", { ascending: false })
    .limit(limit);

  const rows = data ?? [];
  const categories = await fetchCategoriesByIds(rows.map((r) => r.category_id as string));
  const summaries = rows.map((row) =>
    mapArticleSummary(row, categories.get(row.category_id as string) ?? null),
  );
  return attachPrimaryEntitySlug(summaries);
}

/** Artigos publicados de um dominio + cluster especificos. */
export async function getArticlesByCategoryAndEntity(
  categoryId: string,
  entityId: string,
): Promise<ArticleSummary[]> {
  const supabase = await createClient();

  const { data: linkRows } = await supabase
    .from("article_entities")
    .select("article_id")
    .eq("entity_id", entityId);

  const candidateIds = (linkRows ?? []).map((r) => r.article_id as string);
  if (candidateIds.length === 0) return [];

  const { data } = await supabase
    .from("articles")
    .select("id, slug, title, excerpt, status, content_type, cover_image_url, published_at, category_id")
    .in("id", candidateIds)
    .eq("category_id", categoryId)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  const rows = data ?? [];
  const categories = await fetchCategoriesByIds(rows.map((r) => r.category_id as string));
  return rows.map((row) =>
    mapArticleSummary(row, categories.get(row.category_id as string) ?? null),
  );
}

/** Clusters (entities) associados a um artigo especifico. */
export async function getEntitiesForArticle(articleId: string): Promise<Entity[]> {
  const supabase = await createClient();
  const { data: linkRows } = await supabase
    .from("article_entities")
    .select("entity_id")
    .eq("article_id", articleId);

  const entityIds = (linkRows ?? []).map((r) => r.entity_id as string);
  if (entityIds.length === 0) return [];

  const { data } = await supabase
    .from("entities")
    .select("id, slug, name, type, description")
    .in("id", entityIds);

  return (data ?? []).map(mapEntity);
}

/** Artigos publicados de um content_type especial — usado nas paginas indice de /glossario, /reviews, /comparativos, /roadmaps. */
export async function getArticlesByContentType(
  contentType: Exclude<ContentType, "artigo">,
  limit = 50,
): Promise<ArticleSummary[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("articles")
    .select("id, slug, title, excerpt, status, content_type, cover_image_url, published_at, category_id")
    .eq("content_type", contentType)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);

  const rows = data ?? [];
  const categories = await fetchCategoriesByIds(rows.map((r) => r.category_id as string).filter(Boolean));
  return rows.map((row) => mapArticleSummary(row, categories.get(row.category_id as string) ?? null));
}

/**
 * Artigo completo por slug — usado por /vault/.../[slug] e pelas 4
 * rotas de content_type especial (glossario/reviews/comparativos/roadmaps).
 * `expectedContentType`, quando informado, faz retornar null se o
 * artigo existir mas for de outro tipo (evita URL cruzada, ex.: abrir
 * um "review" pela rota /glossario/[slug]).
 */
export async function getArticleBySlug(
  slug: string,
  expectedContentType?: ContentType,
): Promise<ArticleDetail | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("articles")
    .select(
      "id, slug, title, excerpt, content, status, content_type, cover_image_url, published_at, category_id",
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!data) return null;
  if (expectedContentType && data.content_type !== expectedContentType) return null;

  const [category, seoRes, entities] = await Promise.all([
    data.category_id
      ? (async () => {
          const { data: catRow } = await supabase
            .from("categories")
            .select("id, slug, name, description")
            .eq("id", data.category_id as string)
            .maybeSingle();
          return mapCategory(catRow);
        })()
      : Promise.resolve(null),
    supabase
      .from("seo_metadata")
      .select("seo_title, seo_description, canonical_url, og_image_url")
      .eq("article_id", data.id as string)
      .maybeSingle(),
    getEntitiesForArticle(data.id as string),
  ]);

  return {
    ...mapArticleSummary(data, category),
    content: (data.content as string | null) ?? null,
    seo: seoRes.data
      ? {
          seo_title: seoRes.data.seo_title,
          seo_description: seoRes.data.seo_description,
          canonical_url: seoRes.data.canonical_url,
          og_image_url: seoRes.data.og_image_url,
        }
      : null,
    entities,
  };
}

/**
 * Conteudo relacionado: primeiro tenta internal_links explicitos
 * (from_article_id = articleId); se nao houver nenhum, cai pra "outros
 * artigos publicados do mesmo dominio", excluindo o proprio artigo.
 */
export async function getRelatedArticles(
  articleId: string,
  categoryId: string | null,
  limit = 3,
): Promise<ArticleSummary[]> {
  const supabase = await createClient();

  const { data: linkRows } = await supabase
    .from("internal_links")
    .select("to_article_id")
    .eq("from_article_id", articleId)
    .limit(limit);

  const linkedIds = (linkRows ?? []).map((r) => r.to_article_id as string);

  if (linkedIds.length > 0) {
    const { data } = await supabase
      .from("articles")
      .select("id, slug, title, excerpt, status, content_type, cover_image_url, published_at, category_id")
      .in("id", linkedIds)
      .eq("status", "published");
    const rows = data ?? [];
    const categories = await fetchCategoriesByIds(rows.map((r) => r.category_id as string));
    return rows.map((row) => mapArticleSummary(row, categories.get(row.category_id as string) ?? null));
  }

  if (!categoryId) return [];

  const { data } = await supabase
    .from("articles")
    .select("id, slug, title, excerpt, status, content_type, cover_image_url, published_at, category_id")
    .eq("category_id", categoryId)
    .eq("status", "published")
    .neq("id", articleId)
    .order("published_at", { ascending: false })
    .limit(limit);

  const rows = data ?? [];
  const categories = await fetchCategoriesByIds(rows.map((r) => r.category_id as string));
  return rows.map((row) => mapArticleSummary(row, categories.get(row.category_id as string) ?? null));
}
