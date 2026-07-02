# Memória — Como Usar

## Antes de qualquer task
```bash
npx @claude-flow/cli@latest memory search --query "[keywords da task]" --namespace patterns
npx @claude-flow/cli@latest hooks route --task "[descrição]"
```

## Após sucesso
```bash
npx @claude-flow/cli@latest memory store --namespace patterns --key "[nome]" --value "[o que funcionou]"
npx @claude-flow/cli@latest hooks post-task --task-id "[id]" --success true --store-results true
```

## Namespaces
| Namespace | Conteúdo |
|-----------|----------|
| `patterns` | Padrões de solução que funcionaram |
| `agent-teams` | Estado compartilhado entre agentes |

## Auto-memory (sistema Claude)
O sistema salva memórias automaticamente em:
`C:\Users\gabie\.claude\projects\C--Projetos-Dev-Teste-Ruflo\memory\`

Tipos: `user`, `feedback`, `project`, `reference`

## MCP para memória
Ver [[../MCP/tools-por-categoria#Memória]]
