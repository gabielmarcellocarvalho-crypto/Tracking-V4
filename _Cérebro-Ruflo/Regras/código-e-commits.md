# Regras — Código e Commits

## Código
- Fazer apenas o que foi pedido — nada mais, nada menos
- NUNCA criar arquivos desnecessários — preferir editar existentes
- NUNCA criar docs a menos que explicitamente pedido
- NUNCA salvar arquivos de trabalho na raiz — usar `/src`, `/tests`, `/docs`, `/config`, `/scripts`
- SEMPRE ler um arquivo antes de editar
- NUNCA commitar secrets, credenciais, ou `.env`
- Manter arquivos com menos de 500 linhas
- Validar input apenas nas bordas do sistema (não internamente)
- Sem comentários por padrão — só quando o "por quê" não é óbvio
- Sem error handling para cenários impossíveis

## Commits
- NUNCA adicionar `Co-Authored-By` a menos que `attribution.commit` esteja no settings.json
- Preferir criar commit novo em vez de amend
- Nunca usar `--no-verify` ou `--force` sem pedido explícito

## Agent Comms
- SEMPRE nomear agentes (`name: "role"`)
- Incluir instruções de comunicação no prompt (quem mandar, o quê)
- Spawnar TODOS de uma vez com `run_in_background: true`
- Após spawnar: PARAR, avisar o usuário, aguardar resultados
- NUNCA fazer polling — agentes mandam mensagem de volta

## Quando usar swarm vs direto
Ver [[../../Swarm/quando-usar]]
