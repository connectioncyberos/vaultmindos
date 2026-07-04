import Link from "next/link";
import { articleHref, CONTENT_TYPE_LABELS } from "@/lib/types/content";
import type { ArticleSummary } from "@/lib/types/content";

/**
 * Card de artigo (Modulo 6) — usado em listagens (home, dominio,
 * cluster, indices de glossario/reviews/comparativos/roadmaps).
 * `entitySlug` opcional sobrescreve o cluster do artigo quando o card
 * ja esta sendo renderizado dentro do contexto de um cluster especifico.
 */
export function ArticleCard({
  article,
  entitySlug,
}: {
  article: ArticleSummary;
  entitySlug?: string;
}) {
  const href = articleHref(article, entitySlug);

  return (
    <Link
      href={href}
      className="block rounded-md border border-neutral-800 bg-neutral-900 p-4 hover:border-emerald-500/50"
    >
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-neutral-500">
        <span>{CONTENT_TYPE_LABELS[article.content_type]}</span>
        {article.category && (
          <>
            <span>·</span>
            <span>{article.category.name}</span>
          </>
        )}
      </div>
      <h3 className="mt-2 text-lg font-semibold text-neutral-100">{article.title}</h3>
      {article.excerpt && (
        <p className="mt-1 text-sm leading-relaxed text-neutral-400">{article.excerpt}</p>
      )}
    </Link>
  );
}
