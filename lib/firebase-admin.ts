// ─── FIREBASE ADMIN SDK (server-only) ────────────────────────────────────────
// Usado exclusivamente pelas rotas sensíveis: OAuth Meta (grava o access_token
// em users/{email}) e atualização de status das conversões CAPI. Nunca importar
// este arquivo em código que roda no client — a service account tem acesso
// irrestrito ao Firestore, ignorando firestore.rules.
//
// Inicialização é preguiçosa (lazy) de propósito: o Next.js importa as rotas
// de API em build-time pra coletar metadados, então lançar erro no topo do
// módulo (sem FIREBASE_SERVICE_ACCOUNT_KEY configurada) quebraria `next build`
// mesmo antes de qualquer requisição real acontecer.

import { cert, getApps, initializeApp, type App } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import { getAuth, type Auth } from 'firebase-admin/auth'

let app: App | undefined

function getApp(): App {
  if (app) return app
  if (getApps().length > 0) {
    app = getApps()[0]
    return app
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  if (!raw) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_KEY não configurada — gere a chave em ' +
      'Firebase Console → Configurações do projeto → Contas de serviço e ' +
      'cole o JSON (uma linha) no .env.local',
    )
  }

  const serviceAccount = JSON.parse(raw)
  app = initializeApp({ credential: cert(serviceAccount) })
  return app
}

export function getDbAdmin(): Firestore {
  return getFirestore(getApp())
}

export function getAuthAdmin(): Auth {
  return getAuth(getApp())
}
