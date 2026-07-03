// ─── INTERFACE DE ARMAZENAMENTO DA INGESTÃO ──────────────────────────────────
// Abstrai o Firestore (client SDK vs firebase-admin) por trás de um contrato
// comum, pra resolverIdentidade/ingerirEvento funcionarem tanto no /api/track
// (SDK client, sem sessão de usuário) quanto em webhooks server-to-server
// (firebase-admin, ex. Shopify) sem duplicar lógica.

import type { Identidade, Evento, Conversao } from '@/lib/types'

export interface IdentityStore {
  buscarPor(campo: string, valor: string | undefined): Promise<Identidade | null>
  salvar(id: string, payload: Record<string, unknown>): Promise<void>
  apagar(id: string): Promise<void>
}

export interface IngestStore {
  identity: IdentityStore
  /** Grava o evento e retorna o id do doc criado. */
  gravarEvento(evento: Evento): Promise<string>
  /** Grava uma conversão enfileirada e retorna o id do doc criado. */
  gravarConversao(conversao: Omit<Conversao, 'id'>): Promise<string>
}
