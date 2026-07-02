# VaultMindOS — GitHub & Backup Rules v1.0

> **Superado.** Este documento é o toolkit v1, criado antes de o ConnectionCyberOS (CDP) existir. A partir de 2026-07-02 (Módulo 1 do Master Execution Roadmap), a regra oficial passa a ser o **Documento 002 — Repository & Backup Foundation** (`docs/devops/repository-backup-foundation-v1.md`) e o **GitHub Governance v1.0** do ConnectionCyberOS. Mantido aqui apenas como registro histórico — não editar.

## 1. Branch principal

A branch principal será:

```text
main
```

## 2. Repositório remoto

```text
https://github.com/connectioncyberos/vaultmindos.git
```

## 3. Padrão de commits

Usar Conventional Commits:

```text
docs: documentação
feat: funcionalidade
fix: correção
chore: manutenção
db: banco de dados
seo: SEO técnico
devops: scripts e automações
backup: snapshot operacional
```

## 4. Commits de backup

Formato padrão:

```text
backup: VaultMindOS yyyy-MM-dd HH:mm:ss
```

## 5. Regra de segurança

Nunca enviar ao GitHub:

```text
.env
.env.local
chaves secretas
tokens
service role key
senhas
arquivos de credenciais
```

## 6. Fluxo diário recomendado

```powershell
cd C:\Projetos\vaultmindos
.\scripts\verify-vaultmindos.ps1
.\scripts\backup-vaultmindos.ps1
```

## 7. Validação antes do push

Sempre verificar:

```powershell
git status
git remote -v
git branch
```

## 8. Risco mitigado

Essas regras protegem contra:

- perda local de arquivos;
- falha de HD;
- erro humano;
- perda de histórico;
- falta de rastreabilidade;
- sobrescrita indevida;
- exposição acidental de secrets.
