-- ============================================================
-- Migration 006 — Perfil de candidato (Portal de Empregabilidade)
-- Ref.: docs/blueprint/vaultmindos-academy-architecture-v1.md, seção 14
-- (decisão: nível universal — documento de identidade com TIPO variável,
-- não uma coluna "cpf" fixa, pra não acoplar o schema só ao Brasil)
-- ============================================================

-- ------------------------------------------------------------
-- 1) users_profile — campos de candidato
-- ------------------------------------------------------------
alter table users_profile
  add column if not exists identity_doc_type text
    check (identity_doc_type is null or identity_doc_type in ('CPF', 'PASSPORT', 'NATIONAL_ID', 'OTHER')),
  add column if not exists identity_doc_value text,
  add column if not exists career_objective text,
  add column if not exists is_first_job_seeker boolean;

-- ------------------------------------------------------------
-- 2) Autoavaliação de competências — reaproveita a tabela
--    `competencies` já existente (migration 001), em vez de criar um
--    catálogo de skill novo. Cada candidato se autoavalia de 1 a 5 por
--    competência; usado no cálculo de match de vaga (migration 007) e
--    no construtor de currículo.
-- ------------------------------------------------------------
create table if not exists candidate_competency_ratings (
  user_id uuid not null references auth.users(id) on delete cascade,
  competency_id uuid not null references competencies(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  updated_at timestamptz not null default now(),
  primary key (user_id, competency_id)
);

alter table candidate_competency_ratings enable row level security;

drop policy if exists "candidate_ratings_select_own_or_admin" on candidate_competency_ratings;
drop policy if exists "candidate_ratings_insert_own" on candidate_competency_ratings;
drop policy if exists "candidate_ratings_update_own" on candidate_competency_ratings;

create policy "candidate_ratings_select_own_or_admin" on candidate_competency_ratings for select
  using (user_id = auth.uid() or is_admin());

create policy "candidate_ratings_insert_own" on candidate_competency_ratings for insert
  with check (user_id = auth.uid());

create policy "candidate_ratings_update_own" on candidate_competency_ratings for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
