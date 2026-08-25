// ─── POST /api/usuarios ───────────────────────────────────────────────────
// Cria um novo usuário (Firebase Auth, com a senha que quem chamou definiu)
// + concede acesso a uma lista de clientes (partners/{id}/members/{email})
// com o role escolhido. Só superadmin pode chamar essa rota — criar conta e
// distribuir acesso é uma ação sensível, não algo que qualquer membro admin
// de um cliente deveria poder fazer.
//
// A senha é definida por quem chama (não geramos link de "defina sua senha"
// — o gestor prefere repassar a senha ele mesmo). Só se aplica a conta NOVA;
// se o e-mail já tinha conta, a senha dele não é tocada, só concedemos acesso
// aos clientes selecionados.
//
// Quando role === 'admin', o e-mail também entra em config/admins — lista
// global (mesmo padrão de config/superadmins) que a firestore.rule usa pra
// liberar "criar cliente novo" pra qualquer admin, não só superadmin.

import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { getAuthAdmin, getDbAdmin } from '@/lib/firebase-admin'
import { emailDoToken, ehSuperAdmin } from '@/lib/server/auth-helpers'
import type { MemberRole } from '@/lib/types'

interface CriarUsuarioBody {
  email?: string
  nome?: string
  clienteIds?: string[]
  /** Squad (lib/squads.ts) — alternativa a clienteIds: concede acesso a TODO cliente desse squad, inclusive futuros. */
  squad?: string
  role?: MemberRole
  senha?: string
}

export async function POST(req: NextRequest) {
  const chamadorEmail = await emailDoToken(req)
  if (!chamadorEmail) {
    return NextResponse.json({ ok: false, erro: 'sessão inválida — faça login novamente' }, { status: 401 })
  }
  if (!(await ehSuperAdmin(chamadorEmail))) {
    return NextResponse.json({ ok: false, erro: 'só o dono da plataforma pode criar usuários' }, { status: 403 })
  }

  let body: CriarUsuarioBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, erro: 'JSON inválido' }, { status: 400 })
  }

  const email = body.email?.trim().toLowerCase()
  const clienteIds = body.clienteIds ?? []
  const squad = body.squad?.trim()
  const role = body.role
  const senha = body.senha

  if (!email || !email.includes('@')) {
    return NextResponse.json({ ok: false, erro: 'e-mail inválido' }, { status: 400 })
  }
  if (clienteIds.length === 0 && !squad) {
    return NextResponse.json({ ok: false, erro: 'selecione um squad ou pelo menos um cliente' }, { status: 400 })
  }
  if (role !== 'admin' && role !== 'viewer') {
    return NextResponse.json({ ok: false, erro: 'nível de acesso inválido' }, { status: 400 })
  }

  const authAdmin = getAuthAdmin()
  let jaExistia = false

  try {
    await authAdmin.getUserByEmail(email)
    jaExistia = true
  } catch {
    // Não existe ainda — segue pro fluxo de criação abaixo.
  }

  if (!jaExistia) {
    if (!senha || senha.length < 6) {
      return NextResponse.json({ ok: false, erro: 'defina uma senha com pelo menos 6 caracteres' }, { status: 400 })
    }
    try {
      await authAdmin.createUser({
        email,
        password: senha,
        displayName: body.nome?.trim() || undefined,
        emailVerified: false,
      })
    } catch (err: any) {
      console.error('[api/usuarios] erro ao criar usuário:', err)
      return NextResponse.json({ ok: false, erro: 'falha ao criar usuário no Firebase Auth' }, { status: 500 })
    }
  }

  const db = getDbAdmin()
  const addedAt = Date.now()

  let clientesConcedidos = clienteIds.length
  if (squad) {
    // Acesso ao squad = acesso automático a todo cliente com esse squad, sem
    // precisar listar cada um (nem os que ainda não existem) — grava só 1
    // doc em squads/{squad}/members/{email}, a checagem dinâmica fica em
    // lib/server/auth-helpers.ts (server) e firestore.rules (client SDK).
    await db.collection('squads').doc(squad).collection('members').doc(email).set({
      email, role, addedAt, addedBy: chamadorEmail,
    })
    const squadClientesSnap = await db.collection('partners').where('squad', '==', squad).get()
    clientesConcedidos = squadClientesSnap.size
  }

  await Promise.all(
    clienteIds.map((clienteId) =>
      db.collection('partners').doc(clienteId).collection('members').doc(email).set({
        email,
        role,
        addedAt,
        addedBy: chamadorEmail,
      }),
    ),
  )

  if (role === 'admin') {
    await db.doc('config/admins').set({ emails: FieldValue.arrayUnion(email) }, { merge: true })
  }

  return NextResponse.json({ ok: true, jaExistia, clientesConcedidos })
}
