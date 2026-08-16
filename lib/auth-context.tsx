'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  type User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { auth } from './firebase'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [])

  const signIn = useCallback((email: string, password: string) =>
    signInWithEmailAndPassword(auth, email, password).then(() => undefined), [])

  const signOut = useCallback(() => firebaseSignOut(auth), [])

  const resetPassword = useCallback((email: string) => sendPasswordResetEmail(auth, email), [])

  // Sem isso, o objeto do value era recriado em TODO render de AuthProvider
  // (raiz do app) — qualquer componente usando useAuth() (inclusive
  // AuthGuard, que envolve toda página autenticada) re-renderizava a cada
  // vez, mesmo sem o usuário real ter mudado.
  const value = useMemo(
    () => ({ user, loading, signIn, signOut, resetPassword }),
    [user, loading, signIn, signOut, resetPassword],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
