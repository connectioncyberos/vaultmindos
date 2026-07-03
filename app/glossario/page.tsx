import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { ArticleCard } from "@/components/content/ArticleCard";
import { getArticlesByContentType } from "@/lib/content/queries";

export const metadata = {
  title: "Glossário | VaultMindOS",
  description: "Termos e definições usados nos artigos do VaultMindOS.",
};

/** /glossario — indice de todos os verbetes publicados. */
export default async function GlossarioIndexPage() {
  const artigos = await getArticlesByContentType("glossario");

  return (
    <>
      <Header />
      <Container className="flex flex-col gap-6 py-6">
        <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">VaultMindOS</p>
        <h1 className="text-3xl font-bold leading-tight text-neutral-900">Glossário</h1>
        <p className="text-base leading-relaxed text-neutral-600">
          Termos e definições usados nos artigos do VaultMindOS.
        </p>

        <section className="mt-3 border-t border-neutral-200 pt-6">
          {artigos.length === 0 ? (
            <p className="text-sm text-neutral-600">Nenhum verbete publicado ainda.</p>
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
