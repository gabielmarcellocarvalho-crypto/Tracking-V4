'use client'

import { use, useMemo } from 'react'
import Link from 'next/link'
import DashboardHeader from '@/components/tracking/DashboardHeader'
import { useCliente } from '@/lib/data/partners'
import { useConversoes, useConexoes } from '@/lib/data/colecoes'
import type { Conversao, ConversaoStatus } from '@/lib/types'

// Dados demo (mesma visão anterior)
const CONV_DEMO = [
  { plataforma: 'Meta CAPI', evento: 'Purchase', quantidade: 124, status: 'ok', taxa: '98.4%', ultimo: '13/06 · 14:32' },
  { plataforma: 'Meta CAPI', evento: 'Lead',     quantidade: 847, status: 'ok', taxa: '97.1%', ultimo: '13/06 · 14:30' },
  { plataforma: 'Google Enhanced', evento: 'Purchase', quantidade: 89, status: 'ok', taxa: '96.8%', ultimo: '13/06 · 14:28' },
  { plataforma: 'Google Enhanced', evento: 'Lead',     quantidade: 312, status: 'warn', taxa: '82.3%', ultimo: '13/06 · 13:55' },
]

const STATUS_CFG: Record<ConversaoStatus, { label: string; color: string }> = {
  'aguardando-conexao': { label: 'Aguardando conexão', color: '#F59E0B' },
  'pendente':           { label: 'Pendente',           color: '#3B82F6' },
  'enviado':            { label: 'Enviado',            color: '#10B981' },
  'erro':               { label: 'Erro',               color: '#EF4444' },
}

const EVENTO_LABEL: Record<string, string> = {
  lead: 'Lead', checkout: 'InitiateCheckout', compra: 'Purchase',
}

function StatusDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-[5px] text-[11.5px] font-[500]" style={{ color }}>
      <span className="w-[6px] h-[6px] rounded-full" style={{ background: color }} />
      {label}
    </span>
  )
}

const thBase = 'px-5 py-[9px] text-left text-[10px] font-bold uppercase tracking-[.07em] text-[--text-3]'

export default function ConversoesPage({ params }: { params: Promise<{ clienteId: string }> }) {
  const { clienteId } = use(params)
  const { cliente, isDemo } = useCliente(clienteId)
  const { conversoes } = useConversoes(isDemo ? undefined : clienteId)
  const { conexoes } = useConexoes(isDemo ? undefined : clienteId)

  const usarDemo = isDemo

  const resumo = useMemo(() => {
    const porPlataforma = (p: Conversao['plataforma']) => {
      const docs = conversoes.filter((c) => c.plataforma === p)
      const matchMedio = docs.length
        ? Math.round((docs.reduce((s, c) => s + c.matchQuality, 0) / docs.length) * 10)
        : 0
      return { total: docs.length, matchMedio }
    }
    return { meta: porPlataforma('meta-capi'), google: porPlataforma('google-enhanced') }
  }, [conversoes])

  const conexaoMeta   = conexoes.find((c) => c.plataforma === 'meta')?.status === 'configurado'
  const conexaoGoogle = conexoes.find((c) => c.plataforma === 'google')?.status === 'configurado'

  return (
    <>
      <DashboardHeader clienteName={cliente?.nome ?? clienteId} clienteTipo={cliente?.tipo} />

      <main className="flex-1 overflow-y-auto p-6" style={{ background: 'var(--bg-base)' }}>
        <div className="mb-5">
          <h2 className="text-[18px] font-bold text-[--text-1]">Conversões</h2>
          <p className="text-[12.5px] text-[--text-3] mt-1">
            Fila de envio para Meta CAPI e Google Enhanced Conversions
            {usarDemo && <span style={{ color: '#8B5CF6' }}> · dados demo</span>}
          </p>
        </div>

        {!usarDemo && (!conexaoMeta || !conexaoGoogle) && (
          <div className="rounded-[10px] p-4 mb-5 flex items-center justify-between" style={{ background: 'rgba(245,158,11,.06)', border: '1px solid rgba(245,158,11,.25)' }}>
            <p className="text-[12px]" style={{ color: 'var(--text-2)' }}>
              <span style={{ color: '#F59E0B', fontWeight: 700 }}>⚠ </span>
              Os payloads já estão prontos na fila, mas o envio depende das credenciais
              {!conexaoMeta && ' · Meta CAPI'}{!conexaoGoogle && ' · Google Ads'}.
            </p>
            <Link href={`/clientes/${clienteId}/conexoes`} className="text-[12px] font-semibold px-3 py-[6px] rounded-[7px]"
              style={{ background: 'rgba(245,158,11,.12)', color: '#F59E0B' }}>
              Configurar conexões →
            </Link>
          </div>
        )}

        {/* Status cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {(usarDemo
            ? [
                { label: 'Meta CAPI', color: '#1877F2', totalEvents: 971, matchRate: '97.8%', ok: true },
                { label: 'Google Enhanced', color: '#4285F4', totalEvents: 401, matchRate: '89.5%', ok: false },
              ]
            : [
                { label: 'Meta CAPI', color: '#1877F2', totalEvents: resumo.meta.total, matchRate: `${resumo.meta.matchMedio}%`, ok: resumo.meta.matchMedio >= 70 },
                { label: 'Google Enhanced', color: '#4285F4', totalEvents: resumo.google.total, matchRate: `${resumo.google.matchMedio}%`, ok: resumo.google.matchMedio >= 70 },
              ]
          ).map(({ label, color, totalEvents, matchRate, ok }) => (
            <div key={label} className="rounded-[12px] p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[13px] font-semibold" style={{ color: 'var(--text-1)' }}>{label}</span>
                <StatusDot color={ok ? '#10B981' : '#F59E0B'} label={ok ? 'Saudável' : 'Atenção'} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10.5px] uppercase tracking-wide mb-1" style={{ color: 'var(--text-3)' }}>
                    {usarDemo ? 'Eventos Enviados' : 'Eventos na Fila'}
                  </p>
                  <p className="text-[22px] font-bold" style={{ color: 'var(--text-1)' }}>{totalEvents.toLocaleString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-[10.5px] uppercase tracking-wide mb-1" style={{ color: 'var(--text-3)' }}>
                    {usarDemo ? 'Match Rate' : 'Match Quality Estimado'}
                  </p>
                  <p className="text-[22px] font-bold" style={{ color }}>{matchRate}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabela */}
        <div className="rounded-[12px] overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <h3 className="text-[14px] font-semibold text-[--text-1]">
              {usarDemo ? 'Log de Conversões' : 'Fila de Conversões'}
            </h3>
            <p className="text-[11.5px] text-[--text-3] mt-[2px]">
              {usarDemo
                ? 'Últimas 24h — eventos enviados para as plataformas'
                : 'Payloads montados automaticamente a cada lead/checkout/compra recebido'}
            </p>
          </div>

          {usarDemo ? (
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ background: 'rgba(0,0,0,.15)' }}>
                  {['Plataforma', 'Evento', 'Quantidade', 'Taxa de Match', 'Último Envio', 'Status'].map((h) => (
                    <th key={h} className={thBase} style={{ borderBottom: '1px solid var(--border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CONV_DEMO.map((row, i) => (
                  <tr key={i} style={{ borderBottom: i < CONV_DEMO.length - 1 ? '1px solid var(--border-sub)' : 'none' }}>
                    <td className="px-5 py-[12px] text-[13px] font-[500]" style={{ color: 'var(--text-1)' }}>{row.plataforma}</td>
                    <td className="px-5 py-[12px] text-[12.5px]" style={{ color: 'var(--text-2)' }}>{row.evento}</td>
                    <td className="px-5 py-[12px] text-[13px] font-semibold" style={{ color: 'var(--text-1)' }}>{row.quantidade.toLocaleString('pt-BR')}</td>
                    <td className="px-5 py-[12px] text-[13px] font-semibold" style={{ color: parseFloat(row.taxa) > 90 ? '#10B981' : '#F59E0B' }}>{row.taxa}</td>
                    <td className="px-5 py-[12px] text-[12px]" style={{ color: 'var(--text-3)', fontFamily: 'monospace' }}>{row.ultimo}</td>
                    <td className="px-5 py-[12px]">
                      <StatusDot color={row.status === 'ok' ? '#10B981' : '#F59E0B'} label={row.status === 'ok' ? 'Saudável' : 'Atenção'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ background: 'rgba(0,0,0,.15)' }}>
                  {['Plataforma', 'Evento', 'Match Quality', 'Quando', 'Status'].map((h) => (
                    <th key={h} className={thBase} style={{ borderBottom: '1px solid var(--border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {conversoes.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-[12.5px]" style={{ color: 'var(--text-3)' }}>
                      Nenhuma conversão enfileirada ainda
                    </td>
                  </tr>
                )}
                {conversoes.slice(0, 50).map((c, i) => {
                  const cfg = STATUS_CFG[c.status]
                  return (
                    <tr key={c.id} style={{ borderBottom: i < Math.min(conversoes.length, 50) - 1 ? '1px solid var(--border-sub)' : 'none' }}>
                      <td className="px-5 py-[12px] text-[13px] font-[500]" style={{ color: 'var(--text-1)' }}>
                        {c.plataforma === 'meta-capi' ? 'Meta CAPI' : 'Google Enhanced'}
                      </td>
                      <td className="px-5 py-[12px] text-[12.5px]" style={{ color: 'var(--text-2)' }}>
                        {EVENTO_LABEL[c.evento] ?? c.evento}
                      </td>
                      <td className="px-5 py-[12px]">
                        <span className="text-[13px] font-semibold" style={{ color: c.matchQuality >= 7 ? '#10B981' : c.matchQuality >= 4 ? '#F59E0B' : '#EF4444' }}>
                          {c.matchQuality}/10
                        </span>
                      </td>
                      <td className="px-5 py-[12px] text-[12px]" style={{ color: 'var(--text-3)', fontFamily: 'monospace' }}>
                        {new Date(c.ts).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-5 py-[12px]"><StatusDot color={cfg.color} label={cfg.label} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </>
  )
}
