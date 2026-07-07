-- ============================================================
-- Migration 008 — Simulação de entrevista v1 (Portal de Empregabilidade)
-- Ref.: docs/blueprint/vaultmindos-academy-architecture-v1.md, seção 14
-- (v1 sem IA — perguntas fixas no código, ver lib/interview/questions.ts;
-- só a resposta e a autoavaliação de confiança do candidato são gravadas)
-- ============================================================

create table if not exists interview_practice_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_slug text not null,
  answer text,
  confidence_rating int check (confidence_rating between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, question_slug)
);

alter table interview_practice_answers enable row level security;

drop policy if exists "interview_answers_select_own_or_admin" on interview_practice_answers;
drop policy if exists "interview_answers_insert_own" on interview_practice_answers;
drop policy if exists "interview_answers_update_own" on interview_practice_answers;

create policy "interview_answers_select_own_or_admin" on interview_practice_answers for select
  using (user_id = auth.uid() or is_admin());

create policy "interview_answers_insert_own" on interview_practice_answers for insert
  with check (user_id = auth.uid());

create policy "interview_answers_update_own" on interview_practice_answers for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
