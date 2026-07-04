-- ============================================================
-- Migration 001 — VaultMindOS Academy
-- Ref.: docs/blueprint/vaultmindos-academy-architecture-v1.md
-- Convenção de papéis: users_profile.role (admin | editor | author | subscriber)
--   já existente desde o Módulo 5 (lib/auth/session.ts)
--
-- Ordem: tabelas primeiro, funções auxiliares depois (uma função
-- LANGUAGE sql é validada contra o catálogo na hora da criação, então
-- ela só pode ser criada depois que as tabelas que referencia existem).
-- ============================================================

-- ============================================================
-- 1) CATÁLOGO GLOBAL (compartilhado — sem tenant)
-- ============================================================

create table sectors (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table courses (
  id uuid primary key default gen_random_uuid(),
  sector_id uuid references sectors(id),
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
  name text not null,
  kind text not null default 'TECNICA'
    check (kind in ('TECNICA', 'COMPORTAMENTAL', 'OPERACIONAL', 'DIGITAL'))
);

create table course_competencies (
  course_id uuid not null references courses(id) on delete cascade,
  competency_id uuid not null references competencies(id) on delete cascade,
  primary key (course_id, competency_id)
);

-- ============================================================
-- 2) EMPRESA PARCEIRA (tenant) — precisa existir antes das funções
--    auxiliares que dependem dela
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
  role text not null default 'MEMBER'
    check (role in ('MEMBER', 'RESPONSAVEL_RH', 'GESTOR_AREA', 'ALUNO_PATROCINADO')),
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

-- ============================================================
-- 3) ALUNO E PROGRESSO
-- ============================================================

create table enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  course_id uuid not null references courses(id),
  organization_id uuid references organizations(id),
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'COMPLETED', 'CANCELLED')),
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
-- 4) VAGAS (tenant real)
-- ============================================================

create table job_postings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  title text not null,
  sector_id uuid references sectors(id),
  status text not null default 'OPEN' check (status in ('OPEN', 'PAUSED', 'CLOSED')),
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
  status text not null default 'SUGGESTED'
    check (status in ('SUGGESTED', 'CONTACTED', 'HIRED', 'REJECTED')),
  created_at timestamptz not null default now()
);

-- ============================================================
-- 5) FUNÇÕES AUXILIARES (agora que todas as tabelas referenciadas
--    já existem: users_profile já existia antes desta migration;
--    organization_members foi criada acima)
-- ============================================================

create or replace function is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from users_profile
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function is_org_member(target_org_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from organization_members
    where organization_id = target_org_id and user_id = auth.uid()
  );
$$;

create or replace function is_org_hr(target_org_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from organization_members
    where organization_id = target_org_id
      and user_id = auth.uid()
      and role in ('RESPONSAVEL_RH', 'GESTOR_AREA')
  );
$$;

-- ============================================================
-- 6) ROW LEVEL SECURITY + POLICIES (agora que as funções existem)
-- ============================================================

alter table sectors enable row level security;
alter table courses enable row level security;
alter table modules enable row level security;
alter table lessons enable row level security;
alter table competencies enable row level security;
alter table course_competencies enable row level security;
alter table organizations enable row level security;
alter table organization_members enable row level security;
alter table enrollments enable row level security;
alter table user_progress enable row level security;
alter table evidences enable row level security;
alter table certificates enable row level security;
alter table job_postings enable row level security;
alter table job_posting_competencies enable row level security;
alter table job_matches enable row level security;

-- Catálogo: leitura para qualquer autenticado, escrita só admin
create policy "catalogo_select_authenticated" on sectors for select using (auth.role() = 'authenticated');
create policy "catalogo_write_admin" on sectors for all using (is_admin()) with check (is_admin());

create policy "catalogo_select_authenticated" on courses for select using (auth.role() = 'authenticated');
create policy "catalogo_write_admin" on courses for all using (is_admin()) with check (is_admin());

create policy "catalogo_select_authenticated" on modules for select using (auth.role() = 'authenticated');
create policy "catalogo_write_admin" on modules for all using (is_admin()) with check (is_admin());

create policy "catalogo_select_authenticated" on lessons for select using (auth.role() = 'authenticated');
create policy "catalogo_write_admin" on lessons for all using (is_admin()) with check (is_admin());

create policy "catalogo_select_authenticated" on competencies for select using (auth.role() = 'authenticated');
create policy "catalogo_write_admin" on competencies for all using (is_admin()) with check (is_admin());

create policy "catalogo_select_authenticated" on course_competencies for select using (auth.role() = 'authenticated');
create policy "catalogo_write_admin" on course_competencies for all using (is_admin()) with check (is_admin());

-- Organizations: membro enxerga a própria organização; admin enxerga todas
create policy "org_select_member_or_admin" on organizations for select
  using (is_org_member(id) or is_admin());
create policy "org_write_admin" on organizations for all
  using (is_admin()) with check (is_admin());

-- Organization members: cada um enxerga os membros da própria organização
create policy "org_members_select" on organization_members for select
  using (is_org_member(organization_id) or is_admin());
create policy "org_members_write_admin" on organization_members for all
  using (is_admin()) with check (is_admin());

-- Enrollments: dono da linha, ou RH/gestor da organização patrocinadora, ou admin
create policy "enrollments_select" on enrollments for select
  using (
    user_id = auth.uid()
    or is_admin()
    or (organization_id is not null and is_org_hr(organization_id))
  );
create policy "enrollments_insert_own" on enrollments for insert
  with check (user_id = auth.uid() or is_admin());
create policy "enrollments_update_own" on enrollments for update
  using (user_id = auth.uid() or is_admin());

-- User progress: só o próprio aluno lê/escreve
create policy "progress_select_own" on user_progress for select
  using (user_id = auth.uid() or is_admin());
create policy "progress_upsert_own" on user_progress for insert
  with check (user_id = auth.uid());
create policy "progress_update_own" on user_progress for update
  using (user_id = auth.uid());

-- Evidences: dono, ou admin
create policy "evidences_select_own" on evidences for select
  using (user_id = auth.uid() or is_admin());
create policy "evidences_insert_own" on evidences for insert
  with check (user_id = auth.uid());

-- Certificates: leitura só do próprio dono (ou admin), escrita só admin/sistema
create policy "certificates_select_own" on certificates for select
  using (user_id = auth.uid() or is_admin());
create policy "certificates_write_admin" on certificates for all
  using (is_admin()) with check (is_admin());

-- Vagas: visíveis pra membros da organização; escrita por RH/gestor da própria organização
create policy "job_postings_select_org_or_admin" on job_postings for select
  using (is_org_member(organization_id) or is_admin());
create policy "job_postings_write_org_hr" on job_postings for all
  using (is_org_hr(organization_id) or is_admin())
  with check (is_org_hr(organization_id) or is_admin());

create policy "job_posting_competencies_select" on job_posting_competencies for select
  using (
    exists (
      select 1 from job_postings jp
      where jp.id = job_posting_id and (is_org_member(jp.organization_id) or is_admin())
    )
  );
create policy "job_posting_competencies_write_admin" on job_posting_competencies for all
  using (is_admin()) with check (is_admin());

create policy "job_matches_select_own_or_org_or_admin" on job_matches for select
  using (
    user_id = auth.uid()
    or is_admin()
    or exists (
      select 1 from job_postings jp
      where jp.id = job_posting_id and is_org_hr(jp.organization_id)
    )
  );
create policy "job_matches_write_admin" on job_matches for all
  using (is_admin()) with check (is_admin());

-- ============================================================
-- 7) Índices de apoio
-- ============================================================
create index idx_courses_sector on courses(sector_id);
create index idx_modules_course on modules(course_id);
create index idx_lessons_module on lessons(module_id);
create index idx_lessons_course on lessons(course_id);
create index idx_enrollments_user on enrollments(user_id);
create index idx_enrollments_org on enrollments(organization_id);
create index idx_org_members_org on organization_members(organization_id);
create index idx_org_members_user on organization_members(user_id);
create index idx_job_postings_org on job_postings(organization_id);
create index idx_job_matches_posting on job_matches(job_posting_id);
