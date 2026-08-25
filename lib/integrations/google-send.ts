// ─── ENVIO SERVER-SIDE DE CONVERSÕES GOOGLE ADS ENHANCED ─────────────────────
// Server-only (usa firebase-admin — nunca importar em código client). Espelha
// lib/integrations/meta-send.ts: resolve customerId/conversionActionId
// (partners/{id}/integrations/google) + credenciais da MCC escolhida
// (campos.mcc — ver google-mcc.ts) e envia o payload já pronto
// (partners/{id}/conversoes), atualizando status/ultimaResposta/tentativas.

import { getDbAdmin } from '@/lib/firebase-admin'
import { enviarConversaoGoogle } from '@/lib/integrations/google-ads-conversions'
import { resolverCredenciaisMcc, type CredenciaisMcc } from '@/lib/integrations/google-mcc'
import type { Conversao, Integration } from '@/lib/types'

interface CredenciaisResolvidas {
  customerId: string
  conversionActionId: string
  mcc: CredenciaisMcc
}

async function resolverCredenciaisGoogle(clienteId: string): Promise<CredenciaisResolvidas | null> {
  const db = getDbAdmin()
  const conexaoSnap = await db.collection('partners').doc(clienteId).collection('integrations').doc('google').get()
  if (!conexaoSnap.exists) return null
  const conexao = conexaoSnap.data() as Integration
  const customerId = conexao.campos?.customerId?.trim()
  const conversionActionId = conexao.campos?.conversionActionId?.trim()
  if (!customerId || !conversionActionId || conexao.status !== 'configurado') return null

  const mcc = resolverCredenciaisMcc(conexao.campos?.mcc)
  if (!mcc) return null

  return { customerId, conversionActionId, mcc }
}

/** Envia uma conversão google-enhanced já enfileirada e atualiza seu status no Firestore. */
export async function enviarConversaoParaGoogle(clienteId: string, conversaoId: string): Promise<void> {
  const db = getDbAdmin()
  const ref = db.collection('partners').doc(clienteId).collection('conversoes').doc(conversaoId)
  const snap = await ref.get()
  if (!snap.exists) return

  const conversao = snap.data() as Conversao
  if (conversao.plataforma !== 'google-enhanced' || conversao.status === 'enviado') return

  const cred = await resolverCredenciaisGoogle(clienteId)
  if (!cred) {
    await ref.set({ status: 'aguardando-conexao' }, { merge: true })
    return
  }

  const resultado = await enviarConversaoGoogle(cred.mcc, cred.customerId, cred.conversionActionId, conversao.payload)
  await ref.set(
    {
      status: resultado.ok ? 'enviado' : 'erro',
      ultimaResposta: resultado.ok ? 'conversão recebida pelo Google Ads' : (resultado.erro ?? 'erro desconhecido'),
      tentativas: (conversao.tentativas ?? 0) + 1,
    },
    { merge: true },
  )
}
