import type { MetadataRoute } from "next";
import { articleHref } from "@/lib/types/content";
import { getAllCategories, getAllPublishedArticlesForSitemap } from "@/lib/content/queries";
import { SITE_URL } from "@/lib/seo/metadata";

/**
 * Sitemap dinamico (Modulo 8) — Next.js gera /sitemap.xml a partir
 * deste arquivo automaticamente (convencao nativa do App Router,
 * nao precisa de rota manual). Inclui paginas estaticas, indices de
 * dominio e todo artigo publicado.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categorias, artigos] = await Promise.all([
    getAllCategories(),
    getAllPublishedArticlesForSitemap(),
  ]);

  const estaticas: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/sobre`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/contato`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/glossario`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${SITE_URL}/reviews`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${SITE_URL}/comparativos`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${SITE_URL}/roadmaps`, changeFrequency: "weekly", priority: 0.5 },
  ];

  const dominios: MetadataRoute.Sitemap = categorias.map((categoria) => ({
    url: `${SITE_URL}/vault/${categoria.slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const paginasDeArtigo: MetadataRoute.Sitemap = artigos.map((artigo) => ({
    url: `${SITE_URL}${articleHref(artigo)}`,
    lastModified: artigo.published_at ?? undefined,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...estaticas, ...dominios, ...paginasDeArtigo];
}
