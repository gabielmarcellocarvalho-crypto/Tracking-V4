# subagent_type — Tipos Oficiais do Claude Code

> Estes são os valores reais do parâmetro `subagent_type` no Agent tool.
> Diferente dos nomes customizados (coder, reviewer…), estes são built-in.

## Uso básico
```javascript
Agent({ subagent_type: "general-purpose", name: "meu-agente", prompt: "..." })
```

## Tipos disponíveis

### Geral
| subagent_type | Quando usar |
|---------------|-------------|
| `general-purpose` | Padrão — pesquisa, múltiplas etapas, exploração |
| `claude` | Catch-all genérico |
| `Explore` | Busca rápida read-only no código (glob, grep, leitura) |
| `Plan` | Planejar implementação, trade-offs, arquitetura |

### SPARC (fases de desenvolvimento estruturado)
| subagent_type | Fase |
|---------------|------|
| `specification` | Análise de requisitos |
| `pseudocode` | Design de algoritmo |
| `architecture` | Design do sistema |
| `refinement` | Melhoria iterativa |

### Coordenação e Consenso
| subagent_type | Quando usar |
|---------------|-------------|
| `hierarchical-coordinator` | Coordenação top-down com especialistas |
| `mesh-coordinator` | Peer-to-peer, decisão distribuída |
| `adaptive-coordinator` | Muda topologia dinamicamente |
| `byzantine-coordinator` | Consenso tolerante a falhas / atores maliciosos |
| `gossip-coordinator` | Consenso eventual escalável |
| `raft-manager` | Algoritmo Raft (leader election, log replication) |
| `quorum-manager` | Quórum dinâmico, membership |
| `crdt-synchronizer` | CRDTs para estado eventually consistent |

### Segurança e Performance
| subagent_type | Quando usar |
|---------------|-------------|
| `security-manager` | Mecanismos de segurança em sistemas distribuídos |
| `performance-benchmarker` | Benchmarks de protocolos de consenso |
| `tdd-london-swarm` | TDD London School com mocks em swarm |

### Validação e Qualidade
| subagent_type | Quando usar |
|---------------|-------------|
| `production-validator` | Validar que app está pronto para deploy |
| `planner` | Planejamento estratégico com otimização |

### Especializados
| subagent_type | Quando usar |
|---------------|-------------|
| `claude-code-guide` | Dúvidas sobre Claude Code CLI, API, MCP |
| `statusline-setup` | Configurar status line do Claude Code |
| `vercel:ai-architect` | Arquitetura de apps AI no Vercel |
| `vercel:deployment-expert` | Deployment, CI/CD, domínios no Vercel |
| `vercel:performance-optimizer` | Performance, Core Web Vitals no Vercel |

## Qual usar em cada cenário?

| Cenário | subagent_type recomendado |
|---------|--------------------------|
| Pesquisa no codebase | `Explore` |
| Planejar implementação | `Plan` ou `planner` |
| Task genérica complexa | `general-purpose` |
| Bug em sistema distribuído | `raft-manager` ou `byzantine-coordinator` |
| Deploy no Vercel | `vercel:deployment-expert` |
| Validar antes de release | `production-validator` |
| Feature com TDD | `tdd-london-swarm` |
| Dúvida sobre a API Claude | `claude-code-guide` |

## Nota importante
O `name` é o alias que você dá para comunicação via SendMessage.
O `subagent_type` é a especialização real do agente.
Podem ser iguais ou diferentes:
```javascript
Agent({ subagent_type: "general-purpose", name: "researcher", ... })
```
