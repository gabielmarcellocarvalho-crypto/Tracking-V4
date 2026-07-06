'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { auth } from '@/lib/firebase'

function CallbackConteudo() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'processando' | 'sucesso' | 'erro'>('processando')
  const [erro, setErro] = useState('')

  const autenticar = useCallback(async (code: string) => {
    try {
      // Essa página abre numa janela nova — o Firebase Auth ainda não terminou
      // de restaurar a sessão (persistência via IndexedDB é assíncrona) no
      // instante em que o componente monta. Checar auth.currentUser direto é
      // uma corrida: quase sempre vem null mesmo com o usuário logado no app,
      // e é isso que gerava o erro "precisa estar logado" de forma espúria.
      // authStateReady() espera essa restauração inicial terminar antes de checar.
      await auth.authStateReady()
      const user = auth.currentUser
      if (!user) throw new Error('Você precisa estar logado na plataforma para conectar o Facebook.')

      const idToken = await user.getIdToken()
      const redirectUri = `${window.location.origin}/meta/callback`

      const res = await fetch('/api/meta/oauth/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirectUri, idToken }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(json.erro ?? 'falha ao conectar com o Facebook')

      setStatus('sucesso')
      setTimeout(() => {
        if (window.opener) window.close()
        else router.push('/clientes')
      }, 1600)
    } catch (err) {
      setStatus('erro')
      setErro(err instanceof Error ? err.message : 'falha ao conectar com o Facebook')
    }
  }, [router])

  useEffect(() => {
    const code = searchParams.get('code')
    const erroParam = searchParams.get('error')

    if (erroParam) {
      setStatus('erro')
      setErro('O Facebook recusou a conexão.')
      return
    }
    if (code) {
      autenticar(code)
    } else {
      setStatus('erro')
      setErro('Código de autorização não encontrado.')
    }
  }, [searchParams, autenticar])

  return (
    <div className="w-full max-w-[400px] rounded-[16px] p-8 text-center" style={{ background: 'var(--bg-side)', border: '1px solid var(--border)' }}>
      {status === 'processando' && (
        <>
          <div className="w-8 h-8 mx-auto mb-4 rounded-full border-2 animate-spin"
            style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
          <p className="text-[14px]" style={{ color: 'var(--text-1)' }}>Conectando ao Facebook…</p>
        </>
      )}
      {status === 'sucesso' && (
        <p className="text-[14px]" style={{ color: 'var(--green)' }}>Conectado com sucesso! Fechando…</p>
      )}
      {status === 'erro' && (
        <>
          <p className="text-[13.5px]" style={{ color: 'var(--red)' }}>{erro}</p>
          <button
            onClick={() => router.push('/clientes')}
            className="mt-4 text-[12.5px] underline cursor-pointer"
            style={{ color: 'var(--text-3)' }}
          >
            Voltar
          </button>
        </>
      )}
    </div>
  )
}

export default function MetaCallbackPage() {
  return (
    <div className="flex items-center justify-center min-h-screen px-4" style={{ background: 'var(--bg-base)' }}>
      <Suspense fallback={null}>
        <CallbackConteudo />
      </Suspense>
    </div>
  )
}
