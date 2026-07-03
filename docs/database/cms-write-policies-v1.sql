-- ============================================================
-- VaultMindOS — CMS Write Policies v1.0
-- Modulo 7 do Master Execution Roadmap
--
-- As policies do schema-v1.sql so cobrem LEITURA publica (SELECT em
-- artigos com status='published', e SELECT geral em categories/tags/
-- entities). Sem uma policy de escrita, o CMS (/admin/artigos,
-- /admin/categorias, /admin/tags) nao consegue criar, editar nem
-- apagar nada — RLS nega por padrao qualquer comando sem policy
-- correspondente, mesmo pra quem esta autenticado.
--
-- Esta migration adiciona:
--   1. is_cms_user() — funcao SECURITY DEFINER que confere se o
--      usuario autenticado tem role admin/editor/author em
--      users_profile. SECURITY DEFINER evita recursao de RLS (a
--      policy nao pode depender de outra tabela protegida por RLS
--      sem isso).
--   2. Uma policy "for all" (select/insert/update/delete) por tabela
--      de conteudo, usando is_cms_user(). Coexiste com as policies
--      publicas de leitura ja existentes — no Postgres, policies
--      permissivas do mesmo comando se somam com OR.
--
-- Como aplicar: SQL Editor do Supabase, depois de schema-v1.sql,
-- auth-trigger-v1.sql e content-types-v1.sql. Idempotente.
-- ============================================================

create or replace function public.is_cms_user()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.users_profile
    where id = auth.uid() and role in ('admin', 'editor', 'author')
  );
$$;

-- ── articles ──────────────────────────────────────────────────
drop policy if exists "cms manage articles" on public.articles;
create policy "cms manage articles" on public.articles
  for all using (public.is_cms_user()) with check (public.is_cms_user());

-- ── categories ────────────────────────────────────────────────
drop policy if exists "cms manage categories" on public.categories;
create policy "cms manage categories" on public.categories
  for all using (public.is_cms_user()) with check (public.is_cms_user());

-- ── tags ──────────────────────────────────────────────────────
drop policy if exists "cms manage tags" on public.tags;
create policy "cms manage tags" on public.tags
  for all using (public.is_cms_user()) with check (public.is_cms_user());

-- ── entities (clusters) ──────────────────────────────────────
drop policy if exists "cms manage entities" on public.entities;
create policy "cms manage entities" on public.entities
  for all using (public.is_cms_user()) with check (public.is_cms_user());

-- ── article_tags / article_entities (tabelas de ligacao) ────────
drop policy if exists "cms manage article_tags" on public.article_tags;
create policy "cms manage article_tags" on public.article_tags
  for all using (public.is_cms_user()) with check (public.is_cms_user());

drop policy if exists "cms manage article_entities" on public.article_entities;
create policy "cms manage article_entities" on public.article_entities
  for all using (public.is_cms_user()) with check (public.is_cms_user());

-- ── seo_metadata ──────────────────────────────────────────────
drop policy if exists "cms manage seo_metadata" on public.seo_metadata;
create policy "cms manage seo_metadata" on public.seo_metadata
  for all using (public.is_cms_user()) with check (public.is_cms_user());

-- ── internal_links ────────────────────────────────────────────
drop policy if exists "cms manage internal_links" on public.internal_links;
create policy "cms manage internal_links" on public.internal_links
  for all using (public.is_cms_user()) with check (public.is_cms_user());
