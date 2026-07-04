import { createServiceClient } from "@/lib/supabase/service";
import { getPayment } from "@/services/mercadopago/client";
import type { PaymentStatus } from "./types";

function mapMercadoPagoStatus(mpStatus: string, currentStatus: PaymentStatus): PaymentStatus {
  if (mpStatus === "approved") return "APPROVED";
  if (mpStatus === "rejected") return "REJECTED";
  if (mpStatus === "cancelled") return "CANCELLED";
  // pending / in_process / etc.: mantém como está, reconciliamos de novo depois
  // (webhook reenvia, ou o usuário volta a checar).
  return currentStatus;
}

/**
 * Reconcilia um pagamento do Mercado Pago com o nosso banco: busca o
 * status REAL na API do Mercado Pago (nunca confia isoladamente no
 * payload do webhook nem nos query params do redirect de retorno —
 * ambos poderiam ser forjados), atualiza `payments` e, se aprovado,
 * libera a matrícula no curso.
 *
 * Idempotente de propósito — o Mercado Pago reenvia notificações de
 * webhook, e o usuário pode recarregar a página de retorno do checkout;
 * chamar isto de novo pro mesmo pagamento não duplica nada (upsert com
 * ignoreDuplicates na matrícula, update simples no pagamento).
 *
 * Roda com a service role key (lib/supabase/service.ts) porque é
 * chamado por rotas server-only sem sessão de usuário (webhook do
 * Mercado Pago, ou a checagem no retorno do checkout).
 */
export async function reconcilePayment(mpPaymentId: string): Promise<{ status: PaymentStatus }> {
  const supabase = createServiceClient();
  const mpPayment = await getPayment(mpPaymentId);

  const ourPaymentId = mpPayment.external_reference;
  if (!ourPaymentId) {
    throw new Error(`Pagamento ${mpPaymentId} do Mercado Pago sem external_reference — não sei a qual pedido pertence.`);
  }

  const { data: payment } = await supabase
    .from("payments")
    .select("id, user_id, course_id, status")
    .eq("id", ourPaymentId)
    .maybeSingle();

  if (!payment) {
    throw new Error(`payments.id ${ourPaymentId} (external_reference) não encontrado no banco.`);
  }

  const newStatus = mapMercadoPagoStatus(mpPayment.status, payment.status as PaymentStatus);

  await supabase
    .from("payments")
    .update({
      status: newStatus,
      mp_payment_id: String(mpPayment.id),
      updated_at: new Date().toISOString(),
    })
    .eq("id", payment.id);

  if (newStatus === "APPROVED") {
    await supabase.from("enrollments").upsert(
      { user_id: payment.user_id, course_id: payment.course_id, status: "ACTIVE" },
      { onConflict: "user_id, course_id", ignoreDuplicates: true },
    );
  }

  return { status: newStatus };
}
