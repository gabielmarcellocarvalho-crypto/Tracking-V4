// ─── GET /api/meta/ads-insights/{clienteId}?start=YYYY-MM-DD&end=YYYY-MM-DD ──
// Retorna o gasto diário real da conta de anúncios Meta conectada nesse
// cliente (Conexões → "Meta Ads (Métricas)"). Usa o Access Token próprio do
// cliente se houver; senão cai pro token compartilhado da BM (env). Exige
// idToken do Firebase Auth — libera admin ou viewer desse partner.

import { NextRequest, NextResponse } from 'next/server'
import { getDbAdmin } from '@/lib/firebase-admin'
import { emailDoToken, ehMembroDoPartner } from '@/lib/server/auth-helpers'
import { buscarGastoMetaAds, MetaAdsInsightsError } from '@/lib/integrations/meta-ads-insights'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clienteId: string }> },
) {
  const { clienteId } = await params
  const { searchParams } = new URL(req.url)
  const start = searchParams.get('start')
  const end = searchParams.get('end')

  if (!start || !end) {
    return NextResponse.json({ ok: false, erro: 'parâmetros start/end obrigatórios' }, { status: 400 })
  }

  const email = await emailDoToken(req)
  if (!email) {
    return NextResponse.json({ ok: false, erro: 'sessão inválida — faça login novamente' }, { status: 401 })
  }
  if (!(await ehMembroDoPartner(email, clienteId))) {
    return NextResponse.json({ ok: false, erro: 'sem permissão para ver este cliente' }, { status: 403 })
  }

  const db = getDbAdmin()
  const integSnap = await db.collection('partners').doc(clienteId).collection('integrations').doc('meta-ads').get()
  const campos = (integSnap.data()?.campos ?? {}) as Record<string, string>
  const adAccountId = campos.adAccountId?.trim()

  if (!adAccountId) {
    return NextResponse.json({ ok: false, configurado: false, erro: 'Meta Ads (Métricas) não conectado para este cliente' }, { status: 200 })
  }

  const accessToken = campos.accessToken?.trim() || process.env.META_BM_SYSTEM_USER_TOKEN
  if (!accessToken) {
    return NextResponse.json({ ok: false, configurado: true, erro: 'nenhum token disponível (nem próprio, nem da BM)' }, { status: 200 })
  }

  try {
    const gastoPorDia = await buscarGastoMetaAds(adAccountId, accessToken, new Date(start), new Date(end))
    return NextResponse.json({ ok: true, configurado: true, gastoPorDia })
  } catch (err) {
    const erro = err instanceof MetaAdsInsightsError || err instanceof Error
      ? err.message
      : 'falha ao consultar a Marketing API'
    console.error('[api/meta/ads-insights] erro:', erro)
    // 200 de propósito: é uma resposta válida da nossa rota informando que a
    // Marketing API recusou o pedido (token inválido/expirado, sem permissão
    // na conta etc.) — o front decide o que mostrar a partir de `ok`.
    return NextResponse.json({ ok: false, configurado: true, erro }, { status: 200 })
  }
}
