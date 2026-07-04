// One-off: cria/atualiza config/superadmins em produção com o e-mail do dono
// da plataforma. Lê a service account direto do .env.local (mesmo padrão do
// lib/firebase-admin.ts) — nunca loga o conteúdo da chave.
// Uso: node scripts/seed-superadmin.mjs

import { readFileSync } from 'fs'
import { cert, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const SUPERADMIN_EMAILS = ['gabielmarcellocarvalho@gmail.com']

const envContent = readFileSync('.env.local', 'utf8')
const match = envContent.match(/^FIREBASE_SERVICE_ACCOUNT_KEY=(.+)$/m)
if (!match) throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY não encontrada em .env.local')

const serviceAccount = JSON.parse(match[1])
const app = initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore(app)

await db.doc('config/superadmins').set({ emails: SUPERADMIN_EMAILS })
console.log('config/superadmins atualizado com', SUPERADMIN_EMAILS.length, 'e-mail(s)')

const snap = await db.doc('config/superadmins').get()
console.log('confirmado no Firestore:', snap.data())
