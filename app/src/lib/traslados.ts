import { aCentavos, deCentavos } from './dinero'
import { esDeAntonio } from './pagosDestino'

export interface Traslado { id: string; fecha: string; monto: number; de_destino: string; banco_id: string; pagos: string[]; nota: string | null; creado: string }

export interface Entrada { id: string; fecha: string; monto: number; destino: string | null; forma: string | null; negocio_id: string | null; texto: string }

export function enCuentaPersonalSA(e: Entrada, negociosSA: string[], inicio: string | null): boolean {
  if (!inicio || !e.negocio_id || !negociosSA.includes(e.negocio_id)) return false
  if (e.forma === 'anticipo') return false
  return esDeAntonio(e.destino) && e.fecha >= inicio
}

export function pendientesTrasladar(entradas: Entrada[], negociosSA: string[], inicio: string | null, traslados: Traslado[]): Entrada[] {
  const hechos = new Set(traslados.flatMap((t) => t.pagos))
  return entradas.filter((e) => enCuentaPersonalSA(e, negociosSA, inicio) && !hechos.has(e.id)).sort((a, b) => a.fecha.localeCompare(b.fecha))
}

export function totalPendiente(l: Entrada[]): number {
  return deCentavos(l.reduce((s, e) => s + aCentavos(e.monto), 0))
}

export function pendienteAl(entradas: Entrada[], negociosSA: string[], inicio: string | null, traslados: Traslado[], fecha: string): number {
  const hechos = new Set(traslados.filter((t) => t.fecha <= fecha).flatMap((t) => t.pagos))
  return totalPendiente(entradas.filter((e) => e.fecha <= fecha && enCuentaPersonalSA(e, negociosSA, inicio) && !hechos.has(e.id)))
}
