"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { countLessonsForCourse, countCompletedLessonsForUser } from "@/lib/academy/queries";
import { SITE_URL } from "@/lib/seo/metadata";
import { createPreference, isMercadoPagoConfigured } from "@/services/mercadopago/client";
import { reconcilePayment } from "@/lib/payments/grant";

/**
 * Matricula o usuário logado num curso (auto-matrícula individual —
 * organization_id fica null; matrícula patrocinada por empresa é Fase 2).
 * `onConflict` na constraint unique(user_id, course_id) trata o caso de
 * o aluno já estar matriculado sem lançar erro.
 *
 * Guarda de pagamento: se o curso tem `price_cents > 0`, esta action
 * recusa a matrícula direta — quem paga passa por `createCheckoutAction`.
 * Checado aqui (não só escondendo o botão na UI) porque um POST direto
 * pra Server Action ignora qualquer botão escondido na página.
 */
export async function enrollAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/academy");

  const courseId = String(formData.get("course_id") ?? "");
  const courseSlug = String(formData.get("course_slug") ?? "");
  if (!courseId || !courseSlug) return;

  const supabase = createClient();

  const { data: course } = await supabase
    .from("courses")
    .select("price_cents")
    .eq("id", courseId)
    .maybeSingle();

  if (course?.price_cents && course.price_cents > 0) {
    redirect(`/academy/cursos/${courseSlug}`);
  }

  const { error } = await supabase.from("enrollments").upsert(
    {
      user_id: user.id,
      course_id: courseId,
      status: "ACTIVE",
    },
    { onConflict: "user_id, course_id", ignoreDuplicates: true },
  );

  if (error) {
    console.error("Erro ao matricular:", error.message);
  }

  redirect(`/academy/cursos/${courseSlug}`);
}

/**
 * Inicia o checkout (Mercado Pago Checkout Pro) pra um curso pago.
 * Cria um `payments` PENDING nosso, cria a preferência no Mercado Pago
 * com `external_reference` = id desse pagamento, e redireciona pra
 * página hospedada de checkout. Com credenciais de TESTE, usa
 * `sandbox_init_point` — nada de dinheiro real se move.
 */
export async function createCheckoutAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/academy");

  const courseId = String(formData.get("course_id") ?? "");
  const courseSlug = String(formData.get("course_slug") ?? "");
  if (!courseId || !courseSlug) return;

  if (!isMercadoPagoConfigured) {
    redirect(
      `/academy/cursos/${courseSlug}?checkout_error=${encodeURIComponent(
        "Pagamento ainda não configurado (MERCADOPAGO_ACCESS_TOKEN ausente). Avise o time.",
      )}`,
    );
  }

  const supabase = createClient();
  const { data: course } = await supabase
    .from("courses")
    .select("id, title, price_cents")
    .eq("id", courseId)
    .maybeSingle();

  if (!course?.price_cents || course.price_cents <= 0) {
    redirect(`/academy/cursos/${courseSlug}`);
  }

  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .insert({ user_id: user.id, course_id: courseId, amount_cents: course!.price_cents })
    .select("id")
    .single();

  if (paymentError || !payment) {
    redirect(
      `/academy/cursos/${courseSlug}?checkout_error=${encodeURIComponent("Não foi possível iniciar o pagamento. Tente de novo.")}`,
    );
  }

  const returnBase = `${SITE_URL}/academy/cursos/${courseSlug}`;

  // Importante: `redirect()` lança um erro especial internamente pro
  // Next.js interceptar — chamar dentro de um try/catch que também
  // captura erros de rede faria o catch engolir esse redirect. Por
  // isso só a chamada de rede (que pode falhar de verdade) fica no
  // try; o redirect de sucesso acontece depois, fora do try/catch.
  let preference;
  try {
    preference = await createPreference({
      title: `VaultMindOS Academy — ${course!.title}`,
      priceCents: course!.price_cents,
      externalReference: payment!.id,
      payerEmail: user.email ?? undefined,
      successUrl: returnBase,
      failureUrl: `${returnBase}?checkout=falhou`,
      pendingUrl: `${returnBase}?checkout=pendente`,
      notificationUrl: `${SITE_URL}/api/webhooks/mercadopago`,
    });
  } catch (err) {
    console.error("Erro ao criar preferência no Mercado Pago:", err);
    redirect(
      `/academy/cursos/${courseSlug}?checkout_error=${encodeURIComponent("Não foi possível iniciar o pagamento. Tente de novo.")}`,
    );
  }

  await supabase.from("payments").update({ mp_preference_id: preference.id }).eq("id", payment!.id);

  const checkoutUrl = process.env.NODE_ENV === "production" ? preference.init_point : preference.sandbox_init_point;
  redirect(checkoutUrl);
}

/**
 * Confirma o pagamento no retorno do checkout (back_url de sucesso).
 * Não confia no query param sozinho — chama `reconcilePayment`, que
 * reconsulta o status real na API do Mercado Pago antes de liberar a
 * matrícula. Também funciona como rede de segurança em ambiente local
 * (onde o webhook não consegue alcançar `localhost`).
 */
export async function confirmPaymentAction(mpPaymentId: string, courseSlug: string) {
  try {
    await reconcilePayment(mpPaymentId);
  } catch (err) {
    console.error("Erro ao confirmar pagamento:", err);
  }
  revalidatePath(`/academy/cursos/${courseSlug}`);
}

/**
 * Alterna o status de conclusão de uma aula (mesmo padrão validado no
 * vaultmindos-OLD1: toggleLessonProgress). Depois de gravar, verifica
 * se o curso foi totalmente concluído e, se sim, emite o certificado
 * automaticamente (Fase 1 — sem intervenção manual).
 */
export async function toggleLessonProgressAction(
  lessonId: string,
  currentStatus: boolean,
  courseId: string,
  courseSlug: string,
  path: string,
) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/academy");

  const supabase = createClient();
  const newStatus = !currentStatus;

  const { error } = await supabase.from("user_progress").upsert(
    {
      user_id: user.id,
      lesson_id: lessonId,
      is_completed: newStatus,
      last_watched_at: new Date().toISOString(),
    },
    { onConflict: "user_id, lesson_id" },
  );

  if (error) {
    console.error("Erro ao salvar progresso:", error.message);
    throw new Error("Falha ao atualizar progresso");
  }

  if (newStatus) {
    await maybeIssueCertificate(user.id, courseId, courseSlug);
  }

  revalidatePath(path);
}

async function maybeIssueCertificate(userId: string, courseId: string, courseSlug: string) {
  const [total, completed] = await Promise.all([
    countLessonsForCourse(courseId),
    countCompletedLessonsForUser(userId, courseId),
  ]);

  if (total === 0 || completed < total) return;

  const supabase = createClient();
  const { data: existing } = await supabase
    .from("certificates")
    .select("id")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .maybeSingle();

  if (existing) return;

  const code = `VM-${courseSlug.toUpperCase()}-${userId.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

  const { error } = await supabase.from("certificates").insert({
    user_id: userId,
    course_id: courseId,
    code,
  });

  if (error) {
    // Corrida rara (mesma conclusão disparada 2x): a constraint unique
    // do banco (se existir) ou simplesmente uma tentativa duplicada não
    // deve derrubar o fluxo do aluno — só registra.
    console.error("Erro ao emitir certificado:", error.message);
  }
}

