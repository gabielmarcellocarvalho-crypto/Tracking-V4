# Agentes de Arquitetura

## system-architect
- **Uso**: Design de sistema, decisões de arquitetura, ADRs
- **Quando**: Features grandes, mudanças de API, refactor de módulo
- **Recebe de**: researcher
- **Manda para**: coder ou backend-dev

## backend-dev
- **Uso**: Desenvolvimento backend especializado (APIs, DB, serviços)
- **Quando**: Tarefas de server-side que precisam de foco
- **Recebe de**: architect
- **Manda para**: tester

## mobile-dev
- **Uso**: Desenvolvimento mobile (React Native, etc.)
- **Quando**: Features mobile-específicas
- **Recebe de**: architect
- **Manda para**: tester

## Quando usar arquitetura vs core
- **Core (coder)**: Edições simples, bugs óbvios, mudanças pontuais
- **Arquitetura**: 3+ arquivos, nova feature, mudança de contrato de API
