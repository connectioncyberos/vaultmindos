/**
 * Tipos do dominio de conteudo (Modulo 6). Escritos a mao em vez de
 * gerados pelo Supabase CLI — ver TODO em lib/supabase/types.ts. Toda
 * leitura do banco relacionada a portal/CMS passa por lib/content/queries.ts,
 * que mapeia as linhas cruas do Supabase para estes tipos num unico lugar.
 */

export type ArticleStatus = "draft" | "published" | "archived";

export type ContentType = "artigo" | "glossario" | "review" | "comparativo" | "roadmap";

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  artigo: "Artigo",
  glossario: "Glossário",
  review: "Review",
  comparativo: "Comparativo",
  roadmap: "Roadmap",
};

/** slug de rota (plural, como aparece na URL) por content_type especial. */
export const CONTENT_TYPE_ROUTES: Record<Exclude<ContentType, "artigo">, string> = {
  glossario: "glossario",
  review: "reviews",
  comparativo: "comparativos",
  roadmap: "roadmaps",
};

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
}

export interface Entity {
  id: string;
  slug: string;
  name: string;
  type: string | null;
  description: string | null;
}

export interface Tag {
  id: string;
  slug: string;
  name: string;
}

export interface SeoMetadata {
  seo_title: string | null;
  seo_description: string | null;
  canonical_url: string | null;
  og_image_url: string | null;
}

export interface ArticleSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  status: ArticleStatus;
  content_type: ContentType;
  cover_image_url: string | null;
  published_at: string | null;
  category: Category | null;
  /** Slug do primeiro cluster (entity) associado — usado so pra montar o href em listagens fora do contexto de um cluster especifico (home, pagina de dominio). */
  entitySlug?: string | null;
}

export interface ArticleDetail extends ArticleSummary {
  content: string | null;
  seo: SeoMetadata | null;
  entities: Entity[];
}

/** Rota canônica do artigo, de acordo com o content_type. */
export function articleHref(
  article: {
    slug: string;
    content_type: ContentType;
    category?: { slug: string } | null;
    entitySlug?: string | null;
  },
  overrideEntitySlug?: string,
): string {
  if (article.content_type === "artigo") {
    const domain = article.category?.slug ?? "geral";
    const cluster = overrideEntitySlug ?? article.entitySlug ?? "geral";
    return `/vault/${domain}/${cluster}/${article.slug}`;
  }
  const base: Record<Exclude<ContentType, "artigo">, string> = {
    glossario: "/glossario",
    review: "/reviews",
    comparativo: "/comparativos",
    roadmap: "/roadmaps",
  };
  return `${base[article.content_type]}/${article.slug}`;
}
