// ─── POST /api/usuarios ───────────────────────────────────────────────────
// Cria um novo usuário (Firebase Auth, sem senha) + concede acesso a uma
// lista de clientes (partners/{id}/members/{email}) com o role escolhido.
// Só superadmin pode chamar essa rota — criar conta e distribuir acesso é
// uma ação sensível, não algo que qualquer membro admin de um cliente deveria
// poder fazer.
//
// Não enviamos e-mail (sem serviço de SMTP configurado): devolvemos o link de
// "definir senha" pra quem chamou repassar manualmente pro novo usuário.

import { NextRequest, NextResponse } from 'next/server'
import { getAuthAdmin, getDbAdmin } from '@/lib/firebase-admin'
import { emailDoToken, ehSuperAdmin } from '@/lib/server/auth-helpers'
import type { MemberRole } from '@/lib/types'

interface CriarUsuarioBody {
  email?: string
  nome?: string
  clienteIds?: string[]
  role?: MemberRole
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
  const role = body.role

  if (!email || !email.includes('@')) {
    return NextResponse.json({ ok: false, erro: 'e-mail inválido' }, { status: 400 })
  }
  if (clienteIds.length === 0) {
    return NextResponse.json({ ok: false, erro: 'selecione pelo menos um cliente' }, { status: 400 })
  }
  if (role !== 'admin' && role !== 'viewer') {
    return NextResponse.json({ ok: false, erro: 'nível de acesso inválido' }, { status: 400 })
  }

  const authAdmin = getAuthAdmin()
  let jaExistia = false

  try {
    await authAdmin.createUser({
      email,
      displayName: body.nome?.trim() || undefined,
      emailVerified: false,
    })
  } catch (err: any) {
    if (err?.code === 'auth/email-already-exists') {
      jaExistia = true
    } else {
      console.error('[api/usuarios] erro ao criar usuário:', err)
      return NextResponse.json({ ok: false, erro: 'falha ao criar usuário no Firebase Auth' }, { status: 500 })
    }
  }

  let passwordResetLink: string | undefined
  try {
    passwordResetLink = await authAdmin.generatePasswordResetLink(email)
  } catch (err) {
    // Não bloqueia a concessão de acesso por causa disso — só avisa que o link não saiu.
    console.error('[api/usuarios] erro ao gerar link de senha:', err)
  }

  const db = getDbAdmin()
  const addedAt = Date.now()
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

  return NextResponse.json({ ok: true, jaExistia, passwordResetLink, clientesConcedidos: clienteIds.length })
}
