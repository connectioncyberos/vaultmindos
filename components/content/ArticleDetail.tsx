import type { ArticleDetail as ArticleDetailType, ArticleSummary } from "@/lib/types/content";
import { Breadcrumb, type BreadcrumbItem } from "./Breadcrumb";
import { RelatedArticles } from "./RelatedArticles";
import { NewsletterBox } from "./NewsletterBox";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/seo/schema";

/**
 * Corpo compartilhado de toda pagina de artigo (Modulo 6) — reusado
 * por /vault/.../[slug] e pelas 4 rotas de content_type especial
 * (glossario, reviews, comparativos, roadmaps), pra nao repetir a
 * mesma estrutura de hierarquia fixa cinco vezes. Segue Contexto ->
 * Titulo -> Descricao -> Conteudo -> Conteudo Relacionado -> Acoes
 * Secundarias (Visual Language v1.0, secao 4).
 */
export function ArticleDetail({
  article,
  breadcrumb,
  related,
  canonicalPath,
}: {
  article: ArticleDetailType;
  breadcrumb: BreadcrumbItem[];
  related: ArticleSummary[];
  /** Caminho canonico (ex.: /vault/seo/seo-tecnico/meu-artigo) — usado pro JSON-LD Article/BreadcrumbList do Modulo 8. */
  canonicalPath: string;
}) {
  return (
    <article className="flex flex-col gap-6">
      {/* JSON-LD (Modulo 8) — nao afeta o visual, so metadados estruturados pra buscadores. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd(article, canonicalPath)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(breadcrumb)) }}
      />

      <Breadcrumb items={breadcrumb} />

      {/* Contexto */}
      {article.category && (
        <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">
          {article.category.name}
        </p>
      )}

      {/* Titulo Principal */}
      <h1 className="text-3xl font-bold leading-tight text-neutral-900">{article.title}</h1>

      {/* Descricao */}
      {article.excerpt && (
        <p className="text-base leading-relaxed text-neutral-600">{article.excerpt}</p>
      )}

      {/* Conteudo */}
      <div className="whitespace-pre-line text-base leading-relaxed text-neutral-800">
        {article.content}
      </div>

      <RelatedArticles articles={related} />

      {/* Acoes Secundarias */}
      <NewsletterBox />
    </article>
  );
}
