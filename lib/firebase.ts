import { initializeApp, getApps } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

export const auth = getAuth(app)
export const db   = getFirestore(app)

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
