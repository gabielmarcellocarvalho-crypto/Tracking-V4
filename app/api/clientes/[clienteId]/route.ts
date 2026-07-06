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
import { getDbAdmin } from '@/lib/firebase-admin'
import { emailDoToken, ehAdminDoPartner } from '@/lib/server/auth-helpers'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ clienteId: string }> },
) {
  const { clienteId } = await params

  const email = await emailDoToken(req)
  if (!email) {
    return NextResponse.json({ ok: false, erro: 'sessão inválida — faça login novamente' }, { status: 401 })
  }

  try {
    if (!(await ehAdminDoPartner(email, clienteId))) {
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
