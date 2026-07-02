import { redirect } from "next/navigation";
import { CMS_ROLES, getCurrentUser } from "@/lib/auth/session";
import { signOutAction } from "@/app/login/actions";

/**
 * Rota /admin (Modulo 5) — protegida por sessao + papel.
 *
 * Regras:
 * - Sem sessao -> redireciona para /login.
 * - Sessao valida mas role = "subscriber" -> mostra "acesso negado"
 *   (nao redireciona: o usuario esta autenticado corretamente, so
 *   nao tem permissao para esta area — comportamento diferente de
 *   "nao logado").
 * - role em admin/editor/author -> libera acesso.
 *
 * O CMS de verdade (CRUD de artigos etc.) e o Modulo 7. Esta pagina
 * hoje e o "cofre" que prova que a trava de acesso funciona.
 */
export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const acessoLiberado = CMS_ROLES.includes(user.role);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6">
      {/* Contexto */}
      <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">
        VaultMindOS
      </p>

      {/* Titulo Principal */}
      <h1 className="text-3xl font-bold leading-tight text-neutral-900">
        Painel Administrativo
      </h1>

      {/* Descricao */}
      <p className="text-base leading-relaxed text-neutral-600">
        Logado como {user.email} — papel: <code>{user.role}</code>
      </p>

      {!acessoLiberado && (
        <section className="mt-3 rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-900">
          <p className="font-semibold">Acesso negado</p>
          <p className="mt-1">
            Sua conta está autenticada, mas o papel <code>{user.role}</code>{" "}
            não tem permissão para acessar o CMS. Fale com um administrador
            para solicitar um papel editorial (admin, editor ou author).
          </p>
        </section>
      )}

      {acessoLiberado && (
        <section className="mt-3 rounded-md border border-green-300 bg-green-50 p-4 text-sm text-green-900">
          <p className="font-semibold">Acesso liberado</p>
          <p className="mt-1">
            O CMS completo (artigos, categorias, tags, SEO) chega no Módulo
            7. Por enquanto, esta tela confirma que a proteção por papel
            está funcionando.
          </p>
        </section>
      )}

      {/* Acoes Secundarias */}
      <form action={signOutAction} className="mt-3 border-t border-neutral-200 pt-6">
        <button
          type="submit"
          className="w-fit rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-900"
        >
          Sair
        </button>
      </form>
    </main>
  );
}
