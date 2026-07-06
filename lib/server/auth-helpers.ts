// ─── HELPERS DE AUTENTICAÇÃO SERVER-SIDE (firebase-admin) ────────────────────
// Usado pelas rotas /api/* que fazem ações administrativas (recursiveDelete,
// criação de usuário, etc) — a service account ignora firestore.rules, então
// a checagem de permissão precisa ser feita manualmente aqui.

import { NextRequest } from 'next/server'
import { getAuthAdmin, getDbAdmin } from '@/lib/firebase-admin'

/** Extrai e valida o idToken do header Authorization: Bearer — retorna o e-mail (lowercase) ou null. */
export async function emailDoToken(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization')
  const idToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined
  if (!idToken) return null

  try {
    const decoded = await getAuthAdmin().verifyIdToken(idToken)
    return decoded.email ? decoded.email.toLowerCase() : null
  } catch (err) {
    console.error('[auth-helpers] idToken inválido:', err)
    return null
  }
}

export async function ehSuperAdmin(email: string): Promise<boolean> {
  const snap = await getDbAdmin().doc('config/superadmins').get()
  const emails = (snap.data()?.emails as string[] | undefined) ?? []
  return emails.includes(email)
}

export async function ehAdminDoPartner(email: string, partnerId: string): Promise<boolean> {
  if (await ehSuperAdmin(email)) return true
  const snap = await getDbAdmin().collection('partners').doc(partnerId).collection('members').doc(email).get()
  return snap.exists && snap.data()?.role === 'admin'
}
