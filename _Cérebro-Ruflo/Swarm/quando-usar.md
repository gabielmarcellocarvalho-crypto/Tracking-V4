# Quando Usar Swarm

## SIM — use swarm
- 3+ arquivos afetados
- Feature nova
- Refactor cross-módulo
- Mudanças de API
- Segurança
- Performance crítica

## NÃO — use ferramentas diretas
- Edição de arquivo único
- Fix de 1-2 linhas
- Updates de docs / config
- Perguntas / explicações

## Custo vs benefício
Agentes têm overhead. Para tasks simples, `Edit` direto é mais rápido e barato.
Ver [[../../memory/feedback_agent_cost]] (memória do projeto).
