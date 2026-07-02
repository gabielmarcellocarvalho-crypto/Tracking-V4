# Agentes de Performance

## performance-engineer
- **Uso**: Otimização de código, profiling, redução de latência
- **Quando**: Gargalos identificados, benchmark falhou, otimização planejada

## perf-analyzer
- **Uso**: Análise de métricas, identificar bottlenecks, interpretar dados
- **Quando**: Antes da otimização (entender o problema primeiro)

## Pipeline performance
```
perf-analyzer → performance-engineer → tester
```

## Worker automático
Worker `optimize` dispara a cada 2h (configurado no daemon).

```bash
npx @claude-flow/cli@latest performance benchmark
```
