> **Documento corporativo compartilhado.** Esta é a cópia oficial do Documento 002 do ConnectionCyberOS, aplicada ao VaultMindOS (Módulo 1 do Master Execution Roadmap, migração para o padrão CDP). Os exemplos de script abaixo usam `connectioncyberos` como referência da CDP — os scripts reais deste projeto são `scripts/init-vaultmindos-folders.ps1`, `verify-vaultmindos.ps1`, `backup-vaultmindos.ps1` e `restore-vaultmindos.ps1`, já parametrizados via `config/paths.json` deste repositório.

# ConnectionCyberOS — Documento 002

## Repository & Backup Foundation v1.0

**Status:** Oficial — obrigatório para todo projeto ConnectionCyber
**Missão:** Missão 1 do Master Blueprint v1.0
**Última atualização:** 2026-07-01

---

## 1. Objetivo

Definir toda a estratégia de armazenamento, versionamento, backup, recuperação, auditoria e sincronização dos projetos da ConnectionCyber.

Este documento é **obrigatório** para qualquer projeto desenvolvido dentro da empresa — não é específico do ConnectionCyberOS.

## 2. Princípio Mestre

> Todo dado deve existir em pelo menos quatro locais independentes. Nunca confiar em apenas um armazenamento.

## 3. Regra Oficial 3-2-1+

Evolução da estratégia clássica 3-2-1, ampliada para arquitetura corporativa. Cada ativo deve existir simultaneamente em:

```text
1. Workspace de Desenvolvimento   (C:\Projetos\<projeto>)
2. GitHub                          (repositório remoto)
3. Backup em Nuvem — OneDrive      (C:\Users\joaqu\OneDrive\Projetos\<projeto>)
4. Backup Externo — HD             (E:\Projetos\<projeto>)
5. Snapshot Compactado — ZIP       (E:\Projetos\Snapshots\<projeto>)
```

```text
                         DESENVOLVIMENTO

                     C:\Projetos\<projeto>
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
          ▼                      ▼                      ▼
      GitHub               OneDrive Backup        HD Externo
          │                      │                      │
          └───────────────┬──────┴───────────────┬──────┘
                          ▼
                   Snapshot Versionado (.zip)
```

Nenhum projeto pode depender de apenas um desses pontos.

## 4. Estrutura Oficial dos Projetos

Todos os projetos da ConnectionCyber seguem exatamente esta organização:

```text
C:\
└── Projetos
    ├── connectioncyberos
    ├── vaultmindos
    ├── cybertreinaia
    ├── projeto-a
    ├── projeto-b
    └── ...
```

| Camada | Caminho |
|---|---|
| Workspace | `C:\Projetos\<projeto>` |
| Backup em nuvem | `C:\Users\joaqu\OneDrive\Projetos\<projeto>` |
| Backup externo | `E:\Projetos\<projeto>` |
| Snapshots | `E:\Projetos\Snapshots\<projeto>` |
| GitHub | `https://github.com/connectioncyberos/<projeto>.git` |

Esta estrutura passa a ser **padrão corporativo** — vale para o ConnectionCyberOS, o VaultMindOS, o CyberTreinaIA e qualquer novo SaaS.

> **Nota de implementação:** os caminhos-raiz (`workspace`, `onedrive`, `external`, `snapshots`) ficam centralizados em `config/paths.json` (seção 10). Nenhum script referencia caminho fixo — todos derivam do config + nome do projeto. Logs permanecem colocalizados em cada projeto (`<projeto>\logs\`) para manter backup/restore atômico por projeto; a raiz `logs` de cada um segue o layout da seção 8.

## 5. Fluxo Oficial de Trabalho

Nenhuma alteração entra em produção sem seguir este fluxo. Se qualquer etapa falhar, o processo é interrompido.

```text
Editar
  ↓
Salvar
  ↓
Validação Local
  ↓
Backup Local
  ↓
Backup OneDrive
  ↓
Backup HD
  ↓
Git Commit
  ↓
Git Push
  ↓
Validação Final
  ↓
Log
```

## 6. Política de Commits

Commits pequenos, objetivos e rastreáveis. Padrão (Conventional Commits, versão corporativa completa):

```text
feat:      nova funcionalidade
fix:       correção de bug
docs:      documentação
refactor:  refatoração sem mudança de comportamento
test:      testes
perf:      performance
build:     build/dependências
ci:        integração contínua
chore:     manutenção
style:     formatação/estilo
security:  segurança
backup:    snapshot operacional
release:   versão publicada
```

Exemplos:

```text
feat: create project registry module
docs: update architecture book
backup: synchronize local and cloud copies
security: add secrets validation
```

## 7. Política de Backups

### 7.1 Backup automático

Executado:

- antes de cada push;
- antes de cada release;
- diariamente;
- antes de atualizações importantes.

### 7.2 Backup manual

Sempre disponível via `.\scripts\backup-<projeto>.ps1`. Atalho futuro planejado: comando único **"Backup Agora"** integrado à CDP.

### 7.3 Backup incremental

Robocopy `/MIR` já copia apenas arquivos alterados/removidos (espelhamento incremental) — não recopia o que não mudou.

### 7.4 Snapshot completo

Gerado automaticamente a cada execução de backup, com nomenclatura:

```text
<projeto>_AAAA-MM-DD_HHmmss.zip
```

Exemplo:

```text
vaultmindos_2026-07-02_103000.zip
```

## 8. Estrutura de Logs

```text
<projeto>\logs\
└── <AAAA>\
    └── <MM>\
        ├── backup.log
        ├── restore.log
        ├── git.log
        ├── deploy.log
        └── health.log
```

Cada linha de log contém timestamp, usuário, projeto e resultado da etapa. **Logs nunca são apagados automaticamente.**

## 9. Política de Exclusão

Nunca copiar nem versionar:

```text
node_modules
.next
.git
.vercel
dist
build
coverage
temp
cache
.turbo
```

A lista fica centralizada em `config/paths.json` (seção 10) — nenhuma lista duplicada dentro dos scripts.

## 10. Configuração Central

Todos os caminhos e listas de exclusão são definidos em um único arquivo:

```text
C:\Projetos\vaultmindos\config\paths.json
```

Estrutura:

```json
{
  "workspace": "C:\\Projetos",
  "onedrive": "C:\\Users\\joaqu\\OneDrive\\Projetos",
  "external": "E:\\Projetos",
  "snapshots": "E:\\Projetos\\Snapshots",
  "github": {
    "organization": "connectioncyberos"
  },
  "excludedDirectories": ["node_modules", ".next", ".git", ".vercel", "dist", "build", "coverage", ".turbo", ".cache", "temp", "cache"],
  "excludedFiles": [".env", ".env.local", ".env.development.local", ".env.production.local", "*.log"],
  "commitTypes": ["feat", "fix", "docs", "refactor", "test", "perf", "build", "ci", "chore", "style", "security", "backup", "release"]
}
```

Nenhum script tem caminhos fixos espalhados pelo código — todos leem `config/paths.json` e derivam o caminho do projeto atual a partir dele.

## 11. Restore

Todo projeto permite restauração a partir de quatro fontes, em ordem preferencial:

```text
GitHub
  ↓
OneDrive
  ↓
HD Externo
  ↓
Snapshot ZIP
```

GitHub é a fonte preferencial por ser a mais íntegra (histórico completo + hash de commit). OneDrive e HD são espelhos completos mas sem histórico. O ZIP é o último recurso — mais lento para restaurar, porém imutável.

## 12. Auditoria

Cada execução de backup/restore registra:

- data e hora;
- usuário (`$env:USERNAME`);
- projeto;
- arquivos copiados (resumo do robocopy);
- duração da execução;
- resultado (sucesso/falha);
- hash do commit (`git rev-parse --short HEAD`).

## 13. Verificação de Integridade

Após cada backup:

- validar quantidade de arquivos copiados (resumo robocopy);
- validar existência das pastas de destino;
- validar espaço disponível no disco de destino;
- validar código de retorno do Git;
- validar que a sincronização (OneDrive/HD) não retornou código de erro (>7 no robocopy).

## 14. Checklist de Validação

Antes de finalizar uma sessão de trabalho:

- [ ] Projeto salvo
- [ ] Backup local concluído
- [ ] Backup OneDrive concluído
- [ ] Backup externo concluído
- [ ] Commit realizado
- [ ] Push concluído
- [ ] Logs registrados
- [ ] Snapshot gerado (quando aplicável)

## 15. Scripts Oficiais deste projeto

Todos em `scripts/`, lendo `config/paths.json`:

| Script | Função |
|---|---|
| `init-vaultmindos-folders.ps1` | Cria estrutura local, OneDrive, HD externo, config e logs |
| `verify-vaultmindos.ps1` | Valida ambiente, integridade e sincronização |
| `backup-vaultmindos.ps1` | Fluxo completo de backup (OneDrive → HD → ZIP → commit → push → log) |
| `restore-vaultmindos.ps1` | Restaura com prioridade GitHub → OneDrive → HD → ZIP |

Uso:

```powershell
.\scripts\backup-vaultmindos.ps1                 # execução manual completa
.\scripts\backup-vaultmindos.ps1 -Silencioso      # agendamento/Task Scheduler
.\scripts\backup-vaultmindos.ps1 -DryRun          # simulação, sem copiar/commitar
.\scripts\restore-vaultmindos.ps1 -Fonte GitHub   # restauração por prioridade
```

## 16. Critério de Sucesso

O backup é válido quando:

- o GitHub recebeu o push;
- OneDrive foi sincronizado;
- HD externo foi sincronizado ou corretamente ignorado se indisponível;
- snapshot ZIP foi criado quando o drive `E:` estava disponível;
- log foi gerado sem erro crítico;
- `verify-vaultmindos.ps1` reporta todos os itens como `[OK]`.

## 17. Decisão Arquitetural

Ver **ADR-0001** (`docs/architecture-decisions/adr-0001-backup-versioning-strategy.md`) para o registro formal da decisão, justificativa e alternativas consideradas.

## 18. Próxima Missão

Para o ConnectionCyberOS, a próxima missão foi o Repository Bootstrap (já concluído). Para o VaultMindOS, a sequência segue no **Master Execution Roadmap v1.0** (`C:\Projetos\connectioncyberos\docs\projects\master-execution-roadmap-v1.md`), a partir do Módulo 2 (Bootstrap do projeto Next.js).
