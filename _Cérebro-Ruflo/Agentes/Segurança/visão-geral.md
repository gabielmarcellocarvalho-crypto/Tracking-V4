# Agentes de Segurança

## security-architect
- **Uso**: Design de segurança, threat modeling, arquitetura segura
- **Quando**: Novos fluxos de auth, permissões, dados sensíveis

## security-auditor
- **Uso**: Auditoria de código existente, busca de vulnerabilidades
- **Quando**: Após mudanças em código de auth/validação, antes de releases

## MCP Security Tools
Ver [[../../MCP/tools-por-categoria#Segurança]]

```bash
npx @claude-flow/cli@latest security scan
```

## Triggers automáticos
- Worker `audit` dispara após mudanças de segurança
- `aidefence_scan` detecta PII e vulnerabilidades
