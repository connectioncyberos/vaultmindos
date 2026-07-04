import Link from "next/link";

/**
 * Tela pós-cadastro — orienta a confirmar o e-mail antes de logar.
 * Sem essa etapa fica confuso: o Supabase já criou o usuário mas o
 * login falha até o e-mail ser confirmado (se "Confirm email" estiver
 * ativo no projeto).
 */
export default function SignupConfirmacaoPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const next = searchParams?.next || "/academy";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-12 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="VaultMindOS" className="h-10 w-auto object-contain" />

      <div className="flex w-full max-w-sm flex-col gap-3">
        <h1 className="text-2xl font-bold leading-tight text-neutral-100">Confirme seu e-mail</h1>
        <p className="text-sm leading-relaxed text-neutral-400">
          Enviamos um link de confirmação para o e-mail que você cadastrou. Clique nele para ativar
          sua conta — depois é só entrar normalmente.
        </p>
        <p className="text-xs text-neutral-600">
          Não chegou? Confira a caixa de spam, ou aguarde alguns minutos antes de tentar de novo.
        </p>
      </div>

      <Link
        href={`/login?next=${encodeURIComponent(next)}`}
        className="text-sm font-medium text-emerald-400 underline hover:text-emerald-300"
      >
        Ir para o login
      </Link>
    </div>
  );
}
