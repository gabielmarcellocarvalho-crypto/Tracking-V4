import { NextResponse } from 'next/server'

// Só informa se as credenciais compartilhadas da MCC estão configuradas no
// servidor — nunca retorna os valores (o front usa isso só pra decidir a
// mensagem exibida no card "Google Ads (Métricas)" da aba Conexões).
export async function GET() {
  const configurado = !!(
    process.env.GADS_MCC_ID &&
    process.env.GADS_DEVELOPER_TOKEN &&
    process.env.GADS_OAUTH_CLIENT_ID &&
    process.env.GADS_OAUTH_CLIENT_SECRET &&
    process.env.GADS_REFRESH_TOKEN
  )
  return NextResponse.json({ configurado })
}
