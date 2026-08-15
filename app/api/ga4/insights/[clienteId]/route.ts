// ─── GET /api/ga4/insights/{clienteId}?start=&end= ───────────────────────────
// Retorna screenPageViews diário real do GA4 conectado nesse cliente
// (Conexões → GA4), usando a service account colada por lá. Exige idToken do
// Firebase Auth — libera admin ou viewer.

import { NextRequest, NextResponse } from 'next/server'
import { getDbAdmin } from '@/lib/firebase-admin'
import { emailDoToken, ehMembroDoPartner } from '@/lib/server/auth-helpers'
import { buscarPageViewsGA4, GA4InsightsError, type GA4Credenciais } from '@/lib/integrations/ga4'

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
  const integSnap = await db.collection('partners').doc(clienteId).collection('integrations').doc('ga4').get()
  const campos = (integSnap.data()?.campos ?? {}) as Record<string, string>
  const cred: GA4Credenciais = {
    propertyId: campos.propertyId?.trim() ?? '',
    serviceAccountJson: campos.serviceAccountJson,
  }

  if (!cred.propertyId || !cred.serviceAccountJson) {
    return NextResponse.json({ ok: false, configurado: false, erro: 'GA4 não conectado para este cliente' }, { status: 200 })
  }

  try {
    const pageViewsPorDia = await buscarPageViewsGA4(cred, new Date(start), new Date(end))
    return NextResponse.json({ ok: true, configurado: true, pageViewsPorDia })
  } catch (err) {
    const erro = err instanceof GA4InsightsError || err instanceof Error
      ? err.message
      : 'falha ao consultar a GA4 Data API'
    console.error('[api/ga4/insights] erro:', erro)
    return NextResponse.json({ ok: false, configurado: true, erro }, { status: 200 })
  }
}
