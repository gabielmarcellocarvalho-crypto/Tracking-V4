# MCP Tools por Categoria

> Usar `ToolSearch("keyword")` para descobrir e carregar schemas antes de chamar.

## Memória
| Tool | Uso |
|------|-----|
| `memory_store` | Salvar padrão/resultado |
| `memory_search` | Buscar por keyword |
| `memory_search_unified` | Busca cross-namespace |
| `memory_import_claude` | Importar memória Claude |
| `memory_bridge_status` | Status da bridge |

## Swarm
| Tool | Uso |
|------|-----|
| `swarm_init` | Inicializar swarm |
| `swarm_status` | Ver estado atual |
| `swarm_health` | Health check |

## Agents
| Tool | Uso |
|------|-----|
| `agent_spawn` | Spawnar agente via MCP |
| `agent_list` | Listar agentes ativos |
| `agent_status` | Status de um agente |

## Hooks
| Tool | Uso |
|------|-----|
| `hooks_route` | Rotear tarefa para agente certo |
| `hooks_post-task` | Registrar resultado pós-tarefa |
| `hooks_worker-dispatch` | Disparar worker background |

## Segurança
| Tool | Uso |
|------|-----|
| `aidefence_scan` | Scan de vulnerabilidades |
| `aidefence_is_safe` | Verificar segurança de entrada |
| `aidefence_has_pii` | Detectar PII |

## Hive-Mind
| Tool | Uso |
|------|-----|
| `hive-mind_init` | Inicializar hive mind |
| `hive-mind_consensus` | Buscar consenso entre agentes |
| `hive-mind_spawn` | Spawnar via hive mind |

## Background Workers

| Worker | Trigger | Quando |
|--------|---------|--------|
| `audit` | Após mudanças de segurança | security changes |
| `optimize` | A cada 2h | automático |
| `testgaps` | Após features | feature added |
| `map` | A cada 5+ mudanças | file changes |
| `document` | Após mudanças de API | api changes |

```bash
npx @claude-flow/cli@latest hooks worker dispatch --trigger audit
```
