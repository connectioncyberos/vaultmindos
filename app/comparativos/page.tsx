import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { ArticleCard } from "@/components/content/ArticleCard";
import { getArticlesByContentType } from "@/lib/content/queries";

export const metadata = {
  title: "Comparativos | VaultMindOS",
  description: "Ferramenta A vs Ferramenta B — comparações diretas pra ajudar na escolha.",
};

/** /comparativos — indice de todos os comparativos publicados. */
export default async function ComparativosIndexPage() {
  const artigos = await getArticlesByContentType("comparativo");

  return (
    <>
      <Header />
      <Container wide className="flex flex-col gap-6 py-6">
        <h1 className="text-3xl font-bold leading-tight text-neutral-100">Comparativos</h1>
        <p className="text-base leading-relaxed text-neutral-400">
          Ferramenta A vs Ferramenta B — comparações diretas pra ajudar na escolha.
        </p>

        <section className="mt-3 border-t border-neutral-800 pt-6">
          {artigos.length === 0 ? (
            <p className="text-sm text-neutral-400">Nenhum comparativo publicado ainda.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
