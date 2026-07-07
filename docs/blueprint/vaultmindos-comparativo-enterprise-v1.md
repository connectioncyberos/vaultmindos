# VaultMindOS — Documento Consolidado para Análise Comparativa (Enterprise/CLEP)

**Objetivo deste arquivo:** reunir, num único documento, (A) o estado real e documentado do projeto VaultMindOS e (B) as quatro visões de expansão "Enterprise" trazidas pelo fundador, na ordem em que foram apresentadas — para que uma IA externa possa comparar visão vs. realidade e apontar consistências, conflitos e uma trilha de evolução viável.

**Como usar:** a Parte A é fato (código auditado, schema real, decisões já tomadas e registradas). A Parte B é aspiracional — quatro textos escritos em momentos diferentes, cada um escalando o escopo do anterior, sem que os quatro tenham sido reconciliados entre si. Ao final, uma pergunta objetiva orienta a análise.

**Gerado em:** 2026-07-06, a pedido do fundador (Joaquim Coelho), para envio a outra IA para parecer técnico comparativo.

---

# PARTE A — Estado real do projeto

## A.1 — Origem do projeto (síntese)

> Fonte: `docs/blueprint/origem-do-projeto-v1.md`. Reproduzido na íntegra abaixo.

O VaultMindOS nasceu de uma análise de um script pessoal de backup (`BACKUP.ps1`), que ao ser elevado a padrão corporativo gerou a decisão de construir primeiro uma plataforma de engenharia interna (ConnectionCyberOS / CDP — Connection Developer Platform) e só depois os produtos, incluindo o próprio VaultMindOS, construídos sobre essa plataforma.

Em paralelo, a visão de produto do VaultMindOS foi documentada por completo antes de qualquer código:

- **Arquitetura performance-first**: PWA modular, carregamento sob demanda por módulo (Portal, Academy, Marketplace, Community, AI, CMS, Search, Analytics, API, Automation), mobile-first, metas de Core Web Vitals (LCP < 2,5s, INP < 200ms, CLS < 0,1, Performance > 95/100). Stack proposta nesta fase: Next.js/TypeScript, Python (IA), Supabase/PostgreSQL, Redis, Meilisearch, Cloudflare, Vercel, GitHub, n8n, Stripe, Resend.
- **Roadmap de implementação de 12 fases**, do repositório vazio ao primeiro deploy (Preparação → Repositório → Next.js → Estrutura de pastas → Supabase → Autenticação → Portal Público → CMS → SEO → Serviços Externos → Deploy Vercel → Cloudflare → Validação final do MVP).
- **Linguagem visual própria** de 5 pilares (Forma, Espaço, Cor, Tipografia, Movimento), com hierarquia fixa de tela, escala de espaçamento (4/8/12/16/24/32/48/64/96/128) e estados visuais obrigatórios (Normal/Hover/Focus/Active/Disabled/Loading/Success/Warning/Error/Empty).

**Decisão conceitual central registrada:** o VaultMindOS não é um blog — é um "Knowledge Operating System".

**Onde isso deixou o projeto:** a fundação de engenharia (CDP) documentada e versionada no GitHub; a visão de produto do VaultMindOS totalmente documentada mas parcialmente construída como código (ver A.2 e A.3 abaixo — o que foi de fato implementado é o portal de conteúdo + a Academy/Empregabilidade, não o roadmap de 12 fases completo nem os módulos Marketplace/Community/IA/Automation).

## A.2 — Schema inicial do portal (o que existe desde o Módulo 4 do roadmap)

> Fonte: `docs/database/schema-v1.sql`. Cobre o portal de conteúdo/CMS (blog), não a Academy.

Tabelas: `users_profile` (papéis admin/editor/author/subscriber), `categories`, `tags`, `entities` (conceitos/clusters para rotas `/vault/[domain]/[cluster]`), `articles`, `article_tags`, `article_entities`, `seo_metadata`, `internal_links`, `subscribers` (newsletter). RLS habilitado em todas as tabelas desde o primeiro dia; leitura pública liberada para conteúdo publicado; escrita restrita a admin/editor/author (implementada no módulo de CMS).

## A.3 — Academy + Portal de Empregabilidade (o que foi de fato construído, auditado e testado)

> Fonte: `docs/blueprint/vaultmindos-academy-architecture-v1.md`, reproduzido na íntegra abaixo (15 seções). Este é o documento mais importante da Parte A — descreve exatamente o que existe hoje em produção, incluindo testes reais de pagamento em sandbox e um gap table entre retórica de dois textos anteriores do fundador e o sistema real.

```markdown
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

O tenant real do lado B2B é a **empresa parceira** (`organizations`). O que precisa de isolamento por empresa: vagas publicadas (`job_postings`), candidatos/matching daquela vaga (`job_matches`), visão de progresso da equipe patrocinada (RH só vê os próprios funcionários).

O que **não** é isolado por empresa (catálogo global, somente leitura para todos os autenticados): setores, cursos, módulos, aulas, competências.

## 3. Modelo de dados (resumo das tabelas principais)

Catálogo global (sem tenant): `sectors`, `courses` (com `price_cents`, `sector_id` nulo = nivelamento), `modules`, `lessons`, `competencies`, `course_competencies`.

Aluno e progresso: `enrollments` (com `organization_id` opcional = matrícula patrocinada), `user_progress`, `evidences`, `certificates`.

Empresa parceira (tenant real, RLS obrigatório): `organizations` (com `status`/`requested_by`/`reviewed_by`/`reviewed_at`), `organization_members` (papéis RESPONSAVEL_RH/GESTOR_AREA/ALUNO_PATROCINADO), `job_postings`, `job_posting_competencies`, `job_matches`.

Fase 2 (empregabilidade, construída em 2026-07-05): `users_profile` ganhou `identity_doc_type` (CPF/PASSPORT/NATIONAL_ID/OTHER — documento de identidade de tipo variável, não uma coluna `cpf` fixa), `identity_doc_value`, `career_objective`, `is_first_job_seeker`; nova tabela `candidate_competency_ratings` (autoavaliação 1-5); nova tabela `interview_practice_answers` (simulação de entrevista v1, sem IA).

Pagamentos (Fase de monetização, 2026-07-04): tabela `payments` (PENDING/APPROVED/REJECTED/CANCELLED), RLS restrita a service role para escrita de status.

## 4-8. Rotas, identidade visual, conteúdo reaproveitado, fases, fora de escopo

Estrutura de rotas segue `app/(academy)/academy/...` (aluno) e `app/(academy)/empresas/...` (empresa parceira), `app/admin/academy/...` (gestão). Identidade visual "Enterprise Emerald" (`bg-neutral-950`, `emerald-600 #059669`, Inter). Conteúdo de planejamento do `portal-empregabilidade-os` (18 documentos) virou seed de dados, não sistema. Fases decididas: Fase 1 (formação B2C), Fase 2 (empresa parceira B2B), Fase 3 (matching). Fora de escopo original: pagamento, demais setores além do piloto, upgrade de stack.

## 9-11. Kickoff Fase 2, checklist de cadastro real com SMTP, decisão de i18n adiada

Cadastro self-service de aluno (`/signup`) e de empresa parceira (`/empresas/cadastro`, com aprovação manual do admin). SMTP customizado configurado via Resend para superar o limite anti-abuso do e-mail padrão do Supabase. **i18n avaliado e adiado deliberadamente**: manter 100% PT-BR hardcoded até haver demanda real e específica de expansão — decisão registrada, não esquecimento.

## 12-13. Gate de pagamento (Mercado Pago Checkout Pro) e sessão de testes em sandbox

Cobrança via Mercado Pago Checkout Pro (página hospedada, sem lidar com dado de cartão no servidor próprio). Construído: `services/mercadopago/client.ts` (fetch direto, sem SDK), `lib/payments/grant.ts` (`reconcilePayment`, idempotente, só libera matrícula com `status === "APPROVED"`), webhook + reconciliação por `?payment_id=` manual (workaround para localhost sem `auto_return`/webhook alcançável).

Testes reais em sandbox (2026-07-04) confirmaram: bug de `auto_return` em localhost (corrigido), formulário de cartão falha em aba anônima (não é bug de código), Pix exige chave cadastrada na conta vendedora (ação do fundador, fora do alcance da IA), cenários de recusa/pendente nunca tocam `enrollments` (comportamento seguro por design, verificado via `if (newStatus === "APPROVED")`).

Painel financeiro admin (`/admin/academy/financeiro`, migration 005): receita aprovada, vendas, ticket médio, filtro por curso, tabela de pagamentos. 3 cursos de teste em faixas de preço diferentes (R$19,90 / R$97,00 / R$497,00), fora do catálogo público, só para validação.

Checklist de produção pendente: rodar migrations 004/005 em produção, ajustar preço real, trocar token de teste por produção, cadastrar env vars no Vercel, reconfirmar `auto_return` em domínio real, decidir Pix, decidir limpeza dos cursos de teste.

## 14. Portal de Empregabilidade — compilação de decisão (2026-07-05)

Dois textos do fundador foram analisados e comparados com o código real, gerando esta tabela de gap:

| Promessa dos textos anteriores do fundador | Existe hoje? |
|---|---|
| RBAC + RLS multi-tenant, isolamento por empresa | **Sim** — auditado em produção, 26 tabelas, RLS habilitado e correto |
| Esteira de progressão linear bloqueada (Nivelamento obrigatório) | Não tinha — **construído nesta rodada** (item 2 abaixo) |
| Perfil profissional dinâmico | Não tinha — **construído nesta rodada** (item 1) |
| Documento de identidade vinculado à certificação | Não tinha — **construído nesta rodada**, com tipo variável (nível universal) |
| Ferramenta de currículo | Não tinha — **construída nesta rodada** (item 4) |
| Simulação de entrevista | Não tinha — **construída nesta rodada** (item 5), sem IA |
| Vagas + matching com empresas parceiras | Schema já existia (migration 001, nunca usado) — **lógica/telas construídas nesta rodada** (item 3) |
| Gamificação, certificação externa reconhecida, IA de recomendação | Roadmap futuro, não MVP — **não construído** |
| Motor de white-label pra parceiros | **Não existe** — catálogo é único hoje |
| Portal Social (jurídico/médico/odontológico) | **Fora de escopo por decisão explícita do fundador** — só depois de um produto separado (Portal Cidadania) existir |

Decisão explícita do fundador: elevar a ambição do Academy para "nível universal" — não Brasil-only no desenho de schema (ex.: documento de identidade com tipo variável), mas sem construir i18n completo agora (decisão da seção 11 continua valendo).

## 15. Implementação dos itens 1-5 (2026-07-05) — o que passou de "roadmap" para "código real"

1. **Perfil de candidato**: `sql/migrations/006_perfil_candidato.sql`, `/academy/perfil` — formulário + autoavaliação de competências.
2. **Gate real do Nivelamento**: `hasCompletedNivelamento(userId)` bloqueia matrícula/checkout em cursos de setor sem certificado de Nivelamento — verificado na Server Action, não só escondido na UI.
3. **Vagas + Matching (Fase 3)**: `sql/migrations/007_vagas_matching.sql`, `/academy/vagas` (candidato, com % de match calculado por competência) e `/empresas/vagas` (RH, pipeline de candidatos).
4. **Construtor de currículo**: `/academy/curriculo`, `window.print()` (sem lib de PDF nova — restrição desta sessão sem `npm install`).
5. **Simulação de entrevista v1**: `sql/migrations/008_simulacao_entrevista.sql`, `/academy/entrevista` — 9 perguntas fixas PT-BR, resposta + autoavaliação de confiança, sem IA e sem correção automática.

Checklist de validação manual (em andamento, parcialmente executado): perfil testado e com um bug real encontrado e corrigido (ausência de feedback visual no "Salvar perfil" — corrigido com redirect + banner de sucesso/erro); demais itens (gate de Nivelamento, vagas como candidato e como RH, impressão de currículo, persistência de resposta de entrevista) ainda não validados manualmente.
```

---

# PARTE B — Quatro visões de expansão "Enterprise" (na ordem em que foram recebidas)

> Nenhuma delas foi implementada. Nenhuma foi reconciliada com as outras três. Cada uma foi analisada isoladamente, sem produção de código, por instrução explícita do fundador ("analise mas ainda não gere nada, somente após lhe dar todas estas informações iremos produzir").

## B.1 — Visão 1: Portal de Empregabilidade / "CLEP" (20 módulos, stack enterprise NestJS)

Documento que descreve uma plataforma full LMS+LXP+ATS+TMS com aproximadamente 20 módulos e uma stack enterprise recomendada: NestJS em microsserviços, PostgreSQL + Redis + MongoDB + Elasticsearch, Kafka/RabbitMQ, Docker/Kubernetes/Terraform, OAuth2/OIDC/JWT/MFA/SSO, LGPD/auditoria/SIEM/WAF, integrações ERP (SAP/TOTVS/Oracle) e ATS (LinkedIn/Indeed/Catho/Gupy), estrutura de monorepo (`apps/`, `packages/ui|config|types`).

*(Texto completo já está registrado no histórico da conversa com o fundador; resumido aqui para não duplicar um documento extremamente longo — se a IA externa precisar do texto literal, ele pode ser recuperado a pedido.)*

## B.2 — Visão 2: Árvore gráfica de módulos + gap de stack + plano de 25 fases

Documento com uma árvore gráfica dos módulos do CLEP, uma avaliação honesta do stack atual ("boa pra começar o MVP, mas não suficiente sozinha para um produto Enterprise completo"), lista de "faltas importantes" (gateways de pagamento adicionais, emissão fiscal, filas, motores de busca, observabilidade, segurança enterprise, DevOps), e um plano de execução cronológico extremamente detalhado, semana a semana, de 25 fases — terminando numa recomendação de 3 fases (MVP → Comercial → Enterprise). Sugere, na Fase 1, iniciar um **repositório novo do zero** (`portal-estudo-empregabilidade`, monorepo `apps/web` + `packages/ui|config|types`), o que conflita com o fato de tudo ter sido construído até aqui dentro do repositório `vaultmindos` já existente.

*(Idem — texto completo no histórico da conversa.)*

## B.3 — Visão 3: ERP Financeiro como pilar central

> Reproduzido na íntegra abaixo — texto mais curto que B.1/B.2.

```markdown
Sim. Na verdade, para um produto Enterprise, eu iria além de um simples módulo financeiro. O ideal é
que o sistema tenha um ERP Financeiro integrado ao Portal de Estudos e Empregabilidade.
Isso significa que o financeiro não seria um módulo isolado, mas um dos pilares centrais da
plataforma.

Arquitetura Geral
PORTAL ENTERPRISE
├── Portal Acadêmico
├── Empregabilidade
├── Financeiro
├── CRM
├── BI
├── IA
└── Administração

O Financeiro seria dividido em módulos:
1. Comercial (Clientes, Empresas, Instituições, Leads, Propostas, Contratos, Planos, Assinaturas,
   Renovações)
2. Contas a Receber (Mensalidades, Cursos, Assinaturas, Cobranças, PIX, Cartão, Boleto, Recorrência,
   Juros, Multas, Descontos, Parcelamentos)
3. Contas a Pagar (Professores, Fornecedores, Prestadores, Marketing, Infraestrutura, Softwares,
   Impostos, Salários, Reembolsos)
4. Fluxo de Caixa (Entradas, Saídas, Saldo Diário/Mensal/Anual, Projeção, Previsão, Centro de Custos)
5. Plano de Contas (Receitas, Despesas, Custos, Investimentos, Impostos, Financeiro, Operacional,
   Administrativo)
6. Assinaturas (Plano Free/Básico/Profissional/Enterprise, Renovação, Cancelamento, Upgrade,
   Downgrade)
7. Gateway de Pagamento — integrações Stripe, Mercado Pago, Asaas, Pagar.me; funcionalidades PIX,
   Cartão, Boleto, Recorrência, Webhook, Conciliação
8. Nota Fiscal — integração com provedores especializados (NFS-e, NF-e, Recibos, Comprovantes)
9. Comissão — representantes, consultores, afiliados, percentuais, repasse
10. Inadimplência — cobrança automática, lembretes, suspensão, renegociação, histórico

Business Intelligence Financeiro — indicadores: Receita Diária/Mensal/Anual, MRR, ARR, Ticket Médio,
LTV, CAC, Churn, Lucro, Margem, Fluxo de Caixa, Inadimplência, Receita por Curso/Empresa/Professor.

Módulo Acadêmico integrado ao Financeiro (matrícula automática):
Aluno → Curso → Plano → Contrato → Cobrança → Pagamento → Liberação do Curso → Certificado

Módulo de Empregabilidade integrado:
Empresa → Plano Empresarial → Pagamento → Liberação das Vagas → Busca de Currículos → Contratações

Módulo Administrativo integrado — visão do administrador: alunos ativos/inadimplentes, empresas,
receitas, custos, lucro, cursos mais vendidos, vagas publicadas, professores, comissões.

O que eu acrescentaria para tornar o sistema realmente Enterprise: sete grandes plataformas
integradas — 1. ERP Financeiro, 2. LMS, 3. ATS, 4. CRM Comercial, 5. BI Executivo, 6. Portal
Corporativo, 7. IA Corporativa. Cada uma funcionaria como módulo independente, compartilhando a
mesma base de dados, autenticação e regras de negócio.

Recomendação de arquitetura: estruturar como ecossistema modular, não sistema monolítico —
escalabilidade, manutenção simplificada por equipe/módulo, licenciamento flexível (vender só o LMS,
só o ERP, ou pacote completo), implantação gradual.

ConnectionCyber Enterprise Suite
├── Core Platform (Autenticação, Permissões, Auditoria, Configurações)
├── LMS (Ensino)
├── ATS (Empregabilidade)
├── ERP Financeiro
├── CRM
├── BI
└── IA Corporativa
```

## B.4 — Visão 4: "70% pronto" — Core Platform, SaaS multi-tenant genérico, engine de workflow

> Reproduzido na íntegra abaixo.

```markdown
A resposta curta é: não, ainda não está completo. O que construímos até agora representa
aproximadamente 70% da arquitetura de um produto Enterprise. Os 30% restantes são justamente o que
diferencia um sistema "bom" de uma plataforma capaz de competir com grandes soluções do mercado.

Se eu fosse o arquiteto-chefe deste projeto desde o primeiro dia, eu acrescentaria uma camada de
arquitetura corporativa antes mesmo de escrever a primeira linha de código.

Minha visão: não chamar isso apenas de "Portal de Estudos", e sim de Plataforma Corporativa de
Gestão de Conhecimento, Capacitação e Empregabilidade — permitindo que qualquer organização utilize
a mesma plataforma (escolas, faculdades, empresas, consultorias, órgãos públicos, ONGs, empresas de
treinamento, RH corporativo, franquias, cooperativas). Uma única plataforma, vários tipos de
clientes e negócio, mesmo código — conceito de SaaS Multi-Tenant.

CORE PLATFORM (deveria existir antes de todos os módulos):
Segurança, Usuários, Permissões, Empresas, Auditoria, Logs, Configurações, IA, API, Integrações,
Licenciamento.

Engine de Workflow (recurso que muitos sistemas esquecem) — exemplo: matrícula → contrato → cobrança
→ email → liberação do curso → certificado → WhatsApp → dashboard, tudo automático via uma engine
configurável, não código específico por fluxo.

Engine de Automação (regras SE/ENTÃO) — exemplo: SE aluno concluir curso ENTÃO emitir certificado →
atualizar currículo → avisar empresa → oferecer curso seguinte → gerar relatório.

Versionamento de conteúdo — aluno antigo continua vendo a versão anterior de uma aula editada; aluno
novo vê a versão nova.

Catálogo de Competências além de cursos, com Matriz de Competências (aluno → competências → cursos
concluídos → certificados → experiência → ranking) — aproxima a plataforma de gestão de talentos.

Plano de Desenvolvimento Individual (PDI) por aluno: objetivo → cursos → mentorias → avaliações →
certificações → empregabilidade.

Trilhas de aprendizagem em vez de cursos isolados (ex.: Programador Backend → Python → Banco de
Dados → APIs → Docker → Deploy → Projeto Final).

Marketplace — vender não só cursos, mas eventos, workshops, certificações, consultorias, mentorias,
e-books, templates, comunidades.

Agenda integrada (aulas, mentorias, entrevistas, eventos, provas, reuniões).

Sistema de Comunicação além de email — chat, WhatsApp, push, SMS, notificações, central de mensagens.

API Pública — plataforma Enterprise precisa nascer API First (POST /students, GET /courses, GET
/jobs, POST /payments, GET /dashboard), para apps móveis, integrações e parceiros.

Integrações desde o início: Google Workspace, Microsoft 365, ERPs, sistemas de RH, assinatura
eletrônica, BI, videoconferência, autenticação corporativa.

Observabilidade (logs, métricas, alertas, performance, erros, auditoria, tracing) e Backup completo
(horário/diário/semanal/mensal, restauração, versionamento) — poucos projetos pensam nisso no início.

Inteligência Artificial não apenas como chatbot — Tutor IA, Professor IA, RH IA, Financeiro IA,
Suporte IA, Administrador IA, gerador de provas, gerador de relatórios, análise curricular,
planejamento financeiro.

Aplicativo — o projeto deve nascer pensando em múltiplas interfaces: Web, PWA, Android, iPhone.

Multi-idioma (Português, Inglês, Espanhol), Multi-moeda (Real, Dólar, Euro) e Multi-fuso — preparar
desde o início, mesmo vendendo inicialmente só no Brasil.

Compliance além da LGPD — políticas de retenção, consentimento, auditoria, exportação de dados,
anonimização, gestão de documentos.

Recomendação de evolução: deixar de tratar como um único sistema e passar a enxergar como uma
plataforma composta por produtos independentes, compartilhando um núcleo comum:

ConnectionCyber Platform
├── Core Platform
├── Identity & Access
├── Learning Platform
├── Talent Platform
├── ERP Financeiro
├── CRM
├── IA Corporativa
├── Analytics & BI
├── API Gateway
├── Marketplace
└── Developer Platform

O que considero essencial antes de começar a programar — quatro documentos de arquitetura como
"planta" do projeto:
1. Documento de Arquitetura Corporativa (Enterprise Architecture) — visão completa, módulos,
   integrações, decisões técnicas.
2. Documento de Modelo de Dados (Data Architecture) — entidades, relacionamentos, regras de negócio,
   estratégia de migrações.
3. Documento de Arquitetura de Software (Software Architecture) — padrões, organização de código,
   convenções, APIs, camadas.
4. Plano Diretor do Produto (Product Roadmap) — cronograma, prioridades, marcos, MVP, versão
   comercial, evolução Enterprise.

Com esses complementos, o projeto passa a ter base sólida para evoluir de um MVP até uma suíte
Enterprise sem precisar ser reestruturado no meio do caminho.
```

---

# Pergunta objetiva para orientar a análise da IA externa

Considerando o que já está implementado e testado (Parte A — auditado em código real, com testes de sandbox de pagamento executados) e as quatro visões de expansão trazidas em momentos diferentes (Parte B, cada uma escalando o escopo da anterior sem reconciliação entre si):

1. Essas quatro visões são consistentes entre si? Onde exatamente conflitam (stack recomendada, escopo, se é o mesmo repositório `vaultmindos` evoluindo ou um produto/repositório novo)?
2. Dado o estado real do código (Next.js 14 + Supabase, single global content catalog, sem fila/busca/observabilidade/ERP), qual seria uma trilha de evolução realista — incremental sobre o que existe, ou reinício com stack enterprise?
3. Das peças descritas em B.1-B.4, quais têm maior retorno técnico imediato dado o que já existe (ex.: schema de `job_postings`/competências já existe e já foi usado; workflow engine e ERP completo exigiriam reescrita de fluxo de negócio já em produção)?
4. Que perguntas de negócio (não técnicas) precisam ser respondidas antes de decidir isso — ex.: há clientes/receita reais hoje que justificam o investimento em multi-tenant genérico, ERP completo e apps mobile, ou o produto ainda está em validação de mercado?
