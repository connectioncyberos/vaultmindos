> **Documento corporativo compartilhado.** Cópia oficial do ADR-0001 do ConnectionCyberOS. O "Escopo de Aplicação" abaixo, especificamente sobre a migração do VaultMindOS, foi executado no Módulo 1 do Master Execution Roadmap (2026-07-02): `config/paths.json` e os 4 scripts v2 já estão em produção neste projeto.

# ADR-0001 — Estratégia de Versionamento e Backup

**Status:** Aceito
**Data:** 2026-07-01
**Projeto:** ConnectionCyberOS (aplica-se a todo o ecossistema ConnectionCyber)
**Documento relacionado:** `docs/devops/repository-backup-foundation-v1.md` (Documento 002)

## Contexto

A ConnectionCyber está construindo múltiplos projetos (ConnectionCyberOS, VaultMindOS, CyberTreinaIA e futuros SaaS) sem uma política única de versionamento, backup e recuperação. Isso gera risco de perda de dados, inconsistência entre projetos e ausência de rastreabilidade.

## Decisão

Todos os projetos da ConnectionCyber utilizarão uma estratégia padronizada baseada em:

- **GitHub** como repositório oficial (fonte de verdade e histórico);
- **OneDrive** como backup em nuvem;
- **HD externo** como recuperação de desastre;
- **Snapshots ZIP versionados** como cópia imutável point-in-time;
- **Scripts PowerShell automatizados** (init, verify, backup, restore), parametrizados por `config/paths.json`;
- **Logs de auditoria** por projeto, organizados por ano/mês, nunca apagados automaticamente.

A regra 3-2-1 clássica é ampliada para 3-2-1+ com cinco camadas simultâneas (ver Documento 002, seção 3): workspace, GitHub, OneDrive, HD externo e snapshot ZIP.

## Alternativas Consideradas

| Alternativa | Motivo da rejeição |
|---|---|
| Apenas GitHub (sem backup local/externo) | Não cobre indisponibilidade do GitHub, exclusão acidental de repositório ou perda de acesso à conta |
| Apenas backup em nuvem (OneDrive) | Depende de conectividade e de um único provedor; sem histórico de versões nem rastreabilidade de mudanças |
| Backup manual sem automação | Alto risco de esquecimento humano; não escalável para 50+ projetos e 200+ SaaS |
| Caminhos fixos hardcoded em cada script | Gera divergência entre projetos e dificulta mudança de infraestrutura (ex.: trocar disco externo) — substituído por `config/paths.json` central |

## Consequências

**Positivas:**
- Qualquer projeto pode ser restaurado a partir de 4 fontes independentes;
- padronização permite que o Bootstrap gere projetos já compatíveis com este toolkit;
- logs e auditoria dão rastreabilidade completa de cada operação;
- configuração central elimina duplicação e reduz erro humano.

**Negativas / custos aceitos:**
- overhead de execução em cada backup (múltiplas cópias);
- dependência de disponibilidade do disco `E:` para a camada externa e snapshots (mitigada: etapa é ignorada com aviso se o disco não estiver conectado, sem interromper o restante do fluxo);
- necessidade de manter `config/paths.json` atualizado se a infraestrutura mudar (ponto único, portanto baixo custo de manutenção).

## Escopo de Aplicação

Obrigatório para todo projeto novo criado sob a ConnectionCyber a partir desta data. Projetos existentes (VaultMindOS) devem migrar para consumir `config/paths.json` quando o módulo de Backup Manager da CDP for centralizado (Missão 5 do Master Blueprint v1.0). **Status desta migração para o VaultMindOS: concluída em 2026-07-02 (Módulo 1 do Master Execution Roadmap).**
