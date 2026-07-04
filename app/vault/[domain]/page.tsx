import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Breadcrumb } from "@/components/content/Breadcrumb";
import { CategoryCard } from "@/components/content/CategoryCard";
import { ArticleCard } from "@/components/content/ArticleCard";
import {
  getArticlesByCategory,
  getCategoryBySlug,
  getClustersForCategory,
} from "@/lib/content/queries";

export async function generateMetadata({
  params,
}: {
  params: { domain: string };
}): Promise<Metadata> {
  const categoria = await getCategoryBySlug(params.domain);
  if (!categoria) return {};
  return {
    title: `${categoria.name} | VaultMindOS`,
    description: categoria.description || undefined,
    alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/vault/${params.domain}` },
  };
}

/** /vault/[domain] — pagina do dominio: clusters + artigos recentes. */
export default async function DomainPage({
  params,
}: {
  params: { domain: string };
}) {
  const categoria = await getCategoryBySlug(params.domain);
  if (!categoria) notFound();

  const [clusters, artigos] = await Promise.all([
    getClustersForCategory(categoria.id),
    getArticlesByCategory(categoria.id),
  ]);

  return (
    <>
      <Header />
      <Container wide className="flex flex-col gap-6 py-6">
        <Breadcrumb items={[{ label: "Início", href: "/" }, { label: categoria.name }]} />

        {/* Contexto */}
        <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">Domínio</p>

        {/* Titulo Principal */}
        <h1 className="text-3xl font-bold leading-tight text-neutral-100">{categoria.name}</h1>

        {/* Descricao */}
        {categoria.description && (
          <p className="text-base leading-relaxed text-neutral-400">{categoria.description}</p>
        )}

        {/* Conteudo — clusters */}
        <section className="mt-3 border-t border-neutral-800 pt-6">
          <h2 className="text-lg font-semibold text-neutral-100">Clusters</h2>
          {clusters.length === 0 ? (
            <p className="mt-2 text-sm text-neutral-400">Nenhum cluster com artigos ainda neste domínio.</p>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {clusters.map((cluster) => (
                <CategoryCard
                  key={cluster.id}
                  href={`/vault/${categoria.slug}/${cluster.slug}`}
                  name={cluster.name}
                  description={cluster.description}
                />
              ))}
            </div>
          )}
        </section>

        {/* Conteudo Relacionado — artigos do dominio */}
        <section className="mt-3 border-t border-neutral-800 pt-6">
          <h2 className="text-lg font-semibold text-neutral-100">Artigos</h2>
          {artigos.length === 0 ? (
            <p className="mt-2 text-sm text-neutral-400">Nenhum artigo publicado ainda neste domínio.</p>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {artigos.map((artigo) => (
                <ArticleCard key={artigo.id} article={artigo} />
              ))}
            </div>
          )}
        </section>
      </Container>
      <Footer />
    </>
  );
}
