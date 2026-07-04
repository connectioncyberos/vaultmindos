# VaultMindOS — Academy Architecture v1.0

**Status:** Aprovado para construção
**Data:** 2026-07-03
**Repositório:** `vaultmindos` (módulo novo, dentro do repositório existente — não é um produto separado)
**Origem da decisão:** `connectioncyberos/docs/projects/legacy-assets-audit-v1.md` (reaproveitamento aprovado do schema `courses/modules/lessons/enrollments/user_progress` + padrão `portal/page.tsx` do `vaultmindos-OLD1`) + conteúdo de planejamento do `portal-empregabilidade-os`.

## 1. Objetivo

Adicionar ao VaultMindOS (hoje um portal de conteúdo/artigos, sem módulo de cursos) uma Academy com trilhas de formação, incluindo uma trilha de **Empregabilidade** (1º emprego / recolocação) com o lado empresa incluso: cadastro de empresas parceiras e matching de candidatos para vagas.

Escopo confirmado com o fundador:
- Formação + empresas (B2B) desde o desenho inicial — não só B2C.
- Multi-tenant desde já — mesmo princípio de isolamento por tenant já obrigatório no `igrejas-web-system-os`, adaptado para este contexto.

## 2. Decisão de tenant: o que é multi-tenant e o que é catálogo global

Diferente do `igrejas-web-system-os` (onde `ministry_id` é obrigatório em toda tabela), aqui o isolamento por tenant **não se aplica ao catálogo de conteúdo** — cursos, trilhas e competências são produzidos pela ConnectionCyber e compartilhados por todos os alunos, exatamente como os artigos do VaultMindOS já são hoje.

O tenant real do lado B2B é a **empresa parceira** (`organizations`). O que precisa de isolamento por empresa:
- vagas publicadas (`job_postings`)
- candidatos/matching daquela vaga (`job_matches`)
- visão de progresso da equipe patrocinada (RH só vê os próprios funcionários)

O que **não** é isolado por empresa (catálogo global, somente leitura para todos os autenticados):
- setores, cursos, módulos, aulas, competências

Essa distinção evita superaplicar RLS onde não é necessário e mantém o catálogo simples de manter (um curso não pertence a uma empresa).

## 3. Modelo de dados

```sql
-- ============================================================
-- CATÁLOGO GLOBAL (compartilhado — sem tenant)
-- ============================================================

create table sectors (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,          -- administrativo-4-0, seguranca-automacao, redes, suporte-hardware, eletrica, fiscal-mei
  name text not null,
  description text,
  is_active boolean not null default true
);

create table courses (
  id uuid primary key default gen_random_uuid(),
  sector_id uuid references sectors(id),   -- null = nivelamento (obrigatório, não pertence a um setor)
  slug text unique not null,
  title text not null,
  description text,
  level text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  title text not null,
  order_index int not null default 0
);

create table lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references modules(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  slug text not null,
  title text not null,
  video_url text,
  order_index int not null default 0,
  is_preview boolean not null default false
);

create table competencies (
  id uuid primary key default gen_random_uuid(),
  sector_id uuid references sectors(id),
  name text not null,             -- Operação de ERP, Configuração de Câmeras IP, Wi-Fi 6...
  kind text not null default 'TECNICA'  -- TECNICA, COMPORTAMENTAL, OPERACIONAL, DIGITAL
);

create table course_competencies (
  course_id uuid not null references courses(id) on delete cascade,
  competency_id uuid not null references competencies(id) on delete cascade,
  primary key (course_id, competency_id)
);

-- ============================================================
-- ALUNO E PROGRESSO (já validado no vaultmindos-OLD1 — reaproveitar como está)
-- ============================================================

create table enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  course_id uuid not null references courses(id),
  organization_id uuid references organizations(id),  -- null = matrícula individual; preenchido = patrocinada por empresa
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  unique (user_id, course_id)
);

create table user_progress (
  user_id uuid not null references auth.users(id),
  lesson_id uuid not null references lessons(id),
  is_completed boolean not null default false,
  last_watched_at timestamptz,
  primary key (user_id, lesson_id)
);

create table evidences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  competency_id uuid not null references competencies(id),
  course_id uuid references courses(id),
  description text,
  file_url text,
  created_at timestamptz not null default now()
);

create table certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  course_id uuid not null references courses(id),
  issued_at timestamptz not null default now(),
  code text unique not null
);

-- ============================================================
-- EMPRESA PARCEIRA (tenant real — RLS obrigatório a partir daqui)
-- ============================================================

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cnpj text unique,
  sector text,
  created_at timestamptz not null default now()
);

create table organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'MEMBER',   -- RESPONSAVEL_RH, GESTOR_AREA, ALUNO_PATROCINADO
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table job_postings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  title text not null,
  sector_id uuid references sectors(id),
  status text not null default 'OPEN',   -- OPEN, PAUSED, CLOSED
  created_at timestamptz not null default now()
);

create table job_posting_competencies (
  job_posting_id uuid not null references job_postings(id) on delete cascade,
  competency_id uuid not null references competencies(id) on delete cascade,
  primary key (job_posting_id, competency_id)
);

create table job_matches (
  id uuid primary key default gen_random_uuid(),
  job_posting_id uuid not null references job_postings(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  score numeric,
  status text not null default 'SUGGESTED',  -- SUGGESTED, CONTACTED, HIRED, REJECTED
  created_at timestamptz not null default now()
);
```

**RLS:**
- `sectors`, `courses`, `modules`, `lessons`, `competencies`, `course_competencies`: leitura liberada para qualquer usuário autenticado; escrita restrita a admin.
- `enrollments`, `user_progress`, `evidences`, `certificates`: usuário só vê/edita as próprias linhas (`user_id = auth.uid()`); se `organization_id` estiver preenchido, membros com papel `RESPONSAVEL_RH`/`GESTOR_AREA` daquela `organization_id` também podem ler (não editar).
- `organizations`, `organization_members`, `job_postings`, `job_posting_competencies`, `job_matches`: RLS por `organization_id`, só membros daquela organização enxergam — este é o tenant de verdade.

## 4. Estrutura de rotas (dentro do repositório `vaultmindos` existente)

```
app/
  (academy)/
    academy/                        -- área do aluno (B2C)
      page.tsx                      -- dashboard do aluno, trilhas em andamento
      trilhas/
        [sectorSlug]/page.tsx
      cursos/[cursoId]/
        page.tsx
        aulas/[aulaId]/page.tsx     -- reaproveita o padrão portal/page.tsx do OLD1
      certificados/page.tsx
    empresas/                       -- área da empresa parceira (B2B)
      page.tsx                      -- dashboard RH: equipe patrocinada, progresso
      vagas/
        page.tsx
        nova/page.tsx
        [vagaId]/candidatos/page.tsx
  admin/
    academy/
      cursos/page.tsx
      cursos/novo/page.tsx
      trilhas/page.tsx
      competencias/page.tsx
      empresas/page.tsx              -- cadastro/aprovação de empresas parceiras
```

Segue a mesma convenção já usada em `app/admin/artigos`, `app/admin/categorias`: Server Components por padrão, Server Actions em `actions.ts` junto à rota, `"use client"` só em formulários/estado.

## 5. Identidade visual

Enterprise Emerald — confirmado por três fontes independentes (`vaultmindos-OLD1`, `zz-matriz-sistemas/vaultmind-theme.json`, `NOVO PROJETO GLOBAL/identidade visual do projeto Vault`). Reaproveitar os tokens já validados (`bg-neutral-950`, `emerald-500 #10b981`, `emerald-600 #059669`, Inter). O player de aula (`aulas/[aulaId]/page.tsx`) usa como referência de UX o `EscolaLessonPlayer`/`CursosLessonPlayer` visto em `portal-teologico-os`, adaptado à paleta emerald.

## 6. Conteúdo já existente a aproveitar (não é código, é insumo)

Os 18 documentos do `portal-empregabilidade-os` (`_docs/001` a `018`) viram conteúdo, não sistema:
- `005 Mapa de Competências por Setor` e `006 MATRIZ COMPLETA` → seed de `competencies` e `course_competencies`.
- `002 Plano Técnico Completo por Setor` → estrutura de `courses`/`modules`/`lessons` por setor.
- `003 Nível de Nivelamento` → o curso obrigatório sem `sector_id` (nivelamento).

## 7. Fases de construção (viabilidade)

O banco já nasce pronto para o escopo completo (B2B + multi-tenant), mas a entrega é faseada para ter algo real e ofertável o quanto antes:

**Fase 1 — Formação individual (B2C funcional):** schema completo criado e com RLS; interface do aluno; nivelamento + trilha piloto de 1 setor (Administrativo 4.0, por ter o exemplo mais completo nos docs); matrícula, progresso, certificado. Sem tela de empresa ainda — mas o banco já suporta.

**Fase 2 — Empresa parceira (B2B básico):** tela `empresas/`, cadastro de organização, matrícula patrocinada (`enrollments.organization_id`), relatório de progresso da equipe para RH.

**Fase 3 — Matching:** `job_postings` + `job_matches`, cruzando competências do aluno (via `evidences` e cursos concluídos) com vagas publicadas.

## 8. Fora de escopo por enquanto

- Pagamento/assinatura (monetização) — fica para depois da Fase 1 validada.
- Demais setores do plano original (Redes, Suporte, Elétrica, Fiscal) — entram um de cada vez após o piloto.
- Qualquer upgrade de stack (o `vaultmindos` está em Next 14/React 18/Tailwind 3; `portal-teologico-os` e `igrejas-web-system-os` já estão em Next 16/React 19/Tailwind 4) — não faz parte desta arquitetura, é uma decisão separada a avaliar depois.

## 9. Fase 2 — kickoff (decisões do fundador, 2026-07-04)

Ao decidir avançar de "cadastro manual/piloto" para "cadastro real", três decisões foram tomadas:

- **Cadastro de aluno:** abrir `/signup` público e self-service (Supabase Auth com confirmação de
  e-mail), reaproveitando o trigger `handle_new_user` já existente. Login manual via Dashboard
  continua existindo só para promover alguém a admin/editor/author.
- **Cadastro de empresa parceira:** auto-cadastro em `/empresas/cadastro` com aprovação manual do
  admin em `/admin/academy/empresas` (migration `003_organizations_self_service.sql` adiciona
  `status`/`requested_by`/`reviewed_by`/`reviewed_at` em `organizations` e troca a policy única
  admin-only por policies granulares: insert self-service forçando `status = 'PENDING'`,
  update/delete só admin).
- **Monetização:** continua fora de escopo — cadastro e matrícula (individual ou patrocinada) seguem
  gratuitos até a Fase 1/2 estarem validadas com uso real.

Ainda não construído nesta rodada (próximo passo natural da Fase 2): tela de convite/matrícula
patrocinada dentro de `/empresas` (hoje uma empresa aprovada só vê status "Aprovada", sem ainda
poder convidar colaboradores) e o relatório de progresso da equipe para o RH.

Termos de Uso (`/termos`) e Política de Privacidade (`/privacidade`) publicados como rascunho para
destravar o checkbox de aceite do LGPD nos cadastros — **texto genérico, não revisado por advogado**;
recomenda-se revisão jurídica antes de operar com usuários reais em produção.
