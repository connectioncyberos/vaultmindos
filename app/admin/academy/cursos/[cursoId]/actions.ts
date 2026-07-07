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
    throw new Error("Só o admin pode gerenciar módulos e aulas.");
  }
  return user;
}

function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createModuleAction(formData: FormData) {
  const admin = await assertAdminOnly();

  const courseId = String(formData.get("course_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const orderIndex = Number(formData.get("order_index") ?? 0);
  if (!courseId || !title) return;

  const supabase = createClient();
  const { data: newModule, error } = await supabase
    .from("modules")
    .insert({ course_id: courseId, title, order_index: orderIndex })
    .select("id")
    .single();

  if (error || !newModule) {
    console.error("Erro ao criar módulo:", error?.message);
  } else {
    await logAuditEvent(supabase, {
      actorId: admin.id,
      action: "course.module_create",
      entityType: "course",
      entityId: courseId,
      metadata: { moduleId: newModule.id, title },
    });
  }

  revalidatePath(`/admin/academy/cursos/${courseId}`);
}

export async function createLessonAction(formData: FormData) {
  const admin = await assertAdminOnly();

  const courseId = String(formData.get("course_id") ?? "");
  const moduleId = String(formData.get("module_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const videoUrl = String(formData.get("video_url") ?? "").trim() || null;
  const orderIndex = Number(formData.get("order_index") ?? 0);
  const isPreview = formData.get("is_preview") === "on";
  if (!courseId || !moduleId || !title) return;

  const slug = slugInput ? slugify(slugInput) : slugify(title);

  const supabase = createClient();
  const { data: lesson, error } = await supabase
    .from("lessons")
    .insert({
      module_id: moduleId,
      course_id: courseId,
      slug,
      title,
      video_url: videoUrl,
      order_index: orderIndex,
      is_preview: isPreview,
    })
    .select("id")
    .single();

  if (error || !lesson) {
    console.error("Erro ao criar aula:", error?.message);
  } else {
    await logAuditEvent(supabase, {
      actorId: admin.id,
      action: "course.lesson_create",
      entityType: "course",
      entityId: courseId,
      metadata: { lessonId: lesson.id, moduleId, title, slug },
    });
  }

  revalidatePath(`/admin/academy/cursos/${courseId}`);
}
