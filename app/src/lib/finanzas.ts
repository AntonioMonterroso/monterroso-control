import { tipoDeClave } from './cobros'
import { aCentavos, deCentavos } from './dinero'
import { aISO, diasDelMes, partes } from './fechas'
import type { Modelo } from './modelo'
import type { AumentoSalario, Deuda, Factura, GastoFijo, Gasto, ModoImpuesto, MovimientoDeuda, Regimen } from './tipos'

export interface Movimiento {
  fecha: string
  tipo: 'ingreso' | 'gasto'
  negocio_id: string
  categoria_id: string | null
  cliente_id: string | null
  monto: number
  descripcion: string
  origen: 'pago' | 'venta' | 'salario' | 'gasto' | 'costo_venta' | 'deuda'
}

export const periodoDe = (iso: string) => iso.slice(0, 7)

export function rangoMes(periodo: string): [string, string] {
  const [a, m] = partes(`${periodo}-01`)
  return [aISO(a, m, 1), aISO(a, m, diasDelMes(a, m))]
}

export function sumarMeses(periodo: string, n: number): string {
  const [a, m] = partes(`${periodo}-01`)
  const t = a * 12 + (m - 1) + n
  return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}`
}

export function mesesEntre(desde: string, hasta: string): string[] {
  const l: string[] = []
  for (let p = desde; p <= hasta && l.length < 600; p = sumarMeses(p, 1)) l.push(p)
  return l
}

export function aumentoVigente(aumentos: AumentoSalario[], periodo: string): AumentoSalario | null {
  let v: AumentoSalario | null = null
  for (const a of [...aumentos].sort((x, y) => x.desde.localeCompare(y.desde))) if (periodoDe(a.desde) <= periodo) v = a
  return v
}

export function netoSalario(a: AumentoSalario | null): number {
  return a ? deCentavos(aCentavos(a.bruto) - aCentavos(a.descuentos)) : 0
}

export function fechaPagoSalario(a: AumentoSalario, periodo: string): string {
  const [y, m] = partes(`${periodo}-01`)
  return aISO(y, m, Math.min(a.dia_pago, diasDelMes(y, m)))
}

export function saldoDeuda(d: Deuda, movs: MovimientoDeuda[]): number {
  const propios = movs.filter((x) => x.deuda_id === d.id)
  const cargos = propios.filter((x) => x.tipo === 'cargo').reduce((s, x) => s + aCentavos(x.monto), 0)
  const pagos = propios.filter((x) => x.tipo === 'pago').reduce((s, x) => s + aCentavos(x.monto), 0)
  const base = d.tipo === 'cuotas' ? aCentavos(d.total) : aCentavos(d.saldo_inicial)
  return deCentavos(base + cargos - pagos)
}

export function cuotasPagadas(d: Deuda, movs: MovimientoDeuda[]): number {
  if (d.tipo !== 'cuotas' || !d.cuota) return 0
  const pagado = movs.filter((x) => x.deuda_id === d.id && x.tipo === 'pago').reduce((s, x) => s + aCentavos(x.monto), 0)
  return Math.min(d.cuotas ?? 0, Math.floor(pagado / aCentavos(d.cuota)))
}

export function fijosPendientes(fijos: GastoFijo[], gastos: Gasto[], periodo: string): GastoFijo[] {
  const [desde, hasta] = rangoMes(periodo)
  return fijos.filter((f) => f.activo && f.inicio <= hasta && (!f.fin || f.fin >= desde) && !gastos.some((g) => g.gasto_fijo_id === f.id && g.periodo === periodo))
}

export function movimientos(m: Modelo, desde: string, hasta: string, _hoy?: string): Movimiento[] {
  const r: Movimiento[] = []
  const dentro = (f: string) => f >= desde && f <= hasta
  const negocio = (clave: string) => m.negocios.find((n) => n.clave === clave)?.id ?? ''
  const catClave = (clave: string) => m.categorias.find((c) => c.clave === clave)?.id ?? null
  const clienteNeg = new Map(m.clientes.map((c) => [c.id, c.negocio_id]))

  for (const p of m.pagos) {
    if (!dentro(p.fecha)) continue
    const sal = p.cobro_clave.startsWith('s:')
    r.push({ fecha: p.fecha, tipo: 'ingreso', negocio_id: sal ? negocio('salario') : (p.cliente_id && clienteNeg.get(p.cliente_id)) || negocio('dev'), categoria_id: catClave(tipoDeClave(p.cobro_clave)), cliente_id: p.cliente_id, monto: p.monto, descripcion: sal ? 'Salario recibido' : 'Pago de cliente', origen: sal ? 'salario' : 'pago' })
  }

  const canela = negocio('canela')
  for (const v of m.ventas) {
    if (!dentro(v.fecha) || v.estado === 'devuelto') continue
    r.push({ fecha: v.fecha, tipo: 'ingreso', negocio_id: canela, categoria_id: catClave('tienda'), cliente_id: null, monto: v.precio_venta, descripcion: `Pedido ${v.pedido}`, origen: 'venta' })
    const costo = deCentavos(aCentavos(v.costo_producto) + aCentavos(v.envio) + aCentavos(v.comision) + aCentavos(v.otros))
    if (costo > 0) r.push({ fecha: v.fecha, tipo: 'gasto', negocio_id: canela, categoria_id: catClave('costo_tienda'), cliente_id: null, monto: costo, descripcion: `Costo del pedido ${v.pedido}`, origen: 'costo_venta' })
  }

  for (const g of m.gastos) if (dentro(g.fecha)) r.push({ fecha: g.fecha, tipo: 'gasto', negocio_id: g.negocio_id, categoria_id: g.categoria_id, cliente_id: g.cliente_id, monto: g.monto, descripcion: g.descripcion, origen: 'gasto' })

  for (const x of m.movimientos) {
    if (x.tipo !== 'pago' || !dentro(x.fecha)) continue
    const d = m.deudas.find((y) => y.id === x.deuda_id)
    if (d) r.push({ fecha: x.fecha, tipo: 'gasto', negocio_id: d.negocio_id, categoria_id: d.categoria_id, cliente_id: null, monto: x.monto, descripcion: `Pago de ${d.nombre}`, origen: 'deuda' })
  }
  return r.sort((a, b) => a.fecha.localeCompare(b.fecha))
}

export function sumar(l: Movimiento[], f: (x: Movimiento) => boolean = () => true): number {
  return deCentavos(l.filter(f).reduce((s, x) => s + aCentavos(x.monto), 0))
}

export interface Resultado { ingresos: number; gastos: number; utilidad: number }

export function resultado(l: Movimiento[], negocio?: string): Resultado {
  const e = l.filter((x) => !negocio || x.negocio_id === negocio)
  const ingresos = sumar(e, (x) => x.tipo === 'ingreso')
  const gastos = sumar(e, (x) => x.tipo === 'gasto')
  return { ingresos, gastos, utilidad: deCentavos(aCentavos(ingresos) - aCentavos(gastos)) }
}

export function regimenVigente(modos: ModoImpuesto[], periodo: string, negocioId: string, clienteId?: string | null): Regimen {
  const ultimo = (l: ModoImpuesto[]) => l.filter((x) => periodoDe(x.desde) <= periodo).sort((a, b) => a.desde.localeCompare(b.desde)).at(-1)?.regimen
  const deCliente = clienteId ? ultimo(modos.filter((x) => x.ambito === 'cliente' && x.cliente_id === clienteId)) : undefined
  return deCliente ?? ultimo(modos.filter((x) => x.ambito === 'negocio' && x.negocio_id === negocioId)) ?? 'sin_iva'
}

export interface ResumenImpuesto {
  regimen: Regimen
  emitido: number
  recibido: number
  impuesto: number
  debito: number
  credito: number
  aPagar: number
  remanente: number
}

export function resumenImpuesto(facturas: Factura[], modos: ModoImpuesto[], negocioId: string, periodo: string): ResumenImpuesto {
  const regimen = regimenVigente(modos, periodo, negocioId)
  const delMes = facturas.filter((f) => !f.anulada && f.negocio_id === negocioId && periodoDe(f.fecha) === periodo)
  const emitidoC = delMes.filter((f) => f.tipo === 'emitida').reduce((s, f) => s + aCentavos(f.total), 0)
  const recibidoC = delMes.filter((f) => f.tipo === 'recibida').reduce((s, f) => s + aCentavos(f.total), 0)
  let impuesto = 0, debito = 0, credito = 0
  if (regimen === 'pequeno') impuesto = Math.round(emitidoC * 0.05)
  if (regimen === 'general') {
    debito = Math.round((emitidoC * 12) / 112)
    credito = Math.round((recibidoC * 12) / 112)
    impuesto = Math.max(0, debito - credito)
  }
  return {
    regimen, emitido: deCentavos(emitidoC), recibido: deCentavos(recibidoC), impuesto: deCentavos(impuesto),
    debito: deCentavos(debito), credito: deCentavos(credito), aPagar: deCentavos(impuesto), remanente: deCentavos(Math.max(0, credito - debito)),
  }
}
