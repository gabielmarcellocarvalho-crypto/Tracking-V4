import { initializeApp, getApps } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { initializeFirestore, getFirestore, connectFirestoreEmulator } from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const jaExistia = getApps().length > 0
const app = jaExistia ? getApps()[0] : initializeApp(firebaseConfig)

export const auth = getAuth(app)
// Achado ao vivo (2026-08): canal Listen do Firestore em loop de reconexão
// (erro 400 repetido, muda de sessão a cada poucos ciclos) tanto em teste
// automatizado quanto no navegador real do Gabriel, inclusive em aba anônima
// -- deixava toda tela que depende de onSnapshot (eventos, jornada, etc.)
// presa em array vazio pra sempre, mesmo com dado real no banco. Esse é o
// sintoma exato que a própria doc do Firebase recomenda resolver com
// experimentalAutoDetectLongPolling: proxy/antivírus/rede no meio corta a
// conexão de streaming (WebChannel) que o SDK usa por padrão; com essa opção
// o SDK detecta isso e cai pra long-polling simples, que atravessa esse tipo
// de rede sem problema.
export const db = jaExistia
  ? getFirestore(app)
  : initializeFirestore(app, { experimentalAutoDetectLongPolling: true })

// Conecta aos emuladores locais (firebase emulators:start) só quando explicitamente
// habilitado via NEXT_PUBLIC_USE_EMULATOR=true — nunca aponta pra produção por engano.
// Guard em globalThis evita "emulator already connected" no hot-reload do Next dev.
if (process.env.NEXT_PUBLIC_USE_EMULATOR === 'true') {
  const g = globalThis as unknown as { __v4EmulatorConnected?: boolean }
  if (!g.__v4EmulatorConnected) {
    connectFirestoreEmulator(db, '127.0.0.1', 8080)
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
    g.__v4EmulatorConnected = true
  }
}
