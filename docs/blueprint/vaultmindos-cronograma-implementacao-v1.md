# VaultMindOS — Cronograma de Implementação Pós-Análise Enterprise v1.0

**Status:** Em execução
**Data:** 2026-07-06
**Origem:** parecer técnico comparativo (outra IA, ver `vaultmindos-comparativo-enterprise-v1.md`) sobre os quatro documentos de visão Enterprise/CLEP vs. o estado real do projeto. Veredito: o projeto está em fase de **MVP avançado / produto comercial inicial**, não em fase Enterprise — evoluir incrementalmente o `vaultmindos` existente, não reiniciar em stack nova.

Este documento traduz o veredito (9 passos de diagnóstico + 5 prioridades) em tarefas concretas dentro do stack real (Next.js 14, TypeScript, Supabase/PostgreSQL, Mercado Pago, Resend, Vercel), marcando claramente o que já foi **construído em código nesta sessão**, o que é **ação sua** (dashboard Supabase/Vercel, teste no navegador — fora do alcance de escrita de arquivo) e o que fica para depois.

---

## Como ler este documento

- ✅ **Construído agora** — código já escrito nesta sessão, arquivo por arquivo.
- 🔲 **Ação sua** — só você consegue fazer (rodar SQL no Supabase Dashboard, configurar env var no Vercel, testar fluxo no navegador, decisão de negócio).
- ⏳ **Próximo sprint de código** — ainda não construído, mas priorizado real dentro da ordem decidida.
- ⛔ **Fica para depois** — explicitamente adiado pelo parecer (ERP completo, workflow engine genérica, marketplace, white-label, app mobile nativo, i18n/multi-moeda completos, Kubernetes/microsserviços/Kafka, integrações SAP/TOTVS/Oracle).

---

## Prioridade 1 — Produção (finalizar o gate de pagamento)

Base: seção 13 do blueprint principal, checklist "antes de ir pra produção de verdade".

| Item | Status |
|---|---|
| Rodar `004_course_payments.sql` e `005_admin_financeiro.sql` em produção (Supabase) | 🔲 Ação sua — SQL Editor do projeto Supabase de produção |
| Rodar `006_perfil_candidato.sql`, `007_vagas_matching.sql`, `008_simulacao_entrevista.sql` em produção (se ainda não rodadas lá — só foram confirmadas em ambiente de desenvolvimento) | 🔲 Ação sua |
| **Nova**: rodar `009_audit_log.sql` (auditoria — ver Prioridade 4 abaixo) | 🔲 Ação sua — em dev primeiro, depois produção |
| Ajustar `price_cents` real do curso piloto (hoje é o placeholder de teste) | 🔲 Ação sua — decisão de preço |
| Trocar `MERCADOPAGO_ACCESS_TOKEN` pela credencial de produção | 🔲 Ação sua |
| Cadastrar `MERCADOPAGO_ACCESS_TOKEN` e `SUPABASE_SERVICE_ROLE_KEY` no Vercel (Settings → Environment Variables) | 🔲 Ação sua |
| Reconfirmar `auto_return` funcionando sozinho em domínio real | 🔲 Ação sua — só testável com domínio real, não localhost |
| Decidir sobre Pix (exige chave cadastrada na conta vendedora) | 🔲 Ação sua — decisão de negócio |
| **Decisão pendente**: o que fazer com os 3 cursos de teste (`teste-preco-baixo/medio/alto`) | 🔲 Ação sua — ver nota abaixo |

**Nota sobre os cursos de teste:** eles já são invisíveis no catálogo normal (`sector_id = null` e nenhuma query de listagem os busca — só acesso direto por slug ou pelo dropdown do painel financeiro). Não deletei nem desativei nada agora porque isso é dado (histórico de pagamentos de teste vinculado a eles) e essa limpeza já estava registrada como decisão pendente sua, não miha. Três caminhos possíveis, me diga qual prefere:
1. Manter como estão (continuam servindo pra testar preço em produção também).
2. Desativar (`is_active = false`) — some da possibilidade de nova compra, mas mantém o histórico de pagamentos já feito.
3. Apagar de vez (curso + pagamentos de teste) — só eu não faço isso sem confirmação explícita seguida de um "sim, pode apagar", por ser exclusão permanente de dado.

## Prioridade 2 — Empregabilidade (validar e aprofundar o que já existe)

Base: checklist de validação da seção 15 do blueprint principal — só o item "perfil" foi testado até agora (e um bug real foi encontrado e corrigido: falta de feedback visual no "Salvar perfil").

| Item | Status |
|---|---|
| `/academy/perfil` — preencher perfil e autoavaliar competências | ✅ Testado, bug corrigido |
| Tentar matricular em curso de setor **sem** Nivelamento concluído → confirmar banner de pré-requisito | 🔲 Ação sua — teste no navegador |
| Concluir Nivelamento (ou usar usuário já certificado) → confirmar que o gate libera | 🔲 Ação sua |
| `/empresas/vagas` (RH) — publicar vaga com competências | 🔲 Ação sua |
| `/academy/vagas` (candidato) — ver vaga, conferir % de match, demonstrar interesse | 🔲 Ação sua |
| Voltar em `/empresas/vagas` e mudar status do candidato no pipeline | 🔲 Ação sua |
| `/academy/curriculo` — conferir dados e testar impressão (Ctrl+P) | 🔲 Ação sua |
| `/academy/entrevista` — responder, recarregar, confirmar persistência | 🔲 Ação sua |
| Rodar `npx tsc --noEmit` antes do próximo `git push` (cobre também os arquivos novos desta sessão: `lib/audit/*`, rota de export, página de auditoria) | 🔲 Ação sua — sem terminal nesta sessão |

## Prioridade 3 — Financeiro básico (não ERP completo)

| Item | Status |
|---|---|
| Receita/vendas/ticket médio, filtro por curso | ✅ Já existia (`/admin/academy/financeiro`, migration 005) |
| **Novo**: exportação CSV do relatório de pagamentos | ✅ Construído agora — `app/admin/academy/financeiro/export/route.ts` + botão "Exportar CSV" na página |
| Inadimplência, assinaturas/planos recorrentes, plano de contas, contas a pagar, comissão de afiliados (peças do ERP completo descrito na Visão 3) | ⛔ Fica para depois — hoje o modelo é pagamento único por curso, não assinatura; construir isso exigiria schema novo (planos, contratos, recorrência) e não tem retorno até haver demanda real de assinatura |

## Prioridade 4 — Auditoria e segurança

| Item | Status |
|---|---|
| Tabela `audit_log` (ação, entidade, autor, metadata, timestamp) | ✅ Construído agora — `sql/migrations/009_audit_log.sql` |
| RLS: só admin lê; insert restrito ao próprio autor ou admin | ✅ Incluído na migration 009 |
| Helper de log (`lib/audit/log.ts`, `logAuditEvent`) | ✅ Construído agora |
| Log em: aprovação/rejeição de empresa (`organization.approve/reject`) | ✅ Integrado em `app/admin/academy/empresas/actions.ts` |
| Log em: mudança de status de pagamento (`payment.status_changed`) | ✅ Integrado em `lib/payments/grant.ts` (`reconcilePayment`) |
| Log em: publicação de vaga e mudança de status (`job_posting.create/status_changed`) | ✅ Integrado em `app/empresas/vagas/actions.ts` |
| Log em: avanço de candidato no pipeline (`job_match.status_changed`) | ✅ Integrado em `app/empresas/vagas/actions.ts` |
| Tela de consulta (`/admin/academy/auditoria`) | ✅ Construído agora, link adicionado no `AdminNav` |
| Observabilidade de infraestrutura (erros, performance, tracing — ex. Sentry) | ⏳ Próximo sprint — decisão de ferramenta e custo, não construído ainda |
| MFA/SSO, WAF, SIEM, políticas de retenção formais | ⛔ Fica para depois — nada disso tem urgência num produto ainda validando mercado |

## Prioridade 5 — IA leve (depois de validado o resto)

| Item | Status |
|---|---|
| Recomendação de vaga, melhoria de currículo, feedback de entrevista com IA | ⛔ Fica para depois — decisão de negócio antes (qual provedor de IA, orçamento por chamada, se cabe no plano atual do produto) — não construir sem essa decisão |

---

## O que fica explicitamente para depois (sem mudança nesta sessão)

ERP financeiro completo (plano de contas, contas a pagar, comissão, nota fiscal), engine de workflow genérica configurável, marketplace amplo (eventos, mentorias, e-books), motor de white-label multi-tenant genérico, aplicativo mobile nativo, i18n completo (decisão já registrada na seção 11 do blueprint principal — continua adiada), multi-moeda, Kubernetes/microsserviços/Kafka/RabbitMQ, integrações SAP/TOTVS/Oracle. Nenhum desses tem retorno hoje sem validação comercial real do que já existe — é exatamente o veredito do parecer técnico.

## Ordem de migrations (atualizada)

```
001 → 002 → 003 → 004 → 005 → 006 → 007 → 008 → 009 (nova, auditoria)
```

## Resumo do que foi entregue nesta sessão

Arquivos novos: `sql/migrations/009_audit_log.sql`, `lib/audit/log.ts`, `lib/audit/queries.ts`, `app/admin/academy/auditoria/page.tsx`, `app/admin/academy/financeiro/export/route.ts`.
Arquivos editados: `components/admin/AdminNav.tsx` (link Auditoria), `app/admin/academy/empresas/actions.ts` (log de aprovação/rejeição), `lib/payments/grant.ts` (log de mudança de status de pagamento), `app/empresas/vagas/actions.ts` (log de vaga criada/status alterado, candidato avançado no pipeline), `app/admin/academy/financeiro/page.tsx` (botão Exportar CSV).

## Pergunta em aberto pra você

Só a decisão sobre os 3 cursos de teste (manter / desativar / apagar) ficou pendente de resposta sua — o resto da Prioridade 4 (auditoria) e parte da Prioridade 3 (CSV) já está no código, faltando só rodar a migration 009 no Supabase (dev, depois produção) pra funcionar de ponta a ponta.
