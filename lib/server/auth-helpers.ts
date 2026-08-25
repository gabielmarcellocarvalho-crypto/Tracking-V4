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

/** Admin em pelo menos um cliente (não escopado a um partner específico) — libera criar clientes novos. */
export async function ehAdminGeral(email: string): Promise<boolean> {
  const snap = await getDbAdmin().doc('config/admins').get()
  const emails = (snap.data()?.emails as string[] | undefined) ?? []
  return emails.includes(email)
}

/** Role do e-mail no squad dono desse partner, ou null se o partner não tem squad ou o e-mail não está nele. */
async function roleNoSquadDoPartner(email: string, partnerId: string): Promise<string | null> {
  const db = getDbAdmin()
  const partnerSnap = await db.collection('partners').doc(partnerId).get()
  const squad = partnerSnap.data()?.squad as string | undefined
  if (!squad) return null
  const squadSnap = await db.collection('squads').doc(squad).collection('members').doc(email).get()
  return squadSnap.exists ? ((squadSnap.data()?.role as string | undefined) ?? null) : null
}

export async function ehAdminDoPartner(email: string, partnerId: string): Promise<boolean> {
  if (await ehSuperAdmin(email)) return true
  const db = getDbAdmin()
  const snap = await db.collection('partners').doc(partnerId).collection('members').doc(email).get()
  if (snap.exists && snap.data()?.role === 'admin') return true
  return (await roleNoSquadDoPartner(email, partnerId)) === 'admin'
}

/** Admin OU viewer desse partner (direto ou via squad) — libera rotas só-leitura (ex: métricas de Ads). */
export async function ehMembroDoPartner(email: string, partnerId: string): Promise<boolean> {
  if (await ehSuperAdmin(email)) return true
  const db = getDbAdmin()
  const snap = await db.collection('partners').doc(partnerId).collection('members').doc(email).get()
  if (snap.exists) return true
  return (await roleNoSquadDoPartner(email, partnerId)) !== null
}
