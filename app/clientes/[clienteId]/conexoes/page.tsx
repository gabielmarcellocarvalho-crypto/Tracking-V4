'use client'

import { use, useEffect, useState } from 'react'
import DashboardHeader from '@/components/tracking/DashboardHeader'
import { useCliente, definirCorteDados, definirEcommercePlataforma } from '@/lib/data/partners'
import { useConexoes, salvarConexao } from '@/lib/data/colecoes'
import { useMetaIntegration } from '@/lib/data/meta-integration'
import { iniciarLoginMeta } from '@/lib/integrations/meta-oauth-client'
import type { IntegrationPlataforma, EcommercePlataforma } from '@/lib/types'

const ECOMMERCE_PLATAFORMA_LABEL: Record<EcommercePlataforma, string> = {
  shopify: 'Shopify',
  nuvemshop: 'Nuvemshop',
  tray: 'Tray',
  'loja-integrada': 'Loja Integrada',
  outro: 'Outra / não sei ainda',
}

interface CampoDef {
  id: string
  label: string
  placeholder: string
  secreto?: boolean
  textarea?: boolean
  /** Mostra um botão "Gerar" que preenche o campo com um token aleatório — pra segredos que a V4 define, não a plataforma externa. */
  gerar?: boolean
}

interface LogoDef {
  viewBox: string
  path: string
}

// Paths oficiais Simple Icons (simpleicons.org) — Meta, Google Ads, Google Analytics, Shopify
const LOGOS: Record<IntegrationPlataforma, LogoDef> = {
  meta: {
    viewBox: '0 0 24 24',
    path: 'M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056-1.182-.966-2.315-1.303-3.454-1.303zm10.16 2.053c1.147 0 2.188.758 2.992 1.999 1.132 1.748 1.647 4.195 1.647 6.4 0 1.548-.368 2.9-1.839 2.9-.58 0-1.027-.23-1.664-1.004-.496-.601-1.343-1.878-2.832-4.358l-.617-1.028a44.908 44.908 0 0 0-1.255-1.98c.07-.109.141-.224.211-.327 1.12-1.667 2.118-2.602 3.358-2.602zm-10.201.553c1.265 0 2.058.791 2.675 1.446.307.327.737.871 1.234 1.579l-1.02 1.566c-.757 1.163-1.882 3.017-2.837 4.338-1.191 1.649-1.81 1.817-2.486 1.817-.524 0-1.038-.237-1.383-.794-.263-.426-.464-1.13-.464-2.046 0-2.221.63-4.535 1.66-6.088.454-.687.964-1.226 1.533-1.533a2.264 2.264 0 0 1 1.088-.285z',
  },
  // Mesma marca do card acima (CAPI) — é o mesmo Meta, só uma API diferente (Marketing API em vez de Conversions API)
  'meta-ads': {
    viewBox: '0 0 24 24',
    path: 'M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056-1.182-.966-2.315-1.303-3.454-1.303zm10.16 2.053c1.147 0 2.188.758 2.992 1.999 1.132 1.748 1.647 4.195 1.647 6.4 0 1.548-.368 2.9-1.839 2.9-.58 0-1.027-.23-1.664-1.004-.496-.601-1.343-1.878-2.832-4.358l-.617-1.028a44.908 44.908 0 0 0-1.255-1.98c.07-.109.141-.224.211-.327 1.12-1.667 2.118-2.602 3.358-2.602zm-10.201.553c1.265 0 2.058.791 2.675 1.446.307.327.737.871 1.234 1.579l-1.02 1.566c-.757 1.163-1.882 3.017-2.837 4.338-1.191 1.649-1.81 1.817-2.486 1.817-.524 0-1.038-.237-1.383-.794-.263-.426-.464-1.13-.464-2.046 0-2.221.63-4.535 1.66-6.088.454-.687.964-1.226 1.533-1.533a2.264 2.264 0 0 1 1.088-.285z',
  },
  google: {
    viewBox: '0 0 24 24',
    path: 'M3.9998 22.9291C1.7908 22.9291 0 21.1383 0 18.9293s1.7908-3.9998 3.9998-3.9998 3.9998 1.7908 3.9998 3.9998-1.7908 3.9998-3.9998 3.9998zm19.4643-6.0004L15.4632 3.072C14.3586 1.1587 11.9121.5028 9.9988 1.6074S7.4295 5.1585 8.5341 7.0718l8.0009 13.8567c1.1046 1.9133 3.5511 2.5679 5.4644 1.4646 1.9134-1.1046 2.568-3.5511 1.4647-5.4644zM7.5137 4.8438L1.5645 15.1484A4.5 4.5 0 0 1 4 14.4297c2.5597-.0075 4.6248 2.1585 4.4941 4.7148l3.2168-5.5723-3.6094-6.25c-.4499-.7793-.6322-1.6394-.5878-2.4784z',
  },
  // Mesma marca do card acima (Enhanced Conversions) — é o mesmo Google Ads, só uma API diferente (Reporting em vez de Enhanced Conversions)
  'google-ads': {
    viewBox: '0 0 24 24',
    path: 'M3.9998 22.9291C1.7908 22.9291 0 21.1383 0 18.9293s1.7908-3.9998 3.9998-3.9998 3.9998 1.7908 3.9998 3.9998-1.7908 3.9998-3.9998 3.9998zm19.4643-6.0004L15.4632 3.072C14.3586 1.1587 11.9121.5028 9.9988 1.6074S7.4295 5.1585 8.5341 7.0718l8.0009 13.8567c1.1046 1.9133 3.5511 2.5679 5.4644 1.4646 1.9134-1.1046 2.568-3.5511 1.4647-5.4644zM7.5137 4.8438L1.5645 15.1484A4.5 4.5 0 0 1 4 14.4297c2.5597-.0075 4.6248 2.1585 4.4941 4.7148l3.2168-5.5723-3.6094-6.25c-.4499-.7793-.6322-1.6394-.5878-2.4784z',
  },
  ga4: {
    viewBox: '0 0 24 24',
    path: 'M22.84 2.9982v17.9987c.0086 1.6473-1.3197 2.9897-2.967 2.9984a2.9808 2.9808 0 01-.3677-.0208c-1.528-.226-2.6477-1.5558-2.6105-3.1V3.1204c-.0369-1.5458 1.0856-2.8762 2.6157-3.1 1.6361-.1915 3.1178.9796 3.3093 2.6158.014.1201.0208.241.0202.3619zM4.1326 18.0548c-1.6417 0-2.9726 1.331-2.9726 2.9726C1.16 22.6691 2.4909 24 4.1326 24s2.9726-1.3309 2.9726-2.9726-1.331-2.9726-2.9726-2.9726zm7.8728-9.0098c-.0171 0-.0342 0-.0513.0003-1.6495.0904-2.9293 1.474-2.891 3.1256v7.9846c0 2.167.9535 3.4825 2.3505 3.763 1.6118.3266 3.1832-.7152 3.5098-2.327.04-.1974.06-.3983.0593-.5998v-8.9585c.003-1.6474-1.33-2.9852-2.9773-2.9882z',
  },
  shopify: {
    viewBox: '0 0 24 24',
    path: 'M15.337 23.979l7.216-1.561s-2.604-17.613-2.625-17.73c-.018-.116-.114-.192-.211-.192s-1.929-.136-1.929-.136-1.275-1.274-1.439-1.411c-.045-.037-.075-.057-.121-.074l-.914 21.104h.023zM11.71 11.305s-.81-.424-1.774-.424c-1.447 0-1.504.906-1.504 1.141 0 1.232 3.24 1.715 3.24 4.629 0 2.295-1.44 3.76-3.406 3.76-2.354 0-3.54-1.465-3.54-1.465l.646-2.086s1.245 1.066 2.28 1.066c.675 0 .975-.545.975-.932 0-1.619-2.654-1.694-2.654-4.359-.034-2.237 1.571-4.416 4.827-4.416 1.257 0 1.875.361 1.875.361l-.945 2.715-.02.01zM11.17.83c.136 0 .271.038.405.135-.984.465-2.064 1.639-2.508 3.992-.656.213-1.293.405-1.889.578C7.697 3.75 8.951.84 11.17.84V.83zm1.235 2.949v.135c-.754.232-1.583.484-2.394.736.466-1.777 1.333-2.645 2.085-2.971.193.501.309 1.176.309 2.1zm.539-2.234c.694.074 1.141.867 1.429 1.755-.349.114-.735.231-1.158.366v-.252c0-.752-.096-1.371-.271-1.871v.002zm2.992 1.289c-.02 0-.06.021-.078.021s-.289.075-.714.21c-.423-1.233-1.176-2.37-2.508-2.37h-.115C12.135.209 11.669 0 11.265 0 8.159 0 6.675 3.877 6.21 5.846c-1.194.365-2.063.636-2.16.674-.675.213-.694.232-.772.87-.075.462-1.83 14.063-1.83 14.063L15.009 24l.927-21.166z',
  },
  // Sem logo oficial verificada (Nuvemshop não está no acervo Simple Icons) —
  // usa um glifo genérico de loja em vez de arriscar uma marca incorreta.
  nuvemshop: {
    viewBox: '0 0 24 24',
    path: 'M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0',
  },
  // Idem — sem ícone oficial da Tray no Simple Icons, mesmo glifo genérico.
  tray: {
    viewBox: '0 0 24 24',
    path: 'M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0',
  },
  // Idem — Loja Integrada também não está no acervo Simple Icons.
  'loja-integrada': {
    viewBox: '0 0 24 24',
    path: 'M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0',
  },
}

function LogoIcon({ plataforma, size = 20 }: { plataforma: IntegrationPlataforma; size?: number }) {
  const logo = LOGOS[plataforma]
  return (
    <svg viewBox={logo.viewBox} width={size} height={size} fill="currentColor">
      <path d={logo.path} />
    </svg>
  )
}

const PLATAFORMAS: {
  id: IntegrationPlataforma
  nome: string
  cor: string
  desc: string
  campos: CampoDef[]
  passos: string[]
}[] = [
  {
    id: 'meta',
    nome: 'Meta CAPI',
    cor: '#1877F2',
    desc: 'Envio server-side de conversões (Purchase, Lead, InitiateCheckout) com match quality alto — email/telefone hasheados + fbp/fbc. O campo obrigatório é o Access Token abaixo, gerado no Gerenciador de Eventos deste pixel — exige acesso à Business Manager do cliente. Sem esse acesso, peça o token para quem administra a BM (ex: outro gestor) e cole aqui.',
    campos: [
      { id: 'pixelId', label: 'Pixel ID', placeholder: 'Ex: 123456789012345' },
      { id: 'accessToken', label: 'Access Token (Gerenciador de Eventos) — obrigatório', placeholder: 'EAAG...', secreto: true },
      { id: 'testEventCode', label: 'Test Event Code (opcional)', placeholder: 'TEST12345' },
    ],
    passos: [
      'Gerenciador de Eventos → seu Pixel → Configurações (exige acesso à Business Manager do cliente)',
      'Seção "Conversions API" → Gerar token de acesso → copie o token',
      'Sem acesso à BM? Peça pra quem administra (ex: outro gestor) gerar e te passar o token',
      'Cole o Pixel ID + o token aqui — o envio da fila ativa automaticamente',
    ],
  },
  {
    id: 'meta-ads',
    nome: 'Meta Ads (Métricas)',
    cor: '#0866FF',
    desc: 'Puxa gasto, campanhas e resultados direto da conta de anúncios via Marketing API — diferente do CAPI acima (que só envia conversão pra dentro do Meta). Alimenta o Performance com os números oficiais da plataforma, cruzados com os dados primários daqui. A maioria dos clientes está dentro da nossa Business Manager — nesse caso só o ID da conta de anúncios já basta, o token de acesso é compartilhado automaticamente pelo servidor.',
    campos: [
      { id: 'adAccountId', label: 'ID da conta de anúncios', placeholder: 'act_1234567890' },
      { id: 'accessToken', label: 'Access Token próprio (só se a conta não estiver na nossa BM)', placeholder: 'Deixe em branco para usar o token compartilhado da BM', secreto: true },
    ],
    passos: [
      'Se a conta de anúncios do cliente já está na nossa Business Manager: só cole o ID da conta acima e salve — o token é compartilhado automaticamente.',
      'Se for uma conta fora da nossa BM, ela precisa de um token próprio: Business Manager do cliente → Usuários do sistema → Criar usuário de sistema',
      'Atribuir acesso à conta de anúncios do cliente (permissão de leitura já basta)',
      'Gerar token → marcar o escopo "ads_read" → colar no campo Access Token acima',
    ],
  },
  {
    id: 'google',
    nome: 'Google Ads',
    cor: '#4285F4',
    desc: 'Enhanced Conversions — sobe conversões com gclid/wbraid + dados hasheados para recuperar atribuição perdida.',
    campos: [
      { id: 'customerId', label: 'Customer ID', placeholder: 'Ex: 1234567890 (sem hífens)' },
      { id: 'developerToken', label: 'Developer Token', placeholder: 'Token aprovado no Centro de API', secreto: true },
      { id: 'conversionActionId', label: 'Conversion Action ID (opcional)', placeholder: 'Ex: 987654321' },
    ],
    passos: [
      'Google Ads → Ferramentas → Configuração → Centro de API → Developer Token',
      'Anote o Customer ID da conta (canto superior direito)',
      'O envio exige OAuth (etapa posterior) — os payloads ficam prontos na fila',
    ],
  },
  {
    id: 'google-ads',
    nome: 'Google Ads (Métricas)',
    cor: '#34A853',
    desc: 'Puxa gasto, campanhas e resultados direto da conta via Google Ads API — diferente do card acima (que só envia conversão pro Google). A maioria dos clientes está dentro da nossa MCC — nesse caso só o Customer ID já basta, as credenciais são compartilhadas automaticamente pelo servidor.',
    campos: [
      { id: 'customerId', label: 'Customer ID', placeholder: 'Ex: 1234567890 (sem hífens)' },
    ],
    passos: [
      'Se a conta do cliente já está na nossa MCC: só cole o Customer ID acima e salve — as credenciais são compartilhadas automaticamente.',
      'Customer ID fica no canto superior direito do Google Ads, sem hífens',
      'Conta fora da nossa MCC precisa de um vínculo próprio via convite de gerente — combine com quem administra antes de tentar conectar',
    ],
  },
  {
    id: 'ga4',
    nome: 'GA4',
    cor: '#E37400',
    desc: 'Cruza sessões e canais do GA4 com os dados primários — validação de tráfego orgânico e assistido.',
    campos: [
      { id: 'propertyId', label: 'Property ID', placeholder: 'Ex: 312345678' },
      { id: 'measurementId', label: 'Measurement ID (opcional)', placeholder: 'G-XXXXXXXXXX' },
      { id: 'serviceAccountJson', label: 'Service Account JSON (opcional)', placeholder: '{ "type": "service_account", … }', secreto: true, textarea: true },
    ],
    passos: [
      'GA4 → Administrador → Informações da propriedade → Property ID',
      'Google Cloud → IAM → Service account com papel "Viewer" na property',
      'Cole o JSON da service account para habilitar a leitura de relatórios',
    ],
  },
  {
    id: 'shopify',
    nome: 'Shopify',
    cor: '#96BF48',
    desc: 'Recebe pedidos da loja Shopify via webhook, injeta como eventos de compra na fila de conversões CAPI e alimenta a jornada do usuário dentro da própria plataforma — ideal pra cliente que não permite instalar o snippet no site. O Admin API Token (opcional) habilita identificar de qual campanha/anúncio veio o pedido mesmo sem cookie no navegador.',
    campos: [
      { id: 'shopDomain', label: 'Domínio da loja', placeholder: 'sua-loja.myshopify.com' },
      { id: 'webhookSecret', label: 'Webhook Secret (gerado ao criar o webhook)', placeholder: 'shpss_...', secreto: true },
      { id: 'adminApiToken', label: 'Admin API Access Token (opcional — atribuição de campanha)', placeholder: 'shpat_...', secreto: true },
    ],
    passos: [
      'Shopify Admin → Configurações → Notificações → Webhooks → Criar webhook',
      'Evento: "Criação de pedido" (orders/create) · Formato: JSON',
      'Cole a URL abaixo e, depois de criar, copie o "Signing secret" para o campo Webhook Secret aqui',
      'Opcional: Configurações → Apps e canais de vendas → Desenvolver apps → Criar um app → Configurar Admin API → escopo "read_orders" → Instalar app → Revelar token e colar em Admin API Access Token',
    ],
  },
  {
    id: 'nuvemshop',
    nome: 'Nuvemshop',
    cor: '#7C4DFF',
    desc: 'Integração em construção — a Nuvemshop exige um app parceiro cadastrado no painel de desenvolvedor (OAuth) antes de habilitar o envio automático de pedidos. Diferente da Shopify, o pedido da Nuvemshop não carrega UTM/origem — pra esse cliente, o snippet no site é a única forma de saber se a venda veio de anúncio.',
    campos: [
      { id: 'storeId', label: 'ID da loja (Nuvemshop)', placeholder: 'Ex: 1234567' },
      { id: 'accessToken', label: 'Access Token (via app parceiro — ainda não disponível)', placeholder: 'Aguardando app parceiro V4', secreto: true },
    ],
    passos: [
      'Essa integração depende de um app parceiro V4 cadastrado no painel de desenvolvedor da Nuvemshop (OAuth) — ainda não está pronta',
      'Por enquanto, instale o snippet de tracking no site pra capturar a jornada e a origem do anúncio',
      'Assim que o app parceiro estiver pronto, o fluxo de conexão aqui é atualizado',
    ],
  },
  {
    id: 'tray',
    nome: 'Tray',
    cor: '#00A650',
    desc: 'Integração em construção — a Tray exige um app parceiro aprovado pelo painel de parceiros (tray.com.br/quero-ser-parceiro) antes de habilitar o OAuth por loja. Diferente da Shopify, o webhook da Tray não envia os dados do pedido (só o ID) — o envio automático de compras só liga depois que o app estiver aprovado e a loja autorizada.',
    campos: [
      { id: 'storeUrl', label: 'URL da loja (Tray)', placeholder: 'Ex: sua-loja.commercesuite.com.br' },
      { id: 'consumerKey', label: 'Consumer Key (via app parceiro — ainda não disponível)', placeholder: 'Aguardando aprovação de parceiro V4', secreto: true },
      { id: 'consumerSecret', label: 'Consumer Secret (via app parceiro — ainda não disponível)', placeholder: 'Aguardando aprovação de parceiro V4', secreto: true },
    ],
    passos: [
      'Essa integração depende de um app parceiro V4 aprovado no painel de parceiros da Tray (tray.com.br/quero-ser-parceiro) — cadastro em análise, ainda não está pronta',
      'Depois de aprovado, cada loja autoriza o app via OAuth (tela de permissão na própria loja) — não é um campo que se cola direto aqui',
      'Por enquanto, instale o snippet de tracking no site pra capturar a jornada e a origem do anúncio',
      'Assim que o app parceiro estiver aprovado, o fluxo de conexão aqui é atualizado',
    ],
  },
  {
    id: 'loja-integrada',
    nome: 'Loja Integrada',
    cor: '#00C48C',
    desc: 'Recebe pedidos da Loja Integrada via webhook, injeta como eventos de compra na fila de conversões CAPI e alimenta a jornada do usuário — mesmo pipeline server-to-server da Shopify (webhook → evento de compra → envio automático pro Meta). ' +
      'Aviso: a documentação técnica oficial da Loja Integrada fica atrás de um portal que não conseguimos ler por completo — os nomes de campo do payload do pedido foram implementados de forma tolerante (tenta várias variações comuns), mas vale disparar um pedido de teste e conferir os logs antes de confiar 100% nos números.',
    campos: [
      { id: 'chaveAplicacao', label: 'Chave de Aplicação', placeholder: 'Gerada pelo formulário de integrador da Loja Integrada', secreto: true },
      { id: 'chaveApi', label: 'Chave de API (da loja)', placeholder: 'Painel da loja → Configurações → API', secreto: true },
      { id: 'webhookToken', label: 'Token do Webhook (gerado pela V4 — não é da Loja Integrada)', placeholder: 'Clique em Gerar →', gerar: true },
    ],
    passos: [
      'Peça a Chave de Aplicação no formulário de integrador (ajuda.lojaintegrada.com.br) — identifica a V4 como integradora',
      'Painel da loja → Configurações → API → copie a Chave de API (identifica essa loja específica)',
      'Clique em "Gerar" no campo Token do Webhook acima e salve — sem isso a URL abaixo fica incompleta',
      'Painel da loja → Webhooks → Criar → evento "Pedido" → cole a URL abaixo (já com o token)',
    ],
  },
]

const ECOMMERCE_IDS: IntegrationPlataforma[] = ['shopify', 'nuvemshop', 'tray', 'loja-integrada']

function MetaConnectionStatus() {
  const { meta, conectado, loading } = useMetaIntegration()
  const [aguardando, setAguardando] = useState(false)

  // Sem isso, a aba original fica parada sem nenhuma pista de que o login
  // está rolando na outra janela — parece "travada". Detecta o popup
  // fechando (sucesso, cancelamento ou erro) e volta ao estado normal; o
  // status "conectado" em si vem do onSnapshot em tempo real de useMetaIntegration.
  const handleConectar = () => {
    const popup = iniciarLoginMeta()
    if (!popup) return

    setAguardando(true)
    const verificar = setInterval(() => {
      if (popup.closed) {
        clearInterval(verificar)
        setAguardando(false)
      }
    }, 500)
  }

  if (loading) return null

  if (conectado) {
    const expiraEm = meta?.tokenExpiry ? new Date(meta.tokenExpiry) : undefined
    const diasRestantes = expiraEm ? Math.max(0, Math.round((expiraEm.getTime() - Date.now()) / 86400000)) : undefined
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
        padding: '10px 12px', borderRadius: 8, marginBottom: 12,
        background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.25)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)' }}>Conta Meta conectada</span>
          {diasRestantes !== undefined && (
            <span style={{ fontSize: 11, color: 'var(--t3)' }}>· expira em {diasRestantes}d</span>
          )}
        </div>
        <button
          onClick={handleConectar}
          disabled={aguardando}
          style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', background: 'transparent', border: 'none', cursor: aguardando ? 'default' : 'pointer', textDecoration: 'underline', opacity: aguardando ? 0.6 : 1 }}
        >
          {aguardando ? 'Aguardando…' : 'Reconectar'}
        </button>
      </div>
    )
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <button
        onClick={handleConectar}
        disabled={aguardando}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, width: '100%',
          padding: '10px 12px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, color: '#fff',
          background: aguardando ? '#6b93c9' : '#1877F2', border: 'none', cursor: aguardando ? 'default' : 'pointer',
        }}
      >
        {aguardando ? (
          <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', display: 'inline-block' }} className="animate-spin" />
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" width={15} height={15}>
            <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12" />
          </svg>
        )}
        {aguardando ? 'Aguardando confirmação no Facebook…' : 'Conectar com Facebook'}
      </button>
      <p style={{ fontSize: 10.5, color: 'var(--t3)', margin: '6px 0 0' }}>
        Este login não envia conversões (só identifica sua conta) — o campo obrigatório é o Access Token abaixo.
      </p>
    </div>
  )
}

function MetaBmStatusBadge() {
  const [status, setStatus] = useState<'carregando' | 'configurado' | 'ausente'>('carregando')

  useEffect(() => {
    fetch('/api/meta/bm-status')
      .then((r) => r.json())
      .then((d) => setStatus(d.configurado ? 'configurado' : 'ausente'))
      .catch(() => setStatus('ausente'))
  }, [])

  if (status === 'carregando') return null

  const configurado = status === 'configurado'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '10px 12px', borderRadius: 8, marginBottom: 12,
      background: configurado ? 'rgba(16,185,129,.1)' : 'rgba(245,158,11,.08)',
      border: `1px solid ${configurado ? 'rgba(16,185,129,.25)' : 'rgba(245,158,11,.3)'}`,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: configurado ? '#10B981' : '#F59E0B', flexShrink: 0 }} />
      <span style={{ fontSize: 12, color: 'var(--t2)' }}>
        {configurado
          ? 'Token compartilhado da BM configurado no servidor — só o ID da conta já basta.'
          : 'Token compartilhado da BM ainda não configurado no servidor — por enquanto, use um Access Token próprio abaixo.'}
      </span>
    </div>
  )
}

function GoogleAdsMccStatusBadge() {
  const [status, setStatus] = useState<'carregando' | 'configurado' | 'ausente'>('carregando')

  useEffect(() => {
    fetch('/api/google-ads/mcc-status')
      .then((r) => r.json())
      .then((d) => setStatus(d.configurado ? 'configurado' : 'ausente'))
      .catch(() => setStatus('ausente'))
  }, [])

  if (status === 'carregando') return null

  const configurado = status === 'configurado'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '10px 12px', borderRadius: 8, marginBottom: 12,
      background: configurado ? 'rgba(16,185,129,.1)' : 'rgba(245,158,11,.08)',
      border: `1px solid ${configurado ? 'rgba(16,185,129,.25)' : 'rgba(245,158,11,.3)'}`,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: configurado ? '#10B981' : '#F59E0B', flexShrink: 0 }} />
      <span style={{ fontSize: 12, color: 'var(--t2)' }}>
        {configurado
          ? 'Credenciais compartilhadas da MCC configuradas no servidor — só o Customer ID já basta.'
          : 'Credenciais da MCC ainda não configuradas no servidor — essa conexão não funciona por enquanto.'}
      </span>
    </div>
  )
}

function ShopifyWebhookInfo({ clienteId }: { clienteId: string }) {
  const [copiado, setCopiado] = useState(false)
  const origem = typeof window !== 'undefined' ? window.location.origin : 'https://SEU-DOMINIO.vercel.app'
  const url = `${origem}/api/webhooks/shopify/${clienteId}`

  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--t2)', display: 'block', marginBottom: 4 }}>
        URL do webhook (cole no Shopify Admin)
      </label>
      <div style={{ display: 'flex', gap: 8 }}>
        <code style={{
          flex: 1, display: 'block', padding: '9px 11px', borderRadius: 8, fontSize: 11,
          fontFamily: 'monospace', color: 'var(--t2)', background: 'var(--bg-base)',
          border: '1px solid var(--border)', wordBreak: 'break-all',
        }}>{url}</code>
        <button
          onClick={() => { navigator.clipboard.writeText(url); setCopiado(true); setTimeout(() => setCopiado(false), 1500) }}
          style={{
            padding: '9px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, flexShrink: 0,
            background: copiado ? 'rgba(16,185,129,.12)' : 'var(--bg-base)',
            border: `1px solid ${copiado ? '#10B981' : 'var(--border)'}`,
            color: copiado ? '#10B981' : 'var(--t2)', cursor: 'pointer',
          }}
        >{copiado ? 'Copiado ✓' : 'Copiar'}</button>
      </div>
    </div>
  )
}

function LojaIntegradaWebhookInfo({ clienteId, token }: { clienteId: string; token?: string }) {
  const [copiado, setCopiado] = useState(false)
  const origem = typeof window !== 'undefined' ? window.location.origin : 'https://SEU-DOMINIO.vercel.app'
  const url = `${origem}/api/webhooks/loja-integrada/${clienteId}${token ? `?token=${token}` : ''}`

  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--t2)', display: 'block', marginBottom: 4 }}>
        URL do webhook (cole no painel da Loja Integrada)
      </label>
      {!token && (
        <p style={{ fontSize: 10.5, color: '#F59E0B', margin: '0 0 6px' }}>
          Gere o Token do Webhook abaixo antes de copiar essa URL — sem ele, o link fica incompleto.
        </p>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <code style={{
          flex: 1, display: 'block', padding: '9px 11px', borderRadius: 8, fontSize: 11,
          fontFamily: 'monospace', color: 'var(--t2)', background: 'var(--bg-base)',
          border: '1px solid var(--border)', wordBreak: 'break-all',
        }}>{url}</code>
        <button
          onClick={() => { navigator.clipboard.writeText(url); setCopiado(true); setTimeout(() => setCopiado(false), 1500) }}
          disabled={!token}
          style={{
            padding: '9px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, flexShrink: 0,
            background: copiado ? 'rgba(16,185,129,.12)' : 'var(--bg-base)',
            border: `1px solid ${copiado ? '#10B981' : 'var(--border)'}`,
            color: copiado ? '#10B981' : 'var(--t2)', cursor: token ? 'pointer' : 'not-allowed', opacity: token ? 1 : 0.6,
          }}
        >{copiado ? 'Copiado ✓' : 'Copiar'}</button>
      </div>
    </div>
  )
}

function CardConexao({ plataforma, clienteId, camposSalvos, statusSalvo, isDemo }: {
  plataforma: typeof PLATAFORMAS[number]
  clienteId: string
  camposSalvos: Record<string, string>
  statusSalvo: string
  isDemo: boolean
}) {
  const [valores, setValores] = useState<Record<string, string>>({})
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo]       = useState(false)
  const [aberto, setAberto]     = useState(false)
  const [hover, setHover]       = useState(false)

  useEffect(() => { setValores(camposSalvos) }, [camposSalvos])

  const configurado = statusSalvo === 'configurado'

  const handleSalvar = async () => {
    setSalvando(true)
    try {
      await salvarConexao(clienteId, plataforma.id, valores)
      setSalvo(true)
      setTimeout(() => setSalvo(false), 1500)
    } finally {
      setSalvando(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 11px', borderRadius: 8, fontSize: 12,
    background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-1)',
    outline: 'none', fontFamily: 'monospace',
  }

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: 'var(--bg-c)',
        border: `1px solid ${aberto || hover ? plataforma.cor + '40' : 'var(--br)'}`,
        borderRadius: 14, overflow: 'hidden',
        boxShadow: hover || aberto ? `0 4px 16px -6px ${plataforma.cor}30` : '0 1px 2px rgba(0,0,0,.03)',
        transition: 'border-color .2s ease, box-shadow .2s ease',
      }}
    >
      {/* Header do card */}
      <button
        onClick={() => setAberto(!aberto)}
        style={{
          width: '100%', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14,
          background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: `linear-gradient(155deg, ${plataforma.cor}22, ${plataforma.cor}0c)`,
          border: `1px solid ${plataforma.cor}35`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: plataforma.cor,
        }}>
          <LogoIcon plataforma={plataforma.id} size={21} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>{plataforma.nome}</span>
            <span style={{
              display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700,
              padding: '2px 8px', borderRadius: 12,
              background: configurado ? 'rgba(16,185,129,.12)' : 'rgba(107,114,128,.12)',
              color: configurado ? '#10B981' : '#9CA3AF',
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: configurado ? '#10B981' : '#6B7280' }} />
              {configurado ? 'Configurado' : 'Desconectado'}
            </span>
          </div>
          <p style={{ fontSize: 11.5, color: 'var(--t3)', margin: '3px 0 0', lineHeight: 1.5 }}>{plataforma.desc}</p>
        </div>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"
          width={14} height={14}
          style={{ color: 'var(--t3)', transform: aberto ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Corpo expandido */}
      {aberto && (
        <div style={{ padding: '0 18px 18px', borderTop: '1px solid var(--br-s)' }}>
          {plataforma.id === 'meta' && <div style={{ marginTop: 14 }}><MetaConnectionStatus /></div>}
          {plataforma.id === 'meta-ads' && <div style={{ marginTop: 14 }}><MetaBmStatusBadge /></div>}
          {plataforma.id === 'google-ads' && <div style={{ marginTop: 14 }}><GoogleAdsMccStatusBadge /></div>}
          {plataforma.id === 'shopify' && <div style={{ marginTop: 14 }}><ShopifyWebhookInfo clienteId={clienteId} /></div>}
          {plataforma.id === 'loja-integrada' && <div style={{ marginTop: 14 }}><LojaIntegradaWebhookInfo clienteId={clienteId} token={valores.webhookToken} /></div>}
          <div style={{ display: 'flex', gap: 20, marginTop: ['meta', 'meta-ads', 'google-ads', 'shopify', 'loja-integrada'].includes(plataforma.id) ? 0 : 14, flexWrap: 'wrap' }}>
            {/* Campos */}
            <div style={{ flex: 1, minWidth: 260, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {plataforma.campos.map((c) => (
                <div key={c.id}>
                  <label style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--t2)', display: 'block', marginBottom: 4 }}>{c.label}</label>
                  {c.textarea ? (
                    <textarea
                      value={valores[c.id] ?? ''}
                      onChange={(e) => setValores((v) => ({ ...v, [c.id]: e.target.value }))}
                      placeholder={c.placeholder}
                      rows={3}
                      style={{ ...inputStyle, resize: 'vertical' }}
                    />
                  ) : c.gerar ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="text"
                        value={valores[c.id] ?? ''}
                        onChange={(e) => setValores((v) => ({ ...v, [c.id]: e.target.value }))}
                        placeholder={c.placeholder}
                        style={{ ...inputStyle, flex: 1 }}
                      />
                      <button
                        onClick={() => {
                          const bytes = new Uint8Array(16)
                          crypto.getRandomValues(bytes)
                          const token = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
                          setValores((v) => ({ ...v, [c.id]: token }))
                        }}
                        style={{
                          padding: '9px 12px', borderRadius: 8, fontSize: 11.5, fontWeight: 600, flexShrink: 0,
                          background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--t2)', cursor: 'pointer',
                        }}
                      >
                        Gerar
                      </button>
                    </div>
                  ) : (
                    <input
                      type={c.secreto ? 'password' : 'text'}
                      value={valores[c.id] ?? ''}
                      onChange={(e) => setValores((v) => ({ ...v, [c.id]: e.target.value }))}
                      placeholder={c.placeholder}
                      style={inputStyle}
                    />
                  )}
                </div>
              ))}
              <button
                onClick={handleSalvar}
                disabled={salvando || isDemo}
                style={{
                  alignSelf: 'flex-start', marginTop: 4, padding: '9px 18px', borderRadius: 8,
                  fontSize: 12.5, fontWeight: 600, color: '#fff', border: 'none',
                  background: salvo ? '#10B981' : plataforma.cor,
                  cursor: isDemo ? 'not-allowed' : 'pointer', opacity: salvando || isDemo ? 0.6 : 1,
                }}
              >
                {salvo ? 'Salvo ✓' : salvando ? 'Salvando…' : 'Salvar credenciais'}
              </button>
              {isDemo && <p style={{ fontSize: 10.5, color: 'var(--t3)' }}>Cliente demo — crie um cliente real para conectar.</p>}
            </div>

            {/* Passo a passo */}
            <div style={{ width: 280, flexShrink: 0 }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--t3)', margin: '0 0 8px' }}>
                Onde obter
              </p>
              {plataforma.passos.map((p, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 7 }}>
                  <span style={{
                    width: 16, height: 16, borderRadius: '50%', flexShrink: 0, fontSize: 9.5, fontWeight: 700,
                    background: plataforma.cor + '18', color: plataforma.cor,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{i + 1}</span>
                  <span style={{ fontSize: 11, color: 'var(--t2)', lineHeight: 1.5 }}>{p}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ConexoesPage({ params }: { params: Promise<{ clienteId: string }> }) {
  const { clienteId } = use(params)
  const { cliente, isDemo } = useCliente(clienteId)
  const { conexoes } = useConexoes(isDemo ? undefined : clienteId)
  const [copiado, setCopiado] = useState(false)
  const [aplicandoCorte, setAplicandoCorte] = useState(false)
  const [trocandoPlataforma, setTrocandoPlataforma] = useState(false)

  const handleTrocarPlataforma = async (nova: EcommercePlataforma) => {
    if (nova === cliente?.ecommercePlataforma) return
    if (!window.confirm(
      `Trocar a plataforma de e-commerce pra ${ECOMMERCE_PLATAFORMA_LABEL[nova]}? ` +
      'O card certo passa a aparecer aqui embaixo pra você conectar. Se quiser parar de contar o histórico da plataforma anterior, use "Desconsiderar dados anteriores" logo abaixo depois de trocar.',
    )) return
    setTrocandoPlataforma(true)
    try { await definirEcommercePlataforma(clienteId, nova) } finally { setTrocandoPlataforma(false) }
  }

  const handleDesconsiderar = async () => {
    if (!window.confirm(
      'Isso vai fazer os eventos já registrados até agora pararem de entrar em Growth Pack, Performance, Agente IA e alertas deste cliente. ' +
      'Eles continuam guardados no banco (nada é apagado) — só o que for capturado a partir de agora passa a contar. Confirmar?',
    )) return
    setAplicandoCorte(true)
    try { await definirCorteDados(clienteId, Date.now()) } finally { setAplicandoCorte(false) }
  }

  const handleRemoverCorte = async () => {
    if (!window.confirm('Remover o corte? Os eventos anteriores voltam a contar em todos os relatórios.')) return
    setAplicandoCorte(true)
    try { await definirCorteDados(clienteId, null) } finally { setAplicandoCorte(false) }
  }

  // Cards de e-commerce (shopify/nuvemshop) só aparecem pro cliente que tipo/plataforma
  // corresponde — cada um tem webhook e credenciais próprios, não faz sentido mostrar os dois.
  const plataformasVisiveis = PLATAFORMAS.filter((p) =>
    !ECOMMERCE_IDS.includes(p.id) || p.id === cliente?.ecommercePlataforma,
  )

  const origem = typeof window !== 'undefined' ? window.location.origin : 'https://SEU-DOMINIO.vercel.app'
  const snippet = `<script src="${origem}/v4track.js" data-cliente="${clienteId}" data-key="${cliente?.trackingKey ?? 'SUA_TRACKING_KEY'}" defer></script>`

  return (
    <>
      <DashboardHeader clienteName={cliente?.nome ?? clienteId} clienteTipo={cliente?.tipo} clienteId={isDemo ? undefined : clienteId} />

      <main className="flex-1 overflow-y-auto p-6" style={{ background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <h2 className="text-[18px] font-bold text-[--text-1]">Conexões</h2>
          <p className="text-[12.5px] text-[--text-3] mt-1">
            Instalação do tracking no site + credenciais das plataformas de ads
          </p>
        </div>

        {/* Instalação do snippet */}
        <div style={{ background: 'var(--bg-c)', border: '1px solid rgba(200,16,46,.25)', borderRadius: 12, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{
              width: 34, height: 34, borderRadius: 9, flexShrink: 0,
              background: 'rgba(200,16,46,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={15} height={15}>
                <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
              </svg>
            </span>
            <div>
              <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>1. Instalar o snippet no site do cliente</p>
              <p style={{ fontSize: 11.5, color: 'var(--t3)', margin: '2px 0 0' }}>
                Cole antes do <code style={{ color: 'var(--t2)' }}>&lt;/head&gt;</code> — captura page_view automático, cookies (fbp/fbc/gclid/_v4id) e expõe <code style={{ color: 'var(--t2)' }}>v4track(&apos;lead&apos;, {'{…}'})</code>
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <code style={{
              flex: 1, display: 'block', padding: '10px 12px', borderRadius: 8, fontSize: 11,
              fontFamily: 'monospace', color: 'var(--t2)', background: 'var(--bg-base)',
              border: '1px solid var(--border)', wordBreak: 'break-all', lineHeight: 1.6,
            }}>{snippet}</code>
            <button
              onClick={() => { navigator.clipboard.writeText(snippet); setCopiado(true); setTimeout(() => setCopiado(false), 1500) }}
              style={{
                padding: '10px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, flexShrink: 0,
                background: copiado ? 'rgba(16,185,129,.12)' : 'var(--red)',
                border: copiado ? '1px solid #10B981' : 'none',
                color: copiado ? '#10B981' : '#fff', cursor: 'pointer',
              }}
            >{copiado ? 'Copiado ✓' : 'Copiar'}</button>
          </div>
          <p style={{ fontSize: 11, color: 'var(--t3)', margin: '10px 0 0', lineHeight: 1.6 }}>
            Eventos manuais: <code style={{ color: '#10B981' }}>v4track(&apos;lead&apos;, {'{ email, telefone, nome }'})</code> ·{' '}
            <code style={{ color: '#8B5CF6' }}>v4track(&apos;checkout&apos;, {'{ valor, produto }'})</code> ·{' '}
            <code style={{ color: '#F59E0B' }}>v4track(&apos;compra&apos;, {'{ email, valor, produto }'})</code>
            {' '}— também aceita POST direto em <code style={{ color: 'var(--t2)' }}>/api/track</code> (webhooks/n8n).
          </p>
        </div>

        {/* Plataformas */}
        <div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--t1)', margin: '0 0 4px' }}>2. Conectar plataformas</p>
              <p style={{ fontSize: 11.5, color: 'var(--t3)', margin: 0 }}>
                As conversões já ficam enfileiradas com payload pronto — o envio ativa quando as credenciais forem salvas.
              </p>
              {cliente?.tipo === 'ecommerce' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <label style={{ fontSize: 10.5, color: 'var(--t3)' }}>Plataforma de e-commerce:</label>
                  <select
                    value={cliente.ecommercePlataforma ?? 'outro'}
                    onChange={(e) => handleTrocarPlataforma(e.target.value as EcommercePlataforma)}
                    disabled={trocandoPlataforma || isDemo}
                    style={{
                      padding: '4px 8px', borderRadius: 6, fontSize: 11.5, fontWeight: 600,
                      background: 'var(--bg-c)', border: '1px solid var(--border)', color: 'var(--t1)',
                      cursor: trocandoPlataforma || isDemo ? 'default' : 'pointer',
                    }}
                  >
                    {Object.entries(ECOMMERCE_PLATAFORMA_LABEL).map(([id, label]) => (
                      <option key={id} value={id}>{label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              {plataformasVisiveis.map((p) => {
                const conectada = conexoes.find((c) => c.plataforma === p.id)?.status === 'configurado'
                return (
                  <span key={p.id} title={`${p.nome} · ${conectada ? 'conectado' : 'desconectado'}`} style={{
                    width: 26, height: 26, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: conectada ? `${p.cor}18` : 'var(--bg-c)',
                    border: `1px solid ${conectada ? p.cor + '45' : 'var(--br)'}`,
                    color: conectada ? p.cor : 'var(--t3)',
                    opacity: conectada ? 1 : 0.55,
                  }}>
                    <LogoIcon plataforma={p.id} size={13} />
                  </span>
                )
              })}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {plataformasVisiveis.map((p) => {
              const salva = conexoes.find((c) => c.plataforma === p.id)
              return (
                <CardConexao
                  key={p.id}
                  plataforma={p}
                  clienteId={clienteId}
                  camposSalvos={salva?.campos ?? {}}
                  statusSalvo={salva?.status ?? 'desconectado'}
                  isDemo={isDemo}
                />
              )
            })}
          </div>
        </div>

        {/* Corte de dados — reset de histórico ao trocar de plataforma */}
        <div style={{ background: 'var(--bg-c)', border: '1px solid var(--br)', borderRadius: 12, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{
              width: 34, height: 34, borderRadius: 9, flexShrink: 0,
              background: 'rgba(245,158,11,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={15} height={15}>
                <path d="M3 12a9 9 0 1 0 2.64-6.36" /><polyline points="3 4 3 9 8 9" />
              </svg>
            </span>
            <div>
              <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>3. Desconsiderar dados anteriores</p>
              <p style={{ fontSize: 11.5, color: 'var(--t3)', margin: '2px 0 0', lineHeight: 1.5 }}>
                Use ao trocar de plataforma (ex: Shopify → loja integrada). Os eventos já registrados continuam guardados —
                só param de entrar em Growth Pack, Performance, Agente IA e alertas. O que for capturado depois passa a contar normalmente.
              </p>
            </div>
          </div>

          {cliente?.dadosIgnoradosAte ? (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
              padding: '10px 12px', borderRadius: 8, background: 'rgba(245,158,11,.06)', border: '1px solid rgba(245,158,11,.25)',
            }}>
              <p style={{ fontSize: 12, color: 'var(--t2)', margin: 0 }}>
                Desconsiderando tudo até <strong style={{ color: 'var(--t1)' }}>{new Date(cliente.dadosIgnoradosAte).toLocaleString('pt-BR')}</strong>.
              </p>
              <button
                onClick={handleRemoverCorte} disabled={aplicandoCorte || isDemo}
                style={{
                  padding: '7px 14px', borderRadius: 7, fontSize: 11.5, fontWeight: 600, cursor: aplicandoCorte || isDemo ? 'default' : 'pointer',
                  background: 'none', border: '1px solid var(--br)', color: 'var(--t2)', opacity: aplicandoCorte || isDemo ? 0.6 : 1,
                }}
              >
                Remover corte
              </button>
            </div>
          ) : (
            <button
              onClick={handleDesconsiderar} disabled={aplicandoCorte || isDemo}
              style={{
                padding: '9px 16px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: aplicandoCorte || isDemo ? 'default' : 'pointer',
                background: 'rgba(245,158,11,.12)', border: '1px solid rgba(245,158,11,.35)', color: '#F59E0B', opacity: aplicandoCorte || isDemo ? 0.6 : 1,
              }}
            >
              {aplicandoCorte ? 'Aplicando…' : 'Desconsiderar dados até agora'}
            </button>
          )}
        </div>
      </main>
    </>
  )
}
