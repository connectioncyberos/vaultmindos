"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/audit/log";

async function assertAdminOnly() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") {
    throw new Error("Só o admin pode gerenciar bolsas.");
  }
  return user;
}

export async function createCouponAction(formData: FormData) {
  const admin = await assertAdminOnly();

  const codeRaw = String(formData.get("code") ?? "").trim();
  if (!codeRaw) redirect("/admin/academy/bolsas?erro=" + encodeURIComponent("Informe o código do cupom."));
  const code = codeRaw.toUpperCase();

  const courseId = String(formData.get("course_id") ?? "").trim() || null;
  const discountPercent = Number(formData.get("discount_percent") ?? 0);
  const maxRedemptionsRaw = String(formData.get("max_redemptions") ?? "").trim();
  const maxRedemptions = maxRedemptionsRaw ? Number(maxRedemptionsRaw) : null;

  if (discountPercent < 1 || discountPercent > 100) {
    redirect("/admin/academy/bolsas?erro=" + encodeURIComponent("Desconto deve ser entre 1 e 100."));
  }

  const supabase = createClient();
  const { data: coupon, error } = await supabase
    .from("scholarship_coupons")
    .insert({
      code,
      course_id: courseId,
      discount_percent: discountPercent,
      max_redemptions: maxRedemptions,
      created_by: admin.id,
    })
    .select("id")
    .single();

  if (error || !coupon) {
    console.error("Erro ao criar cupom:", error?.message);
    redirect(
      "/admin/academy/bolsas?erro=" +
        encodeURIComponent(error?.code === "23505" ? "Já existe um cupom com esse código." : "Não foi possível criar o cupom."),
    );
  }

  await logAuditEvent(supabase, {
    actorId: admin.id,
    action: "scholarship_coupon.create",
    entityType: "scholarship_coupon",
    entityId: coupon.id,
    metadata: { code, discountPercent, courseId, maxRedemptions },
  });

  revalidatePath("/admin/academy/bolsas");
  redirect("/admin/academy/bolsas?criado=1");
}

export async function toggleCouponActiveAction(formData: FormData) {
  const admin = await assertAdminOnly();

  const couponId = String(formData.get("coupon_id") ?? "");
  const nextActive = formData.get("next_active") === "true";
  if (!couponId) return;

  const supabase = createClient();
  const { error } = await supabase.from("scholarship_coupons").update({ is_active: nextActive }).eq("id", couponId);
  if (error) {
    console.error("Erro ao atualizar cupom:", error.message);
  } else {
    await logAuditEvent(supabase, {
      actorId: admin.id,
      action: "scholarship_coupon.toggle_active",
      entityType: "scholarship_coupon",
      entityId: couponId,
      metadata: { isActive: nextActive },
    });
  }

  revalidatePath("/admin/academy/bolsas");
}

/**
 * Concessão direta de bolsa a um aluno específico (sem cupom). 100% de
 * desconto libera matrícula na hora; desconto parcial só grava a
 * autorização — o aluno completa o pagamento reduzido depois, na
 * própria página do curso (mesmo caminho do cupom autosserviço, ver
 * app/academy/actions.ts).
 */
export async function grantScholarshipDirectAction(formData: FormData) {
  const admin = await assertAdminOnly();

  const studentId = String(formData.get("student_id") ?? "");
  const courseId = String(formData.get("course_id") ?? "");
  const discountPercent = Number(formData.get("discount_percent") ?? 0);
  if (!studentId || !courseId || discountPercent < 1 || discountPercent > 100) {
    redirect("/admin/academy/bolsas?erro=" + encodeURIComponent("Preencha aluno, curso e um desconto entre 1 e 100."));
  }

  const supabase = createClient();

  const { data: existing } = await supabase
    .from("scholarship_grants")
    .select("id")
    .eq("user_id", studentId)
    .eq("course_id", courseId)
    .maybeSingle();
  if (existing) {
    redirect("/admin/academy/bolsas?erro=" + encodeURIComponent("Este aluno já tem uma bolsa registrada para este curso."));
  }

  const { data: course } = await supabase.from("courses").select("price_cents").eq("id", courseId).maybeSingle();
  if (!course) {
    redirect("/admin/academy/bolsas?erro=" + encodeURIComponent("Curso não encontrado."));
  }

  if (discountPercent >= 100) {
    await supabase.from("enrollments").upsert(
      { user_id: studentId, course_id: courseId, status: "ACTIVE" },
      { onConflict: "user_id, course_id", ignoreDuplicates: true },
    );
  }
  // Desconto parcial (<100%): não cria `payments` aqui — fica só a
  // autorização (`scholarship_grants`, payment_id ainda null). O
  // valor reduzido é cobrado depois, quando o próprio aluno clicar em
  // "Comprar acesso" na página do curso (createCheckoutAction já
  // consulta `getActiveGrant` e aplica o desconto). Pré-criar o
  // payments aqui deixaria uma linha PENDING órfã se o aluno demorar
  // ou nunca completar o checkout.

  const { data: grant, error: grantError } = await supabase
    .from("scholarship_grants")
    .insert({
      user_id: studentId,
      course_id: courseId,
      discount_percent: discountPercent,
      source: "ADMIN_DIRECT",
      granted_by: admin.id,
      payment_id: null,
    })
    .select("id")
    .single();

  if (grantError) {
    console.error("Erro ao conceder bolsa:", grantError.message);
    redirect("/admin/academy/bolsas?erro=" + encodeURIComponent("Não foi possível conceder a bolsa."));
  }

  await logAuditEvent(supabase, {
    actorId: admin.id,
    action: "scholarship_grant.direct",
    entityType: "scholarship_grant",
    entityId: grant?.id,
    metadata: { studentId, courseId, discountPercent },
  });

  revalidatePath("/admin/academy/bolsas");
  redirect("/admin/academy/bolsas?concedido=1");
}
