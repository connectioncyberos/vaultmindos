# VaultMindOS — Roteiro de Teste do Zero v1.0

**Status:** Pronto para execução (ambiente de desenvolvimento)
**Data:** 2026-07-06
**Objetivo:** zerar o banco de desenvolvimento e, a partir do zero, cadastrar sua empresa, testar os
níveis de acesso (admin, empresa parceira/RH, aluno) e criar + validar um curso básico com bolsa
100%, bolsa 50% e pagamento normal (PIX/cartão via Mercado Pago Checkout Pro).

**Papéis nesta sessão:** eu preparei todo o código e o script de reset, mas não executo eu mesmo a
exclusão de dados nem faço login/cadastro por você — isso envolve senha e é uma ação irreversível,
então os passos abaixo são pra você seguir no navegador. Cada passo diz exatamente onde clicar.

---

## Passo 0 — Rodar as migrations novas (antes de zerar)

No SQL Editor do Supabase (projeto de **desenvolvimento**), rodar, se ainda não rodou:

```
sql/migrations/009_audit_log.sql
sql/migrations/010_bolsas.sql
```

(Se seu ambiente de dev já tinha 001-008 aplicadas, só falta essas duas novas.)

## Passo 1 — Reset total (dev)

Rodar `sql/scripts/reset-dev-database.sql` inteiro no SQL Editor do mesmo projeto de dev. Isso apaga
todo o conteúdo (artigos, cursos, empresas, pagamentos, usuários — tudo) mas mantém a estrutura das
tabelas intacta. Confirme antes que o projeto selecionado no topo do Supabase Dashboard é o de
desenvolvimento, não produção.

## Passo 2 — Seu cadastro, promovido a admin

1. Acesse `/signup` no navegador, cadastre-se com seu nome, e-mail real e uma senha seguinda (mín. 8
   caracteres). Aceite os Termos/Privacidade.
2. Confira sua caixa de entrada (e spam) e clique no link de confirmação.
3. Faça login em `/login`.
4. Todo cadastro novo nasce com papel `subscriber` — não existe tela pra virar admin sozinho (de
   propósito, por segurança). Pra se promover: Supabase Dashboard → **Table Editor** → tabela
   `users_profile` → localize a linha com seu `id` (confira em **Authentication → Users** qual é o
   seu, pelo e-mail) → edite a coluna `role` pra `admin` → salve.
5. Saia e entre de novo (ou só recarregue a página) pra sessão carregar o novo papel.
6. Acesse `/admin` — deve abrir o painel administrativo.

## Passo 3 — Cadastro da sua empresa (nível RH/gestor)

Pra testar de verdade o papel de RH/gestor de empresa parceira (diferente do admin), use uma segunda
conta. Se seu e-mail for do Gmail, o truque mais rápido é usar um alias: `seuemail+empresa@gmail.com`
— chega na mesma caixa de entrada, mas o Supabase Auth trata como um cadastro totalmente separado.

1. Saia da conta admin (ou abra uma aba anônima).
2. `/signup` com o e-mail da empresa (ex.: `seuemail+empresa@gmail.com`), confirme o e-mail, faça
   login.
3. `/empresas/cadastro` — preencha os dados reais da sua empresa (nome, CNPJ opcional, setor). Ao
   enviar, você vira automaticamente `RESPONSAVEL_RH` dessa organização (ver `app/empresas/actions.ts`),
   com status `PENDING` até um admin aprovar.
4. Volte pra conta admin (`/login` com o e-mail principal) → `/admin/academy/empresas` → aprovar a
   empresa que acabou de ser cadastrada.
5. Volte pra conta da empresa → `/empresas` → deve mostrar status "Aprovada".

## Passo 4 — Criar o curso básico do zero (como admin)

1. Como admin, acesse `/admin/academy/cursos` → **+ Novo curso**.
2. Preencha: título (ex.: "Curso Básico de Teste"), deixe slug em branco (gera sozinho), descrição
   curta, nível "Iniciante", setor em branco (fica sem trilha, igual o Nivelamento), preço em reais
   (ex.: `97,00`). Marque "Ativo". Criar curso.
3. Na tela seguinte (gestão do curso): **+ Adicionar módulo** (ex.: "Módulo 1 — Introdução") → depois,
   dentro do módulo criado, **+ Adicionar aula neste módulo** (título, marque "Prévia gratuita" se
   quiser uma aula de amostra). Crie pelo menos 1 módulo com 1 aula pra o curso funcionar de verdade
   (o certificado só é emitido quando todas as aulas existentes forem concluídas).

## Passo 5 — Criar os cupons de bolsa

Em `/admin/academy/bolsas`:

1. **Cupom 100%**: código `BOLSA100`, curso = o curso básico criado no Passo 4, desconto `100`, usos
   máximos em branco (ilimitado). Criar cupom.
2. **Cupom 50%**: código `BOLSA50`, mesmo curso, desconto `50`. Criar cupom.

(Alternativa pra testar a concessão direta em vez de cupom: na mesma página, seção "Concessão direta
a um aluno", escolher o aluno e o curso e digitar 100 ou 50 — libera sem o aluno precisar digitar
código nenhum.)

## Passo 6 — Testar os 3 fluxos de matrícula (como aluno)

Use uma terceira conta (ou a mesma conta da empresa do Passo 3, sem problema — matrícula é por
usuário, não por empresa) pra representar o aluno. Acesse o curso básico em `/academy/cursos/<slug>`.

**a) Bolsa 100%:** digite `BOLSA100` no campo "Código de bolsa" → Aplicar cupom. Deve liberar a
matrícula na hora, sem passar pelo Mercado Pago — o preço mostrado já aparece riscado com "bolsa de
100% aplicada" antes mesmo de clicar.

**b) Bolsa 50%:** (precisa de um segundo curso pago pra não bater no "já tem bolsa neste curso" — ou
teste isso com uma segunda conta de aluno) digite `BOLSA50` → Aplicar cupom → o preço do botão "Comprar
acesso" cai pela metade → clique nele → você vai pro Mercado Pago Checkout Pro (ambiente sandbox,
como o `MERCADOPAGO_ACCESS_TOKEN` ainda é de teste) → pague com um cartão de teste (pegue a lista
atualizada em
[mercadopago.com.br/developers/pt/docs/checkout-pro/additional-content/test-cards](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/additional-content/test-cards))
→ confirme que volta pro curso com "Pagamento aprovado — acesso liberado!" e o valor cobrado foi o
reduzido.

**c) Pagamento normal (PIX/cartão):** com uma terceira conta de aluno (ou o mesmo aluno num terceiro
curso pago sem cupom), clique direto em "Comprar acesso" pelo valor cheio, sem aplicar cupom. Na
página do Mercado Pago (Checkout Pro), **PIX, cartão de crédito e cartão de débito já aparecem
automaticamente** como opções — isso não depende de nenhuma mudança de código nossa, é a própria
página hospedada do Mercado Pago mostrando os métodos habilitados na conta vendedora. Se PIX não
aparecer, é porque a conta vendedora ainda não tem chave Pix cadastrada (ver blueprint seção 13) —
isso é configuração da conta Mercado Pago, não do código.

## Passo 7 — Conferir os painéis

- `/admin/academy/financeiro` — os pagamentos aparecem, incluindo o valor com desconto do fluxo (b) e
  o valor cheio do fluxo (c). A bolsa 100% do fluxo (a) **não aparece aqui** de propósito — ela nunca
  passa por `payments`, é matrícula direta (ver `/admin/academy/bolsas` pra ver as concessões).
- `/admin/academy/bolsas` — mostra os 2 cupons criados, quantas vezes cada um foi usado.
- `/admin/academy/auditoria` — mostra o evento `scholarship.redeemed` de cada resgate de cupom, a
  mudança de status de pagamento do fluxo (b)/(c), e a aprovação da empresa do Passo 3.

## Antes de considerar o teste concluído

- [ ] Rodar `npx tsc --noEmit` — cobre também todos os arquivos novos desta rodada (bolsas, cursos,
      auditoria).
- [ ] Confirmar que o projeto Supabase usado em todo este roteiro era mesmo o de desenvolvimento.
- [ ] Se o teste passar, decidir se replica isso em produção (rodar 009/010 lá também) ou se o curso
      básico de teste fica só em dev e produção segue com o catálogo real (Nivelamento + Administrativo
      4.0).
