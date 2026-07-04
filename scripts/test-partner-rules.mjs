// Teste manual (não faz parte do build) das regras novas de partners/* contra
// o Firebase Emulator local. Roda com: node scripts/test-partner-rules.mjs
// Requer: firebase emulators:start --only firestore,auth --project demo-tracking-v4

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080'
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099'

import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { initializeApp as initClientApp } from 'firebase/app'
import {
  getAuth, connectAuthEmulator, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut,
} from 'firebase/auth'
import {
  getFirestore as getClientFirestore, connectFirestoreEmulator, doc, getDoc, setDoc,
} from 'firebase/firestore'

const PROJECT_ID = 'demo-tracking-v4'

// ── Seed via admin SDK (ignora as regras) ────────────────────────────────────
const adminApp = initializeApp({ projectId: PROJECT_ID }, 'admin-test')
const db = getFirestore(adminApp)

await db.doc('config/superadmins').set({ emails: ['super@test.com'] })
await db.doc('partners/test-partner').set({
  id: 'test-partner', nome: 'Test Partner', segmento: 'x', tipo: 'leads', status: 'ativo',
})
await db.doc('partners/test-partner/members/admin@test.com').set({
  email: 'admin@test.com', role: 'admin', addedAt: Date.now(),
})
await db.doc('partners/test-partner/members/viewer@test.com').set({
  email: 'viewer@test.com', role: 'viewer', addedAt: Date.now(),
})
await db.doc('partners/test-partner/integrations/meta').set({
  plataforma: 'meta', status: 'configurado', campos: {},
})
console.log('seed ok')

// ── Client SDK apontado pro emulador (é aqui que as regras valem) ───────────
const clientApp = initClientApp({ projectId: PROJECT_ID, apiKey: 'fake-key' }, 'client-test')
const auth = getAuth(clientApp)
connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
const cdb = getClientFirestore(clientApp)
connectFirestoreEmulator(cdb, '127.0.0.1', 8080)

async function testAs(email, password, fn) {
  try { await createUserWithEmailAndPassword(auth, email, password) } catch {}
  await signInWithEmailAndPassword(auth, email, password)
  await fn()
  await signOut(auth)
}

async function canRead(path) {
  try { await getDoc(doc(cdb, path)); return true } catch { return false }
}
async function canWrite(path, data) {
  try { await setDoc(doc(cdb, path), data); return true } catch { return false }
}

const resultados = []

await testAs('viewer@test.com', 'senha1234', async () => {
  resultados.push(['viewer LÊ integrations', await canRead('partners/test-partner/integrations/meta'), true])
  resultados.push(['viewer ESCREVE integrations', await canWrite('partners/test-partner/integrations/meta', { plataforma: 'meta', status: 'configurado', campos: { x: '1' } }), false])
})

await testAs('admin@test.com', 'senha1234', async () => {
  resultados.push(['admin ESCREVE integrations', await canWrite('partners/test-partner/integrations/meta', { plataforma: 'meta', status: 'configurado', campos: { y: '2' } }), true])
  resultados.push(['admin ESCREVE membro', await canWrite('partners/test-partner/members/novo@test.com', { email: 'novo@test.com', role: 'viewer', addedAt: Date.now() }), true])
})

await testAs('outsider@test.com', 'senha1234', async () => {
  resultados.push(['não-membro LÊ integrations', await canRead('partners/test-partner/integrations/meta'), false])
  resultados.push(['não-membro ESCREVE integrations', await canWrite('partners/test-partner/integrations/meta', { plataforma: 'meta', status: 'configurado', campos: {} }), false])
})

await testAs('super@test.com', 'senha1234', async () => {
  resultados.push(['superadmin ESCREVE integrations (sem ser membro)', await canWrite('partners/test-partner/integrations/meta', { plataforma: 'meta', status: 'configurado', campos: { z: '3' } }), true])
})

console.log('\n--- RESULTADOS ---')
let falhou = false
for (const [nome, obtido, esperado] of resultados) {
  const ok = obtido === esperado
  if (!ok) falhou = true
  console.log(`${ok ? 'OK  ' : 'FAIL'} — ${nome}: esperado=${esperado} obtido=${obtido}`)
}
process.exit(falhou ? 1 : 0)
