import Link from "next/link";

/**
 * Card generico de "diretório" (Modulo 6) — reusado tanto para
 * dominios (categories, em /vault/[domain] e na home) quanto para
 * clusters (entities, em /vault/[domain]), ja que estruturalmente sao
 * a mesma coisa: nome, descricao, link. Evita duplicar um componente
 * quase identico so pra trocar o titulo.
 */
export function CategoryCard({
  href,
  name,
  description,
}: {
  href: string;
  name: string;
  description?: string | null;
}) {
  return (
    <Link
      href={href}
      className="block rounded-md border border-neutral-800 bg-neutral-900 p-4 hover:border-emerald-500/50"
    >
      <h3 className="text-base font-semibold text-neutral-100">{name}</h3>
      {description && <p className="mt-1 text-sm text-neutral-400">{description}</p>}
    </Link>
  );
}
