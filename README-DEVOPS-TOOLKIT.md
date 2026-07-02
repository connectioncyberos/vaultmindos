# VaultMindOS DevOps Toolkit v2.0

Este pacote contém os scripts operacionais do VaultMindOS, migrados para o padrão da ConnectionCyber Developer Platform (CDP) no Módulo 1 do Master Execution Roadmap (2026-07-02). Implementa o **Documento 002 — Repository & Backup Foundation v1.0** e o **ADR-0001** do ConnectionCyberOS.

## Arquivos

```text
config/paths.json                                    <- configuração central (sem caminhos fixos nos scripts)
scripts/init-vaultmindos-folders.ps1
scripts/verify-vaultmindos.ps1
scripts/backup-vaultmindos.ps1
scripts/restore-vaultmindos.ps1
docs/devops/repository-backup-foundation-v1.md         <- Documento 002 (cópia corporativa)
docs/architecture-decisions/adr-0001-backup-versioning-strategy.md
docs/devops/backup-strategy-v1.md                      <- v1, superado, mantido como histórico
docs/devops/github-backup-rules-v1.md                  <- v1, superado, mantido como histórico
.gitignore
.env.example
```

## Configuração central

Todos os scripts leem `config/paths.json` para descobrir os caminhos de workspace, OneDrive, HD externo e snapshots, além das listas de exclusão e tipos de commit. É o mesmo arquivo (mesmo conteúdo) usado pelo ConnectionCyberOS — a raiz compartilhada do ecossistema.

## Primeira execução

```powershell
cd C:\Projetos\vaultmindos
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
.\scripts\init-vaultmindos-folders.ps1
.\scripts\verify-vaultmindos.ps1
.\scripts\backup-vaultmindos.ps1 -DryRun
.\scripts\backup-vaultmindos.ps1
```

## Restauração

```powershell
.\scripts\restore-vaultmindos.ps1                 # Auto: GitHub -> OneDrive -> HD -> ZIP
.\scripts\restore-vaultmindos.ps1 -Fonte GitHub
```

## Logs

```text
logs/AAAA/MM/backup.log
logs/AAAA/MM/restore.log
logs/AAAA/MM/git.log
logs/AAAA/MM/deploy.log
logs/AAAA/MM/health.log
```

## Repositório oficial

```text
https://github.com/connectioncyberos/vaultmindos.git
```

## Próximo passo

Seguir o **Master Execution Roadmap v1.0** (`C:\Projetos\connectioncyberos\docs\projects\master-execution-roadmap-v1.md`) a partir do Módulo 2 — Bootstrap do projeto Next.js do VaultMindOS.
