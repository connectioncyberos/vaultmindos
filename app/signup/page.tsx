import Link from "next/link";
import { signUpAction } from "./actions";

/**
 * Rota /signup — cadastro público (Fase 2). Mesmo padrão visual do
 * /login redesenhado: tela cheia sem nav, logo + título + descrição
 * centralizados, card com o form. Aceite de Termos/Privacidade é
 * obrigatório (LGPD — cadastro real coletando dado pessoal).
 */
export default function SignupPage({
  searchParams,
}: {
  searchParams: { error?: string; next?: string };
}) {
  const erro = searchParams?.error;
  const next = searchParams?.next || "/academy";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-12">
      <div className="flex w-full max-w-sm flex-col items-center gap-3 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="VaultMindOS" className="h-10 w-auto object-contain" />
        <h1 className="text-2xl font-bold leading-tight text-neutral-100">Criar conta</h1>
        <p className="text-sm leading-relaxed text-neutral-400">
          Cadastre-se para acessar cursos e trilhas na Academy.
        </p>
      </div>

      {erro && (
        <p className="w-full max-w-sm rounded-md border border-red-900/50 bg-red-950/40 p-3 text-center text-sm text-red-200">
          {erro}
        </p>
      )}

      <div className="w-full max-w-sm rounded-xl border border-neutral-800 bg-neutral-900/60 p-6">
        <form action={signUpAction} className="flex flex-col gap-4">
          <input type="hidden" name="next" value={next} />

          <label className="flex flex-col gap-1.5 text-xs font-medium uppercase tracking-wide text-neutral-500">
            Nome completo
            <input
              type="text"
              name="full_name"
              required
              autoComplete="name"
              className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm normal-case tracking-normal text-neutral-100 focus:border-emerald-500 focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-medium uppercase tracking-wide text-neutral-500">
            E-mail
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
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
              minLength={8}
              autoComplete="new-password"
              className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm normal-case tracking-normal text-neutral-100 focus:border-emerald-500 focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-medium uppercase tracking-wide text-neutral-500">
            Confirmar senha
            <input
              type="password"
              name="password_confirm"
              required
              minLength={8}
              autoComplete="new-password"
              className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm normal-case tracking-normal text-neutral-100 focus:border-emerald-500 focus:outline-none"
            />
          </label>

          <label className="flex items-start gap-2 text-xs leading-relaxed text-neutral-400">
            <input type="checkbox" name="aceite_termos" required className="mt-0.5" />
            <span>
              Li e aceito os{" "}
              <Link href="/termos" className="text-emerald-400 underline hover:text-emerald-300">
                Termos de Uso
              </Link>{" "}
              e a{" "}
              <Link href="/privacidade" className="text-emerald-400 underline hover:text-emerald-300">
                Política de Privacidade
              </Link>
              .
            </span>
          </label>

          <button
            type="submit"
            className="mt-2 w-full rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Criar conta
          </button>
        </form>
      </div>

      <p className="text-sm text-neutral-400">
        Já tem conta?{" "}
        <Link
          href={`/login?next=${encodeURIComponent(next)}`}
          className="text-emerald-400 underline hover:text-emerald-300"
        >
          Entrar
        </Link>
      </p>
    </div>
  );
}
