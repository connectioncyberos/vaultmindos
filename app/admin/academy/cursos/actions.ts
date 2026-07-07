"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/audit/log";

/**
 * Gestão de cursos (admin). Não existia tela pra isso até agora — os
 * cursos do catálogo (Nivelamento, Administrativo 4.0, cursos de teste)
 * foram todos criados via SQL de migration diretamente. RLS de
 * `courses`/`modules`/`lessons` já é `catalogo_write_admin` (is_admin(),
 * migration 001) — nenhuma policy nova precisa ser criada aqui.
 */
async function assertAdminOnly() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") {
    throw new Error("Só o admin pode gerenciar o catálogo de cursos.");
  }
  return user;
}

function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos após decompor (NFD)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createCourseAction(formData: FormData) {
  const admin = await assertAdminOnly();

  const title = String(formData.get("title") ?? "").trim();
  if (!title) redirect("/admin/academy/cursos/novo?erro=" + encodeURIComponent("Informe o título do curso."));

  const slugInput = String(formData.get("slug") ?? "").trim();
  const slug = slugInput ? slugify(slugInput) : slugify(title);

  const description = String(formData.get("description") ?? "").trim() || null;
  const level = String(formData.get("level") ?? "").trim() || null;
  const sectorId = String(formData.get("sector_id") ?? "").trim() || null;
  const priceInput = String(formData.get("price_reais") ?? "").trim();
  const priceCents = priceInput ? Math.round(parseFloat(priceInput.replace(",", ".")) * 100) : null;
  const isActive = formData.get("is_active") === "on";

  const supabase = createClient();
  const { data: course, error } = await supabase
    .from("courses")
    .insert({
      title,
      slug,
      description,
      level,
      sector_id: sectorId,
      price_cents: priceCents,
      is_active: isActive,
    })
    .select("id, slug")
    .single();

  if (error || !course) {
    console.error("Erro ao criar curso:", error?.message);
    redirect(
      "/admin/academy/cursos/novo?erro=" +
        encodeURIComponent(
          error?.code === "23505" ? "Já existe um curso com esse slug." : "Não foi possível criar o curso.",
        ),
    );
  }

  await logAuditEvent(supabase, {
    actorId: admin.id,
    action: "course.create",
    entityType: "course",
    entityId: course.id,
    metadata: { title, slug, priceCents },
  });

  revalidatePath("/admin/academy/cursos");
  redirect(`/admin/academy/cursos/${course.id}?criado=1`);
}

export async function toggleCourseActiveAction(formData: FormData) {
  const admin = await assertAdminOnly();

  const courseId = String(formData.get("course_id") ?? "");
  const nextActive = formData.get("next_active") === "true";
  if (!courseId) return;

  const supabase = createClient();
  const { error } = await supabase.from("courses").update({ is_active: nextActive }).eq("id", courseId);
  if (error) {
    console.error("Erro ao atualizar status do curso:", error.message);
  } else {
    await logAuditEvent(supabase, {
      actorId: admin.id,
      action: "course.toggle_active",
      entityType: "course",
      entityId: courseId,
      metadata: { isActive: nextActive },
    });
  }

  revalidatePath("/admin/academy/cursos");
}
