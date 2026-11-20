import { aCentavos, deCentavos } from './dinero'

export interface Anticipo {
  id: string
  fecha: string
  cliente_id: string
  proyecto_id: string | null
  monto: number
  forma: string
  destino: string | null
  referencia: string | null
  nota: string | null
  comprobantes: string[]
  aplicar_solo: boolean
  estado: 'activo' | 'devuelto' | 'a_favor'
  devuelto_el: string | null
  devuelto_monto: number | null
  registrado_por: string | null
  creado: string
}

export interface PagoConAnticipo { anticipo_id?: string | null; monto: number; cobro_clave: string; fecha: string }
export interface CobroPendiente { clave: string; cliente_id: string; proyecto_id: string | null; vence: string | null; saldo: number }
export interface Aplicacion { anticipo_id: string; cobro_clave: string; monto: number }

export function usadoDe(a: Anticipo, pagos: PagoConAnticipo[]): number {
  return deCentavos(pagos.filter((p) => p.anticipo_id === a.id).reduce((s, p) => s + aCentavos(p.monto), 0))
}

export function saldoAnticipo(a: Anticipo, pagos: PagoConAnticipo[]): number {
  if (a.estado === 'devuelto') return 0
  return deCentavos(Math.max(0, aCentavos(a.monto) - aCentavos(usadoDe(a, pagos)) - aCentavos(a.devuelto_monto ?? 0)))
}

export function saldoAFavor(cliente: string, anticipos: Anticipo[], pagos: PagoConAnticipo[], proyecto?: string | null): number {
  return deCentavos(anticipos.filter((a) => a.cliente_id === cliente && (proyecto === undefined || !a.proyecto_id || a.proyecto_id === proyecto)).reduce((s, a) => s + aCentavos(saldoAnticipo(a, pagos)), 0))
}

export function planAplicar(anticipos: Anticipo[], pagos: PagoConAnticipo[], cobros: CobroPendiente[], tope?: number): Aplicacion[] {
  const saldos = new Map(anticipos.filter((a) => a.estado !== 'devuelto').sort((x, y) => x.fecha.localeCompare(y.fecha) || x.creado.localeCompare(y.creado)).map((a) => [a.id, { a, c: aCentavos(saldoAnticipo(a, pagos)) }]))
  let resto = tope == null ? Infinity : aCentavos(tope)
  const out: Aplicacion[] = []
  for (const cb of [...cobros].sort((x, y) => (x.vence ?? '9999').localeCompare(y.vence ?? '9999'))) {
    let falta = aCentavos(cb.saldo)
    for (const s of saldos.values()) {
      if (falta <= 0 || resto <= 0) break
      if (s.c <= 0 || s.a.cliente_id !== cb.cliente_id || (s.a.proyecto_id && s.a.proyecto_id !== cb.proyecto_id)) continue
      const usa = Math.min(s.c, falta, resto)
      s.c -= usa; falta -= usa; resto -= usa
      const prev = out.find((x) => x.anticipo_id === s.a.id && x.cobro_clave === cb.clave)
      if (prev) prev.monto = deCentavos(aCentavos(prev.monto) + usa)
      else out.push({ anticipo_id: s.a.id, cobro_clave: cb.clave, monto: deCentavos(usa) })
    }
  }
  return out
}

export function autoAplicables(hoy: string, anticipos: Anticipo[], pagos: PagoConAnticipo[], cobros: CobroPendiente[]): Aplicacion[] {
  const solos = anticipos.filter((a) => a.aplicar_solo && a.estado === 'activo')
  if (!solos.length) return []
  return planAplicar(solos, pagos, cobros.filter((c) => c.vence != null && c.vence <= hoy && c.saldo > 0))
}
