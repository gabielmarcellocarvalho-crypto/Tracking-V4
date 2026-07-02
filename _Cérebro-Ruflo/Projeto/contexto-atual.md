# Contexto Atual — Tracking V4

**Última atualização:** 2026-06-14

---

## Status

Build passando — 9 rotas compiladas sem erros.

## Design System Aplicado

Migração completa do tema antigo (blue-navy + laranja) para o design de `design-system/dashboard.html`:

| Token | Valor |
|---|---|
| Background | `#0B0B0B` (--bg) |
| Surface | `#101010` (--bg-s) |
| Card | `#181818` (--bg-c) |
| Border | `#282828` (--br) |
| Accent | `#C8102E` V4 Red (--red) |
| Text 1 | `#F0F0F0` |
| Text 2 | `#909090` |
| Text 3 | `#484848` |
| Font mono | JetBrains Mono |
| Font UI | Inter |

## Arquivos Atualizados

- `app/globals.css` — CSS variables + aliases legado
- `tailwind.config.ts` — cores mapeadas
- `components/tracking/Sidebar.tsx` — 240px, left-border active vermelho, SVG icons
- `components/tracking/DashboardHeader.tsx` — header vermelho
- `components/tracking/KPICard.tsx` — prop `svgPath` (sem emoji), top accent bar
- `components/tracking/LeadsTable.tsx` — JetBrains Mono na coluna campanha
- `components/dashboard/DashboardTabs.tsx` — underline ativo vermelho
- `components/clientes/ClienteCard.tsx` — CTA button vermelho
- `app/login/page.tsx` — accent vermelho
- `app/clientes/page.tsx` — logo/avatar vermelho
- `lib/mock-data.ts` — KPIData com `svgPath` em vez de `icon`

## Estrutura de Rotas

```
/                                     → redirect (auth check)
/login                                → Firebase Auth
/clientes                             → grid de clientes
/clientes/[clienteId]/tracking        → KPIs + gráficos + leads
/clientes/[clienteId]/utms            → UTMs por canal + gerador
/clientes/[clienteId]/jornada         → timeline usuário
/clientes/[clienteId]/conversoes      → log conversões CAPI/Google
```

## Animações (framer-motion instalado)

Padrão aplicado nos componentes principais:
- **KPICard** — entrada fade+slide+spring com stagger por índice (`delay: i * 0.08`), barra accent animada com `scaleX`, número com countUp via `useMotionValue`, hover border glow + lift (`whileHover: { y: -4 }`)
- **ClienteCard** — entrada spring com stagger por índice, hover lift + border glow vermelho, botão CTA com `whileHover: { scale: 1.02 }` + `whileTap: { scale: 0.97 }`
- **LeadsTable** — tabela fade+slide, rows com entrada staggered (`delay: 0.4 + i * 0.055`)
- **Charts (BarChart/FunnelChart)** — cards com fade+slide sequencial na tracking page
- **Clientes page** — título com fade, grid passa `index` para stagger nos ClienteCards

## Próximos Passos

1. [ ] Criar usuário no Firebase Console para testar login
2. [ ] Conectar Firestore real (substituir mock-data)
3. [ ] Deploy no Vercel
4. [ ] Implementar páginas /meta, /google, /ga4
