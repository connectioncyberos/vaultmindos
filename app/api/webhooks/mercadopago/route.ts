import { NextRequest, NextResponse } from "next/server";
import { reconcilePayment } from "@/lib/payments/grant";

/**
 * Webhook do Mercado Pago (Checkout Pro). Configurado via
 * `notification_url` na criação da preferência (services/mercadopago/client.ts).
 *
 * O Mercado Pago envia um POST com `{ type: "payment", data: { id } }`
 * sempre que o status de um pagamento muda. Nunca confiamos no status
 * que viria dentro desse payload (poderia ser forjado por qualquer um
 * que descubra esta URL) — `reconcilePayment` sempre reconsulta o
 * status real direto na API do Mercado Pago antes de liberar acesso.
 *
 * Sempre responde 200: um erro 4xx/5xx faria o Mercado Pago reenviar a
 * notificação repetidamente. Erros de verdade ficam só no log — a
 * confirmação no retorno do checkout (`confirmPaymentAction`) serve de
 * segunda tentativa caso este webhook não seja alcançável (ex.: teste
 * rodando em `localhost`, que o Mercado Pago não consegue chamar).
 */
export async function POST(request: NextRequest) {
  let paymentId: string | null = null;

  try {
    const body = await request.json();
    if (body?.type === "payment" && body?.data?.id) {
      paymentId = String(body.data.id);
    }
  } catch {
    // corpo vazio ou não-JSON — tenta query params abaixo (formato antigo/IPN)
  }

  if (!paymentId) {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") ?? searchParams.get("topic");
    const dataId = searchParams.get("data.id") ?? searchParams.get("id");
    if (type === "payment" && dataId) paymentId = dataId;
  }

  if (!paymentId) {
    // Notificação de outro tipo (merchant_order etc.) — só confirma recebimento.
    return NextResponse.json({ received: true });
  }

  try {
    await reconcilePayment(paymentId);
  } catch (err) {
    console.error("[webhook mercadopago] erro ao reconciliar pagamento:", err);
  }

  return NextResponse.json({ received: true });
}

/** Mercado Pago (ou você mesmo) pode fazer GET só pra checar se a URL responde. */
export async function GET() {
  return NextResponse.json({ ok: true });
}
