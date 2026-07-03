"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { assertCmsAccess } from "@/lib/auth/session";
import { slugify } from "@/lib/utils/slugify";

export async function createCategoryAction(formData: FormData) {
  await assertCmsAccess();

  const name = String(formData.get("name") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const slug = slugInput ? slugify(slugInput) : slugify(name);

  if (!name || !slug) {
    redirect("/admin/categorias?error=" + encodeURIComponent("Nome é obrigatório."));
  }

  const supabase = await createClient();
  const { error } = await supabase.from("categories").insert({ name, slug, description });

  if (error) {
    const msg =
      error.code === "23505" ? "Já existe um domínio com esse slug." : "Não foi possível criar.";
    redirect("/admin/categorias?error=" + encodeURIComponent(msg));
  }

  redirect("/admin/categorias");
}

export async function deleteCategoryAction(formData: FormData) {
  await assertCmsAccess();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/categorias");

  const supabase = await createClient();
  await supabase.from("categories").delete().eq("id", id);

  redirect("/admin/categorias");
}
