import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { ArticleDetail } from "@/components/content/ArticleDetail";
import { getArticleBySlug, getCategoryBySlug, getRelatedArticles } from "@/lib/content/queries";
import { buildArticleMetadata } from "@/lib/seo/metadata";

type Params = { domain: string; cluster: string; slug: string };

async function loadArticle(params: Params) {
  const article = await getArticleBySlug(params.slug, "artigo");
  if (!article) return null;
  // URL precisa bater com o dominio e o cluster reais do artigo —
  // evita a mesma pagina respondendo em varias URLs diferentes.
  if (article.category?.slug !== params.domain) return null;
  if (!article.entities.some((e) => e.slug === params.cluster)) return null;
  return article;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const article = await loadArticle(params);
  if (!article) return {};
  return buildArticleMetadata(article, `/vault/${params.domain}/${params.cluster}/${params.slug}`);
}

/** /vault/[domain]/[cluster]/[slug] — artigo do Vault. */
export default async function ArticlePage({ params }: { params: Params }) {
  const article = await loadArticle(params);
  if (!article) notFound();

  const categoria = await getCategoryBySlug(params.domain);
  const cluster = article.entities.find((e) => e.slug === params.cluster);
  const relacionados = await getRelatedArticles(article.id, article.category?.id ?? null);

  return (
    <>
      <Header />
      <Container className="py-6">
        <ArticleDetail
          article={article}
          breadcrumb={[
            { label: "Início", href: "/" },
            { label: categoria?.name ?? params.domain, href: `/vault/${params.domain}` },
            {
              label: cluster?.name ?? params.cluster,
              href: `/vault/${params.domain}/${params.cluster}`,
            },
            { label: article.title },
          ]}
          related={relacionados}
          canonicalPath={`/vault/${params.domain}/${params.cluster}/${params.slug}`}
        />
      </Container>
      <Footer />
    </>
  );
}
