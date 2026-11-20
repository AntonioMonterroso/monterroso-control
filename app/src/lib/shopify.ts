import { leerCSV } from './csv'
import { aCentavos, deCentavos } from './dinero'
import type { Producto, VentaTienda } from './tipos'

export type PedidoImportado = Omit<VentaTienda, 'id'>

export interface Importacion {
  nuevos: PedidoImportado[]
  repetidos: string[]
  errores: string[]
}

const num = (s: string | undefined) => {
  const v = Number((s ?? '').replace(/[^\d.-]/g, ''))
  return Number.isFinite(v) ? v : 0
}

function fechaISO(s: string): string | null {
  const m = s.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${m[1]}-${m[2]}-${m[3]}`
  const d = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (d) return `${d[3]}-${d[2].padStart(2, '0')}-${d[1].padStart(2, '0')}`
  return null
}

export function importarShopify(texto: string, existentes: string[], productos: Producto[]): Importacion {
  const filas = leerCSV(texto)
  if (filas.length < 2) return { nuevos: [], repetidos: [], errores: ['El archivo está vacío.'] }
  const cab = filas[0].map((c) => c.trim().toLowerCase())
  const col = (n: string) => cab.indexOf(n)
  const iNombre = col('name'), iTotal = col('total'), iFecha = col('created at'), iCant = col('lineitem quantity'), iItem = col('lineitem name'), iSku = col('lineitem sku'), iEnvio = col('shipping'), iCliente = col('billing name'), iCancel = col('cancelled at'), iFin = col('financial status')
  if (iNombre < 0 || iTotal < 0 || iFecha < 0) return { nuevos: [], repetidos: [], errores: ['No parece una exportación de pedidos de Shopify: faltan las columnas Name, Total o Created at.'] }
  const ya = new Set(existentes.map((x) => x.trim().toLowerCase()))
  const grupos = new Map<string, string[][]>()
  for (const f of filas.slice(1)) {
    const k = (f[iNombre] ?? '').trim()
    if (!k) continue
    grupos.set(k, [...(grupos.get(k) ?? []), f])
  }
  const nuevos: PedidoImportado[] = []
  const repetidos: string[] = []
  const errores: string[] = []
  for (const [pedido, lineas] of grupos) {
    if (ya.has(pedido.toLowerCase())) { repetidos.push(pedido); continue }
    const p = lineas[0]
    const fecha = fechaISO(p[iFecha] ?? '')
    if (!fecha) { errores.push(`${pedido}: no se entendió la fecha.`); continue }
    let costo = 0
    let cantidad = 0
    const nombres: string[] = []
    for (const l of lineas) {
      const c = Math.max(1, num(l[iCant]))
      cantidad += c
      const item = (l[iItem] ?? '').trim()
      if (item) nombres.push(c > 1 ? `${item} ×${c}` : item)
      const sku = iSku >= 0 ? (l[iSku] ?? '').trim().toLowerCase() : ''
      const prod = productos.find((x) => (sku && x.sku?.toLowerCase() === sku) || x.nombre.trim().toLowerCase() === item.toLowerCase())
      if (prod) costo += aCentavos(prod.costo) * c
    }
    const cancelado = (iCancel >= 0 && (p[iCancel] ?? '').trim() !== '') || /refunded|voided/i.test(iFin >= 0 ? p[iFin] ?? '' : '')
    nuevos.push({
      pedido, fecha, cliente_nombre: iCliente >= 0 ? (p[iCliente] ?? '').trim() || null : null, descripcion: nombres.join(', ') || 'Pedido de Shopify',
      cantidad, precio_venta: num(p[iTotal]), costo_producto: deCentavos(costo), envio: iEnvio >= 0 ? num(p[iEnvio]) : 0, comision: 0, otros: 0,
      estado: cancelado ? 'devuelto' : 'entregado', origen: 'csv',
    })
  }
  return { nuevos, repetidos, errores }
}

export function utilidadVenta(v: Pick<VentaTienda, 'precio_venta' | 'costo_producto' | 'envio' | 'comision' | 'otros' | 'estado'>): number {
  if (v.estado === 'devuelto') return 0
  return deCentavos(aCentavos(v.precio_venta) - aCentavos(v.costo_producto) - aCentavos(v.envio) - aCentavos(v.comision) - aCentavos(v.otros))
}

export function margen(precio: number, costo: number): number {
  if (precio <= 0) return 0
  return Math.round(((precio - costo) / precio) * 1000) / 10
}
