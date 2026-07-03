import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { ArticleCard } from "@/components/content/ArticleCard";
import { getArticlesByContentType } from "@/lib/content/queries";

export const metadata = {
  title: "Reviews | VaultMindOS",
  description: "Análises de ferramentas e produtos relevantes pra IA, SEO e automação.",
};

/** /reviews — indice de todas as reviews publicadas. */
export default async function ReviewsIndexPage() {
  const artigos = await getArticlesByContentType("review");

  return (
    <>
      <Header />
      <Container className="flex flex-col gap-6 py-6">
        <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">VaultMindOS</p>
        <h1 className="text-3xl font-bold leading-tight text-neutral-900">Reviews</h1>
        <p className="text-base leading-relaxed text-neutral-600">
          Análises de ferramentas e produtos relevantes pra IA, SEO e automação.
        </p>

        <section className="mt-3 border-t border-neutral-200 pt-6">
          {artigos.length === 0 ? (
            <p className="text-sm text-neutral-600">Nenhuma review publicada ainda.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
