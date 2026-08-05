'use client'

import { useMemo, useState } from 'react'
import type { ClienteTipo } from '@/lib/demo-data'
import type { PlanoMidiaItem, PlanoMidiaVeiculo } from '@/lib/types'
import {
  usePlanoMidia, usePlanoMidiaConfig, salvarPlanoMidiaItem, excluirPlanoMidiaItem, salvarPlanoMidiaConfigMes,
} from '@/lib/data/colecoes'
import { funilDoTipo } from './growthPackColunas'
import { calcularLinhaPlanoMidia, somarOrcamentoPosImposto } from '@/lib/data/plano-midia-calc'
import { colunasPlanoMidia, rotulosFunilPlanoMidia, formatarValorPlanoMidia } from './planoMidiaColunas'

const FATOR_PADRAO = 0.8718
const FUNIL_PRESETS = ['Aquisição (Topo)', 'Ativação (Meio)', 'Remarketing (Fundo)', 'Receita (Fundo)']

const ITEM_VAZIO: Omit<PlanoMidiaItem, 'mes'> = {
  dataInicio: '', dataFim: '', veiculo: 'meta', campanha: '', objetivo: '', kpiPrimario: '',
  funil: FUNIL_PRESETS[0], orcamento: 0, frequencia: 1.5, cpm: 0, ctr: 0.03, connectRate: 0.7,
  taxaEstagio1: 0.05, taxaEstagio2: 0.3, taxaEstagio3: 0.4, faturamentoProjetado: 0,
}

interface Props {
  clienteId: string
  clienteTipo?: ClienteTipo
  isDemo: boolean
}

function labelMes(mes: string) {
  const [ano, m] = mes.split('-')
  const nomes = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
  return `${nomes[Number(m) - 1]} de ${ano}`
}

// Precisa ficar FORA de ItemFormModal: um componente definido dentro do
// corpo de outro componente é recriado (nova identidade) a cada re-render —
// como o formulário re-renderiza a cada tecla digitada, isso desmontava e
// remontava o <input>, tirando o foco a cada letra.
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: 10.5, color: 'var(--t2)', display: 'block', marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  )
}

function ItemFormModal({
  clienteId, itemAtual, funil, onClose,
}: {
  clienteId: string
  itemAtual: (PlanoMidiaItem & { id?: string }) | null
  funil: ReturnType<typeof funilDoTipo>
  onClose: () => void
}) {
  const rotulos = rotulosFunilPlanoMidia(funil)
  const [form, setForm] = useState<Omit<PlanoMidiaItem, 'mes'> & { id?: string }>(
    itemAtual ?? (funil === 'leadsFunil' ? { ...ITEM_VAZIO, taxaEstagio4: 0.1 } : ITEM_VAZIO),
  )
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }))
  type CampoNumerico = 'ctr' | 'connectRate' | 'taxaEstagio1' | 'taxaEstagio2' | 'taxaEstagio3' | 'taxaEstagio4'
  const setPct = (key: CampoNumerico) => (e: React.ChangeEvent<HTMLInputElement>) => set(key, Number(e.target.value) / 100)

  const handleSalvar = async () => {
    if (!form.dataInicio) return
    setSalvando(true)
    setErro(null)
    try {
      const mes = form.dataInicio.slice(0, 7)
      await salvarPlanoMidiaItem(clienteId, { ...form, mes, id: form.id })
      onClose()
    } catch (e) {
      console.error('[PlanoMidia] falha ao salvar inserção:', e)
      setErro(e instanceof Error ? e.message : 'falha ao salvar — tente de novo')
    } finally {
      setSalvando(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px', borderRadius: 7, fontSize: 12.5,
    background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--t1)', outline: 'none',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 300,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 640, maxHeight: '88vh', overflowY: 'auto', borderRadius: 14,
          background: 'var(--bg-c)', border: '1px solid var(--br)', padding: 22,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>
            {itemAtual ? 'Editar inserção' : 'Nova inserção'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--t3)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
          <Field label="Data início"><input type="date" className="pm-date-vermelho" value={form.dataInicio} onChange={(e) => set('dataInicio', e.target.value)} style={inputStyle} /></Field>
          <Field label="Data fim"><input type="date" className="pm-date-vermelho" value={form.dataFim} onChange={(e) => set('dataFim', e.target.value)} style={inputStyle} /></Field>
          <style>{`
            .pm-date-vermelho::-webkit-calendar-picker-indicator {
              filter: invert(13%) sepia(94%) saturate(7151%) hue-rotate(356deg) brightness(90%) contrast(119%);
              cursor: pointer;
            }
          `}</style>
          <Field label="Veículo">
            <select value={form.veiculo} onChange={(e) => set('veiculo', e.target.value as PlanoMidiaVeiculo)} style={inputStyle}>
              <option value="meta">Meta Ads</option>
              <option value="google">Google Ads</option>
            </select>
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          <Field label="Campanha"><input value={form.campanha} onChange={(e) => set('campanha', e.target.value)} style={inputStyle} /></Field>
          <Field label="Objetivo de campanha"><input value={form.objetivo} onChange={(e) => set('objetivo', e.target.value)} style={inputStyle} /></Field>
          <Field label="KPI Primário"><input value={form.kpiPrimario} onChange={(e) => set('kpiPrimario', e.target.value)} placeholder="Ex: ROAS Desejado" style={inputStyle} /></Field>
          <Field label="Funil">
            <select value={form.funil} onChange={(e) => set('funil', e.target.value)} style={inputStyle}>
              {FUNIL_PRESETS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </Field>
        </div>

        <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--t3)', margin: '4px 0 8px' }}>
          Orçamento e premissas de mídia
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
          <Field label="Orçamento (R$)"><input type="number" value={form.orcamento} onChange={(e) => set('orcamento', Number(e.target.value))} style={inputStyle} /></Field>
          <Field label="CPM (R$)"><input type="number" step="0.01" value={form.cpm} onChange={(e) => set('cpm', Number(e.target.value))} style={inputStyle} /></Field>
          <Field label="Frequência"><input type="number" step="0.1" value={form.frequencia} onChange={(e) => set('frequencia', Number(e.target.value))} style={inputStyle} /></Field>
          <Field label="CTR (%)"><input type="number" step="0.01" value={(form.ctr * 100).toFixed(2)} onChange={setPct('ctr')} style={inputStyle} /></Field>
          <Field label="Connect Rate (%)"><input type="number" step="1" value={(form.connectRate * 100).toFixed(0)} onChange={setPct('connectRate')} style={inputStyle} /></Field>
        </div>

        <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--t3)', margin: '4px 0 8px' }}>
          Funil (taxas de conversão entre estágios)
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
          <Field label={`Taxa Conv. ${rotulos.estagio1} (%)`}><input type="number" step="0.1" value={(form.taxaEstagio1 * 100).toFixed(1)} onChange={setPct('taxaEstagio1')} style={inputStyle} /></Field>
          <Field label={`Taxa Conv. ${rotulos.estagio2} (%)`}><input type="number" step="0.1" value={(form.taxaEstagio2 * 100).toFixed(1)} onChange={setPct('taxaEstagio2')} style={inputStyle} /></Field>
          <Field label={`Taxa Conv. ${rotulos.estagio3} (%)`}><input type="number" step="0.1" value={(form.taxaEstagio3 * 100).toFixed(1)} onChange={setPct('taxaEstagio3')} style={inputStyle} /></Field>
          {rotulos.estagio4 && (
            <Field label={`Taxa Conv. ${rotulos.estagio4} (%)`}>
              <input type="number" step="0.1" value={((form.taxaEstagio4 ?? 0) * 100).toFixed(1)} onChange={setPct('taxaEstagio4')} style={inputStyle} />
            </Field>
          )}
        </div>

        <Field label="Projeção de Faturamento (R$) — digitado, sem fórmula confiável">
          <input type="number" value={form.faturamentoProjetado} onChange={(e) => set('faturamentoProjetado', Number(e.target.value))} style={{ ...inputStyle, marginBottom: 18 }} />
        </Field>

        {erro && (
          <div style={{ padding: '10px 12px', borderRadius: 8, marginBottom: 12, background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.3)', fontSize: 12, color: '#EF4444' }}>
            {erro}
          </div>
        )}

        <button
          onClick={handleSalvar}
          disabled={salvando || !form.dataInicio || !form.dataFim}
          style={{
            width: '100%', padding: '10px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: 'var(--red)', border: 'none', color: '#fff',
            cursor: salvando ? 'default' : 'pointer', opacity: salvando ? 0.6 : 1,
          }}
        >
          {salvando ? 'Salvando…' : 'Salvar inserção'}
        </button>
      </div>
    </div>
  )
}

function ConfigMesModal({
  clienteId, mes, configAtual, onClose,
}: {
  clienteId: string
  mes: string
  configAtual: { orcamentoTotal: number; ticketMedio: number; fatorPosImposto: number }
  onClose: () => void
}) {
  const [orcamentoTotal, setOrcamentoTotal] = useState(String(configAtual.orcamentoTotal || ''))
  const [ticketMedio, setTicketMedio] = useState(String(configAtual.ticketMedio || ''))
  const [fatorPct, setFatorPct] = useState(((configAtual.fatorPosImposto || FATOR_PADRAO) * 100).toFixed(2))
  const [salvando, setSalvando] = useState(false)

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px', borderRadius: 7, fontSize: 12.5,
    background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--t1)', outline: 'none',
  }

  const handleSalvar = async () => {
    setSalvando(true)
    try {
      await salvarPlanoMidiaConfigMes(clienteId, mes, {
        orcamentoTotal: Number(orcamentoTotal) || 0,
        ticketMedio: Number(ticketMedio) || 0,
        fatorPosImposto: (Number(fatorPct) || FATOR_PADRAO * 100) / 100,
      })
      onClose()
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 300,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 380, borderRadius: 14, background: 'var(--bg-c)', border: '1px solid var(--br)', padding: 22 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)', margin: '0 0 16px' }}>Config de {labelMes(mes)}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 18 }}>
          <div>
            <label style={{ fontSize: 10.5, color: 'var(--t2)', display: 'block', marginBottom: 4 }}>Orçamento total do mês (R$)</label>
            <input type="number" value={orcamentoTotal} onChange={(e) => setOrcamentoTotal(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 10.5, color: 'var(--t2)', display: 'block', marginBottom: 4 }}>Ticket médio (R$)</label>
            <input type="number" value={ticketMedio} onChange={(e) => setTicketMedio(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 10.5, color: 'var(--t2)', display: 'block', marginBottom: 4 }}>Fator pós imposto (%) — quanto sobra do orçamento após dedução</label>
            <input type="number" step="0.01" value={fatorPct} onChange={(e) => setFatorPct(e.target.value)} style={inputStyle} />
          </div>
        </div>
        <button onClick={handleSalvar} disabled={salvando} style={{ width: '100%', padding: '10px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: 'var(--red)', border: 'none', color: '#fff', cursor: 'pointer', opacity: salvando ? 0.6 : 1 }}>
          {salvando ? 'Salvando…' : 'Salvar config'}
        </button>
      </div>
    </div>
  )
}

export default function PlanoMidia({ clienteId, clienteTipo, isDemo }: Props) {
  const { itens } = usePlanoMidia(isDemo ? undefined : clienteId)
  const { config } = usePlanoMidiaConfig(isDemo ? undefined : clienteId)
  const [mesAberto, setMesAberto] = useState<string | null>(null)
  const [itemEditando, setItemEditando] = useState<(PlanoMidiaItem & { id?: string }) | null | 'novo'>(null)
  const [configEditando, setConfigEditando] = useState<string | null>(null)

  const funil = funilDoTipo(clienteTipo ?? 'ecommerce')
  const colunas = colunasPlanoMidia(funil)
  const configPorMes = useMemo(() => new Map(config.map((c) => [c.mes, c])), [config])

  const porMes = useMemo(() => {
    const grupos = new Map<string, PlanoMidiaItem[]>()
    for (const item of itens) {
      const lista = grupos.get(item.mes) ?? []
      lista.push(item)
      grupos.set(item.mes, lista)
    }
    return [...grupos.entries()].sort((a, b) => b[0].localeCompare(a[0]))
  }, [itens])

  const thStyle: React.CSSProperties = {
    padding: '8px 12px', textAlign: 'right', fontSize: '9px', fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--t3)',
    borderBottom: '1px solid var(--br)', whiteSpace: 'nowrap',
  }
  const tdStyle: React.CSSProperties = {
    padding: '9px 12px', textAlign: 'right', fontSize: 12, color: 'var(--t2)',
    borderBottom: '1px solid var(--br)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {isDemo && (
        <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(139,92,246,.07)', border: '1px solid rgba(139,92,246,.25)', fontSize: 12.5, color: 'var(--t2)' }}>
          Cliente demo — Plano de Mídia disponível só pra clientes reais.
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        {!isDemo && (
          <button
            onClick={() => setItemEditando('novo')}
            style={{ padding: '8px 16px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, background: 'var(--red)', border: 'none', color: '#fff', cursor: 'pointer' }}
          >
            + Nova inserção
          </button>
        )}
      </div>

      {porMes.length === 0 && !isDemo && (
        <div style={{ padding: '48px 24px', textAlign: 'center', borderRadius: 14, background: 'var(--bg-c)', border: '1px solid var(--br)', color: 'var(--t3)', fontSize: 12.5 }}>
          Nenhuma inserção cadastrada ainda. Clique em &ldquo;+ Nova inserção&rdquo; pra começar o planejamento do mês.
        </div>
      )}

      {porMes.map(([mes, itensDoMes]) => {
        const cfg = configPorMes.get(mes)
        const fatorPosImposto = cfg?.fatorPosImposto || FATOR_PADRAO
        const orcamentoTotalPosImposto = cfg?.orcamentoTotal
          ? cfg.orcamentoTotal * fatorPosImposto
          : somarOrcamentoPosImposto(itensDoMes, fatorPosImposto)
        const linhas = itensDoMes.map((item) => calcularLinhaPlanoMidia(item, fatorPosImposto, orcamentoTotalPosImposto))
        const totalOrcamento = linhas.reduce((s, l) => s + l.orcamento, 0)
        const totalFaturamento = linhas.reduce((s, l) => s + l.faturamentoProjetado, 0)
        const aberto = mesAberto === mes

        return (
          <div key={mes} style={{ background: 'var(--bg-c)', border: '1px solid var(--br)', borderRadius: 12, overflow: 'hidden' }}>
            <button
              onClick={() => setMesAberto(aberto ? null : mes)}
              style={{
                width: '100%', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={13} height={13}
                  style={{ color: 'var(--t3)', transform: aberto ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }}>
                  <polyline points="9 18 15 12 9 6" />
                </svg>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>{labelMes(mes)}</span>
                <span style={{ fontSize: 11, color: 'var(--t3)' }}>· {itensDoMes.length} inserç{itensDoMes.length === 1 ? 'ão' : 'ões'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ fontSize: 12, color: 'var(--t2)' }}>
                  Orçamento: <strong style={{ color: 'var(--t1)' }}>{formatarValorPlanoMidia(totalOrcamento, 'moeda')}</strong>
                </span>
                <span style={{ fontSize: 12, color: 'var(--t2)' }}>
                  Proj. faturamento: <strong style={{ color: '#10B981' }}>{formatarValorPlanoMidia(totalFaturamento, 'moeda')}</strong>
                </span>
                <span
                  role="button"
                  onClick={(e) => { e.stopPropagation(); setConfigEditando(mes) }}
                  title="Configurar orçamento total / ticket médio / fator pós imposto"
                  style={{ color: 'var(--t3)', cursor: 'pointer', fontSize: 13 }}
                >
                  ⚙
                </span>
              </div>
            </button>

            {aberto && (
              <div style={{ overflowX: 'auto', borderTop: '1px solid var(--br)' }}>
                <table style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ ...thStyle, textAlign: 'left' }}>Campanha</th>
                      {colunas.map((c) => <th key={c.key} style={thStyle}>{c.label}</th>)}
                      <th style={thStyle}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {linhas.map((linha, i) => (
                      <tr key={itensDoMes[i].id}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-s)' }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                      >
                        <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 600, color: 'var(--t1)' }}>
                          {linha.campanha || '—'}
                          <div style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 400 }}>{linha.veiculo === 'meta' ? 'Meta Ads' : 'Google Ads'}</div>
                        </td>
                        {colunas.map((c) => (
                          <td key={c.key} style={{ ...tdStyle, color: c.fonte === 'calculado' ? 'var(--t1)' : 'var(--t2)', fontWeight: c.fonte === 'calculado' ? 600 : 400 }}>
                            {formatarValorPlanoMidia((linha as unknown as Record<string, number | string>)[c.key], c.formato)}
                          </td>
                        ))}
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                            <button onClick={() => setItemEditando(itensDoMes[i] as PlanoMidiaItem & { id?: string })} title="Editar" style={{ background: 'none', border: 'none', color: 'var(--t3)', cursor: 'pointer', fontSize: 13 }}>✎</button>
                            <button
                              onClick={() => { if (itensDoMes[i].id && confirm('Remover essa inserção?')) excluirPlanoMidiaItem(clienteId, itensDoMes[i].id as string) }}
                              title="Remover" style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: 13 }}
                            >×</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      })}

      {itemEditando && (
        <ItemFormModal
          clienteId={clienteId}
          itemAtual={itemEditando === 'novo' ? null : itemEditando}
          funil={funil}
          onClose={() => setItemEditando(null)}
        />
      )}

      {configEditando && (
        <ConfigMesModal
          clienteId={clienteId}
          mes={configEditando}
          configAtual={{
            orcamentoTotal: configPorMes.get(configEditando)?.orcamentoTotal ?? 0,
            ticketMedio: configPorMes.get(configEditando)?.ticketMedio ?? 0,
            fatorPosImposto: configPorMes.get(configEditando)?.fatorPosImposto ?? FATOR_PADRAO,
          }}
          onClose={() => setConfigEditando(null)}
        />
      )}
    </div>
  )
}
