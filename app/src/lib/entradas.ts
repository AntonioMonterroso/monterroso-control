import type { Anticipo } from './anticipos'
import { conceptoDePago, type Cobro } from './cobros'
import type { Modelo } from './modelo'
import type { PagoTienda } from './tiendaPagos'
import type { Pago } from './tipos'

export type TipoEntrada = 'pago' | 'anticipo' | 'tienda'

export interface EntradaDinero {
  id: string
  tipo: TipoEntrada
  fecha: string
  monto: number
  cliente_id: string | null
  proyecto_id: string | null
  negocio_id: string | null
  forma: string | null
  destino: string | null
  referencia: string | null
  recibo: number | null
  comprobantes: string[]
  concepto: string
  registrado_por: string | null
  creado: string
  pago?: Pago
  anticipo?: Anticipo
  tienda?: PagoTienda
}

const FORMA_TIENDA: Record<string, string> = { transferencia: 'transferencia', contra_entrega: 'efectivo', shopify: 'tarjeta', dropi: 'otro', otro: 'otro' }

export function entradasDe(m: Modelo, cobros: Cobro[]): EntradaDinero[] {
  const negocioCliente = (id: string | null) => m.clientes.find((c) => c.id === id)?.negocio_id ?? null
  const salario = m.negocios.find((n) => n.clave === 'salario')?.id ?? null
  const canela = m.negocios.find((n) => n.clave === 'canela')?.id ?? null
  const pagos: EntradaDinero[] = m.pagos.map((p) => ({
    id: p.id, tipo: 'pago', fecha: p.fecha, monto: p.monto, cliente_id: p.cliente_id, proyecto_id: p.proyecto_id ?? cobros.find((c) => c.clave === p.cobro_clave)?.proyecto_id ?? null,
    negocio_id: p.cobro_clave.startsWith('s:') ? salario : negocioCliente(p.cliente_id), forma: p.forma, destino: p.destino, referencia: p.referencia, recibo: p.recibo_numero,
    comprobantes: p.comprobantes, concepto: conceptoDePago(p.cobro_clave, cobros), registrado_por: p.registrado_por, creado: p.creado, pago: p,
  }))
  const anticipos: EntradaDinero[] = m.anticipos.map((a) => ({
    id: `a:${a.id}`, tipo: 'anticipo', fecha: a.fecha, monto: a.monto, cliente_id: a.cliente_id, proyecto_id: a.proyecto_id, negocio_id: negocioCliente(a.cliente_id), forma: a.forma, destino: a.destino,
    referencia: a.referencia, recibo: null, comprobantes: a.comprobantes, concepto: 'Anticipo', registrado_por: a.registrado_por, creado: a.creado, anticipo: a,
  }))
  const tienda: EntradaDinero[] = m.pagosTienda.map((t) => ({
    id: `t:${t.id}`, tipo: 'tienda', fecha: t.fecha, monto: t.monto, cliente_id: null, proyecto_id: null, negocio_id: canela, forma: FORMA_TIENDA[t.medio] ?? 'otro', destino: t.destino ?? null,
    referencia: t.referencia, recibo: null, comprobantes: Array.isArray(t.comprobantes) ? t.comprobantes : [], concepto: 'Pago de la tienda', registrado_por: null, creado: t.creado ?? t.fecha, tienda: t,
  }))
  return [...pagos, ...anticipos, ...tienda].sort((a, b) => b.fecha.localeCompare(a.fecha) || b.creado.localeCompare(a.creado))
}

export function entraDinero(e: EntradaDinero): boolean {
  return e.forma !== 'anticipo'
}

export interface PagoLigero { id: string; fecha: string; monto: number; proyecto_id: string | null; cobro_clave: string; forma: string | null }

export function posiblesRepetidos(pagos: PagoLigero[]): Map<string, string[]> {
  const grupos = new Map<string, string[]>()
  const meter = (k: string, id: string) => grupos.set(k, [...(grupos.get(k) ?? []), id])
  for (const p of pagos) {
    if (p.forma === 'anticipo') continue
    const c = Math.round(p.monto * 100)
    if (p.proyecto_id) meter(`f:${p.proyecto_id}:${c}:${p.fecha}`, p.id)
    if (p.cobro_clave.startsWith('i:')) meter(`i:${p.cobro_clave}:${c}`, p.id)
  }
  const r = new Map<string, string[]>()
  for (const ids of grupos.values()) {
    if (ids.length < 2) continue
    for (const id of ids) r.set(id, [...new Set([...(r.get(id) ?? []), ...ids.filter((x) => x !== id)])])
  }
  return r
}

export function sugerirClave(nota: string | null, opciones: { clave: string; tipo: string; vence: string | null }[]): string | null {
  const n = (nota ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  if (!n) return null
  if (/inscrip|instalac|anticipo de inicio|enganche/.test(n)) return opciones.find((o) => o.clave.startsWith('i:'))?.clave ?? null
  if (/mensualidad|mes de|mensual/.test(n)) {
    const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
    const i = MESES.findIndex((x) => n.includes(x))
    const mens = opciones.filter((o) => o.clave.startsWith('m:'))
    if (i >= 0) return mens.find((o) => o.clave.endsWith(`-${String(i + 1).padStart(2, '0')}`))?.clave ?? null
    return mens[0]?.clave ?? null
  }
  return null
}
