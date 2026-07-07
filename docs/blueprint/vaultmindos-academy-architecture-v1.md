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

## 10. Checklist de validação — cadastro real (SMTP + testes)

Ao testar `/signup` com e-mail real pela primeira vez apareceu o erro padrão do Supabase Auth "For
security purposes, you can only request this after N seconds" — **não é bug**, é o limitador
anti-abuso do serviço de e-mail embutido do Supabase (pensado só para teste, não para volume real de
cadastro). Duas coisas foram feitas em código por causa disso:

- `lib/auth/error-messages.ts` — traduz esse e outros erros comuns do Supabase Auth (credenciais
  inválidas, e-mail não confirmado, e-mail já cadastrado, etc.) para PT-BR antes de mostrar em
  `/login` e `/signup`. Importante: isso só traduz as mensagens que aparecem **na tela**; o texto do
  **e-mail de confirmação em si** é outra coisa (ver abaixo).
- Antes de operar com cadastro real de verdade, o passo que resolve o limite (e melhora a entrega do
  e-mail) é configurar SMTP customizado no Supabase usando o Resend que o projeto já usa (Módulo 9).

### Passo a passo — SMTP customizado (Resend → Supabase)

1. No [Resend](https://resend.com) (Dashboard → Domains → Add Domain), cadastrar o domínio de envio
   (ex.: `vaultmindos.com`) e adicionar os registros DNS (SPF/DKIM, e DMARC se quiser) que o Resend
   fornece. Aguardar o status virar **Verified** (pode levar de minutos a algumas horas, depende do
   provedor de DNS).
2. Confirmar/gerar a API Key do Resend (Dashboard → API Keys) — pode ser a mesma já usada em
   `RESEND_API_KEY` no `.env.local`, ou uma dedicada só para SMTP de Auth.
3. No Supabase Dashboard do projeto **vaultmindos**: `Project Settings → Authentication → SMTP
   Settings` → ativar **Enable Custom SMTP**.
4. Preencher:
   - **Sender email**: um endereço do domínio verificado no Resend (ex.:
     `nao-responda@vaultmindos.com`) — ideal ser igual ao `RESEND_FROM_EMAIL` já usado no app, pra
     manter o remetente consistente em todos os e-mails do produto.
   - **Sender name**: `VaultMindOS`
   - **Host**: `smtp.resend.com`
   - **Port**: `465` (SSL) — alternativa `587` (STARTTLS)
   - **Username**: `resend` (literal, é sempre essa string pro Resend)
   - **Password**: a API Key do Resend (passo 2)
5. Salvar.
6. **Recomendado**: `Authentication → Email Templates` → editar o template **Confirm signup** (e os
   outros que forem usados: Magic Link, Reset Password) para PT-BR — o padrão do Supabase vem em
   inglês e isso é editável no Dashboard (diferente das mensagens de erro da API).
7. **Opcional**: `Authentication → Rate Limits` → revisar/ajustar o limite de envio de e-mail — com
   SMTP próprio, quem passa a limitar é o Resend (plano gratuito: 100 e-mails/dia, 3.000/mês), não
   mais o limitador padrão do Supabase.

### Passo a passo — testar com e-mail real

1. Acessar `/signup` com um e-mail real (ex.: o seu próprio).
2. Preencher nome, e-mail, senha (mín. 8 caracteres), aceitar Termos/Privacidade, enviar.
3. Conferir a caixa de entrada (e o spam) — o e-mail deve chegar do domínio configurado no passo
   anterior, sem mais cair no limite de reenvio.
4. Clicar no link de confirmação → deve redirecionar para `/login?next=...`.
5. Fazer login com a senha cadastrada → deve dar acesso à Academy (ou à área correspondente ao
   `next`, ex. `/admin` se veio de lá).
6. Conferir no Supabase Dashboard (`Authentication → Users`) que o novo usuário aparece, e que
   `users_profile` tem a linha correspondente com `full_name` preenchido e `role = subscriber`
   (via trigger `handle_new_user`).
7. Repetir o mesmo teste end-to-end para `/empresas/cadastro` (cadastrar uma empresa, aprovar em
   `/admin/academy/empresas` como admin, conferir que `/empresas` reflete o status "Aprovada").

## 11. Internacionalização (i18n) — decisão adiada (2026-07-04)

Avaliado e **adiado de propósito**, não esquecido. Motivo: i18n não é só trocar strings de
interface — significa reestruturar rotas por locale (`/pt-BR/...` vs `/en/...`), traduzir
manualmente todo o conteúdo que hoje vive no banco (artigos, cursos, aulas — conteúdo editorial,
não string fixa), cuidar de SEO por idioma (hreflang, sitemap por locale) e manter tudo isso em dobro
a cada mudança futura. Hoje 100% do público-alvo, do conteúdo publicado e da Academy é voltado ao
mercado brasileiro — não há ainda demanda concreta (cliente, parceiro ou expansão de mercado) que
justifique esse investimento.

**Decisão:** manter o site 100% em PT-BR hardcoded até surgir uma demanda real e específica. Quando
isso acontecer, revisitar esta seção para planejar a abordagem (provável candidato: `next-intl` com
roteamento por locale) antes de implementar.

## 12. Gate de pagamento — Mercado Pago Checkout Pro (2026-07-04)

Decisão do fundador: cobrar só o curso piloto (Administrativo 4.0); Nivelamento continua gratuito
como porta de entrada. Checkout Pro (página hospedada do Mercado Pago) em vez de formulário embutido
— mais rápido de validar, sem lidar com dado de cartão no nosso servidor.

**O que foi construído:**
- `sql/migrations/004_course_payments.sql` — `courses.price_cents` (null/0 = gratuito) e a tabela
  `payments` (PENDING/APPROVED/REJECTED/CANCELLED), RLS: usuário só vê/insere os próprios; só o
  webhook/confirmação server-only (service role, `lib/supabase/service.ts`) atualiza o status.
- `services/mercadopago/client.ts` — fetch direto na API (sem SDK, mesmo padrão do Resend):
  `createPreference` (cria a cobrança) e `getPayment` (reconsulta o status real — nunca confiamos
  isoladamente no payload do webhook nem nos query params do redirect de retorno).
- `lib/payments/grant.ts` — `reconcilePayment`: busca o status real no Mercado Pago e, se aprovado,
  libera a matrícula (idempotente — seguro rodar mais de uma vez pro mesmo pagamento).
- `app/academy/actions.ts` — `createCheckoutAction` (cria a preferência e redireciona pro checkout)
  e `confirmPaymentAction`; `enrollAction` passou a recusar matrícula direta de curso pago (a
  Server Action é chamada, então esconder o botão na UI não bastaria como única defesa).
- `app/api/webhooks/mercadopago/route.ts` — recebe a notificação e chama `reconcilePayment`.
- A página do curso (`app/academy/cursos/[cursoSlug]/page.tsx`) reconcilia automaticamente quando o
  Mercado Pago redireciona de volta com `?payment_id=...` — funciona mesmo sem o webhook alcançar o
  servidor (útil rodando em `localhost`, onde o Mercado Pago não consegue chamar o webhook).

### Passo a passo — configurar (Painel de Desenvolvedores do Mercado Pago)

1. Acessar [mercadopago.com.br/developers/panel](https://www.mercadopago.com.br/developers/panel),
   criar/abrir uma Aplicação.
2. Em **Credenciais de teste**, copiar o **Access Token de teste** → colar em `MERCADOPAGO_ACCESS_TOKEN`
   no `.env.local`. Nada de dinheiro real se move com essa credencial.
3. Ajustar o preço real do curso piloto (o `9700` — R$ 97,00 — na migration é só um placeholder):
   ```sql
   update courses set price_cents = <valor em centavos> where slug = 'administrativo-4-0';
   ```
4. Confirmar que `SUPABASE_SERVICE_ROLE_KEY` está preenchida no `.env.local` (necessária pro
   webhook/confirmação — `lib/supabase/service.ts`).

### Passo a passo — teste de recebimento (sandbox, sem dinheiro real)

1. Em **Contas de teste** no Painel de Desenvolvedores, criar um usuário de teste **comprador**
   (país Brasil) — ele vem com e-mail/senha fictícios; você não compra de você mesmo com a mesma
   conta que gerou o Access Token (que atua como vendedor).
2. Pegar os **cartões de teste** atualizados direto na
   [documentação oficial](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/additional-content/test-cards)
   (os números mudam periodicamente — não vale copiar de uma lista antiga).
3. No app, logado com sua própria conta VaultMindOS, ir em `/academy/cursos/administrativo-4-0` e
   clicar **Comprar acesso**.
4. Na página do Mercado Pago, logar com o **usuário de teste comprador** (não com sua conta real do
   Mercado Pago) e pagar com um cartão de teste.
5. Confirmar o redirecionamento de volta pro curso com a mensagem "Pagamento aprovado — acesso
   liberado!" e que as aulas ficaram acessíveis.
6. Conferir no Supabase (`select * from payments order by created_at desc`) que a linha ficou
   `APPROVED` com `mp_payment_id` preenchido, e que `enrollments` tem a matrícula correspondente.
7. Testar também um cartão de teste de **recusa**, pra conferir a mensagem "Pagamento não aprovado".
8. Só depois de validar os passos acima, trocar `MERCADOPAGO_ACCESS_TOKEN` pela credencial de
   **produção** (mesma tela do Painel) — a partir daí pagamentos reais passam a valer, e vincular a
   conta bancária de recebimento no Mercado Pago é uma ação que só o fundador faz (dado financeiro
   de conta, fora do que a IA pode configurar).

### Fora de escopo por enquanto
- Reembolso/estorno pela plataforma (hoje seria feito direto no painel do Mercado Pago, manualmente).
- Cobrança recorrente/assinatura — o modelo atual é pagamento único por curso.
- Split de pagamento pra empresa parceira (Fase 2 B2B) — matrícula patrocinada continua gratuita por
  enquanto (ver seção 9).

## 13. Sessão de testes em sandbox + painel financeiro (2026-07-04)

Primeira rodada real de testes ponta a ponta do gate de pagamento, em `localhost`. Resumo do que
foi encontrado e corrigido, pra não redescobrir o mesmo problema numa sessão futura.

### Achados do teste em sandbox

1. **`auto_return` quebra em `localhost`.** O Mercado Pago exige domínio real (com DNS) em
   `back_urls.success` quando `auto_return: "approved"` é enviado — em `localhost` a API recusa a
   criação da preferência (`invalid_auto_return`). Corrigido em `services/mercadopago/client.ts`: só
   envia `auto_return` quando a URL de retorno não é `localhost`/`127.0.0.1`. Em produção (domínio
   real) o comportamento automático volta a valer.
2. **Sem `auto_return`, o Mercado Pago não redireciona sozinho de volta** — mostra um link/botão de
   retorno na própria página de resultado. Em alguns fluxos (recusa, boleto) esse link não apareceu
   de forma confiável no sandbox; o caminho alternativo que funcionou foi usar o **número da
   operação** mostrado na tela de aprovação como `payment_id` manual
   (`?payment_id=<numero>` na página do curso) pra disparar a reconciliação.
3. **Formulário de cartão do checkout falha em aba anônima/incógnito** (erro imediato "Não é
   possível pagar com este cartão" ao digitar o número, mesmo com dados corretos da documentação
   oficial). Numa janela normal do navegador o mesmo cartão funcionou. Se algum teste futuro travar
   assim, checar aba anônima antes de suspeitar do código.
4. **Pix não aparece no checkout** — não é bug: exige a conta vendedora (a conta real vinculada à
   aplicação) ter uma chave Pix cadastrada e verificada. Ação do fundador, fora do que a IA configura.
5. **Cenários de recusa/pendente (`OTHE`, boleto) terminaram numa tela genérica "Ocorreu um erro"**
   do próprio Mercado Pago em vez da tela específica esperada — provável efeito colateral de
   `back_urls` apontando pra `localhost` nesses fluxos. Não impede validar a regra de negócio: sem
   reconciliação bem-sucedida, `reconcilePayment` nunca roda, e `enrollments` nunca é tocada (só
   acontece dentro do `if (newStatus === "APPROVED")` — ver `lib/payments/grant.ts`). Validado
   recarregando a página do curso sem parâmetro e confirmando que o botão "Comprar acesso" continua
   aparecendo (ou seja, nenhum acesso foi liberado indevidamente).
6. **Script de reset pra repetir testes** (apaga matrícula/pagamento de um usuário+curso específico,
   sem afetar mais nada):
   ```sql
   delete from enrollments
   where course_id = (select id from courses where slug = '<slug-do-curso>')
     and user_id = (select id from auth.users where email = '<email-de-teste>');

   delete from payments
   where course_id = (select id from courses where slug = '<slug-do-curso>')
     and user_id = (select id from auth.users where email = '<email-de-teste>');
   ```

### Painel financeiro (admin) — `migration 005`

- `sql/migrations/005_admin_financeiro.sql`: adiciona policy de SELECT admin em `users_profile`
  (antes só existia "cada um lê o próprio perfil" — nem o admin conseguia ver nome de outro usuário)
  e cadastra 3 cursos de teste em faixas de preço (`teste-preco-baixo` R$19,90, `teste-preco-medio`
  R$97,00, `teste-preco-alto` R$497,00), propositalmente fora do catálogo (`sector_id = null`) pra
  não aparecerem pra alunos reais — só acessíveis por link direto.
- `/admin/academy/financeiro` (só role `admin`): cards de receita aprovada/vendas/ticket médio,
  filtro por curso, tabela de pagamentos (curso, aluno, valor, status, data).
- Limitação conhecida: a tabela mostra o **nome completo** do `users_profile`, não o e-mail — o
  e-mail do Supabase Auth só é acessível via service role key, reservada de propósito só pro
  webhook/confirmação (ver `lib/supabase/service.ts`). Se precisar do e-mail no painel no futuro,
  avaliar expor isso via uma function `security definer` bem restrita, em vez de abrir o uso da
  service role key pra mais rotas.

### Checklist antes de ir pra produção de verdade

- [ ] Rodar `004_course_payments.sql` e `005_admin_financeiro.sql` no ambiente de produção do Supabase
      (se ainda não rodados lá).
- [ ] Ajustar `price_cents` real do curso piloto (hoje é o placeholder de teste).
- [ ] Trocar `MERCADOPAGO_ACCESS_TOKEN` pela credencial de **produção**.
- [ ] Cadastrar `MERCADOPAGO_ACCESS_TOKEN` e `SUPABASE_SERVICE_ROLE_KEY` nas variáveis de ambiente do
      **projeto no Vercel** (Settings → Environment Variables) — o `.env.local` não viaja no deploy.
- [ ] Com domínio real em produção, `auto_return` volta a funcionar sozinho — reconfirmar o fluxo de
      redirecionamento automático de aprovação lá (não só via `?payment_id=` manual).
- [ ] Cadastrar uma chave Pix na conta vendedora, se quiser oferecer Pix como opção de pagamento.
- [ ] Remover ou manter oculto os 3 cursos de teste (`teste-preco-*`) antes de considerar o catálogo
      "limpo" pra produção — hoje eles não aparecem pra ninguém, mas continuam no banco.

## 14. Portal de Empregabilidade — compilação de decisão (2026-07-05)

Origem: dois textos do fundador foram analisados nesta data — (1) uma tese de valor/arquitetura em
linguagem institucional (RBAC/RLS multi-tenant, "esteira de progressão linear bloqueada", "perfil
profissional dinâmico", integração com um futuro Portal Social/Cidadania) e (2) um roteiro de
apresentação/pitch focado em primeiro emprego e recolocação, com jornada do usuário, ferramentas
de currículo, simulação de entrevista, matching de vagas e valor pra empresas parceiras.

**Decisão explícita do fundador:** a integração com o Portal Social/Cidadania (atendimento jurídico,
médico, odontológico via identidade unificada) fica **fora de escopo por enquanto** — só entra depois
que o Portal Cidadania (produto separado) estiver pronto. Não implementar nada disso agora.

**Decisão explícita do fundador:** elevar a ambição do Academy dentro do VaultMindOS de um módulo
de cursos B2C/B2B para uma **área de aprendizado enterprise de nível universal** — não pensar o
desenho apenas para o mercado brasileiro. Isso não significa construir i18n agora (decisão de adiar
i18n continua valendo, seção 11) — significa que, ao desenhar os novos módulos abaixo (perfil de
candidato, vagas, ferramentas de carreira), os campos e a modelagem devem evitar acoplamento
desnecessário a conceitos exclusivamente brasileiros (ex.: CPF deve ser um campo de **documento de
identidade**, com tipo variável — CPF, passaporte, national ID — e não uma coluna `cpf` fixa),
preparando terreno pra expansão futura sem exigir retrabalho de schema.

### Gap encontrado: retórica vs. sistema real

Cruzando os dois textos com o que existe hoje no código (auditado nesta sessão):

| Promessa dos textos | Existe hoje? | Observação |
|---|---|---|
| RBAC + RLS multi-tenant, isolamento por empresa | **Sim** | Auditado em produção nesta sessão — RLS habilitado nas 26 tabelas, policies corretas. |
| "Banco de dados trata acesso indevido como dado inexistente" | **Sim** | Comportamento real de RLS do Postgres, validado. |
| Esteira de progressão linear **bloqueada** (Nivelamento obrigatório) | **Não** | Hoje é só um card de destaque na home; nenhuma trava técnica impede pular pro curso avançado. |
| Perfil profissional dinâmico (dado comportamental/qualificatório/progresso) | **Não** | `users_profile` só tem nome/avatar/papel. |
| Documento de identidade vinculado à certificação | **Não** | Nenhum campo de documento de identidade existe no schema hoje. |
| Ferramenta de currículo | **Não** | Não existe nenhum domínio de dado pra isso. |
| Simulação de entrevista | **Não** | Idem. |
| Vagas + matching com empresas parceiras | **Parcial** | `job_postings`, `job_posting_competencies`, `job_matches` já existem no schema (migration 001), com RLS já escrito — só falta a lógica/telas (Fase 3, nunca iniciada). |
| Gamificação, certificação externa reconhecida, IA de recomendação | **Não** | Tratado nos dois textos como roadmap futuro, não MVP. |
| Motor de white-label pra parceiros | **Não** | Catálogo hoje é único, editado manualmente. |
| Portal Social (jurídico/médico/odontológico) | **Fora de escopo** | Decisão do fundador — só depois do Portal Cidadania. |

### Ordem de implementação decidida

1. **Perfil de candidato** — estender identidade do usuário com documento de identidade (tipo +
   valor, não só CPF), objetivo de carreira, indicador de primeira experiência de trabalho,
   autoavaliação de competências.
2. **Nivelamento como gate técnico real** — impedir matrícula/acesso a cursos de especialização
   antes da conclusão do Nivelamento, em vez de só sugerir via UX.
3. **Vagas + matching (Fase 3)** — construir a lógica e as telas em cima do schema que já existe e
   já foi auditado (`job_postings`/`job_matches`), maior retorno técnico imediato por não exigir
   desenho de tabela novo.
4. **Construtor de currículo** — ferramenta prática, versão inicial sem IA (formulário guiado →
   PDF).
5. **Simulação de entrevista** — versão inicial roteirizada (perguntas fixas + autoavaliação),
   sem IA.
6. **Depois:** gamificação, IA de recomendação, certificação externa reconhecida, integração com
   Portal Social/Cidadania — todos tratados como roadmap pós-MVP nos dois textos originais.

## 15. Implementação dos itens 1-5 (2026-07-05)

Construído nesta sessão, sem interrupção pra validar cada item — validação em bloco no final, por
pedido do fundador. Ordem de migrations a rodar (dependem umas das outras nessa sequência):
`006_perfil_candidato.sql` → `007_vagas_matching.sql` → `008_simulacao_entrevista.sql`.

### 1) Perfil de candidato
- `sql/migrations/006_perfil_candidato.sql`: `users_profile` ganha `identity_doc_type` (CPF /
  PASSPORT / NATIONAL_ID / OTHER — tipo variável, decisão de nível universal), `identity_doc_value`,
  `career_objective`, `is_first_job_seeker`. Nova tabela `candidate_competency_ratings` (autoavaliação
  1-5 por competência, reaproveitando o catálogo `competencies` já existente).
- `lib/candidate/` (novo domínio): `types.ts`, `queries.ts` (`getCandidateProfile`,
  `getCompetencyRatings`, `getResumeData`).
- `/academy/perfil`: formulário de perfil + autoavaliação de competências (botões 1-5 por
  competência, upsert individual).

### 2) Gate real do Nivelamento
- `lib/academy/queries.ts`: `hasCompletedNivelamento(userId)` — completo = tem certificado emitido
  pro curso `nivelamento` (reaproveita a emissão automática já existente, não inventa um status novo
  de "curso completo").
- `enrollAction` e `createCheckoutAction` (`app/academy/actions.ts`) recusam matrícula/checkout em
  qualquer curso com `sector_id` preenchido se o Nivelamento não estiver concluído — verificado na
  Server Action, não só escondendo botão.
- Página do curso (`app/academy/cursos/[cursoSlug]/page.tsx`) mostra banner de pré-requisito com link
  pro Nivelamento em vez do botão de matrícula/compra, quando aplicável.

### 3) Vagas + Matching (Fase 3)
- `sql/migrations/007_vagas_matching.sql`: abre `job_postings`/`job_posting_competencies` pra
  candidatos verem vagas `OPEN` (antes só empresa/admin liam); RH da empresa passa a poder gerenciar
  competências da própria vaga; candidato pode inserir a própria linha em `job_matches`
  (`SUGGESTED`); RH atualiza status (`CONTACTED`/`HIRED`/`REJECTED`); constraint
  `unique(job_posting_id, user_id)` evita duplicar interesse; nova policy em `users_profile` deixa o
  RH ver o nome de candidatos que se aplicaram nas vagas **dele** (só isso, escopo restrito).
- `lib/jobs/` (novo domínio): `types.ts`, `queries.ts` — `getOpenJobPostingsForCandidate` (calcula
  match 0-100% comparando competências exigidas da vaga com a autoavaliação do candidato, v1 sem IA),
  `getJobPostingsForOrg`, `getJobMatchesForPosting`, `getMyJobMatches`.
- `/academy/vagas`: candidato vê vagas abertas com % de match e competências exigidas, clica "Tenho
  interesse", acompanha "Minhas candidaturas".
- `/empresas/vagas`: RH/gestor de empresa aprovada publica vaga (título, setor, competências) e
  gerencia o pipeline de candidatos (mudar status). Link adicionado em `/empresas`.

### 4) Construtor de currículo
- `getResumeData` (`lib/candidate/queries.ts`) junta perfil + competências bem avaliadas (nota ≥ 3) +
  certificados emitidos no VaultMindOS.
- `/academy/curriculo`: preview do currículo com classes `print:` que viram preto-no-branco só na
  impressão (currículo escuro impresso desperdiçaria tinta). Botão "Imprimir / Salvar como PDF"
  (`components/academy/PrintButton.tsx`, `window.print()`) — **sem biblioteca de PDF nova**, decisão
  deliberada porque esta sessão não consegue rodar `npm install`. `AcademyLayout` ganhou
  `print:hidden` na navegação pra a impressão sair limpa em qualquer página da Academy, não só nesta.

### 5) Simulação de entrevista v1
- `sql/migrations/008_simulacao_entrevista.sql`: tabela `interview_practice_answers` (pergunta fixa
  por slug, resposta em texto, autoavaliação de confiança 1-5), RLS dono/admin.
- `lib/interview/questions.ts`: 9 perguntas fixas em PT-BR focadas em primeiro emprego/recolocação
  (sem experiência prévia, ponto forte/fraco, trabalho em equipe etc.), cada uma com uma dica.
- `/academy/entrevista`: responde por escrito + autoavalia confiança por pergunta. Sem IA, sem
  correção automática — espaço de prática e autorreflexão, como decidido.

### Checklist de validação (fazer depois de tudo revisado)

- [ ] Rodar as 3 migrations (006, 007, 008) no Supabase, nessa ordem.
- [ ] `/academy/perfil` — preencher perfil e autoavaliar pelo menos 2-3 competências.
- [ ] Tentar se matricular num curso de setor (ex.: Administrativo 4.0) **sem** ter concluído o
      Nivelamento — confirmar que aparece o banner de pré-requisito e não a opção de comprar/matricular.
- [ ] Concluir o Nivelamento (ou usar um usuário que já tenha certificado) e confirmar que o gate libera.
- [ ] `/empresas/vagas` (como RH de empresa aprovada) — publicar uma vaga com 1-2 competências.
- [ ] `/academy/vagas` (como candidato) — ver a vaga, conferir se o % de match faz sentido com as notas
      dadas no perfil, clicar "Tenho interesse".
- [ ] Voltar em `/empresas/vagas` e confirmar que o candidato aparece no pipeline, mudar o status.
- [ ] `/academy/curriculo` — conferir se os dados aparecem certos e testar Ctrl+P (ou o botão) pra ver
      o preview de impressão em preto-no-branco.
- [ ] `/academy/entrevista` — responder 1-2 perguntas, recarregar a página e confirmar que a resposta
      e a confiança continuam salvas.
- [ ] Rodar `npx tsc --noEmit` (ou equivalente) antes do git push, já que boa parte disso não pôde ser
      compilado nesta sessão (sem acesso a terminal).

## 16. Parecer Enterprise comparativo + auditoria mínima (2026-07-06)

Os quatro documentos de visão "Enterprise/CLEP" trazidos pelo fundador foram consolidados em
`docs/blueprint/vaultmindos-comparativo-enterprise-v1.md` e enviados para outra IA produzir um
parecer técnico comparativo. Veredito: o projeto está em fase de **MVP avançado / produto comercial
inicial**, não em fase Enterprise — evoluir incrementalmente o `vaultmindos`, sem novo repositório e
sem migrar stack (NestJS/Kubernetes/Kafka) agora. Cronograma completo em
`docs/blueprint/vaultmindos-cronograma-implementacao-v1.md`.

Executado nesta rodada (Prioridade 4 do cronograma — auditoria mínima):
`sql/migrations/009_audit_log.sql` (tabela `audit_log`, RLS admin-only), `lib/audit/log.ts`
(`logAuditEvent`), `lib/audit/queries.ts` (`getRecentAuditLog`), `/admin/academy/auditoria` (tela de
consulta). Log integrado em: aprovação/rejeição de empresa, mudança de status de pagamento
(`reconcilePayment`), publicação de vaga e mudança de status, avanço de candidato no pipeline.

Também executado (Prioridade 3 — financeiro básico): exportação CSV do painel financeiro
(`app/admin/academy/financeiro/export/route.ts`, botão na página).

Decisão explicitamente deixada em aberto para o fundador: o que fazer com os 3 cursos de teste
(manter / desativar / apagar) — ver seção "Pergunta em aberto" do cronograma.

## 17. Reset total (dev) + sistema de bolsas + tela de criação de curso (2026-07-06)

Pedido do fundador: zerar o ambiente de desenvolvimento e testar do zero — cadastro em todos os
níveis (admin, empresa/RH, aluno), criação de um curso básico pela própria aplicação (não só SQL), e
bolsa 100%/50%/pagamento normal. Escopo do reset confirmado com o fundador: tudo (portal de conteúdo
+ Academy + usuários), só em desenvolvimento; modelo de bolsa confirmado: cupom autosserviço +
concessão direta pelo admin.

Construído: `sql/migrations/010_bolsas.sql` (`scholarship_coupons`, `scholarship_grants`, função
`redeem_coupon()` security definer, colunas novas em `payments`); `lib/scholarships/` (types,
queries); resgate de cupom e cálculo de desconto integrados em `app/academy/actions.ts` e na página do
curso; `/admin/academy/bolsas` (criar cupom, conceder bolsa direta); `/admin/academy/cursos` +
`/novo` + `/[cursoId]` (tela de criação de curso/módulo/aula que não existia até agora — cursos só
eram criados via SQL de migration).

Também: `sql/scripts/reset-dev-database.sql` (script de reset total, só para o usuário rodar —
exclusão permanente de dado não é executada pela IA) e
`docs/blueprint/vaultmindos-roteiro-teste-zero-v1.md` (roteiro passo a passo completo, do reset até
os 3 fluxos de matrícula testados).
