// ─── SQUADS ────────────────────────────────────────────────────────────────
// Times fixos da V4 Company — cada cliente (partner) pertence a um squad
// (Partner.squad, guarda o id abaixo). Dar acesso a um squad (Novo usuário)
// concede visão de TODOS os clientes daquele squad, inclusive os criados
// depois — ver squads/{squadId}/members/{email} e a checagem em
// lib/server/auth-helpers.ts + firestore.rules.

import { slugify } from '@/lib/utm/engine'

export const SQUAD_NOMES = ['Atena', 'Thunder', 'Falcon', 'Titãs', 'Guardians', 'Tropa de Elite'] as const

export interface Squad {
  id: string
  nome: string
}

export const SQUADS: Squad[] = SQUAD_NOMES.map((nome) => ({ id: slugify(nome), nome }))
