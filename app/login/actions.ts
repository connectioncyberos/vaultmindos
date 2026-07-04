"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Server Actions do login (Modulo 5). Rodam no servidor, usando o
 * cliente Supabase que le/escreve cookies (lib/supabase/server.ts) —
 * por isso o cookie de sessao fica disponivel imediatamente para o
 * middleware e para as Server Components seguintes, sem round-trip
 * extra pelo browser.
 */
export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "") || "/admin";

  if (!email || !password) {
    redirect(`/login?error=Preencha e-mail e senha.&next=${encodeURIComponent(next)}`);
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`);
  }

  redirect(next);
}

export async function signOutAction() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
