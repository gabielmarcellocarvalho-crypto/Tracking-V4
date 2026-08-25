// ─── CRON — reenvio de conversões pendentes/erro ao Meta CAPI / Google Ads ───
// Agendado via vercel.json (ver schedule). Varre clientes/*/conversoes com
// status "pendente" ou "erro" e tentativas < 5, tentando reenviar — cobre
// casos como credencial recém-conectada, pixel/tag configurado depois do
// evento ou falha temporária de rede/API.
//
// Protegido por CRON_SECRET: a Vercel injeta o header Authorization: Bearer
// {CRON_SECRET} nas chamadas de cron; qualquer outra chamada é rejeitada.

import { NextRequest, NextResponse } from 'next/server'
import { getDbAdmin } from '@/lib/firebase-admin'
import { enviarConversaoParaMeta } from '@/lib/integrations/meta-send'
import { enviarConversaoParaGoogle } from '@/lib/integrations/google-send'
import type { Conversao } from '@/lib/types'

const MAX_TENTATIVAS = 5
const LIMITE_POR_EXECUCAO = 200

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, erro: 'não autorizado' }, { status: 401 })
    }
  }

  const db = getDbAdmin()
  const candidatos = new Map<string, { clienteId: string; conversaoId: string; plataforma: Conversao['plataforma'] }>()

  // Três queries simples (um filtro de igualdade cada) — evita exigir um
  // índice composto de collection group só para o cron. "aguardando-conexao"
  // entra aqui porque senão uma conversão que nasceu antes da credencial
  // estar conectada fica presa nesse status pra sempre — nada mais a reprocessa.
  for (const status of ['pendente', 'erro', 'aguardando-conexao'] as const) {
    const snap = await db
      .collectionGroup('conversoes')
      .where('status', '==', status)
      .limit(LIMITE_POR_EXECUCAO)
      .get()

    for (const doc of snap.docs) {
      const conv = doc.data() as Conversao
      if (conv.plataforma !== 'meta-capi' && conv.plataforma !== 'google-enhanced') continue
      if ((conv.tentativas ?? 0) >= MAX_TENTATIVAS) continue
      const clienteId = doc.ref.parent.parent?.id
      if (!clienteId) continue
      candidatos.set(doc.id, { clienteId, conversaoId: doc.id, plataforma: conv.plataforma })
    }
  }

  let reenviadas = 0
  let falhas = 0
  for (const { clienteId, conversaoId, plataforma } of candidatos.values()) {
    try {
      if (plataforma === 'meta-capi') await enviarConversaoParaMeta(clienteId, conversaoId)
      else await enviarConversaoParaGoogle(clienteId, conversaoId)
      reenviadas++
    } catch (err) {
      falhas++
      console.error(`[cron/reenviar-conversoes] falha em ${clienteId}/${conversaoId}:`, err)
    }
  }

  return NextResponse.json({ ok: true, verificadas: candidatos.size, reenviadas, falhas })
}
