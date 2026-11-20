import { aCentavos, deCentavos } from './dinero'
import type { Movimiento } from './finanzas'
import type { Categoria, Presupuesto } from './tipos'

export interface LineaPresupuesto {
  categoria: Categoria
  plan: number
  real: number
  diferencia: number
  avance: number
}

export function lineasPresupuesto(categorias: Categoria[], presupuestos: Presupuesto[], movs: Movimiento[], periodo: string, negocio: string | null): LineaPresupuesto[] {
  return categorias.map((c) => {
    const plan = presupuestos.filter((p) => p.periodo === periodo && p.categoria_id === c.id && (!negocio || p.negocio_id === negocio)).reduce((s, p) => s + aCentavos(p.monto), 0)
    const real = movs.filter((x) => x.categoria_id === c.id && x.tipo === c.tipo && (!negocio || x.negocio_id === negocio)).reduce((s, x) => s + aCentavos(x.monto), 0)
    const diferencia = c.tipo === 'gasto' ? plan - real : real - plan
    return { categoria: c, plan: deCentavos(plan), real: deCentavos(real), diferencia: deCentavos(diferencia), avance: plan > 0 ? real / plan : real > 0 ? 1 : 0 }
  })
}

export function copiarMes(presupuestos: Presupuesto[], de: string, a: string): Omit<Presupuesto, 'id'>[] {
  const ya = new Set(presupuestos.filter((p) => p.periodo === a).map((p) => `${p.negocio_id}|${p.categoria_id}`))
  return presupuestos.filter((p) => p.periodo === de && !ya.has(`${p.negocio_id}|${p.categoria_id}`)).map((p) => ({ periodo: a, negocio_id: p.negocio_id, categoria_id: p.categoria_id, monto: p.monto }))
}
