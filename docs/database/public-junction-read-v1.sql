-- ============================================================
-- VaultMindOS — Public Junction Read v1.0
-- Correcao pos-deploy do Modulo 10
--
-- Bug: schema-v1.sql habilitou RLS em article_tags e article_entities
-- mas nunca deu a elas uma policy de SELECT publica (so as tabelas
-- articles/categories/tags/entities/seo_metadata ganharam). Resultado:
-- qualquer consulta anonima a essas duas tabelas de ligacao volta
-- vazia, entao o portal nunca descobre o cluster real de um artigo e
-- cai no fallback "geral" ao montar o link — clique nesse link e a
-- pagina de destino da 404 (o slug do cluster na URL nao bate com
-- nenhum cluster de verdade do artigo).
--
-- Correcao: leitura publica de article_tags/article_entities quando o
-- artigo pai esta publicado (mesmo padrao ja usado em seo_metadata).
--
-- Como aplicar: SQL Editor do Supabase. Idempotente. Nao precisa de
-- redeploy na Vercel — RLS e avaliado em tempo real, o codigo ja
-- publicado passa a funcionar assim que a policy existir.
-- ============================================================

drop policy if exists "public read article_tags" on public.article_tags;
create policy "public read article_tags" on public.article_tags
  for select using (
    exists (
      select 1 from public.articles a
      where a.id = article_tags.article_id and a.status = 'published'
    )
  );

drop policy if exists "public read article_entities" on public.article_entities;
create policy "public read article_entities" on public.article_entities
  for select using (
    exists (
      select 1 from public.articles a
      where a.id = article_entities.article_id and a.status = 'published'
    )
  );
