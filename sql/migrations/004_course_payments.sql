-- ============================================================
-- Migration 004 — Gate de pagamento (Mercado Pago, Checkout Pro)
-- Ref.: docs/blueprint/vaultmindos-academy-architecture-v1.md
-- (Fase 2 — decisão do fundador: cobrar só o curso piloto
-- Administrativo 4.0; Nivelamento continua gratuito como porta de
-- entrada. Checkout Pro = página hospedada do Mercado Pago.)
-- ============================================================

-- ------------------------------------------------------------
-- 1) courses.price_cents — null ou 0 = gratuito (comportamento
--    atual, sem mudança pra Nivelamento e futuros cursos gratuitos)
-- ------------------------------------------------------------
alter table courses
  add column if not exists price_cents integer;

alter table courses
  add constraint courses_price_cents_check check (price_cents is null or price_cents >= 0);

-- Preço placeholder do piloto — ajustar depois via SQL Editor
-- (update courses set price_cents = X where slug = 'administrativo-4-0';)
update courses set price_cents = 9700 where slug = 'administrativo-4-0';

-- ------------------------------------------------------------
-- 2) payments — rastreia cada cobrança criada (preferência do
--    Mercado Pago) e o resultado confirmado (via webhook ou via
--    checagem direta no retorno do checkout, nunca confiando só
--    no que a URL de retorno diz).
-- ------------------------------------------------------------
create table payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  course_id uuid not null references courses(id),
  amount_cents integer not null,
  status text not null default 'PENDING'
    check (status in ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
  mp_preference_id text,
  mp_payment_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_payments_user on payments(user_id);
create index idx_payments_course on payments(course_id);
create index idx_payments_mp_payment_id on payments(mp_payment_id);

alter table payments enable row level security;

-- Usuário vê só os próprios pagamentos; admin vê todos.
create policy "payments_select_own_or_admin" on payments for select
  using (user_id = auth.uid() or is_admin());

-- Criação acontece pela Server Action do próprio usuário (ao iniciar
-- o checkout) — nunca pelo webhook, que roda com a service role key
-- (bypassa RLS) e só faz UPDATE.
create policy "payments_insert_own" on payments for insert
  with check (user_id = auth.uid());

-- Nenhuma policy de UPDATE aqui de propósito: quem atualiza o status
-- (aprovado/rejeitado) é o webhook/confirmação server-only usando a
-- service role key (lib/supabase/service.ts), que ignora RLS. Um
-- usuário comum nunca deve poder se auto-aprovar um pagamento.
