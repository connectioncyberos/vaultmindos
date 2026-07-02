import { signInAction } from "./actions";

/**
 * Rota /login (Modulo 5). Form nativo (<form action={serverAction}>),
 * sem JS de cliente — segue a hierarquia fixa do Visual Language v1.0:
 * Contexto -> Titulo -> Descricao -> Acao Principal (o form em si).
 *
 * Criacao de usuario: nao ha /signup publico neste MVP. O primeiro
 * usuario (admin) e criado pelo fundador direto no Supabase Dashboard
 * (Authentication -> Users -> Add user) — ver checklist de validacao
 * do Modulo 5.
 *
 * Autofill em dev: gated por NODE_ENV !== "production" (o mesmo padrao
 * aplicado no login do igrejas-web-system-os). Diferenca proposital:
 * aqui os valores vem de NEXT_PUBLIC_DEV_LOGIN_EMAIL/PASSWORD no
 * .env.local (gitignored) em vez de credenciais hardcoded no arquivo —
 * assim nenhuma senha real chega a existir em texto no codigo-fonte
 * versionado, mesmo dentro de um branch morto de producao.
 */
const IS_DEV_LOGIN_ENABLED = process.env.NODE_ENV !== "production";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const erro = searchParams?.error;
  const devEmail = IS_DEV_LOGIN_ENABLED
    ? process.env.NEXT_PUBLIC_DEV_LOGIN_EMAIL ?? ""
    : "";
  const devPassword = IS_DEV_LOGIN_ENABLED
    ? process.env.NEXT_PUBLIC_DEV_LOGIN_PASSWORD ?? ""
    : "";

  return (
    <main className="mx-auto flex max-w-sm flex-col gap-6 px-4 py-6">
      {/* Contexto */}
      <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">
        VaultMindOS
      </p>

      {/* Titulo Principal */}
      <h1 className="text-3xl font-bold leading-tight text-neutral-900">
        Entrar
      </h1>

      {/* Descricao */}
      <p className="text-base leading-relaxed text-neutral-600">
        Acesso restrito à equipe editorial (admin, editor, author).
      </p>

      {erro && (
        <p className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900">
          {erro}
        </p>
      )}

      {/* Acao Principal */}
      <form action={signInAction} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm text-neutral-700">
          E-mail
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            defaultValue={devEmail}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-neutral-700">
          Senha
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            defaultValue={devPassword}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none"
          />
        </label>

        <button
          type="submit"
          className="mt-2 w-fit rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
        >
          Entrar
        </button>
      </form>
    </main>
  );
}
