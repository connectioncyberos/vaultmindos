import Link from "next/link";
import { signOutAction } from "@/app/login/actions";
import type { CurrentUser } from "@/lib/auth/session";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/artigos", label: "Artigos" },
  { href: "/admin/categorias", label: "Categorias" },
  { href: "/admin/tags", label: "Tags" },
  { href: "/admin/seo", label: "SEO" },
];

/** Nav do CMS (Modulo 7) — mesma em toda rota /admin/*. */
export function AdminNav({ user }: { user: CurrentUser }) {
  return (
    <header className="border-b border-neutral-200 py-4">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4 px-4">
        <nav className="flex flex-wrap items-center gap-4 text-sm">
          <span className="font-bold uppercase tracking-wide text-neutral-900">VaultMindOS CMS</span>
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-neutral-600 hover:text-neutral-900">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 text-sm text-neutral-600">
          <span>
            {user.email} · <code>{user.role}</code>
          </span>
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-md border border-neutral-300 px-3 py-1.5 font-medium text-neutral-900 hover:border-neutral-900"
            >
              Sair
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
