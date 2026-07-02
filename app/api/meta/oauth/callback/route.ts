// ─── POST /api/meta/oauth/callback ───────────────────────────────────────────
// Recebe o `code` do popup de OAuth (app/meta/callback/page.tsx), valida a
// sessão do usuário logado (idToken do Firebase Auth) e troca o code pelo
// access_token de longa duração, salvando em users/{email}.meta_integration
// via firebase-admin (nunca passa pelo SDK client / firestore.rules).

import { NextRequest, NextResponse } from 'next/server'
import { getAuthAdmin, getDbAdmin } from '@/lib/firebase-admin'
import { trocarCodePorTokenLongo } from '@/lib/integrations/meta-oauth'

export async function POST(req: NextRequest) {
  let body: { code?: string; redirectUri?: string; idToken?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, erro: 'JSON inválido' }, { status: 400 })
  }

  const { code, redirectUri, idToken } = body
  if (!code || !redirectUri || !idToken) {
    return NextResponse.json(
      { ok: false, erro: 'code, redirectUri e idToken são obrigatórios' },
      { status: 400 },
    )
  }

  let email: string
  try {
    const decoded = await getAuthAdmin().verifyIdToken(idToken)
    if (!decoded.email) {
      return NextResponse.json({ ok: false, erro: 'usuário sem e-mail no token' }, { status: 400 })
    }
    email = decoded.email.toLowerCase()
  } catch (err) {
    console.error('[meta/oauth/callback] idToken inválido:', err)
    return NextResponse.json({ ok: false, erro: 'sessão inválida — faça login novamente' }, { status: 401 })
  }

  try {
    const { accessToken, expiraEm } = await trocarCodePorTokenLongo(code, redirectUri)

    await getDbAdmin().collection('users').doc(email).set(
      {
        email,
        meta_integration: {
          accessToken,
          tokenExpiry: expiraEm,
          atualizadoEm: Date.now(),
        },
      },
      { merge: true },
    )

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[meta/oauth/callback] erro na troca de token:', err)
    return NextResponse.json(
      { ok: false, erro: err instanceof Error ? err.message : 'falha na troca de token' },
      { status: 502 },
    )
  }
}
