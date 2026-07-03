import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { CategoryCard } from "@/components/content/CategoryCard";
import { ArticleCard } from "@/components/content/ArticleCard";
import { NewsletterBox } from "@/components/content/NewsletterBox";
import { getAllCategories, getRecentPublishedArticles } from "@/lib/content/queries";
import { SITE_NAME, SITE_URL } from "@/lib/seo/metadata";

export const metadata = {
  title: `${SITE_NAME} — Sistema Operacional de Conhecimento`,
  description:
    "IA, Tecnologia, Automação, SEO e Negócios Digitais organizados em domínios e clusters.",
  alternates: { canonical: SITE_URL },
};

/**
 * Home do Portal Publico (Modulo 6) — substitui a pagina placeholder
 * dos Modulos 2-5. Segue a hierarquia fixa: Contexto -> Titulo ->
 * Descricao -> Acao Principal -> Conteudo (dominios) -> Conteudo
 * Relacionado (artigos recentes) -> Acoes Secundarias (newsletter).
 */
export default async function HomePage() {
  const [categorias, artigosRecentes] = await Promise.all([
    getAllCategories(),
    getRecentPublishedArticles(6),
  ]);

  return (
    <>
      <Header />
      <Container className="flex flex-col gap-6 py-6">
        {/* Contexto */}
        <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">
          VaultMindOS
        </p>

        {/* Titulo Principal */}
        <h1 className="text-3xl font-bold leading-tight text-neutral-900">
          Sistema Operacional de Conhecimento
        </h1>

        {/* Descricao */}
        <p className="text-base leading-relaxed text-neutral-600">
          IA, Tecnologia, Automação, SEO e Negócios Digitais organizados em
          domínios e clusters — não é só um blog, é uma base de conhecimento
          navegável.
        </p>

        {/* Acao Principal */}
        {categorias[0] && (
          <a
            href={`/vault/${categorias[0].slug}`}
            className="w-fit rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
          >
            Explorar o Vault
          </a>
        )}

        {/* Conteudo — dominios */}
        <section className="mt-3 border-t border-neutral-200 pt-6">
          <h2 className="text-lg font-semibold text-neutral-900">Domínios</h2>
          {categorias.length === 0 ? (
            <p className="mt-2 text-sm text-neutral-600">
              Nenhum domínio cadastrado ainda. Aplique{" "}
              <code>docs/database/seed-content-v1.sql</code> ou crie um em{" "}
              <code>/admin/categorias</code>.
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {categorias.map((categoria) => (
                <CategoryCard
                  key={categoria.id}
                  href={`/vault/${categoria.slug}`}
                  name={categoria.name}
                  description={categoria.description}
                />
              ))}
            </div>
          )}
        </section>

        {/* Conteudo Relacionado — artigos recentes */}
        <section className="mt-3 border-t border-neutral-200 pt-6">
          <h2 className="text-lg font-semibold text-neutral-900">Artigos recentes</h2>
          {artigosRecentes.length === 0 ? (
            <p className="mt-2 text-sm text-neutral-600">Nenhum artigo publicado ainda.</p>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {artigosRecentes.map((artigo) => (
                <ArticleCard key={artigo.id} article={artigo} />
              ))}
            </div>
          )}
        </section>

        {/* Acoes Secundarias */}
        <NewsletterBox />
      </Container>
      <Footer />
    </>
  );
}
