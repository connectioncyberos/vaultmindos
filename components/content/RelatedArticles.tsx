import type { ArticleSummary } from "@/lib/types/content";
import { ArticleCard } from "./ArticleCard";

/** Secao "Conteudo Relacionado" da hierarquia fixa (Visual Language v1.0). */
export function RelatedArticles({ articles }: { articles: ArticleSummary[] }) {
  if (articles.length === 0) return null;

  return (
    <section className="mt-3 border-t border-neutral-800 pt-6">
      <h2 className="text-lg font-semibold text-neutral-100">Conteúdo Relacionado</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </section>
  );
}
