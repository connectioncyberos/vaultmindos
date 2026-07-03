"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { assertCmsAccess } from "@/lib/auth/session";
import { slugify } from "@/lib/utils/slugify";
import type { ArticleStatus, ContentType } from "@/lib/types/content";

function readArticleFields(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const slug = slugInput ? slugify(slugInput) : slugify(title);
  const excerpt = String(formData.get("excerpt") ?? "").trim() || null;
  const content = String(formData.get("content") ?? "").trim() || null;
  const status = String(formData.get("status") ?? "draft") as ArticleStatus;
  const content_type = String(formData.get("content_type") ?? "artigo") as ContentType;
  const category_id = String(formData.get("category_id") ?? "").trim() || null;
  const cover_image_url = String(formData.get("cover_image_url") ?? "").trim() || null;
  const seo_title = String(formData.get("seo_title") ?? "").trim() || null;
  const seo_description = String(formData.get("seo_description") ?? "").trim() || null;
  const tagIds = formData.getAll("tag_ids").map(String).filter(Boolean);
  const entityIds = formData.getAll("entity_ids").map(String).filter(Boolean);

  return {
    title,
    slug,
    excerpt,
    content,
    status,
    content_type,
    category_id,
    cover_image_url,
    seo_title,
    seo_description,
    tagIds,
    entityIds,
  };
}

async function syncTagsAndEntities(articleId: string, tagIds: string[], entityIds: string[]) {
  const supabase = await createClient();

  await supabase.from("article_tags").delete().eq("article_id", articleId);
  if (tagIds.length > 0) {
    await supabase
      .from("article_tags")
      .insert(tagIds.map((tag_id) => ({ article_id: articleId, tag_id })));
  }

  await supabase.from("article_entities").delete().eq("article_id", articleId);
  if (entityIds.length > 0) {
    await supabase
      .from("article_entities")
      .insert(entityIds.map((entity_id) => ({ article_id: articleId, entity_id })));
  }
}

async function syncSeo(articleId: string, seoTitle: string | null, seoDescription: string | null) {
  const supabase = await createClient();
  if (!seoTitle && !seoDescription) {
    await supabase.from("seo_metadata").delete().eq("article_id", articleId);
    return;
  }
  await supabase
    .from("seo_metadata")
    .upsert(
      { article_id: articleId, seo_title: seoTitle, seo_description: seoDescription },
      { onConflict: "article_id" },
    );
}

/**
 * Best-effort (Modulo 9): dispara um webhook n8n quando um artigo e
 * publicado. Import dinamico + try/catch pra nunca travar o
 * create/update se N8N_BASE_URL nao estiver configurada — ver
 * services/n8n/client.ts.
 */
async function notifyIfPublished(status: string, title: string, slug: string) {
  if (status !== "published") return;
  try {
    const { triggerWebhook } = await import("@/services/n8n/client");
    await triggerWebhook("article.published", { title, slug });
  } catch {
    // silencioso de proposito
  }
}

export async function createArticleAction(formData: FormData) {
  await assertCmsAccess();
  const fields = readArticleFields(formData);

  if (!fields.title || !fields.slug) {
    redirect("/admin/artigos/novo?error=" + encodeURIComponent("Título é obrigatório."));
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("articles")
    .insert({
      title: fields.title,
      slug: fields.slug,
      excerpt: fields.excerpt,
      content: fields.content,
      status: fields.status,
      content_type: fields.content_type,
      category_id: fields.category_id,
      cover_image_url: fields.cover_image_url,
      published_at: fields.status === "published" ? new Date().toISOString() : null,
    })
    .select("id")
    .single();

  if (error || !data) {
    const msg =
      error?.code === "23505"
        ? "Já existe um artigo com esse slug. Escolha outro."
        : "Não foi possível criar o artigo.";
    redirect("/admin/artigos/novo?error=" + encodeURIComponent(msg));
  }

  await syncTagsAndEntities(data.id as string, fields.tagIds, fields.entityIds);
  await syncSeo(data.id as string, fields.seo_title, fields.seo_description);
  await notifyIfPublished(fields.status, fields.title, fields.slug);

  redirect("/admin/artigos");
}

export async function updateArticleAction(formData: FormData) {
  await assertCmsAccess();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/artigos");

  const fields = readArticleFields(formData);

  if (!fields.title || !fields.slug) {
    redirect(`/admin/artigos/${id}/editar?error=` + encodeURIComponent("Título é obrigatório."));
  }

  const supabase = await createClient();
  const { data: current } = await supabase
    .from("articles")
    .select("status, published_at")
    .eq("id", id)
    .maybeSingle();

  const jaEstavaPublicado = current?.status === "published";
  const published_at =
    fields.status === "published"
      ? (jaEstavaPublicado ? current?.published_at : new Date().toISOString())
      : null;

  const { error } = await supabase
    .from("articles")
    .update({
      title: fields.title,
      slug: fields.slug,
      excerpt: fields.excerpt,
      content: fields.content,
      status: fields.status,
      content_type: fields.content_type,
      category_id: fields.category_id,
      cover_image_url: fields.cover_image_url,
      published_at,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    const msg =
      error.code === "23505"
        ? "Já existe um artigo com esse slug. Escolha outro."
        : "Não foi possível salvar o artigo.";
    redirect(`/admin/artigos/${id}/editar?error=` + encodeURIComponent(msg));
  }

  await syncTagsAndEntities(id, fields.tagIds, fields.entityIds);
  await syncSeo(id, fields.seo_title, fields.seo_description);
  await notifyIfPublished(fields.status, fields.title, fields.slug);

  redirect("/admin/artigos");
}

export async function deleteArticleAction(formData: FormData) {
  await assertCmsAccess();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/artigos");

  const supabase = await createClient();
  await supabase.from("articles").delete().eq("id", id);

  redirect("/admin/artigos");
}
