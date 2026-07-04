# CLAUDE.md — Plataforma de Tracking V4

## O que é este projeto

Plataforma web interna da V4 Company (unidade Carvalho & Co) para centralizar e visualizar todos os dados de tracking dos clientes gerenciados pelo gestor de tráfego Gabriel.

O objetivo é ter uma **base de dados própria** que consolida informações de Meta Ads, Google Ads, GA4 e e-commerce — permitindo entender a jornada completa do usuário desde o clique no anúncio até a compra.

> Inspiração técnica: arquitetura apresentada por Dericson Pablo — estrutura central de dados própria, não dependendo 100% das plataformas de ads.

---

## Stack tecnológica

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js (App Router) |
| Banco de dados | Firebase Firestore |
| Autenticação | Firebase Auth (Email/Password) |
| Deploy | Vercel |
| Estilo | Tailwind CSS |

---

## Estrutura de dados — visão geral

### Coleções principais no Firestore

```
clientes/
  {clienteId}/
    info/           → nome, segmento, tipo (ecommerce, leads, mensagens)
    leads/          → dados de usuários que viraram lead
    compras/        → dados de usuários que compraram
    eventos/        → todos os eventos rastreados (page_view, lead, checkout, compra)
    utms/           → histórico de UTMs utilizadas

usuarios/
  {userId}/         → perfil do usuário da plataforma (admin/visualizador)
```

---

## Dados rastreados por cliente

### Dados do usuário/lead/comprador

- Email, nome, telefone
- Origem (UTM source, medium, campaign, content, term)

### Cookies de rastreamento

**Meta Ads:**
- `fbp` — Facebook Browser ID
- `fbc` — Facebook Click ID
- Geolocalização: cidade, estado, país
- IP do usuário
- User agent
- Valor pago na compra

**Google Ads:**
- `gclid` — Google Click ID
- `wbraid` — Web to App measurement
- `gbraid` — App to Web measurement

### Eventos rastreados (jornada do usuário)

1. `page_view` — visitou o site
2. `lead` — virou lead
3. `checkout` — iniciou checkout
4. `compra` — comprou

### Janelas de atribuição

- Meta Ads: **7 dias**
- Google Ads: **90 dias**

---

## Funcionalidades da plataforma

### Aba 1 — Login
- Tela de login com email e senha
- Firebase Auth
- Após login, redireciona para o dashboard

### Aba 2 — Seleção de cliente
- Lista todos os clientes cadastrados
- Card por cliente com nome e segmento
- Clique no cliente abre o dashboard daquele cliente

### Aba 3 — Dashboard do cliente

Sub-abas:
- **Tracking** → eventos rastreados, cookies coletados, jornada do usuário
- **UTMs** → planilha/tabela de UTMs no padrão V4
- **Jornada** → visualização da jornada completa (GA4 + Meta + e-commerce)
- **Conversões** → dados enviados para Meta CAPI e Google Enhanced Conversions

### Aba 4 — Jornada do Usuário (detalhada)
- Linha do tempo por usuário individual
- Mostra todos os touchpoints: de onde veio, quais páginas visitou, quando virou lead, quando comprou
- Combina dados de GA4 + Meta + e-commerce (Shopify ou outro)
- Usa cookies para unificar identidade do usuário (fbp, fbc, gclid)

### Aba 5 — UTMs (padrão V4)
- Tabela com todas as UTMs utilizadas por cliente
- Campos: campanha, conjunto, anúncio, source, medium, campaign, content, term
- Gerador de UTM integrado seguindo o padrão V4

---

## Fluxo técnico de dados (como funciona por baixo)

```
Usuário clica no anúncio
        ↓
Chega no site com cookies (fbp, fbc, gclid...)
        ↓
Site registra o evento (page_view, lead, compra...)
        ↓
Webhook/n8n captura e envia para Firestore
        ↓
Plataforma lê o Firestore e exibe os dados
        ↓
Plataforma envia conversão para Meta CAPI / Google
```

---

## Padrão de desenvolvimento

- Sempre usar **App Router** do Next.js (não Pages Router)
- Autenticação via **Firebase Auth** — nunca expor dados sem login
- Regras do Firestore: usuário só acessa dados dos clientes que tem permissão
- Variáveis de ambiente no `.env.local` (nunca commitar no git)
- Deploy automático via Vercel conectado ao GitHub
- Componentes em `/components`, páginas em `/app`
- Estilo com Tailwind CSS

---

## Controle de acesso (partners / members)

> Migração em andamento (2026-07): a coleção raiz do Firestore está virando
> `partners/{partnerId}` (era `clientes/{clienteId}`) e ganhou controle de
> acesso real por gestor. A seção "Estrutura de dados" acima ainda descreve o
> modelo antigo/planejado — será atualizada na limpeza final da migração.

- `partners/{partnerId}/members/{emailMinusculo}` — quem pode acessar aquele
  cliente. Campos: `email`, `role: 'admin' | 'viewer'`, `addedAt`, `addedBy?`.
  `admin` lê/escreve tudo; `viewer` só lê.
- `config/superadmins` — doc único e global `{ emails: string[] }`. Quem está
  nessa lista enxerga **todos** os partners, independente de membership (é o
  papel do dono da plataforma).
- **Não existe tela de convite ainda.** Pra dar acesso a um novo gestor num
  cliente específico:
  1. Firebase Console → Firestore Database → `partners/{id}/members`
  2. "Add document" → ID do documento = e-mail do gestor em minúsculas
     (ex: `joao@v4company.com`)
  3. Campos: `email` (mesmo e-mail), `role` (`"admin"` ou `"viewer"`),
     `addedAt` (número — epoch em ms, ex: `Date.now()` no console do navegador)
  4. A conta do Firebase Auth precisa já existir (criação de conta continua
     manual, como sempre foi)
- Pra tornar alguém superadmin (acesso a tudo), edite `config/superadmins`
  direto no Console e adicione o e-mail (minúsculo) na lista `emails`.
- Scripts úteis: `scripts/migrate-clientes-to-partners.mjs` (copia um cliente
  antigo pra `partners/`, idempotente) e `scripts/seed-superadmin.mjs`
  (define a lista de superadmins em produção).

## Variáveis de ambiente necessárias

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

---

## Contexto do responsável

- **Gabriel** — gestor de tráfego na V4 Company (unidade Carvalho & Co)
- Gerencia 20+ clientes em Meta Ads e Google Ads
- Já tem experiência com Claude Code e projetos como: ATENA, Positiva Dashboard, checkin-v4, meta-ads-report
- Prefere: explicações passo a passo, testar incrementalmente, Plan Mode antes de executar
- Stack familiar: Next.js, Firebase, Vercel, Node.js, Windows (PowerShell)

---

## Próximos passos (ordem de implementação)

1. [ ] Criar projeto Firebase + ativar Auth e Firestore
2. [ ] Iniciar projeto Next.js com Tailwind
3. [ ] Configurar Firebase no projeto
4. [ ] Criar tela de login
5. [ ] Criar layout autenticado (sidebar + header)
6. [ ] Criar tela de seleção de clientes
7. [ ] Criar estrutura do dashboard por cliente
8. [ ] Implementar aba de UTMs
9. [ ] Implementar aba de Tracking / Jornada
10. [ ] Conectar com Meta Ads API
11. [ ] Conectar com Google Ads / GA4
