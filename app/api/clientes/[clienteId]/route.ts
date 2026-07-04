// ─── DELETE /api/clientes/{clienteId} ────────────────────────────────────────
// Remove um cliente por completo: doc raiz + TODAS as subcoleções (eventos,
// identidades, conversoes, utms, insights, integrations, members,
// performance_config). Usa firebase-admin (recursiveDelete) porque o SDK
// client não apaga subcoleções — um deleteDoc() simples deixaria tudo isso
// órfão no Firestore.
//
// Exige idToken do Firebase Auth (Authorization: Bearer) e checa permissão
// manualmente (a rota usa a service account, que ignora firestore.rules):
// só passa quem é superadmin (config/superadmins) ou membro admin desse
// partner específico (partners/{id}/members/{email}.role === 'admin').

import { NextRequest, NextResponse } from 'next/server'
import { getAuthAdmin, getDbAdmin } from '@/lib/firebase-admin'

async function podeExcluir(email: string, clienteId: string): Promise<boolean> {
  const db = getDbAdmin()

  const superadminsSnap = await db.doc('config/superadmins').get()
  const emails = (superadminsSnap.data()?.emails as string[] | undefined) ?? []
  if (emails.includes(email)) return true

  const memberSnap = await db.collection('partners').doc(clienteId).collection('members').doc(email).get()
  return memberSnap.exists && memberSnap.data()?.role === 'admin'
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ clienteId: string }> },
) {
  const { clienteId } = await params

  const authHeader = req.headers.get('authorization')
  const idToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined
  if (!idToken) {
    return NextResponse.json({ ok: false, erro: 'sessão inválida — faça login novamente' }, { status: 401 })
  }

  let email: string
  try {
    const decoded = await getAuthAdmin().verifyIdToken(idToken)
    if (!decoded.email) {
      return NextResponse.json({ ok: false, erro: 'usuário sem e-mail no token' }, { status: 400 })
    }
    email = decoded.email.toLowerCase()
  } catch (err) {
    console.error('[api/clientes] idToken inválido:', err)
    return NextResponse.json({ ok: false, erro: 'sessão inválida — faça login novamente' }, { status: 401 })
  }

  try {
    if (!(await podeExcluir(email, clienteId))) {
      return NextResponse.json({ ok: false, erro: 'sem permissão para remover este cliente' }, { status: 403 })
    }

    const db = getDbAdmin()
    await db.recursiveDelete(db.collection('partners').doc(clienteId))

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/clientes] erro ao remover cliente:', err)
    return NextResponse.json({ ok: false, erro: 'falha ao remover cliente' }, { status: 500 })
  }
}
