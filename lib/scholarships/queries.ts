import { createClient } from "@/lib/supabase/server";
import type { CouponForAdmin, GrantForAdmin, ScholarshipGrant } from "./types";

/**
 * Bolsa (autorização de desconto) já registrada pro par (aluno, curso),
 * se existir — usado na página do curso pra mostrar preço com desconto
 * e trocar o botão de compra, e no createCheckoutAction pra calcular o
 * valor real da preferência do Mercado Pago.
 */
export async function getActiveGrant(userId: string, courseId: string): Promise<ScholarshipGrant | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("scholarship_grants")
    .select("id, user_id, course_id, discount_percent, source, coupon_id, granted_by, payment_id, created_at")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .maybeSingle();
  return data as ScholarshipGrant | null;
}

/** Todos os cupons (admin) — mesma estratégia de 2 consultas + Map do resto do projeto. */
export async function getCouponsForAdmin(): Promise<CouponForAdmin[]> {
  const supabase = createClient();
  const { data: couponRows } = await supabase
    .from("scholarship_coupons")
    .select("id, code, course_id, discount_percent, max_redemptions, redemption_count, is_active, created_by, created_at")
    .order("created_at", { ascending: false });

  const coupons = (couponRows ?? []) as CouponForAdmin[];
  if (coupons.length === 0) return [];

  const courseIds = [...new Set(coupons.map((c) => c.course_id).filter((id): id is string => !!id))];
  const titleByCourse = new Map<string, string>();
  if (courseIds.length > 0) {
    const { data: courseRows } = await supabase.from("courses").select("id, title").in("id", courseIds);
    (courseRows ?? []).forEach((row) => {
      const r = row as Record<string, unknown>;
      titleByCourse.set(r.id as string, r.title as string);
    });
  }

  return coupons.map((coupon) => ({
    ...coupon,
    courseTitle: coupon.course_id ? (titleByCourse.get(coupon.course_id) ?? "Curso removido") : "Qualquer curso pago",
  }));
}

/** Todas as bolsas concedidas (admin) — cupom resgatado ou concessão direta. */
export async function getGrantsForAdmin(): Promise<GrantForAdmin[]> {
  const supabase = createClient();
  const { data: grantRows } = await supabase
    .from("scholarship_grants")
    .select("id, user_id, course_id, discount_percent, source, coupon_id, granted_by, payment_id, created_at")
    .order("created_at", { ascending: false });

  const grants = (grantRows ?? []) as ScholarshipGrant[];
  if (grants.length === 0) return [];

  const userIds = [...new Set(grants.map((g) => g.user_id))];
  const courseIds = [...new Set(grants.map((g) => g.course_id))];

  const [{ data: profileRows }, { data: courseRows }] = await Promise.all([
    supabase.from("users_profile").select("id, full_name").in("id", userIds),
    supabase.from("courses").select("id, title").in("id", courseIds),
  ]);

  const nameByUser = new Map<string, string | null>();
  (profileRows ?? []).forEach((row) => {
    const r = row as Record<string, unknown>;
    nameByUser.set(r.id as string, (r.full_name as string | null) ?? null);
  });

  const titleByCourse = new Map<string, string>();
  (courseRows ?? []).forEach((row) => {
    const r = row as Record<string, unknown>;
    titleByCourse.set(r.id as string, r.title as string);
  });

  return grants.map((grant) => ({
    ...grant,
    studentName: nameByUser.get(grant.user_id) ?? `Usuário ${grant.user_id.slice(0, 8)}`,
    courseTitle: titleByCourse.get(grant.course_id) ?? "Curso removido",
  }));
}

/** Alunos conhecidos (id + nome) — dropdown do formulário de concessão direta (admin). */
export async function getAllStudentsForAdmin(): Promise<{ id: string; fullName: string | null }[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("users_profile")
    .select("id, full_name")
    .order("full_name", { ascending: true });
  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    return { id: r.id as string, fullName: (r.full_name as string | null) ?? null };
  });
}
