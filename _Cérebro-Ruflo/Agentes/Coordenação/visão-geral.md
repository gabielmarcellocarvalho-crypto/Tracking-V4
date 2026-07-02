# Agentes de Coordenação

## hierarchical-coordinator
- **Uso**: Coordenação top-down com hierarquia clara (lead → workers)
- **Quando**: Tasks com dependências sequenciais, pipeline A→B→C→D
- **Topologia**: Padrão do projeto (hierarchical-mesh)

## mesh-coordinator
- **Uso**: Coordenação peer-to-peer, decisões distribuídas
- **Quando**: Tasks paralelas independentes sem hierarquia definida
- **Topologia**: mesh

## adaptive-coordinator
- **Uso**: Muda topologia dinamicamente conforme o contexto
- **Quando**: Tasks com requisitos que evoluem durante execução

## Padrões de comunicação

| Padrão | Fluxo | Use quando |
|--------|-------|------------|
| Pipeline | A → B → C → D | Dependências sequenciais |
| Fan-out | Lead → A, B, C → Lead | Trabalho paralelo independente |
| Supervisor | Lead ↔ workers | Coordenação contínua |

## Regras de comms
- Sempre nomear agentes (`name: "role"`)
- Spawnar TODOS em uma mensagem com `run_in_background: true`
- Nunca fazer polling — agentes mandam mensagem de volta
