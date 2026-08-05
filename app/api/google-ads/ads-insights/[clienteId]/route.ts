// ─── GET /api/google-ads/ads-insights/{clienteId}?start=&end= ───────────────
// Retorna o gasto diário real da conta do Google Ads conectada nesse cliente
// (Conexões → "Google Ads (Métricas)"), usando as credenciais compartilhadas
// da MCC (env). Exige idToken do Firebase Auth — libera admin ou viewer.

import { NextRequest, NextResponse } from 'next/server'
import { getDbAdmin } from '@/lib/firebase-admin'
import { emailDoToken, ehMembroDoPartner } from '@/lib/server/auth-helpers'
import { buscarGastoGoogleAds, GoogleAdsInsightsError } from '@/lib/integrations/google-ads-insights'

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
  const integSnap = await db.collection('partners').doc(clienteId).collection('integrations').doc('google-ads').get()
  const campos = (integSnap.data()?.campos ?? {}) as Record<string, string>
  const customerId = campos.customerId?.trim()

  if (!customerId) {
    return NextResponse.json({ ok: false, configurado: false, erro: 'Google Ads (Métricas) não conectado para este cliente' }, { status: 200 })
  }

  const mccId = process.env.GADS_MCC_ID
  const developerToken = process.env.GADS_DEVELOPER_TOKEN
  const clientId = process.env.GADS_OAUTH_CLIENT_ID
  const clientSecret = process.env.GADS_OAUTH_CLIENT_SECRET
  const refreshToken = process.env.GADS_REFRESH_TOKEN

  if (!mccId || !developerToken || !clientId || !clientSecret || !refreshToken) {
    return NextResponse.json({ ok: false, configurado: true, erro: 'credenciais da MCC não configuradas no servidor' }, { status: 200 })
  }

  try {
    const gastoPorDia = await buscarGastoGoogleAds(
      customerId, mccId, developerToken, clientId, clientSecret, refreshToken,
      new Date(start), new Date(end),
    )
    return NextResponse.json({ ok: true, configurado: true, gastoPorDia })
  } catch (err) {
    const erro = err instanceof GoogleAdsInsightsError || err instanceof Error
      ? err.message
      : 'falha ao consultar a Google Ads API'
    console.error('[api/google-ads/ads-insights] erro:', erro)
    return NextResponse.json({ ok: false, configurado: true, erro }, { status: 200 })
  }
}
