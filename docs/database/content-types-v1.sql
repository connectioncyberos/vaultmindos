-- ============================================================
-- VaultMindOS — Content Types v1.0
-- Modulo 6 do Master Execution Roadmap
--
-- Objetivo: distinguir o "tipo" de conteudo de um artigo (artigo comum
-- do Vault, verbete de glossario, review, comparativo, roadmap) sem
-- criar uma tabela por tipo (mantem o principio de "uma fonte de
-- verdade" ja usado no schema-v1). `category_id` continua sendo o
-- dominio de conhecimento (IA, SEO, Automacao...) — content_type e
-- ortogonal a isso, controla qual familia de rota renderiza o artigo:
--   artigo      -> /vault/[domain]/[cluster]/[slug]
--   glossario   -> /glossario/[slug]
--   review      -> /reviews/[slug]
--   comparativo -> /comparativos/[slug]
--   roadmap     -> /roadmaps/[slug]
--
-- Como aplicar: SQL Editor do Supabase, depois de schema-v1.sql e
-- auth-trigger-v1.sql ja aplicados. Idempotente.
-- ============================================================

alter table public.articles
  add column if not exists content_type text not null default 'artigo';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'articles_content_type_check'
  ) then
    alter table public.articles
      add constraint articles_content_type_check
      check (content_type in ('artigo', 'glossario', 'review', 'comparativo', 'roadmap'));
  end if;
end $$;

create index if not exists idx_articles_content_type on public.articles (content_type);
