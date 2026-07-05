-- ============================================================
-- Migration 005 — Painel financeiro (admin) + cursos de teste
-- Ref.: docs/blueprint/vaultmindos-academy-architecture-v1.md
-- (Fase 2 — decisão do fundador: montar um painel dentro da Academy
-- pra listar pagamentos/status, ver receita total e filtrar por
-- curso; e cadastrar cursos de teste em faixas de preço diferentes
-- pra validar todas as modalidades de venda no sandbox.)
-- ============================================================

-- ------------------------------------------------------------
-- 1) users_profile — faltava uma policy de SELECT pra admin.
--    Até aqui só existia "users read own profile" (auth.uid() = id),
--    então nem o admin conseguia ler o perfil de outro usuário (isso
--    já bloquearia, por exemplo, mostrar o nome de quem comprou um
--    curso). Segue o mesmo padrão usado em todas as outras tabelas
--    deste projeto: dono OU admin.
-- ------------------------------------------------------------
drop policy if exists "users read own profile" on users_profile;
drop policy if exists "users_profile_select_own_or_admin" on users_profile;

create policy "users_profile_select_own_or_admin" on users_profile for select
  using (auth.uid() = id or is_admin());

-- ------------------------------------------------------------
-- 2) Cursos de teste — 3 faixas de preço, "não listados" de propósito:
--    sector_id = null (não aparecem em nenhuma trilha) e slug próprio
--    (não é "nivelamento", não entra no destaque da home da Academy).
--    is_active = true (senão a página do curso dá 404 e não dá pra
--    testar a compra) — ficam acessíveis só por link direto, sem
--    poluir o catálogo que alunos reais veem.
-- ------------------------------------------------------------
insert into courses (sector_id, slug, title, description, level, is_active, price_cents)
values
  (null, 'teste-preco-baixo', '[TESTE] Curso — preço baixo', 'Curso de teste só pra validar o gate de pagamento em faixa de preço baixa. Não aparece no catálogo.', 'Teste', true, 1990),
  (null, 'teste-preco-medio', '[TESTE] Curso — preço médio', 'Curso de teste só pra validar o gate de pagamento em faixa de preço média (igual ao piloto). Não aparece no catálogo.', 'Teste', true, 9700),
  (null, 'teste-preco-alto', '[TESTE] Curso — preço alto', 'Curso de teste só pra validar o gate de pagamento em faixa de preço alta. Não aparece no catálogo.', 'Teste', true, 49700)
on conflict (slug) do nothing;
