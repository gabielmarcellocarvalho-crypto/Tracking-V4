// ─── GET /api/auth/whoami ─────────────────────────────────────────────────
// Diz se o usuário logado é superadmin — usado pelo client pra decidir se
// mostra ações restritas (ex: "Novo usuário"). config/superadmins não tem
// "allow read" pro SDK client de propósito (só a engine de regras enxerga
// via get()), então essa checagem precisa passar por uma rota server.

import { NextRequest, NextResponse } from 'next/server'
import { emailDoToken, ehSuperAdmin } from '@/lib/server/auth-helpers'

export async function GET(req: NextRequest) {
  const email = await emailDoToken(req)
  if (!email) {
    return NextResponse.json({ ok: false, erro: 'sessão inválida' }, { status: 401 })
  }

  const superAdmin = await ehSuperAdmin(email)
  return NextResponse.json({ ok: true, email, superAdmin })
}
