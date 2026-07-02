'use client'

// ─── STATUS DA CONEXÃO META (OAuth) — por usuário logado ─────────────────────
// Lê users/{email}.meta_integration em tempo real. Compartilhado entre todos
// os clientes cujo donoEmail aponta pro e-mail do usuário logado.

import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/lib/auth-context'
import type { UserMetaIntegration } from '@/lib/types'

export function useMetaIntegration() {
  const { user } = useAuth()
  const [meta, setMeta] = useState<UserMetaIntegration | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.email) { setMeta(null); setLoading(false); return }
    const ref = doc(db, 'users', user.email.toLowerCase())
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setMeta((snap.data()?.meta_integration as UserMetaIntegration | undefined) ?? null)
        setLoading(false)
      },
      () => { setMeta(null); setLoading(false) },
    )
    return unsub
  }, [user?.email])

  const conectado = !!meta?.accessToken && meta.tokenExpiry > Date.now()
  return { meta, conectado, loading }
}
