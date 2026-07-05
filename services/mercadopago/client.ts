/**
 * Wrapper do Mercado Pago (Checkout Pro) — chama a API REST direto via
 * fetch, sem instalar o SDK oficial. Mesmo motivo do services/resend/client.ts:
 * não há como rodar `npm install` neste ambiente durante a construção,
 * então qualquer pacote novo quebraria o build até alguém instalar
 * manualmente. Fetch nativo evita essa dependência.
 *
 * Credenciais: MERCADOPAGO_ACCESS_TOKEN no .env.local. Comece com o
 * Access Token de TESTE (Painel de Desenvolvedores > sua aplicação >
 * Credenciais de teste) — nada de dinheiro real se movimenta com ele.
 * Só troque para o Access Token de produção quando o teste ponta-a-ponta
 * (checkout > aprovação > liberação do curso) estiver validado.
 */

const MP_API = "https://api.mercadopago.com";

export const isMercadoPagoConfigured = Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN);

function accessToken(): string {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) {
    throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado.");
  }
  return token;
}

export interface CreatePreferenceInput {
  title: string;
  priceCents: number;
  quantity?: number;
  externalReference: string;
  payerEmail?: string;
  successUrl: string;
  failureUrl: string;
  pendingUrl: string;
  notificationUrl: string;
}

export interface CreatePreferenceResult {
  id: string;
  init_point: string;
  sandbox_init_point: string;
}

/**
 * Cria uma "preferência" — a cobrança em si. O retorno traz duas URLs de
 * checkout: `init_point` (produção) e `sandbox_init_point` (teste, usa
 * usuários/cartões fictícios do Mercado Pago). Com credenciais de teste,
 * usar sempre `sandbox_init_point`.
 */
export async function createPreference(input: CreatePreferenceInput): Promise<CreatePreferenceResult> {
  // O Mercado Pago exige que `back_urls.success` seja um domínio real
  // (com DNS) quando `auto_return` é usado — em `localhost` ele recusa
  // a preferência com "auto_return invalid. back_url.success must be
  // defined". Por isso só mandamos `auto_return` fora do ambiente local;
  // em dev, o comprador simplesmente clica no botão de retorno que o
  // próprio Mercado Pago exibe na página de resultado (back_urls
  // continua valendo normalmente, só não há redirect automático).
  const isLocalReturnUrl = /^https?:\/\/(localhost|127\.0\.0\.1)/i.test(input.successUrl);

  const response = await fetch(`${MP_API}/checkout/preferences`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items: [
        {
          title: input.title,
          quantity: input.quantity ?? 1,
          currency_id: "BRL",
          unit_price: input.priceCents / 100,
        },
      ],
      payer: input.payerEmail ? { email: input.payerEmail } : undefined,
      external_reference: input.externalReference,
      back_urls: {
        success: input.successUrl,
        failure: input.failureUrl,
        pending: input.pendingUrl,
      },
      ...(isLocalReturnUrl ? {} : { auto_return: "approved" }),
      notification_url: input.notificationUrl,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Mercado Pago recusou a criação da preferência: ${response.status} ${detail}`);
  }

  return response.json();
}

export interface MercadoPagoPayment {
  id: number;
  status: "approved" | "pending" | "rejected" | "cancelled" | "refunded" | "in_process" | string;
  external_reference: string | null;
  transaction_amount: number;
}

/**
 * Busca o status REAL de um pagamento direto na API do Mercado Pago.
 * Nunca confiar no status que vem só do webhook ou da query string do
 * redirect — sempre reconfirmar aqui antes de liberar acesso a um curso,
 * pra não depender de um payload que poderia ser forjado.
 */
export async function getPayment(paymentId: string): Promise<MercadoPagoPayment> {
  const response = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${accessToken()}` },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Falha ao consultar pagamento ${paymentId}: ${response.status} ${detail}`);
  }

  return response.json();
}
