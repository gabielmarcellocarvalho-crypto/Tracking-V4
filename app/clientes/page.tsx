'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import AuthGuard from '@/components/auth/AuthGuard'
import ClienteCard from '@/components/clientes/ClienteCard'
import NovoClienteModal from '@/components/clientes/NovoClienteModal'
import NovoUsuarioModal from '@/components/clientes/NovoUsuarioModal'
import { useClientes } from '@/lib/data/partners'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'

/** Só o dono da plataforma vê a opção de criar usuário — checagem via rota
 * server porque config/superadmins não é legível pelo SDK client (de propósito). */
function useSuperAdmin() {
  const { user } = useAuth()
  const [superAdmin, setSuperAdmin] = useState(false)

  useEffect(() => {
    if (!user) { setSuperAdmin(false); return }
    let cancelado = false
    user.getIdToken().then((idToken) =>
      fetch('/api/auth/whoami', { headers: { Authorization: `Bearer ${idToken}` } })
        .then((r) => r.json())
        .then((j) => { if (!cancelado) setSuperAdmin(!!j.superAdmin) })
        .catch(() => { if (!cancelado) setSuperAdmin(false) }),
    )
    return () => { cancelado = true }
  }, [user])

  return superAdmin
}

function ClientesHeader() {
  const { user, signOut } = useAuth()
  const router = useRouter()

  const initials = user?.displayName
    ? user.displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? 'G'

  const handleSignOut = async () => {
    await signOut()
    router.replace('/login')
  }

  return (
    <header
      className="h-[64px] flex items-center justify-between px-8 sticky top-0 z-50"
      style={{ background: 'var(--bg-side)', borderBottom: '1px solid var(--border)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-[10px]">
        <img
          src="/v4-logo.png"
          alt="V4 Company"
          style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover', flexShrink: 0, boxShadow: '0 4px 12px rgba(200,16,46,.4)' }}
        />
        <span className="text-[15px] font-bold text-[--text-1]">TRACKING V4</span>
        <span className="text-[12px] text-[--text-3] ml-1">— Carvalho &amp; Co</span>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-3">
        <span className="text-[13px] text-[--text-2]">{user?.displayName ?? user?.email ?? 'Gabriel'}</span>
        <button
          onClick={handleSignOut}
          title="Sair"
          className="w-[36px] h-[36px] rounded-full flex items-center justify-center font-bold text-[13px] text-white cursor-pointer transition-all duration-[180ms] hover:scale-105"
          style={{ background: 'linear-gradient(135deg, var(--red), var(--purple))' }}
        >
          {initials}
        </button>
      </div>
    </header>
  )
}

export default function ClientesPage() {
  const { clientes, reais, loading } = useClientes()
  const [modal, setModal] = useState(false)
  const [modalUsuario, setModalUsuario] = useState(false)
  const souSuperAdmin = useSuperAdmin()

  const ativos   = clientes.filter((c) => c.status === 'ativo')
  const inativos = clientes.filter((c) => c.status === 'inativo')

  return (
    <AuthGuard>
      <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
        <ClientesHeader />

        <main className="max-w-[1200px] mx-auto px-8 py-10">
          {/* Page title */}
          <motion.div
            className="mb-8 flex items-end justify-between"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div>
              <h1 className="text-[26px] font-bold text-[--text-1]">Clientes</h1>
              <p className="text-[13.5px] text-[--text-3] mt-[5px]">
                Selecione um cliente para acessar o dashboard de tracking.
                {reais.length === 0 && !loading && ' Os cards abaixo são demonstração — crie seu primeiro cliente real.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {souSuperAdmin && (
                <button
                  onClick={() => setModalUsuario(true)}
                  className="flex items-center gap-2 px-5 py-[10px] rounded-[9px] text-[13px] font-semibold cursor-pointer transition-all duration-[180ms]"
                  style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-2)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--text-3)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={14} height={14}>
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
                  </svg>
                  Novo usuário
                </button>
              )}
              <button
                onClick={() => setModal(true)}
                className="flex items-center gap-2 px-5 py-[10px] rounded-[9px] text-[13px] font-semibold text-white cursor-pointer transition-all duration-[180ms]"
                style={{ background: 'var(--red)', boxShadow: '0 3px 12px rgba(200,16,46,.35)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--red-h)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--red)'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" width={14} height={14}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                Novo cliente
              </button>
            </div>
          </motion.div>

          {/* Active clients */}
          <div className="mb-10">
            <p className="text-[11px] font-bold uppercase tracking-[0.09em] text-[--text-3] mb-4">
              Ativos · {ativos.length} clientes
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {ativos.map((c, i) => <ClienteCard key={c.id} cliente={c} index={i} />)}
            </div>
          </div>

          {/* Inactive clients */}
          {inativos.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.09em] text-[--text-3] mb-4">
                Inativos · {inativos.length} clientes
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {inativos.map((c, i) => <ClienteCard key={c.id} cliente={c} index={ativos.length + i} />)}
              </div>
            </div>
          )}
        </main>

        {modal && <NovoClienteModal onClose={() => setModal(false)} />}
        {modalUsuario && <NovoUsuarioModal clientes={reais} onClose={() => setModalUsuario(false)} />}
      </div>
    </AuthGuard>
  )
}
