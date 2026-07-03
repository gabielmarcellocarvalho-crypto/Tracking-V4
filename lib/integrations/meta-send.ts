// ─── ENVIO SERVER-SIDE DE CONVERSÕES META CAPI ───────────────────────────────
// Server-only (usa firebase-admin — nunca importar em código client).
// Resolve pixelId (clientes/{id}/conexoes/meta) + access_token (users/{donoEmail}
// .meta_integration) e envia o payload já pronto (clientes/{id}/conversoes),
// atualizando status/ultimaResposta/tentativas no próprio doc.

import { getDbAdmin } from '@/lib/firebase-admin'
import { enviarConversaoMeta } from '@/lib/integrations/meta-capi'
import type { Cliente, Conversao, UserDoc, Conexao } from '@/lib/types'

interface CredenciaisResolvidas {
  pixelId: string
  accessToken: string
  testEventCode?: string
}

async function resolverCredenciaisMeta(clienteId: string): Promise<CredenciaisResolvidas | null> {
  const db = getDbAdmin()

  const clienteSnap = await db.collection('clientes').doc(clienteId).get()
  if (!clienteSnap.exists) return null
  const cliente = clienteSnap.data() as Cliente

  const conexaoSnap = await db.collection('clientes').doc(clienteId).collection('conexoes').doc('meta').get()
  if (!conexaoSnap.exists) return null
  const conexao = conexaoSnap.data() as Conexao
  const pixelId = conexao.campos?.pixelId
  if (!pixelId || conexao.status !== 'configurado') return null
  const testEventCode = conexao.campos?.testEventCode || undefined

  // 1) Token colado manualmente na página de Conexões (Gerenciador de Eventos
  //    → Pixel → Configurações → Conversions API → Gerar token de acesso) —
  //    já nasce com permissão de envio pro pixel, sem depender do OAuth
  //    "Conectar com Facebook" (hoje restrito a email/public_profile).
  const accessTokenManual = conexao.campos?.accessToken
  if (accessTokenManual) return { pixelId, accessToken: accessTokenManual, testEventCode }

  // 2) Fallback: token OAuth do dono do cliente (users/{donoEmail}.meta_integration)
  if (!cliente.donoEmail) return null
  const userSnap = await db.collection('users').doc(cliente.donoEmail.toLowerCase()).get()
  if (!userSnap.exists) return null
  const user = userSnap.data() as UserDoc
  const accessToken = user.meta_integration?.accessToken
  if (!accessToken || (user.meta_integration?.tokenExpiry ?? 0) < Date.now()) return null

  return { pixelId, accessToken, testEventCode }
}

/** Envia uma conversão meta-capi já enfileirada e atualiza seu status no Firestore. */
export async function enviarConversaoParaMeta(clienteId: string, conversaoId: string): Promise<void> {
  const db = getDbAdmin()
  const ref = db.collection('clientes').doc(clienteId).collection('conversoes').doc(conversaoId)
  const snap = await ref.get()
  if (!snap.exists) return

  const conversao = snap.data() as Conversao
  if (conversao.plataforma !== 'meta-capi' || conversao.status === 'enviado') return

  const cred = await resolverCredenciaisMeta(clienteId)
  if (!cred) {
    await ref.set({ status: 'aguardando-conexao' }, { merge: true })
    return
  }

  const resultado = await enviarConversaoMeta(cred, [conversao.payload])
  await ref.set(
    {
      status: resultado.ok ? 'enviado' : 'erro',
      ultimaResposta: resultado.ok
        ? `${resultado.eventsReceived ?? 0} evento(s) recebido(s) pelo Meta`
        : (resultado.erro ?? 'erro desconhecido'),
      tentativas: (conversao.tentativas ?? 0) + 1,
    },
    { merge: true },
  )
}
