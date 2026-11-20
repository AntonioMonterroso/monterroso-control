import { useMemo, useState } from 'react'
import { generarCobros, type Cobro } from './cobros'
import { rangoMes } from './finanzas'
import { hoyISO } from './fechas'
import { useModelo } from './modelo'
import { avisosDev } from './desarrollo'
import { avisosSA } from './sa'

export function useHoy(): string {
  return hoyISO()
}

export function usePeriodo(): [string, (p: string) => void] {
  const [p, setP] = useState(() => {
    try { return sessionStorage.getItem('mc_periodo') ?? hoyISO().slice(0, 7) } catch { return hoyISO().slice(0, 7) }
  })
  return [p, (x: string) => { setP(x); try { sessionStorage.setItem('mc_periodo', x) } catch { return } }]
}

export function useCobros(hastaPeriodo?: string): Cobro[] {
  const m = useModelo()
  const hoy = useHoy()
  const hasta = rangoMes(hastaPeriodo && hastaPeriodo > hoy.slice(0, 7) ? hastaPeriodo : hoy.slice(0, 7))[1]
  return useMemo(() => generarCobros(m.proyectos, m.cobros, m.pagos, hasta, hoy, m.aumentos), [m.proyectos, m.cobros, m.pagos, hasta, hoy, m.aumentos])
}

export function useAvisosDev() {
  const m = useModelo()
  const hoy = useHoy()
  return useMemo(() => [...avisosDev({ supabase: m.devSupabase, tokens: m.devTokens, servicios: m.devServicios, enlaces: m.devEnlaces }, hoy), ...avisosSA(m.recordatorios, m.sociedad, hoy)].sort((a, b) => (a.nivel === b.nivel ? a.dias - b.dias : a.nivel === 'peligro' ? -1 : 1)), [m.devSupabase, m.devTokens, m.devServicios, m.devEnlaces, m.recordatorios, m.sociedad, hoy])
}
