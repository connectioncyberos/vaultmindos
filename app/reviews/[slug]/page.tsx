import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { ArticleDetail } from "@/components/content/ArticleDetail";
import { getArticleBySlug, getRelatedArticles } from "@/lib/content/queries";
import { buildArticleMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const article = await getArticleBySlug(params.slug, "review");
  if (!article) return {};
  return buildArticleMetadata(article, `/reviews/${params.slug}`);
}

/** /reviews/[slug] — review individual. */
export default async function ReviewArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const article = await getArticleBySlug(params.slug, "review");
  if (!article) notFound();

  const relacionados = await getRelatedArticles(article.id, article.category?.id ?? null);

  return (
    <>
      <Header />
      <Container className="py-6">
        <ArticleDetail
          article={article}
          breadcrumb={[
            { label: "Início", href: "/" },
            { label: "Reviews", href: "/reviews" },
            { label: article.title },
          ]}
          related={relacionados}
          canonicalPath={`/reviews/${params.slug}`}
        />
      </Container>
      <Footer />
    </>
  );
}
