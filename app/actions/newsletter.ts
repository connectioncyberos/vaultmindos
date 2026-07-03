"use server";

import { createClient } from "@/lib/supabase/server";

export type NewsletterState = {
  status: "idle" | "success" | "error";
  message?: string;
};

/**
 * Server Action da caixa de newsletter (Modulo 6). Insere em
 * `subscribers` — RLS permite insert publico ("anyone can subscribe",
 * ver schema-v1.sql), entao funciona com a anon key sem precisar de
 * sessao. Codigo de erro 23505 = unique_violation (e-mail repetido),
 * tratado como sucesso silencioso pra nao vazar "esse e-mail ja existe"
 * pra quem estiver testando e-mails de terceiros.
 */
export async function subscribeAction(
  _prevState: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!email || !email.includes("@") || !email.includes(".")) {
    return { status: "error", message: "Digite um e-mail válido." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("subscribers").insert({ email });

  if (error && error.code !== "23505") {
    return { status: "error", message: "Não foi possível concluir a inscrição agora. Tente novamente." };
  }

  // Best-effort: e-mail de confirmacao via Resend (Modulo 9). Import
  // dinamico + try/catch pra nunca quebrar a inscricao se o servico
  // nao estiver configurado (sem RESEND_API_KEY) — ver services/resend/client.ts.
  try {
    const { sendEmail } = await import("@/services/resend/client");
    await sendEmail({
      to: email,
      subject: "Inscrição confirmada — VaultMindOS",
      html: "<p>Você está inscrito na newsletter do VaultMindOS. Em breve enviaremos novidades.</p>",
    });
  } catch {
    // silencioso de proposito
  }

  return { status: "success", message: "Inscrição confirmada — obrigado!" };
}
