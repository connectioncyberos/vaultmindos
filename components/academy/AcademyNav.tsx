import Link from "next/link";
import { signOutAction } from "@/app/login/actions";
import type { CurrentUser } from "@/lib/auth/session";

const LINKS = [
  { href: "/academy", label: "Dashboard" },
  { href: "/academy/certificados", label: "Certificados" },
];

/** Nav da Academy (Fase 1) — mesma em toda rota /academy/*, espelhando AdminNav.tsx. Topo fixo (sticky). */
export function AcademyNav({ user }: { user: CurrentUser }) {
  return (
    <header className="sticky top-0 z-50 border-b border-neutral-800 bg-neutral-950 py-4">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4">
        <nav className="flex flex-wrap items-center gap-4 text-sm">
          <Link href="/academy" className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="VaultMindOS" className="h-7 w-auto object-contain" />
          </Link>
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Academy</span>
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-neutral-400 hover:text-emerald-400">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 text-sm text-neutral-400">
          <span>{user.email}</span>
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-md border border-neutral-700 px-3 py-1.5 font-medium text-neutral-100 hover:border-emerald-500"
            >
              Sair
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
