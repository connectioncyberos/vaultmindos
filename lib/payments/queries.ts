import { createClient } from "@/lib/supabase/server";
import type { Payment } from "./types";

/** Usado pela página do curso pra mostrar o status do pagamento no retorno do checkout. RLS: só o dono lê. */
export async function getPaymentById(paymentId: string): Promise<Payment | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("payments")
    .select("id, user_id, course_id, amount_cents, status, mp_preference_id, mp_payment_id, created_at, updated_at")
    .eq("id", paymentId)
    .maybeSingle();
  return data as Payment | null;
}
