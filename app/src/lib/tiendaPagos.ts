import { aCentavos, deCentavos } from './dinero'
import type { VentaTienda } from './tipos'

export type MedioPago = 'shopify' | 'contra_entrega' | 'dropi' | 'transferencia' | 'otro'

export interface PagoTienda {
  id: string
  fecha: string
  medio: MedioPago
  monto: number
  referencia: string | null
  nota: string | null
  destino?: string | null
  comprobantes?: string[] | null
  creado?: string
}

export interface PartePagoTienda {
  id: string
  pago_id: string
  venta_id: string
  monto: number
}

export const MEDIOS: { valor: MedioPago; nombre: string }[] = [
  { valor: 'shopify', nombre: 'Shopify Payments' },
  { valor: 'contra_entrega', nombre: 'Contra entrega' },
  { valor: 'dropi', nombre: 'Liquidación de Dropi' },
  { valor: 'transferencia', nombre: 'Transferencia' },
  { valor: 'otro', nombre: 'Otro' },
]

export type EstadoCobroVenta = 'pagado' | 'parcial' | 'por_cobrar' | 'devuelto'

export interface CobroVenta {
  venta: VentaTienda
  cobrado: number
  saldo: number
  estado: EstadoCobroVenta
}

export function cobrosDeVentas(ventas: VentaTienda[], partes: PartePagoTienda[]): CobroVenta[] {
  const por = new Map<string, number>()
  for (const p of partes) por.set(p.venta_id, (por.get(p.venta_id) ?? 0) + aCentavos(p.monto))
  return ventas.map((v) => {
    const c = por.get(v.id) ?? 0
    const total = v.estado === 'devuelto' ? 0 : aCentavos(v.precio_venta)
    const saldo = Math.max(0, total - c)
    const estado: EstadoCobroVenta = v.estado === 'devuelto' ? 'devuelto' : saldo === 0 ? 'pagado' : c > 0 ? 'parcial' : 'por_cobrar'
    return { venta: v, cobrado: deCentavos(c), saldo: deCentavos(saldo), estado }
  })
}

export function porCobrarTienda(c: CobroVenta[]): number {
  return deCentavos(c.reduce((s, x) => s + aCentavos(x.saldo), 0))
}

export function repartirPago(monto: number, pendientes: { id: string; saldo: number }[]): { venta_id: string; monto: number }[] {
  let resto = aCentavos(monto)
  const r: { venta_id: string; monto: number }[] = []
  for (const p of pendientes) {
    if (resto <= 0) break
    const m = Math.min(resto, aCentavos(p.saldo))
    if (m > 0) { r.push({ venta_id: p.id, monto: deCentavos(m) }); resto -= m }
  }
  return r
}
