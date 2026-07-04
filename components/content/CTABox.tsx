import Link from "next/link";

/** Caixa de chamada-pra-acao generica (Modulo 6) — titulo, descricao, botao. */
export function CTABox({
  title,
  description,
  href,
  label,
}: {
  title: string;
  description?: string;
  href: string;
  label: string;
}) {
  return (
    <section className="mt-3 rounded-md border border-emerald-500/30 bg-neutral-900 p-4 text-neutral-100">
      <h2 className="text-base font-semibold">{title}</h2>
      {description && <p className="mt-1 text-sm text-neutral-300">{description}</p>}
      <Link
        href={href}
        className="mt-3 inline-block w-fit rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-emerald-400"
      >
        {label}
      </Link>
    </section>
  );
}
