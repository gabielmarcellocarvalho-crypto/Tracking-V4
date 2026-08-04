import { NextResponse } from 'next/server'

// Só informa se o token compartilhado da BM está configurado no servidor —
// nunca retorna o valor em si (o front usa isso só pra decidir a mensagem
// exibida no card "Meta Ads (Métricas)" da aba Conexões).
export async function GET() {
  return NextResponse.json({ configurado: !!process.env.META_BM_SYSTEM_USER_TOKEN })
}
