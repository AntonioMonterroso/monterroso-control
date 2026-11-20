import { useMemo, useState } from 'react'
import { generarCobros, type Cobro } from './cobros'
import { rangoMes } from './finanzas'
import { hoyISO } from './fechas'
import { useModelo } from './modelo'
import { avisosDev } from './desarrollo'
import { avisosSA } from './sa'
import { entradasDe } from './entradas'
import { pendientesSA } from './saModelo'
import { totalPendiente } from './traslados'
import { quetzales } from './dinero'
import type { AvisoDev } from './desarrollo'
import { diasEntre } from './fechas'

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
  return useMemo(() => [...avisosDev({ supabase: m.devSupabase, tokens: m.devTokens, servicios: m.devServicios, enlaces: m.devEnlaces }, hoy), ...avisosSA(m.recordatorios, m.sociedad, hoy), ...avisosDinero(m, hoy)].sort((a, b) => (a.nivel === b.nivel ? a.dias - b.dias : a.nivel === 'peligro' ? -1 : 1)), [m, hoy])
}

function avisosDinero(m: ReturnType<typeof useModelo>, hoy: string): AvisoDev[] {
  const r: AvisoDev[] = []
  const p = pendientesSA(m)
  if (p.length) {
    const viejo = p[0].fecha
    const dias = diasEntre(viejo, hoy)
    r.push({ id: `tr:${p.length}:${totalPendiente(p)}`, clave: 'traslado', nivel: dias > 30 ? 'peligro' : 'aviso', tipo: 'traslado', titulo: `Cobrado en cuenta personal: ${quetzales(totalPendiente(p))} pendiente de pasar a la S.A.`, detalle: `${p.length} ${p.length === 1 ? 'pago' : 'pagos'}; el más viejo de hace ${dias} ${dias === 1 ? 'día' : 'días'}.`, dias: -dias, proyecto_id: null, registro_id: 'traslado' })
  }
  for (const l of m.links) {
    if (!l.aceptado_el) continue
    const d = diasEntre(l.aceptado_el.slice(0, 10), hoy)
    if (d > 14) continue
    r.push({ id: `ac:${l.id}`, clave: `ac:${l.id}`, nivel: 'aviso', tipo: 'aceptado', titulo: `${l.aceptado_por ?? 'El cliente'} aceptó «${l.titulo}»`, detalle: d === 0 ? 'Hoy.' : `Hace ${d} ${d === 1 ? 'día' : 'días'}.`, dias: -d, proyecto_id: null, registro_id: l.id })
  }
  return r
}

export function useEntradas() {
  const m = useModelo()
  const cobros = useCobros()
  return useMemo(() => entradasDe(m, cobros), [m, cobros])
}
