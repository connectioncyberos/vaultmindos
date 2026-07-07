-- ============================================================
-- Migration 009 — Auditoria mínima (Prioridade 4 do cronograma
-- pós-análise Enterprise, ver docs/blueprint/vaultmindos-comparativo-enterprise-v1.md
-- e docs/blueprint/vaultmindos-cronograma-implementacao-v1.md)
--
-- Objetivo: rastreabilidade de eventos críticos de negócio (não é log
-- de aplicação/erro — isso é responsabilidade da Vercel/observabilidade
-- de infraestrutura, fora de escopo deste arquivo). Cobre: aprovação/
-- rejeição de empresa parceira, mudança de status de pagamento
-- (reconciliação Mercado Pago), publicação/mudança de status de vaga,
-- avanço de candidato no pipeline.
-- ============================================================

create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id),
  actor_label text,          -- fallback legível quando não há sessão de usuário (ex.: "Mercado Pago — reconciliação de webhook")
  action text not null,      -- 'organization.approve' | 'organization.reject' | 'payment.status_changed' | 'job_posting.create' | 'job_posting.status_changed' | 'job_match.status_changed'
  entity_type text not null, -- 'organization' | 'payment' | 'job_posting' | 'job_match'
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_log_entity on audit_log(entity_type, entity_id);
create index if not exists idx_audit_log_actor on audit_log(actor_id);
create index if not exists idx_audit_log_created on audit_log(created_at desc);

alter table audit_log enable row level security;

-- Só admin lê o log de auditoria — é dado sensível de rastreabilidade,
-- não algo que um RH de empresa parceira ou aluno deveria enxergar.
drop policy if exists "audit_log_select_admin" on audit_log;
create policy "audit_log_select_admin" on audit_log for select
  using (is_admin());

-- Insert: o próprio usuário autenticado registrando a própria ação, ou
-- admin. Chamadas feitas via service role (webhook do Mercado Pago em
-- lib/payments/grant.ts) ignoram RLS por natureza (service role bypassa
-- RLS) — esta policy cobre o caminho normal (Server Actions com sessão).
drop policy if exists "audit_log_insert_own_or_admin" on audit_log;
create policy "audit_log_insert_own_or_admin" on audit_log for insert
  with check (actor_id = auth.uid() or is_admin());

-- Ninguém edita ou apaga log de auditoria pela aplicação — histórico é
-- imutável por design. Sem policy de update/delete = bloqueado por
-- padrão do RLS (nenhuma policy permissiva = nega tudo).
