# VaultMindOS — Backup Strategy v1.0

> **Superado.** Este documento é o toolkit v1, criado antes de o ConnectionCyberOS (CDP) existir. A partir de 2026-07-02 (Módulo 1 do Master Execution Roadmap), a regra oficial passa a ser o **Documento 002 — Repository & Backup Foundation**, em `docs/devops/repository-backup-foundation-v1.md`, e os scripts `scripts/*.ps1` foram migrados para a v2 (config-driven via `config/paths.json`). Mantido aqui apenas como registro histórico — não editar.

## 1. Objetivo

Definir as regras oficiais de backup, sincronização GitHub, restauração e proteção operacional do projeto VaultMindOS.

## 2. Pastas oficiais

| Função | Caminho |
|---|---|
| Desenvolvimento principal | `C:\Projetos\vaultmindos` |
| Backup em nuvem OneDrive | `C:\Users\joaqu\OneDrive\Projetos\vaultmindos` |
| Backup externo | `E:\Projetos\vaultmindos` |
| Snapshots ZIP | `E:\Projetos\BACKUPS\vaultmindos` |
| Repositório GitHub | `https://github.com/connectioncyberos/vaultmindos.git` |

## 3. Regra principal

A pasta oficial de trabalho é sempre:

```text
C:\Projetos\vaultmindos
```

As demais pastas são destinos de backup e restauração, não devem ser usadas como origem principal de desenvolvimento.

## 4. Estratégia 3-2-1 adaptada

O projeto terá quatro camadas de proteção:

1. Cópia principal local em `C:\Projetos\vaultmindos`.
2. Versionamento GitHub.
3. Backup OneDrive.
4. Backup externo em `E:\Projetos\vaultmindos` e snapshots ZIP.

## 5. Ordem oficial do procedimento

```text
Validar ambiente
↓
Copiar para OneDrive
↓
Copiar para HD externo
↓
Gerar ZIP versionado
↓
Commit Git
↓
Push GitHub
↓
Registrar log
```

## 6. Arquivos e pastas excluídos

Nunca copiar ou versionar:

```text
node_modules
.next
.git
.vercel
dist
build
coverage
.env
.env.local
.env.production.local
```

## 7. Frequência recomendada

| Evento | Ação |
|---|---|
| Antes de codar | `verify-vaultmindos.ps1` |
| Após alterações importantes | `backup-vaultmindos.ps1` |
| Final do dia | `backup-vaultmindos.ps1` |
| Antes de atualizar dependências | backup completo |
| Antes de migração Supabase | backup completo + export SQL |
| Antes de deploy produção | backup completo |

## 8. Logs

Os logs ficarão em:

```text
C:\Projetos\vaultmindos\logs\backup
```

Cada execução cria um arquivo com data e hora.

## 9. Restauração

A restauração deve ser feita apenas quando necessário usando:

```powershell
.\scripts\restore-vaultmindos.ps1 -Fonte OneDrive
```

ou

```powershell
.\scripts\restore-vaultmindos.ps1 -Fonte Externo
```

O script exige confirmação manual com a palavra `RESTAURAR`.

## 10. Critério de sucesso

O backup é considerado válido quando:

- o GitHub recebeu o push;
- OneDrive foi sincronizado;
- HD externo foi sincronizado ou corretamente ignorado se indisponível;
- snapshot ZIP foi criado quando o drive E estava disponível;
- log foi gerado sem erro crítico.

## 11. Decisão arquitetural

O VaultMindOS terá backup operacional antes do início do desenvolvimento funcional. Nenhum código crítico será criado sem estar protegido por GitHub, OneDrive, HD externo e logs locais.
