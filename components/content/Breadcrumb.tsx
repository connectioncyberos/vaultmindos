import Link from "next/link";

export type BreadcrumbItem = { label: string; href?: string };

/**
 * Breadcrumb (Modulo 6). O ultimo item nunca e link (representa a
 * pagina atual). O JSON-LD BreadcrumbList correspondente e emitido
 * separadamente no Modulo 8 (lib/seo/schema.ts), pra manter este
 * componente livre de responsabilidade de SEO.
 */
export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="breadcrumb" className="text-lg text-neutral-500">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-1">
              {item.href && !isLast ? (
                <Link href={item.href} className="hover:text-emerald-400">
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? "text-neutral-300" : ""}>{item.label}</span>
              )}
              {!isLast && <span>/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
