/**
 * n8n (Modulo 9) — preparado pra automacoes futuras (ex.: disparar um
 * workflow quando um artigo e publicado). Sem N8N_BASE_URL
 * configurada, `triggerWebhook` vira no-op — nada que chamar isto
 * quebra o fluxo principal se a automacao ainda nao existir.
 */

export const isN8nConfigured = Boolean(process.env.N8N_BASE_URL);

export async function triggerWebhook(event: string, payload: Record<string, unknown>): Promise<void> {
  if (!isN8nConfigured) return;

  try {
    await fetch(`${process.env.N8N_BASE_URL}/webhook/${event}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.N8N_WEBHOOK_SECRET
          ? { Authorization: `Bearer ${process.env.N8N_WEBHOOK_SECRET}` }
          : {}),
      },
      body: JSON.stringify(payload),
    });
  } catch {
    // desacoplado de proposito: falha no n8n nunca deve quebrar quem chamou
  }
}
