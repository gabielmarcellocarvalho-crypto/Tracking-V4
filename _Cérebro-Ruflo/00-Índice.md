# Cérebro Ruflo — Índice Geral

> Base de conhecimento do projeto Ruflo. Lida pelo Claude sob demanda para reduzir tokens por sessão.

## Contexto do Projeto (ler primeiro em qualquer sessão)

| Arquivo | Conteúdo |
|---------|----------|
| [[Projeto/visão-geral]] | O que é o projeto, stack, objetivo |
| [[Projeto/arquitetura]] | Decisões técnicas, módulos, padrões |
| [[Projeto/contexto-atual]] | Estado atual, em andamento, bloqueios |

---

## Mapa de Navegação — Sistema Ruflo

| Área        | Arquivo                             | Conteúdo                                           |
| ----------- | ----------------------------------- | -------------------------------------------------- |
| **Agentes** | [[Agentes/subagent-types-oficiais]] | Tipos oficiais do Claude Code (subagent_type real) |
| **Agentes** | [[Agentes/Core/visão-geral]]        | coder, reviewer, tester, planner, researcher       |
| **Agentes** | [[Agentes/Arquitetura/visão-geral]] | system-architect, backend-dev, mobile-dev          |
| **Agentes** | [[Agentes/Segurança/visão-geral]]   | security-architect, security-auditor               |
| **Agentes** | [[Agentes/Performance/visão-geral]] | performance-engineer, perf-analyzer                |
| **Agentes** | [[Agentes/Coordenação/visão-geral]] | hierarchical, mesh, adaptive coordinators          |
| **Agentes** | [[Agentes/GitHub/visão-geral]]      | pr-manager, code-review-swarm, issue-tracker       |
| **Swarm**   | [[Swarm/config]]                    | Topologia, max-agents, roteamento                  |
| **Swarm**   | [[Swarm/quando-usar]]               | Regras: sim vs não para swarm                      |
| **MCP**     | [[MCP/tools-por-categoria]]         | memory, swarm, agent, hooks, security tools        |
| **Skills**  | [[Skills/lista-e-uso]]              | Todas as skills e quando invocar                   |
| **Memória** | [[Memória/como-usar]]               | memory_store, memory_search, padrões               |
| **CLI**     | [[CLI/referência-rápida]]           | 26 comandos, subcomandos principais                |
| **Regras**  | [[Regras/código-e-commits]]         | Regras de código, commits, agent comms             |

## Como o Claude usa este vault

1. **Sessão inicia**: CLAUDE.md carrega regras mínimas (sem detalhe)
2. **Tarefa chega**: Claude lê a nota específica (ex: só [[Swarm/quando-usar]])
3. **Token economizado**: Não carrega o vault inteiro, só o necessário

## Última atualização
2026-06-06
