"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";

/**
 * Aprovação de empresa parceira (Fase 2). Diferente do resto do CMS
 * (que aceita admin/editor/author via assertCmsAccess), aprovar/rejeitar
 * uma empresa é uma decisão de negócio, não editorial — por isso o
 * gate aqui é estritamente role === "admin", checado à parte.
 */
async function assertAdminOnly() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") {
    throw new Error("Só o admin pode aprovar ou rejeitar empresas parceiras.");
  }
  return user;
}

export async function approveOrganizationAction(formData: FormData) {
  const admin = await assertAdminOnly();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase
    .from("organizations")
    .update({ status: "APPROVED", reviewed_by: admin.id, reviewed_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/admin/academy/empresas");
}

export async function rejectOrganizationAction(formData: FormData) {
  const admin = await assertAdminOnly();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase
    .from("organizations")
    .update({ status: "REJECTED", reviewed_by: admin.id, reviewed_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/admin/academy/empresas");
}
