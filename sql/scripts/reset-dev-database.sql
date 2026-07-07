-- ============================================================
-- RESET TOTAL — SOMENTE AMBIENTE DE DESENVOLVIMENTO
-- ============================================================
-- ⚠️  NÃO é uma migration — não rodar em produção. Isto apaga TODOS os
-- dados do projeto Supabase onde for executado: portal de conteúdo
-- (artigos/categorias/tags), Academy (cursos/matrículas/certificados),
-- Empregabilidade (empresas/vagas/candidaturas), pagamentos, bolsas,
-- auditoria e TODOS os usuários (auth.users).
--
-- Antes de rodar, confirme visualmente no topo do SQL Editor do
-- Supabase que o projeto selecionado é o de DESENVOLVIMENTO — não tem
-- como desfazer depois de rodar (não é lixeira, é exclusão real).
--
-- Como rodar: copiar este arquivo inteiro no SQL Editor do Supabase
-- Dashboard (projeto de dev) e executar. As duas partes (1 e 2) podem
-- rodar juntas ou separadas — juntas é mais simples.
-- ============================================================

-- ------------------------------------------------------------
-- PARTE 1 — Zera todas as tabelas do schema public (CASCADE resolve a
-- ordem de dependência entre FKs automaticamente, não importa a ordem
-- em que as tabelas aparecem na lista).
-- ------------------------------------------------------------
truncate table
  -- Portal de conteúdo (CMS)
  articles,
  categories,
  tags,
  article_tags,
  article_entities,
  seo_metadata,
  internal_links,
  entities,
  subscribers,
  -- Perfil complementar (também seria apagado em cascata pelo delete de
  -- auth.users na Parte 2, mas incluído aqui pra Parte 1 poder rodar
  -- sozinha se um dia for útil sem mexer em auth.users)
  users_profile,
  -- Academy — catálogo
  sectors,
  courses,
  modules,
  lessons,
  competencies,
  course_competencies,
  -- Academy — empresa parceira / empregabilidade
  organizations,
  organization_members,
  job_postings,
  job_posting_competencies,
  job_matches,
  -- Academy — aluno e progresso
  enrollments,
  user_progress,
  evidences,
  certificates,
  candidate_competency_ratings,
  interview_practice_answers,
  -- Pagamentos e bolsas
  payments,
  scholarship_coupons,
  scholarship_grants,
  -- Auditoria
  audit_log
restart identity cascade;

-- ------------------------------------------------------------
-- PARTE 2 — Apaga todos os usuários de autenticação. Isso cascade-
-- deleta qualquer linha de users_profile remanescente (FK on delete
-- cascade, ver schema-v1.sql linha 19) — redundante com a Parte 1, mas
-- não custa nada. Depois disso, TODOS precisam se cadastrar de novo em
-- /signup, inclusive você.
-- ------------------------------------------------------------
delete from auth.users;

-- ------------------------------------------------------------
-- Verificação (rodar depois, cada uma deve devolver 0)
-- ------------------------------------------------------------
-- select count(*) from articles;
-- select count(*) from courses;
-- select count(*) from auth.users;

-- ------------------------------------------------------------
-- Depois deste script: siga o roteiro em
-- docs/blueprint/vaultmindos-roteiro-teste-zero-v1.md — ele cobre, na
-- ordem certa: seu próprio cadastro (e como se promover a admin pelo
-- Dashboard, já que todo signup novo nasce "subscriber"), cadastro da
-- sua empresa, criação do curso básico pela nova tela
-- /admin/academy/cursos, criação dos cupons de bolsa 100%/50%, e o
-- teste dos 3 fluxos de matrícula.
-- ============================================================
