# CLI — Referência Rápida

> `npx @claude-flow/cli@latest <comando>`

## Setup e diagnóstico
```bash
init --wizard           # Setup inicial
doctor --fix            # Diagnóstico e correção
daemon start            # Iniciar daemon
```

## Swarm
```bash
swarm init --topology hierarchical --max-agents 8 --strategy specialized
swarm init --v3-mode
swarm status
swarm health
```

## Memória
```bash
memory search --query "" --namespace patterns
memory store --namespace patterns --key "" --value ""
```

## Hooks
```bash
hooks route --task ""
hooks post-task --task-id "" --success true --store-results true
hooks worker dispatch --trigger audit
hooks worker dispatch --trigger optimize
hooks worker dispatch --trigger testgaps
hooks worker dispatch --trigger map
hooks worker dispatch --trigger document
```

## Segurança e Performance
```bash
security scan
performance benchmark
```

## Total: 26 comandos, 140+ subcomandos
Use `--help` em qualquer comando para detalhes.
