import type { ArticleDetail } from "@/lib/types/content";
import type { BreadcrumbItem } from "@/components/content/Breadcrumb";
import { SITE_NAME, SITE_URL } from "./metadata";

/** JSON-LD schema.org/Article (Modulo 8). */
export function articleJsonLd(article: ArticleDetail, path: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt ?? undefined,
    image: article.seo?.og_image_url || article.cover_image_url || undefined,
    datePublished: article.published_at ?? undefined,
    dateModified: article.published_at ?? undefined,
    url: `${SITE_URL}${path}`,
    publisher: { "@type": "Organization", name: SITE_NAME },
  };
}

/** JSON-LD schema.org/BreadcrumbList (Modulo 8). */
export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      item: item.href ? `${SITE_URL}${item.href}` : undefined,
    })),
  };
}

/**
 * Helper pra FAQPage (Modulo 8) — pronto pra uso, mas nada no CMS
 * ainda produz perguntas/respostas estruturadas, entao nenhuma pagina
 * chama isto por enquanto. Fica documentado aqui pra quando o CMS
 * ganhar um campo de FAQ por artigo.
 */
export function faqJsonLd(pairs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: pairs.map((p) => ({
      "@type": "Question",
      name: p.question,
      acceptedAnswer: { "@type": "Answer", text: p.answer },
    })),
  };
}
