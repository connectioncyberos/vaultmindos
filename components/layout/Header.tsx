import Link from "next/link";
import { getAllCategories } from "@/lib/content/queries";
import { Container } from "./Container";

/**
 * Header do Portal Publico (Modulo 6). Server Component assincrono —
 * busca os dominios (categories) direto do banco pra montar a nav.
 * Usado explicitamente em cada pagina publica (ver comentario em
 * app/page.tsx) em vez de um layout.tsx aninhado, pra nao afetar
 * /login e /admin, que tem chrome proprio.
 */
export async function Header() {
  const categorias = await getAllCategories();

  return (
    <header className="border-b border-neutral-200 py-4">
      <Container className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/" className="text-sm font-bold uppercase tracking-wide text-neutral-900">
          VaultMindOS
        </Link>

        <nav className="flex flex-wrap items-center gap-4 text-sm text-neutral-600">
          {categorias.map((categoria) => (
            <Link key={categoria.id} href={`/vault/${categoria.slug}`} className="hover:text-neutral-900">
              {categoria.name}
            </Link>
          ))}
          <Link href="/glossario" className="hover:text-neutral-900">
            Glossário
          </Link>
          <Link href="/reviews" className="hover:text-neutral-900">
            Reviews
          </Link>
          <Link href="/comparativos" className="hover:text-neutral-900">
            Comparativos
          </Link>
          <Link href="/roadmaps" className="hover:text-neutral-900">
            Roadmaps
          </Link>
          <Link href="/sobre" className="hover:text-neutral-900">
            Sobre
          </Link>
          <Link
            href="/login"
            className="rounded-md border border-neutral-300 px-3 py-1.5 font-medium text-neutral-900 hover:border-neutral-900"
          >
            Entrar
          </Link>
        </nav>
      </Container>
    </header>
  );
}
