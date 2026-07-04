-- ============================================================
-- Migration 003 — Empresa parceira: auto-cadastro + aprovação
-- Ref.: docs/blueprint/vaultmindos-academy-architecture-v1.md
-- (Fase 2, kickoff — decisão do fundador: auto-cadastro com
-- aprovação manual do admin, sem cobrança nesta fase)
--
-- Até aqui (migration 001), `organizations` só podia ser escrita
-- por admin (`org_write_admin` cobria insert/update/delete). Isso
-- bloqueava o auto-cadastro: a empresa (via seu responsável já
-- logado) precisa poder criar a própria `organizations` e a própria
-- `organization_members`, ficando pendente até um admin aprovar.
-- ============================================================

-- ------------------------------------------------------------
-- 1) Colunas de aprovação em organizations
-- ------------------------------------------------------------
alter table organizations
  add column if not exists status text not null default 'PENDING'
    check (status in ('PENDING', 'APPROVED', 'REJECTED')),
  add column if not exists requested_by uuid references auth.users(id),
  add column if not exists reviewed_by uuid references auth.users(id),
  add column if not exists reviewed_at timestamptz;

create index if not exists idx_organizations_status on organizations(status);

-- ------------------------------------------------------------
-- 2) organizations — trocar policy única "all" por policies
--    granulares: qualquer autenticado insere (sempre como PENDING,
--    se auto-declarando requested_by), só admin aprova/edita/apaga.
--
--    A policy de SELECT original (migration 001) só liberava
--    is_org_member(id) ou is_admin() — mas no exato momento do
--    cadastro (`insert(...).select().single()` no Server Action)
--    ainda não existe `organization_members` pra essa organização
--    (é inserido logo em seguida). Sem incluir `requested_by =
--    auth.uid()` aqui, o próprio INSERT teria sucesso mas o
--    RETURNING/select do Supabase falharia por RLS. Por isso
--    recriamos a policy de select incluindo essa condição.
-- ------------------------------------------------------------
drop policy if exists "org_write_admin" on organizations;
drop policy if exists "org_select_member_or_admin" on organizations;

create policy "org_select_member_or_admin_or_requester" on organizations for select
  using (is_org_member(id) or is_admin() or requested_by = auth.uid());

create policy "org_insert_self_service" on organizations for insert
  with check (
    auth.role() = 'authenticated'
    and status = 'PENDING'
    and requested_by = auth.uid()
  );

create policy "org_update_admin_only" on organizations for update
  using (is_admin())
  with check (is_admin());

create policy "org_delete_admin_only" on organizations for delete
  using (is_admin());

-- ------------------------------------------------------------
-- 3) organization_members — usuário pode se auto-inserir como
--    responsável da empresa que acabou de criar (era admin-only).
--    Update/delete continuam admin-only (promover/remover membro
--    é decisão administrativa, não self-service).
-- ------------------------------------------------------------
drop policy if exists "org_members_write_admin" on organization_members;

create policy "org_members_insert_self_or_admin" on organization_members for insert
  with check (user_id = auth.uid() or is_admin());

create policy "org_members_update_admin_only" on organization_members for update
  using (is_admin())
  with check (is_admin());

create policy "org_members_delete_admin_only" on organization_members for delete
  using (is_admin());
