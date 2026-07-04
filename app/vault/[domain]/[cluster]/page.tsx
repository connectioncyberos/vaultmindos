import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Breadcrumb } from "@/components/content/Breadcrumb";
import { ArticleCard } from "@/components/content/ArticleCard";
import {
  getArticlesByCategoryAndEntity,
  getCategoryBySlug,
  getEntityBySlug,
} from "@/lib/content/queries";

export async function generateMetadata({
  params,
}: {
  params: { domain: string; cluster: string };
}): Promise<Metadata> {
  const cluster = await getEntityBySlug(params.cluster);
  if (!cluster) return {};
  return {
    title: `${cluster.name} | VaultMindOS`,
    description: cluster.description || undefined,
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/vault/${params.domain}/${params.cluster}`,
    },
  };
}

/** /vault/[domain]/[cluster] — artigos do dominio+cluster especificos. */
export default async function ClusterPage({
  params,
}: {
  params: { domain: string; cluster: string };
}) {
  const [categoria, cluster] = await Promise.all([
    getCategoryBySlug(params.domain),
    getEntityBySlug(params.cluster),
  ]);
  if (!categoria || !cluster) notFound();

  const artigos = await getArticlesByCategoryAndEntity(categoria.id, cluster.id);

  return (
    <>
      <Header />
      <Container wide className="flex flex-col gap-6 py-6">
        <Breadcrumb
          items={[
            { label: "Início", href: "/" },
            { label: categoria.name, href: `/vault/${categoria.slug}` },
            { label: cluster.name },
          ]}
        />

        {/* Contexto */}
        <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">
          {categoria.name} · Cluster
        </p>

        {/* Titulo Principal */}
        <h1 className="text-3xl font-bold leading-tight text-neutral-100">{cluster.name}</h1>

        {/* Descricao */}
        {cluster.description && (
          <p className="text-base leading-relaxed text-neutral-400">{cluster.description}</p>
        )}

        {/* Conteudo */}
        <section className="mt-3 border-t border-neutral-800 pt-6">
          <h2 className="text-lg font-semibold text-neutral-100">Artigos</h2>
          {artigos.length === 0 ? (
            <p className="mt-2 text-sm text-neutral-400">Nenhum artigo publicado ainda neste cluster.</p>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {artigos.map((artigo) => (
                <ArticleCard key={artigo.id} article={artigo} entitySlug={cluster.slug} />
              ))}
            </div>
          )}
        </section>
      </Container>
      <Footer />
    </>
  );
}
