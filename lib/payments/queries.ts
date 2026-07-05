import { createClient } from "@/lib/supabase/server";
import type { Payment, PaymentForAdmin, PaymentTotals } from "./types";

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

/**
 * Todos os pagamentos, mais recentes primeiro — painel financeiro (admin).
 * RLS de `payments` já libera select pra `is_admin()` (migration 004); a
 * de `users_profile` passou a liberar também (migration 005). Sem isso,
 * um admin nem conseguiria ler o nome de quem comprou.
 *
 * `courseId` opcional filtra por um curso especifico (dropdown da página).
 * Mesma estrategia de 2 consultas + Map usada em getUserEnrollments —
 * mais simples de revisar do que um embed aninhado do PostgREST.
 */
export async function getPaymentsForAdmin(courseId?: string): Promise<PaymentForAdmin[]> {
  const supabase = createClient();

  let query = supabase
    .from("payments")
    .select("id, user_id, course_id, amount_cents, status, mp_preference_id, mp_payment_id, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (courseId) {
    query = query.eq("course_id", courseId);
  }

  const { data: paymentRows } = await query;
  const payments = (paymentRows ?? []) as Payment[];
  if (payments.length === 0) return [];

  const courseIds = [...new Set(payments.map((p) => p.course_id))];
  const userIds = [...new Set(payments.map((p) => p.user_id))];

  const [{ data: courseRows }, { data: profileRows }] = await Promise.all([
    supabase.from("courses").select("id, slug, title").in("id", courseIds),
    supabase.from("users_profile").select("id, full_name").in("id", userIds),
  ]);

  const courseById = new Map<string, { slug: string; title: string }>();
  (courseRows ?? []).forEach((row) => {
    const r = row as Record<string, unknown>;
    courseById.set(r.id as string, { slug: r.slug as string, title: r.title as string });
  });

  const nameByUser = new Map<string, string | null>();
  (profileRows ?? []).forEach((row) => {
    const r = row as Record<string, unknown>;
    nameByUser.set(r.id as string, (r.full_name as string | null) ?? null);
  });

  return payments.map((payment) => {
    const course = courseById.get(payment.course_id);
    const fullName = nameByUser.get(payment.user_id);
    return {
      ...payment,
      courseTitle: course?.title ?? "Curso removido",
      courseSlug: course?.slug ?? "",
      studentName: fullName ?? `Usuário ${payment.user_id.slice(0, 8)}`,
    };
  });
}

/** Receita aprovada, quantidade de vendas e ticket médio — cards do painel financeiro. */
export function computeTotals(payments: PaymentForAdmin[]): PaymentTotals {
  const approved = payments.filter((p) => p.status === "APPROVED");
  const revenueCents = approved.reduce((sum, p) => sum + p.amount_cents, 0);
  return {
    revenueCents,
    approvedCount: approved.length,
    averageTicketCents: approved.length > 0 ? Math.round(revenueCents / approved.length) : 0,
  };
}
