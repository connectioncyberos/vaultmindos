"use server";

export type ContactState = {
  status: "idle" | "success" | "error";
  message?: string;
};

/**
 * Server Action do formulario de contato (Modulo 6, envio real no
 * Modulo 9). Sem tabela `contact_messages` no schema — a mensagem
 * nao fica armazenada no banco, so e encaminhada por e-mail via
 * Resend (services/resend/client.ts). Se o Resend nao estiver
 * configurado (RESEND_API_KEY vazio), retorna erro honesto em vez de
 * fingir sucesso, e a pagina mostra um link mailto como alternativa.
 */
export async function contactAction(
  _prevState: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const mensagem = String(formData.get("mensagem") ?? "").trim();

  if (!nome || !email || !email.includes("@") || !mensagem) {
    return { status: "error", message: "Preencha nome, e-mail e mensagem." };
  }

  try {
    const { sendEmail, isResendConfigured } = await import("@/services/resend/client");

    if (!isResendConfigured) {
      return {
        status: "error",
        message: "Envio automático ainda não está configurado. Use o e-mail direto abaixo.",
      };
    }

    const destino = process.env.RESEND_FROM_EMAIL || "contato@vaultmindos.com";
    await sendEmail({
      to: destino,
      subject: `Contato via site — ${nome}`,
      html: `<p><strong>De:</strong> ${nome} (${email})</p><p>${mensagem}</p>`,
    });

    return { status: "success", message: "Mensagem enviada! Retornamos em breve." };
  } catch {
    return {
      status: "error",
      message: "Não foi possível enviar agora. Use o e-mail direto abaixo.",
    };
  }
}
