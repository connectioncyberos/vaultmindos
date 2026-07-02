-- ============================================================
-- VaultMindOS — Schema Inicial v1.0
-- Modulo 4 do Master Execution Roadmap
--
-- Como aplicar: copiar este arquivo inteiro no Supabase Dashboard
-- (SQL Editor) do projeto "vaultmindos" e rodar. Idempotente
-- (usa IF NOT EXISTS) — pode rodar de novo sem duplicar.
-- ============================================================

-- ------------------------------------------------------------
-- Extensoes
-- ------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- users_profile — perfil complementar ao auth.users do Supabase
-- ------------------------------------------------------------
create table if not exists public.users_profile (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  role text not null default 'subscriber'
    check (role in ('admin', 'editor', 'author', 'subscriber')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- categories
-- ------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- tags
-- ------------------------------------------------------------
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- entities — conceitos/"clusters" do Vault (rota /vault/[domain]/[cluster])
-- ------------------------------------------------------------
create table if not exists public.entities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  type text,
  description text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- articles
-- ------------------------------------------------------------
create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  content text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  category_id uuid references public.categories (id) on delete set null,
  author_id uuid references public.users_profile (id) on delete set null,
  cover_image_url text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_articles_status on public.articles (status);
create index if not exists idx_articles_category on public.articles (category_id);
create index if not exists idx_articles_slug on public.articles (slug);

-- ------------------------------------------------------------
-- article_tags — N:N articles <-> tags
-- ------------------------------------------------------------
create table if not exists public.article_tags (
  article_id uuid not null references public.articles (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (article_id, tag_id)
);

-- ------------------------------------------------------------
-- article_entities — N:N articles <-> entities
-- ------------------------------------------------------------
create table if not exists public.article_entities (
  article_id uuid not null references public.articles (id) on delete cascade,
  entity_id uuid not null references public.entities (id) on delete cascade,
  primary key (article_id, entity_id)
);

-- ------------------------------------------------------------
-- seo_metadata — 1:1 com articles
-- ------------------------------------------------------------
create table if not exists public.seo_metadata (
  article_id uuid primary key references public.articles (id) on delete cascade,
  seo_title text,
  seo_description text,
  canonical_url text,
  og_image_url text,
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- internal_links — grafo de links internos entre artigos
-- ------------------------------------------------------------
create table if not exists public.internal_links (
  id uuid primary key default gen_random_uuid(),
  from_article_id uuid not null references public.articles (id) on delete cascade,
  to_article_id uuid not null references public.articles (id) on delete cascade,
  anchor_text text,
  created_at timestamptz not null default now(),
  unique (from_article_id, to_article_id)
);

-- ------------------------------------------------------------
-- subscribers — newsletter
-- ------------------------------------------------------------
create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  confirmed boolean not null default false,
  subscribed_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);

-- ============================================================
-- Row Level Security (RLS) — habilitado desde o primeiro dia
-- ============================================================

alter table public.users_profile enable row level security;
alter table public.categories enable row level security;
alter table public.tags enable row level security;
alter table public.entities enable row level security;
alter table public.articles enable row level security;
alter table public.article_tags enable row level security;
alter table public.article_entities enable row level security;
alter table public.seo_metadata enable row level security;
alter table public.internal_links enable row level security;
alter table public.subscribers enable row level security;

-- Leitura publica do conteudo ja publicado (Portal Publico, Modulo 6)
drop policy if exists "public read published articles" on public.articles;
create policy "public read published articles" on public.articles
  for select using (status = 'published');

drop policy if exists "public read categories" on public.categories;
create policy "public read categories" on public.categories
  for select using (true);

drop policy if exists "public read tags" on public.tags;
create policy "public read tags" on public.tags
  for select using (true);

drop policy if exists "public read entities" on public.entities;
create policy "public read entities" on public.entities
  for select using (true);

drop policy if exists "public read seo of published articles" on public.seo_metadata;
create policy "public read seo of published articles" on public.seo_metadata
  for select using (
    exists (
      select 1 from public.articles a
      where a.id = seo_metadata.article_id and a.status = 'published'
    )
  );

-- Perfil: usuario le/atualiza apenas o proprio
drop policy if exists "users read own profile" on public.users_profile;
create policy "users read own profile" on public.users_profile
  for select using (auth.uid() = id);

drop policy if exists "users update own profile" on public.users_profile;
create policy "users update own profile" on public.users_profile
  for update using (auth.uid() = id);

-- Newsletter: qualquer um pode se inscrever (insert), ninguem le a lista
drop policy if exists "anyone can subscribe" on public.subscribers;
create policy "anyone can subscribe" on public.subscribers
  for insert with check (true);

-- Escrita de conteudo (articles, categories, tags, seo, links) fica
-- restrita a admin/editor/author — implementada no Modulo 7 (CMS)
-- via policies que checam users_profile.role, junto com a definicao
-- final das rotas /admin. Deixado fora deste schema v1 para nao
-- travar o Modulo 4 numa decisao de UX que ainda nao foi tomada.
