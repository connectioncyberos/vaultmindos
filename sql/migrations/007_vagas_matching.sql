-- ============================================================
-- Migration 007 — Vagas + Matching (Fase 3, Portal de Empregabilidade)
-- Ref.: docs/blueprint/vaultmindos-academy-architecture-v1.md, seção 14
-- Schema de job_postings/job_posting_competencies/job_matches já existia
-- desde a migration 001 (nunca usado) — aqui só ajustamos RLS pra
-- permitir o fluxo de candidato (ver vagas abertas, demonstrar
-- interesse) que antes só existia pro lado da empresa/admin.
-- ============================================================

-- ------------------------------------------------------------
-- 1) job_postings — candidato autenticado pode ver vagas ABERTAS de
--    qualquer empresa (antes só via is_org_member/is_admin, o que
--    escondia vagas de quem não é da empresa — inviável pro candidato
--    externo procurar emprego). Múltiplas policies permissivas de
--    SELECT se somam com OR, então isso não reduz o que já existia.
-- ------------------------------------------------------------
drop policy if exists "job_postings_select_public_open" on job_postings;
create policy "job_postings_select_public_open" on job_postings for select
  using (status = 'OPEN');

-- ------------------------------------------------------------
-- 2) job_posting_competencies — mesma lógica, pra listar as
--    competências exigidas na tela pública de vagas.
-- ------------------------------------------------------------
drop policy if exists "job_posting_competencies_select_public_open" on job_posting_competencies;
create policy "job_posting_competencies_select_public_open" on job_posting_competencies for select
  using (
    exists (
      select 1 from job_postings jp
      where jp.id = job_posting_id and jp.status = 'OPEN'
    )
  );

-- Empresa parceira (RH/gestor) passa a poder gerenciar as competências
-- da própria vaga — antes só admin escrevia aqui.
drop policy if exists "job_posting_competencies_write_admin" on job_posting_competencies;
drop policy if exists "job_posting_competencies_write_admin_or_org_hr" on job_posting_competencies;
create policy "job_posting_competencies_write_admin_or_org_hr" on job_posting_competencies for all
  using (
    is_admin() or exists (
      select 1 from job_postings jp where jp.id = job_posting_id and is_org_hr(jp.organization_id)
    )
  )
  with check (
    is_admin() or exists (
      select 1 from job_postings jp where jp.id = job_posting_id and is_org_hr(jp.organization_id)
    )
  );

-- ------------------------------------------------------------
-- 3) job_matches — candidato demonstra interesse (insere a própria
--    linha, status inicial SUGGESTED por default) e o RH da empresa
--    dona da vaga atualiza o status (CONTACTED/HIRED/REJECTED) pra
--    acompanhar o pipeline. Antes só admin escrevia (`for all`).
-- ------------------------------------------------------------
drop policy if exists "job_matches_insert_own" on job_matches;
create policy "job_matches_insert_own" on job_matches for insert
  with check (user_id = auth.uid());

drop policy if exists "job_matches_update_org_hr" on job_matches;
create policy "job_matches_update_org_hr" on job_matches for update
  using (
    exists (
      select 1 from job_postings jp
      where jp.id = job_posting_id and is_org_hr(jp.organization_id)
    )
  )
  with check (
    exists (
      select 1 from job_postings jp
      where jp.id = job_posting_id and is_org_hr(jp.organization_id)
    )
  );

-- Evita duplicar "interesse" no mesmo clique repetido / duplo submit.
alter table job_matches add constraint job_matches_unique_posting_user unique (job_posting_id, user_id);

-- ------------------------------------------------------------
-- 4) users_profile — RH da empresa precisa ver o nome de quem
--    demonstrou interesse nas vagas DELA (só isso, não qualquer
--    usuário) pra gerenciar o pipeline em /empresas/vagas. Sem essa
--    policy a consulta simplesmente não retorna nada (RLS filtra
--    silenciosamente), então o RH veria "Usuário XXXXXXXX" pra todo
--    mundo — funcional, mas menos útil.
-- ------------------------------------------------------------
drop policy if exists "users_profile_select_org_hr_candidates" on users_profile;
create policy "users_profile_select_org_hr_candidates" on users_profile for select
  using (
    exists (
      select 1 from job_matches jm
      join job_postings jp on jp.id = jm.job_posting_id
      where jm.user_id = users_profile.id and is_org_hr(jp.organization_id)
    )
  );
