// Copia clientes/{id} (+ subcoleções) para partners/{id}, preservando o mesmo
// id de documento. NÃO apaga a árvore antiga — isso só acontece na Etapa 5,
// depois de um período de segurança sem precisar reverter.
//
// Uso:
//   USE_EMULATOR=1 node scripts/migrate-clientes-to-partners.mjs [clienteId]
//   node scripts/migrate-clientes-to-partners.mjs [clienteId]        (produção real)
//
// Sem clienteId, migra todos os docs encontrados em clientes/.

import { readFileSync } from 'fs'
import { cert, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const useEmulator = process.env.USE_EMULATOR === '1'
if (useEmulator) {
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080'
}

function getAdminApp() {
  if (useEmulator) {
    return initializeApp({ projectId: 'demo-tracking-v4' })
  }
  const envContent = readFileSync('.env.local', 'utf8')
  const match = envContent.match(/^FIREBASE_SERVICE_ACCOUNT_KEY=(.+)$/m)
  if (!match) throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY não encontrada em .env.local')
  const serviceAccount = JSON.parse(match[1])
  return initializeApp({ credential: cert(serviceAccount) })
}

const app = getAdminApp()
const db = getFirestore(app)

const SUBCOLECOES_MULTI = ['eventos', 'identidades', 'utms', 'conversoes', 'insights']
const PLATAFORMAS = ['meta', 'google', 'ga4', 'shopify']
const SUPERADMIN_EMAIL = 'gabielmarcellocarvalho@gmail.com'
const BATCH_LIMIT = 400

async function copiarSubcolecao(clienteId, nome) {
  const origemRef = db.collection('clientes').doc(clienteId).collection(nome)
  const destRef = db.collection('partners').doc(clienteId).collection(nome)

  const snap = await origemRef.get()
  let batch = db.batch()
  let ops = 0
  for (const docSnap of snap.docs) {
    batch.set(destRef.doc(docSnap.id), docSnap.data())
    ops++
    if (ops >= BATCH_LIMIT) {
      await batch.commit()
      batch = db.batch()
      ops = 0
    }
  }
  if (ops > 0) await batch.commit()

  const destSnap = await destRef.get()
  return { origem: snap.size, destino: destSnap.size }
}

async function migrarCliente(clienteId) {
  console.log(`\n=== Migrando ${clienteId} ===`)

  const clienteSnap = await db.collection('clientes').doc(clienteId).get()
  if (!clienteSnap.exists) {
    console.log(`clientes/${clienteId} não existe, pulando.`)
    return false
  }
  await db.collection('partners').doc(clienteId).set(clienteSnap.data())
  console.log('doc raiz copiado')

  let divergiu = false
  for (const nome of SUBCOLECOES_MULTI) {
    const r = await copiarSubcolecao(clienteId, nome)
    const ok = r.origem === r.destino
    if (!ok) divergiu = true
    console.log(`  ${nome}: origem=${r.origem} destino=${r.destino} [${ok ? 'OK' : 'DIVERGENTE!!'}]`)
  }

  const perfSnap = await db.collection('clientes').doc(clienteId).collection('performance_config').doc('main').get()
  if (perfSnap.exists) {
    await db.collection('partners').doc(clienteId).collection('performance_config').doc('main').set(perfSnap.data())
    console.log('  performance_config/main: copiado')
  } else {
    console.log('  performance_config/main: não existe na origem, pulando')
  }

  for (const plataforma of PLATAFORMAS) {
    const conSnap = await db.collection('clientes').doc(clienteId).collection('conexoes').doc(plataforma).get()
    if (conSnap.exists) {
      await db.collection('partners').doc(clienteId).collection('integrations').doc(plataforma).set(conSnap.data())
      console.log(`  integrations/${plataforma}: copiado`)
    }
  }

  await db.collection('partners').doc(clienteId).collection('members').doc(SUPERADMIN_EMAIL).set({
    email: SUPERADMIN_EMAIL,
    role: 'admin',
    addedAt: Date.now(),
  })
  console.log(`  members/${SUPERADMIN_EMAIL}: admin adicionado`)

  console.log(`=== ${clienteId} migrado${divergiu ? ' — COM DIVERGÊNCIAS, revisar antes de cortar ingestão' : ' com sucesso' } ===`)
  return !divergiu
}

const alvo = process.argv[2]
let todasOk = true

if (alvo) {
  todasOk = await migrarCliente(alvo)
} else {
  const todos = await db.collection('clientes').listDocuments()
  console.log(`Encontrados ${todos.length} cliente(s): ${todos.map((d) => d.id).join(', ') || '(nenhum)'}`)
  for (const docRef of todos) {
    const ok = await migrarCliente(docRef.id)
    if (!ok) todasOk = false
  }
}

console.log('\nclientes/{id} NÃO foi apagado (fica como rollback até a Etapa 5).')
process.exit(todasOk ? 0 : 1)
