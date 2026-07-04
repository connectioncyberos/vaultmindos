import { signInAction } from "./actions";

/**
 * Rota /login (Modulo 5). Form nativo (<form action={serverAction}>).
 *
 * Layout (revisao pos-feedback): tela cheia, sem topo/nav — so o logo,
 * titulo, descricao e o card do formulario, tudo centralizado vertical
 * e horizontalmente. Referencia: tela "Acesso Unico" do ecossistema
 * ConnectionCyberOS (logo + titulo empilhados, card com bordas suaves e
 * labels em maiusculas, selo de confianca abaixo do card, rodape
 * minimo "Powered by"). Mantive a marca/copy do VaultMindOS (nao a
 * copy literal de SSO multi-produto do exemplo) porque o login unico
 * entre VaultMindOS/AutoZap/CyberTreina ainda nao foi construido —
 * so pegamos o padrao visual daqui.
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
  searchParams: { error?: string; next?: string };
}) {
  const erro = searchParams?.error;
  const next = searchParams?.next || "/admin";
  const devEmail = IS_DEV_LOGIN_ENABLED
    ? process.env.NEXT_PUBLIC_DEV_LOGIN_EMAIL ?? ""
    : "";
  const devPassword = IS_DEV_LOGIN_ENABLED
    ? process.env.NEXT_PUBLIC_DEV_LOGIN_PASSWORD ?? ""
    : "";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-12">
      {/* Marca + Titulo + Descricao — empilhados e centralizados */}
      <div className="flex w-full max-w-sm flex-col items-center gap-3 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="VaultMindOS" className="h-10 w-auto object-contain" />
        <h1 className="text-2xl font-bold leading-tight text-neutral-100">Entrar</h1>
        <p className="text-sm leading-relaxed text-neutral-400">
          {next.startsWith("/academy")
            ? "Entre para acessar seus cursos e trilhas na Academy."
            : "Acesso restrito à equipe editorial (admin, editor, author)."}
        </p>
      </div>

      {erro && (
        <p className="w-full max-w-sm rounded-md border border-red-900/50 bg-red-950/40 p-3 text-center text-sm text-red-200">
          {erro}
        </p>
      )}

      {/* Card do formulario */}
      <div className="w-full max-w-sm rounded-xl border border-neutral-800 bg-neutral-900/60 p-6">
        <form action={signInAction} className="flex flex-col gap-4">
          <input type="hidden" name="next" value={next} />
          <label className="flex flex-col gap-1.5 text-xs font-medium uppercase tracking-wide text-neutral-500">
            E-mail
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              defaultValue={devEmail}
              placeholder="seunome@exemplo.com"
              className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm normal-case tracking-normal text-neutral-100 focus:border-emerald-500 focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-medium uppercase tracking-wide text-neutral-500">
            Senha
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              defaultValue={devPassword}
              className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm normal-case tracking-normal text-neutral-100 focus:border-emerald-500 focus:outline-none"
            />
          </label>

          <button
            type="submit"
            className="mt-2 w-full rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Entrar
          </button>
        </form>
      </div>

      {/* Selo de confianca */}
      <p className="flex items-center gap-1.5 text-xs text-neutral-600">
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-emerald-500">
          <path
            fillRule="evenodd"
            d="M10 1.5c-.3 0-.6.07-.86.2L3.5 4.24a1.9 1.9 0 0 0-1.06 1.7v4.3c0 4.2 2.9 7.7 6.86 9.06.45.16.95.16 1.4 0 3.96-1.36 6.86-4.86 6.86-9.06v-4.3c0-.72-.41-1.38-1.06-1.7L10.86 1.7A1.9 1.9 0 0 0 10 1.5Z"
            clipRule="evenodd"
          />
        </svg>
        Conexão segura via Supabase Auth
      </p>

      {/* Rodape minimo — sem nav, so credito */}
      <p className="mt-4 text-xs text-neutral-600">
        © {new Date().getFullYear()} VaultMindOS — ConnectionCyberOS Ecosystem
      </p>
    </div>
  );
}
