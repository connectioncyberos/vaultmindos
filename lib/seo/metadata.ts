import type { Metadata } from "next";
import type { ArticleDetail } from "@/lib/types/content";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
export const SITE_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "VaultMindOS";

/**
 * Metadata completa (Modulo 8) pra qualquer pagina de artigo — usada
 * pelas 5 rotas de conteudo (vault, glossario, reviews, comparativos,
 * roadmaps). Centralizada aqui pra canonical/OG/Twitter ficarem
 * consistentes em vez de reescritos em cada page.tsx.
 */
export function buildArticleMetadata(article: ArticleDetail, path: string): Metadata {
  const title = article.seo?.seo_title || `${article.title} | ${SITE_NAME}`;
  const description = article.seo?.seo_description || article.excerpt || undefined;
  const url = article.seo?.canonical_url || `${SITE_URL}${path}`;
  const image = article.seo?.og_image_url || article.cover_image_url || undefined;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: "article",
      publishedTime: article.published_at ?? undefined,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}
