// ─── GET /api/auth/whoami ─────────────────────────────────────────────────
// Diz se o usuário logado é superadmin e/ou admin geral (admin em pelo menos
// um cliente) — usado pelo client pra decidir se mostra ações restritas
// (ex: "Novo usuário", "Novo cliente"). config/superadmins e config/admins
// não têm "allow read" pro SDK client de propósito (só a engine de regras
// enxerga via get()), então essa checagem precisa passar por uma rota server.

import { NextRequest, NextResponse } from 'next/server'
import { emailDoToken, ehSuperAdmin, ehAdminGeral } from '@/lib/server/auth-helpers'

export async function GET(req: NextRequest) {
  const email = await emailDoToken(req)
  if (!email) {
    return NextResponse.json({ ok: false, erro: 'sessão inválida' }, { status: 401 })
  }

  const [superAdmin, adminGeral] = await Promise.all([ehSuperAdmin(email), ehAdminGeral(email)])
  return NextResponse.json({ ok: true, email, superAdmin, adminGeral })
}
