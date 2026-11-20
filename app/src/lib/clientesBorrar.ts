import type { Tabla } from './almacen'

export interface PlanBorrar {
  modo: 'borrar' | 'archivar'
  motivos: string[]
  borrar: { t: Tabla; ids: string[] }[]
  desligar: { t: Tabla; ids: string[] }[]
}

type ConCliente = { id: string; cliente_id?: string | null }

export function planBorrarCliente(key: string, d: { trabajos: number; pagos: number; contratos: ConCliente[]; facturas: ConCliente[]; cobros: (ConCliente & { tipo?: string })[]; modos: ConCliente[]; gastos: ConCliente[]; gastosFijos: ConCliente[]; extra: ConCliente[] }): PlanBorrar {
  const de = (l: ConCliente[]) => l.filter((x) => x.cliente_id === key)
  const motivos: string[] = []
  if (d.trabajos) motivos.push(`${d.trabajos} ${d.trabajos === 1 ? 'trabajo' : 'trabajos'}`)
  if (d.pagos) motivos.push(`${d.pagos} ${d.pagos === 1 ? 'pago' : 'pagos'}`)
  if (de(d.contratos).length) motivos.push(`${de(d.contratos).length} ${de(d.contratos).length === 1 ? 'contrato' : 'contratos'}`)
  if (de(d.facturas).length) motivos.push(`${de(d.facturas).length} ${de(d.facturas).length === 1 ? 'factura' : 'facturas'}`)
  if (motivos.length) return { modo: 'archivar', motivos, borrar: [], desligar: [] }
  return {
    modo: 'borrar',
    motivos: [],
    borrar: [
      { t: 'ctl_cobros' as Tabla, ids: de(d.cobros).map((x) => x.id) },
      { t: 'ctl_impuesto_modo' as Tabla, ids: de(d.modos).map((x) => x.id) },
      { t: 'ctl_cliente_extra' as Tabla, ids: d.extra.map((x) => x.id) },
    ].filter((x) => x.ids.length),
    desligar: [
      { t: 'ctl_gastos' as Tabla, ids: de(d.gastos).map((x) => x.id) },
      { t: 'ctl_gastos_fijos' as Tabla, ids: de(d.gastosFijos).map((x) => x.id) },
    ].filter((x) => x.ids.length),
  }
}
