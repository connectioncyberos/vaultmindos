import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { CMS_ROLES, getCurrentUser } from "@/lib/auth/session";
import { signOutAction } from "@/app/login/actions";
import { AdminNav } from "@/components/admin/AdminNav";

/**
 * Layout de /admin/* (Modulo 7) — centraliza o gate de sessao/papel
 * que ate o Modulo 5 vivia dentro de app/admin/page.tsx. A partir de
 * agora toda rota nova dentro de /admin (artigos, categorias, tags,
 * seo) fica protegida automaticamente so por estar aninhada aqui —
 * nao precisa repetir getCurrentUser() em cada page.tsx.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const acessoLiberado = CMS_ROLES.includes(user.role);

  if (!acessoLiberado) {
    return (
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6">
        <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">VaultMindOS</p>
        <h1 className="text-3xl font-bold leading-tight text-neutral-100">Painel Administrativo</h1>
        <p className="text-base leading-relaxed text-neutral-400">
          Logado como {user.email} — papel: <code>{user.role}</code>
        </p>

        <section className="mt-3 rounded-md border border-red-900/50 bg-red-950/40 p-4 text-sm text-red-200">
          <p className="font-semibold">Acesso negado</p>
          <p className="mt-1">
            Sua conta está autenticada, mas o papel <code>{user.role}</code> não
            tem permissão para acessar o CMS. Fale com um administrador para
            solicitar um papel editorial (admin, editor ou author).
          </p>
        </section>

        <form action={signOutAction} className="mt-3 border-t border-neutral-800 pt-6">
          <button
            type="submit"
            className="w-fit rounded-md border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-100"
          >
            Sair
          </button>
        </form>
      </main>
    );
  }

  return (
    <div>
      <AdminNav user={user} />
      <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
    </div>
  );
}
