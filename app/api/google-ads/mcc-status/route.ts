import { NextResponse } from 'next/server'
import { mccConfigurada, MCC_LABELS } from '@/lib/integrations/google-mcc'

// Só informa se as credenciais compartilhadas de cada MCC estão configuradas
// no servidor — nunca retorna os valores. O front usa isso pra montar o
// seletor de MCC nos cards "Google Ads (Métricas)" e "Google Ads" (Enhanced).
export async function GET() {
  return NextResponse.json({
    configurado: mccConfigurada('1') || mccConfigurada('2'),
    mccs: [
      { id: '1', label: MCC_LABELS['1'], configurado: mccConfigurada('1') },
      { id: '2', label: MCC_LABELS['2'], configurado: mccConfigurada('2') },
    ],
  })
}
