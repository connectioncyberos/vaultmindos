"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { countLessonsForCourse, countCompletedLessonsForUser } from "@/lib/academy/queries";

/**
 * Matricula o usuário logado num curso (auto-matrícula individual —
 * organization_id fica null; matrícula patrocinada por empresa é Fase 2).
 * `onConflict` na constraint unique(user_id, course_id) trata o caso de
 * o aluno já estar matriculado sem lançar erro.
 */
export async function enrollAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/academy");

  const courseId = String(formData.get("course_id") ?? "");
  const courseSlug = String(formData.get("course_slug") ?? "");
  if (!courseId || !courseSlug) return;

  const supabase = createClient();
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

