/**
 * Wrapper do Resend (Modulo 9) — chama a API REST direto via fetch,
 * sem instalar o SDK oficial. Motivo: nao ha como rodar `npm install`
 * neste ambiente durante a construcao do modulo, entao qualquer novo
 * pacote quebraria o build ate o fundador instalar manualmente. Fetch
 * nativo evita essa dependencia nova por completo.
 *
 * "Desacoplado" (conforme o roadmap): se RESEND_API_KEY nao estiver
 * configurada, `isResendConfigured` e false e `sendEmail` retorna
 * {skipped:true} em vez de lancar erro — nada que chama isto (newsletter,
 * contato) quebra so porque o Resend nao foi configurado ainda.
 */

export const isResendConfigured = Boolean(process.env.RESEND_API_KEY);

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ skipped: boolean; ok?: boolean }> {
  if (!isResendConfigured) {
    console.warn("[resend] RESEND_API_KEY não configurada — e-mail não enviado (esperado em dev).");
    return { skipped: true };
  }

  const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  return { skipped: false, ok: response.ok };
}
