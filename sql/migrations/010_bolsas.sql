-- ============================================================
-- Migration 010 — Sistema de bolsas (cupom + concessão direta)
-- Ref.: docs/blueprint/vaultmindos-cronograma-implementacao-v1.md
-- Pedido do fundador: bolsa 100%, bolsa 50% e pagamento normal
-- (PIX/cartão via Mercado Pago Checkout Pro, sem mudança de código —
-- Checkout Pro já mostra os métodos habilitados na conta) para testar
-- um curso do zero.
--
-- Modelo: `scholarship_grants` é a autorização de desconto pra um
-- par (aluno, curso) — vem de um cupom autosserviço OU de concessão
-- direta do admin. 100% de desconto libera matrícula na hora (nunca
-- passa pelo Mercado Pago). Desconto parcial (ex.: 50%) só ajusta o
-- valor cobrado no checkout normal — sem criar caminho de pagamento
-- paralelo.
-- ============================================================

-- ------------------------------------------------------------
-- 1) scholarship_coupons — cadastro de cupons (admin)
-- ------------------------------------------------------------
create table if not exists scholarship_coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  course_id uuid references courses(id),  -- null = vale pra qualquer curso pago
  discount_percent int not null check (discount_percent between 1 and 100),
  max_redemptions int,                    -- null = ilimitado
  redemption_count int not null default 0,
  is_active boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2) scholarship_grants — autorização de desconto por (aluno, curso).
--    unique(user_id, course_id): só uma bolsa por aluno por curso.
-- ------------------------------------------------------------
create table if not exists scholarship_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  course_id uuid not null references courses(id),
  discount_percent int not null check (discount_percent between 1 and 100),
  source text not null check (source in ('COUPON', 'ADMIN_DIRECT')),
  coupon_id uuid references scholarship_coupons(id),
  granted_by uuid references auth.users(id),  -- admin, se ADMIN_DIRECT; null se autosserviço
  payment_id uuid references payments(id),    -- preenchido quando <100% gera um payments (ver createCheckoutAction)
  created_at timestamptz not null default now(),
  unique (user_id, course_id)
);

create index if not exists idx_scholarship_grants_user on scholarship_grants(user_id);
create index if not exists idx_scholarship_grants_course on scholarship_grants(course_id);

-- ------------------------------------------------------------
-- 3) payments — colunas novas pra registrar quando um pagamento teve
--    desconto de bolsa aplicado (transparência no painel financeiro).
-- ------------------------------------------------------------
alter table payments add column if not exists discount_percent int;
alter table payments add column if not exists original_amount_cents int;
alter table payments add column if not exists coupon_id uuid references scholarship_coupons(id);

-- payments_insert_own (migration 004) só permitia user_id = auth.uid() —
-- concessão direta do admin em 50% precisa criar o payments PENDING em
-- nome do aluno (o aluno é quem completa o checkout depois). Mesmo
-- padrão já usado em outras tabelas do projeto (users_profile,
-- job_posting_competencies): adicionar "or is_admin()" em vez de trocar
-- pra service role.
drop policy if exists "payments_insert_own" on payments;
drop policy if exists "payments_insert_own_or_admin" on payments;
create policy "payments_insert_own_or_admin" on payments for insert
  with check (user_id = auth.uid() or is_admin());

-- ------------------------------------------------------------
-- 4) RLS — scholarship_coupons: só admin lê e escreve. A validação de
--    código pelo aluno acontece via a função redeem_coupon() abaixo
--    (security definer), não por SELECT direto — evita expor a lista
--    de cupons pra qualquer autenticado.
-- ------------------------------------------------------------
alter table scholarship_coupons enable row level security;

drop policy if exists "coupons_select_admin" on scholarship_coupons;
create policy "coupons_select_admin" on scholarship_coupons for select
  using (is_admin());

drop policy if exists "coupons_write_admin" on scholarship_coupons;
create policy "coupons_write_admin" on scholarship_coupons for all
  using (is_admin()) with check (is_admin());

-- ------------------------------------------------------------
-- 5) RLS — scholarship_grants: dono ou admin lê; insert é o próprio
--    aluno (resgate de cupom) ou admin (concessão direta a outro
--    aluno). Sem policy de update/delete — bolsa concedida não se
--    edita, só se cria (histórico imutável, igual audit_log).
-- ------------------------------------------------------------
alter table scholarship_grants enable row level security;

drop policy if exists "grants_select_own_or_admin" on scholarship_grants;
create policy "grants_select_own_or_admin" on scholarship_grants for select
  using (user_id = auth.uid() or is_admin());

drop policy if exists "grants_insert_own_or_admin" on scholarship_grants;
create policy "grants_insert_own_or_admin" on scholarship_grants for insert
  with check (user_id = auth.uid() or is_admin());

drop policy if exists "grants_update_admin" on scholarship_grants;
create policy "grants_update_admin" on scholarship_grants for update
  using (is_admin());

-- ------------------------------------------------------------
-- 6) redeem_coupon() — valida + incrementa o contador de uso num único
--    UPDATE atômico (evita corrida quando dois alunos usam a última
--    vaga do mesmo cupom ao mesmo tempo). security definer: roda com
--    privilégio do dono da função, não do aluno chamando — por isso
--    consegue fazer UPDATE em scholarship_coupons mesmo sem o aluno
--    ter policy de escrita ali. Retorna 0 linhas se o código for
--    inválido, inativo, esgotado ou não valer pro curso informado.
-- ------------------------------------------------------------
create or replace function redeem_coupon(p_code text, p_course_id uuid)
returns table(coupon_id uuid, discount_percent int)
language plpgsql
security definer
as $$
begin
  return query
  update scholarship_coupons
  set redemption_count = redemption_count + 1
  where code = upper(trim(p_code))
    and is_active = true
    and (course_id is null or course_id = p_course_id)
    and (max_redemptions is null or redemption_count < max_redemptions)
  returning id, scholarship_coupons.discount_percent;
end;
$$;

grant execute on function redeem_coupon(text, uuid) to authenticated;

-- ------------------------------------------------------------
-- Observação: cupons são salvos com `code` como veio (recomendo criar
-- sempre em MAIÚSCULAS já no cadastro); redeem_coupon compara com
-- upper(trim(...)) pra tolerar o aluno digitar em minúsculas.
-- ------------------------------------------------------------
