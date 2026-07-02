// ─── FIREBASE ADMIN SDK (server-only) ────────────────────────────────────────
// Usado exclusivamente pelas rotas sensíveis: OAuth Meta (grava o access_token
// em users/{email}) e atualização de status das conversões CAPI. Nunca importar
// este arquivo em código que roda no client — a service account tem acesso
// irrestrito ao Firestore, ignorando firestore.rules.

import { cert, getApps, initializeApp, type App } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'

function criarApp(): App {
  if (getApps().length > 0) return getApps()[0]

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  if (!raw) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_KEY não configurada — gere a chave em ' +
      'Firebase Console → Configurações do projeto → Contas de serviço e ' +
      'cole o JSON (uma linha) no .env.local',
    )
  }

  const serviceAccount = JSON.parse(raw)
  return initializeApp({ credential: cert(serviceAccount) })
}

const app = criarApp()

export const dbAdmin = getFirestore(app)
export const authAdmin = getAuth(app)
