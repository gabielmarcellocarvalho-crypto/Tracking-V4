// ─── GET /api/eventos/{clienteId}?desde=&limite= ──────────────────────────────
// Busca eventos via firebase-admin (servidor), em vez do cliente escutar o
// Firestore direto. Existe porque a conexão em tempo real (onSnapshot) do
// Firestore no navegador se mostrou instável em algumas máquinas/redes —
// canal de Listen entrando em loop de reconexão e nunca entregando o
// primeiro snapshot, mesmo com dado real existindo (ver conversa com o
// Gabriel, 2026-08). Uma chamada HTTP simples de servidor pro servidor não
// tem esse problema (testado e confirmado: gRPC direto via admin SDK
// conecta normal na mesma máquina onde o navegador falha).
import { NextRequest, NextResponse } from 'next/server'
import { getDbAdmin } from '@/lib/firebase-admin'
import { emailDoToken, ehMembroDoPartner } from '@/lib/server/auth-helpers'
import type { Evento } from '@/lib/types'

const LIMITE_MAXIMO = 20000

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clienteId: string }> },
) {
  const { clienteId } = await params
  const { searchParams } = new URL(req.url)
  const desde = Number(searchParams.get('desde') ?? 0) || undefined
  const limiteParam = Number(searchParams.get('limite') ?? 2000)
  const limite = Math.min(Number.isFinite(limiteParam) && limiteParam > 0 ? limiteParam : 2000, LIMITE_MAXIMO)

  const email = await emailDoToken(req)
  if (!email) {
    return NextResponse.json({ ok: false, erro: 'sessão inválida — faça login novamente' }, { status: 401 })
  }
  if (!(await ehMembroDoPartner(email, clienteId))) {
    return NextResponse.json({ ok: false, erro: 'sem permissão para ver este cliente' }, { status: 403 })
  }

  try {
    const db = getDbAdmin()
    let query = db.collection('partners').doc(clienteId).collection('eventos').orderBy('ts', 'desc')
    if (desde !== undefined) query = query.where('ts', '>=', desde)
    query = query.limit(limite)

    const snap = await query.get()
    const eventos: Evento[] = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Evento)
    return NextResponse.json({ ok: true, eventos })
  } catch (err) {
    console.error('[api/eventos] erro:', err)
    return NextResponse.json({ ok: false, erro: 'falha ao buscar eventos' }, { status: 500 })
  }
}
