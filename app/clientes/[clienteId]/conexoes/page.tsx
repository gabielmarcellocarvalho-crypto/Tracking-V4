'use client'

import { use, useEffect, useState } from 'react'
import DashboardHeader from '@/components/tracking/DashboardHeader'
import { useCliente } from '@/lib/data/clientes'
import { useConexoes, salvarConexao } from '@/lib/data/colecoes'
import { useMetaIntegration } from '@/lib/data/meta-integration'
import { iniciarLoginMeta } from '@/lib/integrations/meta-oauth-client'
import type { ConexaoPlataforma } from '@/lib/types'

interface CampoDef {
  id: string
  label: string
  placeholder: string
  secreto?: boolean
  textarea?: boolean
}

const PLATAFORMAS: {
  id: ConexaoPlataforma
  nome: string
  cor: string
  desc: string
  campos: CampoDef[]
  passos: string[]
}[] = [
  {
    id: 'meta',
    nome: 'Meta CAPI',
    cor: '#1877F2',
    desc: 'Envio server-side de conversões (Purchase, Lead, InitiateCheckout) com match quality alto — email/telefone hasheados + fbp/fbc. O token de acesso vem da sua conexão com o Facebook (veja abaixo), não precisa mais colar manualmente.',
    campos: [
      { id: 'pixelId', label: 'Pixel ID', placeholder: 'Ex: 123456789012345' },
      { id: 'testEventCode', label: 'Test Event Code (opcional)', placeholder: 'TEST12345' },
    ],
    passos: [
      'Conecte sua conta Meta com o botão acima (uma vez só — vale pra todos os seus clientes)',
      'Gerenciador de Eventos → seu Pixel → copie o Pixel ID',
      'Cole o Pixel ID aqui — o envio da fila ativa automaticamente',
    ],
  },
  {
    id: 'google',
    nome: 'Google Ads',
    cor: '#4285F4',
    desc: 'Enhanced Conversions — sobe conversões com gclid/wbraid + dados hasheados para recuperar atribuição perdida.',
    campos: [
      { id: 'customerId', label: 'Customer ID', placeholder: 'Ex: 1234567890 (sem hífens)' },
      { id: 'developerToken', label: 'Developer Token', placeholder: 'Token aprovado no Centro de API', secreto: true },
      { id: 'conversionActionId', label: 'Conversion Action ID (opcional)', placeholder: 'Ex: 987654321' },
    ],
    passos: [
      'Google Ads → Ferramentas → Configuração → Centro de API → Developer Token',
      'Anote o Customer ID da conta (canto superior direito)',
      'O envio exige OAuth (etapa posterior) — os payloads ficam prontos na fila',
    ],
  },
  {
    id: 'ga4',
    nome: 'GA4',
    cor: '#E37400',
    desc: 'Cruza sessões e canais do GA4 com os dados primários — validação de tráfego orgânico e assistido.',
    campos: [
      { id: 'propertyId', label: 'Property ID', placeholder: 'Ex: 312345678' },
      { id: 'measurementId', label: 'Measurement ID (opcional)', placeholder: 'G-XXXXXXXXXX' },
      { id: 'serviceAccountJson', label: 'Service Account JSON (opcional)', placeholder: '{ "type": "service_account", … }', secreto: true, textarea: true },
    ],
    passos: [
      'GA4 → Administrador → Informações da propriedade → Property ID',
      'Google Cloud → IAM → Service account com papel "Viewer" na property',
      'Cole o JSON da service account para habilitar a leitura de relatórios',
    ],
  },
]

function MetaConnectionStatus() {
  const { meta, conectado, loading } = useMetaIntegration()

  if (loading) return null

  if (conectado) {
    const expiraEm = meta?.tokenExpiry ? new Date(meta.tokenExpiry) : undefined
    const diasRestantes = expiraEm ? Math.max(0, Math.round((expiraEm.getTime() - Date.now()) / 86400000)) : undefined
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
        padding: '10px 12px', borderRadius: 8, marginBottom: 12,
        background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.25)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)' }}>Conta Meta conectada</span>
          {diasRestantes !== undefined && (
            <span style={{ fontSize: 11, color: 'var(--t3)' }}>· expira em {diasRestantes}d</span>
          )}
        </div>
        <button
          onClick={iniciarLoginMeta}
          style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
        >
          Reconectar
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={iniciarLoginMeta}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, width: '100%', marginBottom: 12,
        padding: '10px 12px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, color: '#fff',
        background: '#1877F2', border: 'none', cursor: 'pointer',
      }}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" width={15} height={15}>
        <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12" />
      </svg>
      Conectar com Facebook
    </button>
  )
}

function CardConexao({ plataforma, clienteId, camposSalvos, statusSalvo, isDemo }: {
  plataforma: typeof PLATAFORMAS[number]
  clienteId: string
  camposSalvos: Record<string, string>
  statusSalvo: string
  isDemo: boolean
}) {
  const [valores, setValores] = useState<Record<string, string>>({})
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo]       = useState(false)
  const [aberto, setAberto]     = useState(false)

  useEffect(() => { setValores(camposSalvos) }, [camposSalvos])

  const configurado = statusSalvo === 'configurado'

  const handleSalvar = async () => {
    setSalvando(true)
    try {
      await salvarConexao(clienteId, plataforma.id, valores)
      setSalvo(true)
      setTimeout(() => setSalvo(false), 1500)
    } finally {
      setSalvando(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 11px', borderRadius: 8, fontSize: 12,
    background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-1)',
    outline: 'none', fontFamily: 'monospace',
  }

  return (
    <div style={{ background: 'var(--bg-c)', border: '1px solid var(--br)', borderRadius: 12, overflow: 'hidden' }}>
      {/* Header do card */}
      <button
        onClick={() => setAberto(!aberto)}
        style={{
          width: '100%', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12,
          background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{
          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
          background: plataforma.cor + '15', border: `1px solid ${plataforma.cor}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 800, color: plataforma.cor,
        }}>
          {plataforma.nome[0]}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>{plataforma.nome}</span>
            <span style={{
              display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700,
              padding: '2px 8px', borderRadius: 12,
              background: configurado ? 'rgba(16,185,129,.12)' : 'rgba(107,114,128,.12)',
              color: configurado ? '#10B981' : '#9CA3AF',
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: configurado ? '#10B981' : '#6B7280' }} />
              {configurado ? 'Configurado' : 'Desconectado'}
            </span>
          </div>
          <p style={{ fontSize: 11.5, color: 'var(--t3)', margin: '3px 0 0', lineHeight: 1.5 }}>{plataforma.desc}</p>
        </div>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"
          width={14} height={14}
          style={{ color: 'var(--t3)', transform: aberto ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Corpo expandido */}
      {aberto && (
        <div style={{ padding: '0 18px 18px', borderTop: '1px solid var(--br-s)' }}>
          {plataforma.id === 'meta' && <div style={{ marginTop: 14 }}><MetaConnectionStatus /></div>}
          <div style={{ display: 'flex', gap: 20, marginTop: plataforma.id === 'meta' ? 0 : 14, flexWrap: 'wrap' }}>
            {/* Campos */}
            <div style={{ flex: 1, minWidth: 260, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {plataforma.campos.map((c) => (
                <div key={c.id}>
                  <label style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--t2)', display: 'block', marginBottom: 4 }}>{c.label}</label>
                  {c.textarea ? (
                    <textarea
                      value={valores[c.id] ?? ''}
                      onChange={(e) => setValores((v) => ({ ...v, [c.id]: e.target.value }))}
                      placeholder={c.placeholder}
                      rows={3}
                      style={{ ...inputStyle, resize: 'vertical' }}
                    />
                  ) : (
                    <input
                      type={c.secreto ? 'password' : 'text'}
                      value={valores[c.id] ?? ''}
                      onChange={(e) => setValores((v) => ({ ...v, [c.id]: e.target.value }))}
                      placeholder={c.placeholder}
                      style={inputStyle}
                    />
                  )}
                </div>
              ))}
              <button
                onClick={handleSalvar}
                disabled={salvando || isDemo}
                style={{
                  alignSelf: 'flex-start', marginTop: 4, padding: '9px 18px', borderRadius: 8,
                  fontSize: 12.5, fontWeight: 600, color: '#fff', border: 'none',
                  background: salvo ? '#10B981' : plataforma.cor,
                  cursor: isDemo ? 'not-allowed' : 'pointer', opacity: salvando || isDemo ? 0.6 : 1,
                }}
              >
                {salvo ? 'Salvo ✓' : salvando ? 'Salvando…' : 'Salvar credenciais'}
              </button>
              {isDemo && <p style={{ fontSize: 10.5, color: 'var(--t3)' }}>Cliente demo — crie um cliente real para conectar.</p>}
            </div>

            {/* Passo a passo */}
            <div style={{ width: 280, flexShrink: 0 }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--t3)', margin: '0 0 8px' }}>
                Onde obter
              </p>
              {plataforma.passos.map((p, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 7 }}>
                  <span style={{
                    width: 16, height: 16, borderRadius: '50%', flexShrink: 0, fontSize: 9.5, fontWeight: 700,
                    background: plataforma.cor + '18', color: plataforma.cor,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{i + 1}</span>
                  <span style={{ fontSize: 11, color: 'var(--t2)', lineHeight: 1.5 }}>{p}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ConexoesPage({ params }: { params: Promise<{ clienteId: string }> }) {
  const { clienteId } = use(params)
  const { cliente, isDemo } = useCliente(clienteId)
  const { conexoes } = useConexoes(isDemo ? undefined : clienteId)
  const [copiado, setCopiado] = useState(false)

  const origem = typeof window !== 'undefined' ? window.location.origin : 'https://SEU-DOMINIO.vercel.app'
  const snippet = `<script src="${origem}/v4track.js" data-cliente="${clienteId}" data-key="${cliente?.trackingKey ?? 'SUA_TRACKING_KEY'}" defer></script>`

  return (
    <>
      <DashboardHeader clienteName={cliente?.nome ?? clienteId} clienteTipo={cliente?.tipo} />

      <main className="flex-1 overflow-y-auto p-6" style={{ background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <h2 className="text-[18px] font-bold text-[--text-1]">Conexões</h2>
          <p className="text-[12.5px] text-[--text-3] mt-1">
            Instalação do tracking no site + credenciais das plataformas de ads
          </p>
        </div>

        {/* Instalação do snippet */}
        <div style={{ background: 'var(--bg-c)', border: '1px solid rgba(200,16,46,.25)', borderRadius: 12, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{
              width: 34, height: 34, borderRadius: 9, flexShrink: 0,
              background: 'rgba(200,16,46,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={15} height={15}>
                <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
              </svg>
            </span>
            <div>
              <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>1. Instalar o snippet no site do cliente</p>
              <p style={{ fontSize: 11.5, color: 'var(--t3)', margin: '2px 0 0' }}>
                Cole antes do <code style={{ color: 'var(--t2)' }}>&lt;/head&gt;</code> — captura page_view automático, cookies (fbp/fbc/gclid/_v4id) e expõe <code style={{ color: 'var(--t2)' }}>v4track(&apos;lead&apos;, {'{…}'})</code>
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <code style={{
              flex: 1, display: 'block', padding: '10px 12px', borderRadius: 8, fontSize: 11,
              fontFamily: 'monospace', color: 'var(--t2)', background: 'var(--bg-base)',
              border: '1px solid var(--border)', wordBreak: 'break-all', lineHeight: 1.6,
            }}>{snippet}</code>
            <button
              onClick={() => { navigator.clipboard.writeText(snippet); setCopiado(true); setTimeout(() => setCopiado(false), 1500) }}
              style={{
                padding: '10px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, flexShrink: 0,
                background: copiado ? 'rgba(16,185,129,.12)' : 'var(--red)',
                border: copiado ? '1px solid #10B981' : 'none',
                color: copiado ? '#10B981' : '#fff', cursor: 'pointer',
              }}
            >{copiado ? 'Copiado ✓' : 'Copiar'}</button>
          </div>
          <p style={{ fontSize: 11, color: 'var(--t3)', margin: '10px 0 0', lineHeight: 1.6 }}>
            Eventos manuais: <code style={{ color: '#10B981' }}>v4track(&apos;lead&apos;, {'{ email, telefone, nome }'})</code> ·{' '}
            <code style={{ color: '#8B5CF6' }}>v4track(&apos;checkout&apos;, {'{ valor, produto }'})</code> ·{' '}
            <code style={{ color: '#F59E0B' }}>v4track(&apos;compra&apos;, {'{ email, valor, produto }'})</code>
            {' '}— também aceita POST direto em <code style={{ color: 'var(--t2)' }}>/api/track</code> (webhooks/n8n).
          </p>
        </div>

        {/* Plataformas */}
        <div>
          <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--t1)', margin: '0 0 4px' }}>2. Conectar plataformas</p>
          <p style={{ fontSize: 11.5, color: 'var(--t3)', margin: '0 0 12px' }}>
            As conversões já ficam enfileiradas com payload pronto — o envio ativa quando as credenciais forem salvas.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {PLATAFORMAS.map((p) => {
              const salva = conexoes.find((c) => c.plataforma === p.id)
              return (
                <CardConexao
                  key={p.id}
                  plataforma={p}
                  clienteId={clienteId}
                  camposSalvos={salva?.campos ?? {}}
                  statusSalvo={salva?.status ?? 'desconectado'}
                  isDemo={isDemo}
                />
              )
            })}
          </div>
        </div>
      </main>
    </>
  )
}
