# Agentes Core

Agentes de uso geral para a maioria das tarefas de desenvolvimento.

## coder
- **Uso**: Implementar código, fazer edições em arquivos
- **Quando**: Feature nova, bug fix, refactor
- **Recebe mensagens de**: architect, researcher
- **Manda mensagens para**: tester

## reviewer
- **Uso**: Revisar qualidade de código, segurança, boas práticas
- **Quando**: Após implementação, antes de commit
- **Recebe mensagens de**: tester
- **Manda mensagens para**: lead (você)

## tester
- **Uso**: Escrever e rodar testes, validar comportamento
- **Quando**: Após coder terminar implementação
- **Recebe mensagens de**: coder
- **Manda mensagens para**: reviewer

## planner
- **Uso**: Decompor tarefas complexas, criar plano de execução
- **Quando**: Tarefas grandes com múltiplos passos
- **Recebe mensagens de**: lead
- **Manda mensagens para**: architect ou coder

## researcher
- **Uso**: Explorar codebase, entender contexto, mapear dependências
- **Quando**: Início de qualquer tarefa não trivial
- **Recebe mensagens de**: lead
- **Manda mensagens para**: architect

## Pipeline padrão
```
researcher → architect → coder → tester → reviewer
```

Ver [[../Coordenação/visão-geral]] para padrões de comunicação.
