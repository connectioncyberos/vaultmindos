-- ============================================================
-- VaultMindOS — Seed de Conteudo v1.0
-- Modulo 6 do Master Execution Roadmap
--
-- Objetivo: popular o banco com dominios, clusters, tags e artigos de
-- exemplo (um de cada content_type) para o Portal Publico ter algo
-- real pra navegar durante a validacao — em vez de testar so telas
-- vazias. Conteudo de exemplo, troque/apague quando tiver conteudo
-- real.
--
-- Como aplicar: SQL Editor do Supabase, depois de schema-v1.sql,
-- auth-trigger-v1.sql e content-types-v1.sql ja aplicados.
-- Idempotente — usa slug/nome unico + ON CONFLICT DO NOTHING.
-- ============================================================

-- ------------------------------------------------------------
-- Dominios (categories)
-- ------------------------------------------------------------
insert into public.categories (slug, name, description) values
  ('inteligencia-artificial', 'Inteligência Artificial', 'IA aplicada, modelos de linguagem, automação cognitiva.'),
  ('seo', 'SEO', 'Otimização para mecanismos de busca, técnico e de conteúdo.'),
  ('automacao', 'Automação', 'Automação de processos, no-code e integrações.')
on conflict (slug) do nothing;

-- ------------------------------------------------------------
-- Clusters (entities)
-- ------------------------------------------------------------
insert into public.entities (slug, name, type, description) values
  ('llms', 'LLMs (Modelos de Linguagem)', 'cluster', 'Modelos de linguagem grandes: como funcionam e como usar.'),
  ('seo-tecnico', 'SEO Técnico', 'cluster', 'Performance, indexação, Core Web Vitals e arquitetura de site.')
on conflict (slug) do nothing;

-- ------------------------------------------------------------
-- Tags
-- ------------------------------------------------------------
insert into public.tags (slug, name) values
  ('iniciante', 'Iniciante'),
  ('avancado', 'Avançado'),
  ('ferramentas', 'Ferramentas'),
  ('tutorial', 'Tutorial')
on conflict (slug) do nothing;

-- ------------------------------------------------------------
-- Artigos — um de cada content_type, mais dois artigos extras no
-- cluster de LLMs para o /vault/[domain]/[cluster] ter lista.
-- ------------------------------------------------------------
insert into public.articles (slug, title, excerpt, content, status, content_type, category_id, published_at) values
  (
    'o-que-sao-llms',
    'O que são LLMs e como funcionam',
    'Uma introdução direta a modelos de linguagem grandes, sem jargão desnecessário.',
    'LLMs (Large Language Models) são modelos treinados em grandes volumes de texto para prever a próxima palavra de uma sequência. Na prática, isso permite gerar texto coerente, responder perguntas, traduzir e resumir conteúdo.

Este artigo é um placeholder de conteúdo semente — substitua pelo texto real quando publicar pelo CMS (/admin/artigos).',
    'published',
    'artigo',
    (select id from public.categories where slug = 'inteligencia-artificial'),
    now()
  ),
  (
    'prompt-engineering-basico',
    'Prompt Engineering: guia básico',
    'Como estruturar instruções para obter respostas melhores de um LLM.',
    'Prompt engineering é a prática de desenhar instruções para extrair o melhor resultado possível de um modelo de linguagem.

Este artigo é um placeholder de conteúdo semente — substitua pelo texto real quando publicar pelo CMS.',
    'published',
    'artigo',
    (select id from public.categories where slug = 'inteligencia-artificial'),
    now()
  ),
  (
    'core-web-vitals-explicado',
    'Core Web Vitals explicado',
    'As três métricas que o Google usa para medir experiência de carregamento, interatividade e estabilidade visual.',
    'Core Web Vitals são um conjunto de métricas (LCP, INP, CLS) usadas pelo Google como sinal de ranqueamento relacionado à experiência do usuário.

Este artigo é um placeholder de conteúdo semente — substitua pelo texto real quando publicar pelo CMS.',
    'published',
    'artigo',
    (select id from public.categories where slug = 'seo'),
    now()
  ),
  (
    'tokenizacao',
    'Tokenização',
    'O processo de quebrar texto em unidades menores (tokens) antes de alimentar um modelo de linguagem.',
    'Tokenização é a etapa que converte texto bruto em tokens — unidades que podem ser palavras inteiras, pedaços de palavra ou caracteres, dependendo do tokenizador.',
    'published',
    'glossario',
    (select id from public.categories where slug = 'inteligencia-artificial'),
    now()
  ),
  (
    'review-claude-vs-gpt',
    'Claude vs GPT: comparação de uso prático',
    'Uma review de uso no dia a dia — pontos fortes e fracos de cada um em tarefas reais.',
    'Esta é uma review placeholder comparando fluxos de uso reais. Substitua pelo conteúdo real quando publicar pelo CMS.',
    'published',
    'review',
    (select id from public.categories where slug = 'inteligencia-artificial'),
    now()
  ),
  (
    'n8n-vs-zapier',
    'n8n vs Zapier: qual escolher',
    'Comparativo direto entre as duas ferramentas de automação mais usadas hoje.',
    'Este é um comparativo placeholder. Substitua pelo conteúdo real quando publicar pelo CMS.',
    'published',
    'comparativo',
    (select id from public.categories where slug = 'automacao'),
    now()
  ),
  (
    'roadmap-aprender-ia-2026',
    'Roadmap para aprender IA em 2026',
    'Um caminho sugerido, do zero ao uso prático de IA no trabalho.',
    'Este é um roadmap placeholder com etapas sugeridas de aprendizado. Substitua pelo conteúdo real quando publicar pelo CMS.',
    'published',
    'roadmap',
    (select id from public.categories where slug = 'inteligencia-artificial'),
    now()
  )
on conflict (slug) do nothing;

-- ------------------------------------------------------------
-- Vincular artigos "artigo" aos seus clusters (entities)
-- ------------------------------------------------------------
insert into public.article_entities (article_id, entity_id)
select a.id, e.id
from public.articles a, public.entities e
where (a.slug, e.slug) in (
  ('o-que-sao-llms', 'llms'),
  ('prompt-engineering-basico', 'llms'),
  ('core-web-vitals-explicado', 'seo-tecnico')
)
on conflict do nothing;

-- ------------------------------------------------------------
-- Tags dos artigos
-- ------------------------------------------------------------
insert into public.article_tags (article_id, tag_id)
select a.id, t.id
from public.articles a, public.tags t
where (a.slug, t.slug) in (
  ('o-que-sao-llms', 'iniciante'),
  ('o-que-sao-llms', 'tutorial'),
  ('prompt-engineering-basico', 'iniciante'),
  ('core-web-vitals-explicado', 'avancado'),
  ('core-web-vitals-explicado', 'ferramentas')
)
on conflict do nothing;

-- ------------------------------------------------------------
-- SEO metadata — so em parte dos artigos, de proposito (o resto
-- fica "faltando" para o /admin/seo do Modulo 7 ter algo pra apontar)
-- ------------------------------------------------------------
insert into public.seo_metadata (article_id, seo_title, seo_description)
select a.id, v.seo_title, v.seo_description
from public.articles a
join (values
  ('o-que-sao-llms', 'O que são LLMs? Guia completo | VaultMindOS', 'Entenda como modelos de linguagem grandes funcionam, sem jargão desnecessário.'),
  ('core-web-vitals-explicado', 'Core Web Vitals: o guia definitivo | VaultMindOS', 'LCP, INP e CLS explicados na prática, com foco em ranqueamento.')
) as v(slug, seo_title, seo_description) on v.slug = a.slug
on conflict (article_id) do nothing;

-- ------------------------------------------------------------
-- Link interno de exemplo
-- ------------------------------------------------------------
insert into public.internal_links (from_article_id, to_article_id, anchor_text)
select a.id, b.id, 'prompt engineering'
from public.articles a, public.articles b
where a.slug = 'o-que-sao-llms' and b.slug = 'prompt-engineering-basico'
on conflict (from_article_id, to_article_id) do nothing;

insert into public.internal_links (from_article_id, to_article_id, anchor_text)
select a.id, b.id, 'LLMs'
from public.articles a, public.articles b
where a.slug = 'core-web-vitals-explicado' and b.slug = 'o-que-sao-llms'
on conflict (from_article_id, to_article_id) do nothing;
