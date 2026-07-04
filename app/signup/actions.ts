"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/seo/metadata";
import { translateAuthError } from "@/lib/auth/error-messages";

/**
 * Server Action de cadastro público (Fase 2 — decisão do fundador:
 * abrir signup self-service em vez de continuar só criando conta
 * manualmente no Supabase Dashboard).
 *
 * `supabase.auth.signUp` já dispara o e-mail de confirmação do
 * Supabase Auth (desde que "Confirm email" esteja ativo no projeto —
 * Authentication > Providers > Email). O trigger `handle_new_user`
 * (docs/database/auth-trigger-v1.sql) cria a linha em `users_profile`
 * automaticamente com role "subscriber", lendo `full_name` de
 * `raw_user_meta_data` — por isso passamos `options.data.full_name`
 * aqui, sem precisar tocar em mais nenhuma tabela.
 */
export async function signUpAction(formData: FormData) {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("password_confirm") ?? "");
  const next = String(formData.get("next") ?? "") || "/academy";
  const aceite = formData.get("aceite_termos");

  if (!fullName || !email || !password) {
    redirect(`/signup?error=${encodeURIComponent("Preencha nome, e-mail e senha.")}&next=${encodeURIComponent(next)}`);
  }

  if (password.length < 8) {
    redirect(`/signup?error=${encodeURIComponent("A senha precisa ter no mínimo 8 caracteres.")}&next=${encodeURIComponent(next)}`);
  }

  if (password !== passwordConfirm) {
    redirect(`/signup?error=${encodeURIComponent("As senhas não coincidem.")}&next=${encodeURIComponent(next)}`);
  }

  if (!aceite) {
    redirect(`/signup?error=${encodeURIComponent("É preciso aceitar os Termos de Uso e a Política de Privacidade.")}&next=${encodeURIComponent(next)}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${SITE_URL}/login?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    const msg = translateAuthError(error.message, error.code);
    redirect(`/signup?error=${encodeURIComponent(msg)}&next=${encodeURIComponent(next)}`);
  }

  redirect(`/signup/confirmacao?next=${encodeURIComponent(next)}`);
}
