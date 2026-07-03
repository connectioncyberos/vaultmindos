"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { assertCmsAccess } from "@/lib/auth/session";
import { slugify } from "@/lib/utils/slugify";

export async function createTagAction(formData: FormData) {
  await assertCmsAccess();

  const name = String(formData.get("name") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const slug = slugInput ? slugify(slugInput) : slugify(name);

  if (!name || !slug) {
    redirect("/admin/tags?error=" + encodeURIComponent("Nome é obrigatório."));
  }

  const supabase = await createClient();
  const { error } = await supabase.from("tags").insert({ name, slug });

  if (error) {
    const msg = error.code === "23505" ? "Já existe uma tag com esse slug." : "Não foi possível criar.";
    redirect("/admin/tags?error=" + encodeURIComponent(msg));
  }

  redirect("/admin/tags");
}

export async function deleteTagAction(formData: FormData) {
  await assertCmsAccess();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/tags");

  const supabase = await createClient();
  await supabase.from("tags").delete().eq("id", id);

  redirect("/admin/tags");
}
