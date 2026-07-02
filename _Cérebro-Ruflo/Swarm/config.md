# Swarm — Configuração

## Config atual do projeto
```
Topologia:  hierarchical-mesh (anti-drift)
Max Agents: 15
Memória:    hybrid
HNSW:       Enabled
Neural:     Enabled
```

## Inicializar swarm
```bash
npx @claude-flow/cli@latest swarm init --topology hierarchical --max-agents 8 --strategy specialized
```

## Roteamento por tipo de tarefa

| Tarefa | Agentes | Topologia |
|--------|---------|-----------|
| Bug Fix | researcher, coder, tester | hierarchical |
| Feature | architect, coder, tester, reviewer | hierarchical |
| Refactor | architect, coder, reviewer | hierarchical |
| Performance | perf-engineer, coder | hierarchical |
| Security | security-architect, auditor | hierarchical |

## Model routing (3 tiers)

| Tier | Handler | Quando usar |
|------|---------|-------------|
| 1 | Agent Booster (WASM) | Transforms simples — usar Edit diretamente |
| 2 | Haiku | Tasks simples, baixa complexidade |
| 3 | Sonnet/Opus | Arquitetura, segurança, raciocínio complexo |

Ver [[quando-usar]] para decisão sim/não.
