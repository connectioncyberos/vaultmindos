import Link from "next/link";
import { getAllCategories } from "@/lib/content/queries";

/**
 * Header do Portal Publico (Modulo 6). Server Component assincrono —
 * busca os dominios (categories) direto do banco pra montar a nav.
 * Usado explicitamente em cada pagina publica (ver comentario em
 * app/page.tsx) em vez de um layout.tsx aninhado, pra nao afetar
 * /login e /admin, que tem chrome proprio.
 *
 * `sticky top-0`: gruda no topo ao rolar a pagina, em vez de rolar
 * junto com o conteudo. Wrapper interno usa `max-w-7xl` (mais largo
 * que o `Container` padrao de `max-w-3xl`) pra a nav ocupar a linha
 * toda em telas grandes, em vez de ficar encolhida num canto.
 */
export async function Header() {
  const categorias = await getAllCategories();

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-800 bg-neutral-950 py-4">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4">
        <Link href="/" className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="VaultMindOS" className="h-8 w-auto object-contain" />
        </Link>

        <nav className="flex flex-wrap items-center gap-4 text-sm text-neutral-400">
          {categorias.map((categoria) => (
            <Link key={categoria.id} href={`/vault/${categoria.slug}`} className="hover:text-emerald-400">
              {categoria.name}
            </Link>
          ))}
          <Link href="/glossario" className="hover:text-emerald-400">
            Glossário
          </Link>
          <Link href="/reviews" className="hover:text-emerald-400">
            Reviews
          </Link>
          <Link href="/comparativos" className="hover:text-emerald-400">
            Comparativos
          </Link>
          <Link href="/roadmaps" className="hover:text-emerald-400">
            Roadmaps
          </Link>
          <Link href="/sobre" className="hover:text-emerald-400">
            Sobre
          </Link>
          <Link href="/academy" className="hover:text-emerald-400">
            Academy
          </Link>
          <Link href="/empresas" className="hover:text-emerald-400">
            Empresas
          </Link>
          <Link
            href="/login"
            className="rounded-md border border-neutral-700 px-3 py-1.5 font-medium text-neutral-100 hover:border-emerald-500 hover:text-emerald-400"
          >
            Entrar
          </Link>
        </nav>
      </div>
    </header>
  );
}
