-- ============================================================
-- Migration 002 — Seed: Nivelamento + setor piloto Administrativo 4.0
-- Ref.: docs/blueprint/vaultmindos-academy-architecture-v1.md (Fase 1)
-- Fonte de conteúdo: portal-empregabilidade-os/_docs/003 e /007
--
-- Cria os 6 setores do plano original (só Administrativo 4.0 ativo
-- nesta fase — os outros ficam como referência/roadmap, is_active=false),
-- o curso de Nivelamento (obrigatório, sem setor) e o curso-piloto
-- Administrativo 4.0 completo (módulos, aulas, competências).
-- ============================================================

-- ------------------------------------------------------------
-- 1) Setores (os 6 do plano — só o piloto fica ativo por enquanto)
-- ------------------------------------------------------------
insert into sectors (slug, name, description, is_active) values
  ('administrativo-4-0', 'Administrativo 4.0', 'ERP, CRM e automação SaaS para o setor administrativo/financeiro', true),
  ('seguranca-automacao', 'Segurança e Automação Inteligente', 'Câmeras IP, CFTV, VMS e IoT aplicado', false),
  ('redes-conectividade', 'Redes & Conectividade', 'Wi-Fi 6, VLAN, cabeamento estruturado e infraestrutura', false),
  ('suporte-hardware', 'Suporte & Hardware', 'Diagnóstico de hardware, sistemas operacionais e help desk', false),
  ('eletrica-moderna', 'Elétrica Moderna', 'Instalações, projetos elétricos e energia solar', false),
  ('fiscal-mei', 'Consultoria Fiscal & MEI', 'IRPF, gestão MEI e obrigações acessórias', false);

-- ------------------------------------------------------------
-- 2) Curso de Nivelamento (obrigatório, sem sector_id — vale pra todos)
-- ------------------------------------------------------------
insert into courses (sector_id, slug, title, description, level, is_active) values
  (null, 'nivelamento', 'Treinamento de Nivelamento',
   'Base obrigatória antes das trilhas técnicas: garante competência digital mínima, raciocínio lógico aplicado, comunicação profissional, produtividade e noções de mercado de trabalho.',
   'INICIANTE', true);

insert into modules (course_id, title, order_index)
select id, m.title, m.order_index
from courses c
cross join (values
  ('Módulo 1 — Fundamentos Digitais (12h)', 0),
  ('Módulo 2 — Raciocínio Lógico Aplicado (10h)', 1),
  ('Módulo 3 — Comunicação Profissional (8h)', 2),
  ('Módulo 4 — Produtividade 4.0 (10h)', 3),
  ('Módulo 5 — Introdução ao Mercado de Trabalho (8h)', 4)
) as m(title, order_index)
where c.slug = 'nivelamento';

insert into lessons (module_id, course_id, slug, title, order_index, is_preview)
select mo.id, mo.course_id, l.slug, l.title, l.order_index, l.is_preview
from modules mo
join courses c on c.id = mo.course_id and c.slug = 'nivelamento'
join (values
  ('Módulo 1 — Fundamentos Digitais (12h)', 'fundamentos-digitais', 'Fundamentos Digitais', 0, true),
  ('Módulo 2 — Raciocínio Lógico Aplicado (10h)', 'raciocinio-logico-aplicado', 'Raciocínio Lógico Aplicado', 0, false),
  ('Módulo 3 — Comunicação Profissional (8h)', 'comunicacao-profissional', 'Comunicação Profissional', 0, false),
  ('Módulo 4 — Produtividade 4.0 (10h)', 'produtividade-4-0', 'Produtividade 4.0', 0, false),
  ('Módulo 5 — Introdução ao Mercado de Trabalho (8h)', 'introducao-mercado-de-trabalho', 'Introdução ao Mercado de Trabalho', 0, false)
) as l(module_title, slug, title, order_index, is_preview)
  on l.module_title = mo.title;

-- ------------------------------------------------------------
-- 3) Curso piloto: Administrativo 4.0
-- ------------------------------------------------------------
insert into courses (sector_id, slug, title, description, level, is_active)
select id, 'administrativo-4-0', 'Administrativo 4.0',
       'Trilha técnica completa: ERP, CRM e automação de processos administrativos, da fundamentação à aplicação prática.',
       'INTERMEDIARIO', true
from sectors where slug = 'administrativo-4-0';

-- Só 3 módulos de conteúdo — "Nível 4 (Vagas Associadas)" do plano original
-- não vira módulo de aula, vira alvo de matching (job_postings), tratado na Fase 3.
insert into modules (course_id, title, order_index)
select id, m.title, m.order_index
from courses c
cross join (values
  ('Nível 1 — Fundamentos', 0),
  ('Nível 2 — Competências Técnicas', 1),
  ('Nível 3 — Aplicação Prática', 2)
) as m(title, order_index)
where c.slug = 'administrativo-4-0' and c.sector_id is not null;

insert into lessons (module_id, course_id, slug, title, order_index, is_preview)
select mo.id, mo.course_id, l.slug, l.title, l.order_index, l.is_preview
from modules mo
join courses c on c.id = mo.course_id and c.slug = 'administrativo-4-0' and c.sector_id is not null
join (values
  ('Nível 1 — Fundamentos', 'fundamentos-digitais-adm', 'Fundamentos Digitais aplicados ao Administrativo', 0, true),
  ('Nível 1 — Fundamentos', 'raciocinio-logico-adm', 'Raciocínio Lógico aplicado a fluxos administrativos', 1, false),
  ('Nível 1 — Fundamentos', 'comunicacao-profissional-adm', 'Comunicação Profissional no ambiente administrativo', 2, false),
  ('Nível 2 — Competências Técnicas', 'operacao-de-erp', 'Operação de ERP', 0, false),
  ('Nível 2 — Competências Técnicas', 'gestao-de-crm', 'Gestão de CRM', 1, false),
  ('Nível 2 — Competências Técnicas', 'automacao-saas', 'Automação SaaS', 2, false),
  ('Nível 3 — Aplicação Prática', 'lancar-notas-fiscais', 'Atividade prática: lançar notas fiscais', 0, false),
  ('Nível 3 — Aplicação Prática', 'criar-pipeline-de-vendas', 'Atividade prática: criar pipeline de vendas no CRM', 1, false),
  ('Nível 3 — Aplicação Prática', 'automatizar-processos-administrativos', 'Atividade prática: automatizar processos administrativos', 2, false)
) as l(module_title, slug, title, order_index, is_preview)
  on l.module_title = mo.title;

-- ------------------------------------------------------------
-- 4) Competências do setor Administrativo 4.0
-- ------------------------------------------------------------
insert into competencies (sector_id, name, kind)
select id, c.name, c.kind
from sectors s
cross join (values
  ('Fundamentos Digitais', 'DIGITAL'),
  ('Raciocínio Lógico Aplicado', 'OPERACIONAL'),
  ('Comunicação Profissional', 'COMPORTAMENTAL'),
  ('Operação de ERP', 'TECNICA'),
  ('Gestão de CRM', 'TECNICA'),
  ('Automação SaaS', 'TECNICA')
) as c(name, kind)
where s.slug = 'administrativo-4-0';

insert into course_competencies (course_id, competency_id)
select c.id, comp.id
from courses c
join sectors s on s.id = c.sector_id and s.slug = 'administrativo-4-0'
join competencies comp on comp.sector_id = s.id
where c.slug = 'administrativo-4-0';

-- ------------------------------------------------------------
-- Referência para a Fase 3 (matching) — não seedado agora, pois depende
-- de uma organização real cadastrada: vagas-alvo do setor são
-- Assistente Administrativo, Auxiliar Financeiro e SDR/Comercial
-- (portal-empregabilidade-os/_docs/007, Nível 4).
-- ------------------------------------------------------------
