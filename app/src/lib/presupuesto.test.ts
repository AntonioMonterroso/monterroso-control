import { describe, expect, it } from 'vitest'
import { copiarMes, lineasPresupuesto } from './presupuesto'
import type { Movimiento } from './finanzas'
import type { Categoria, Presupuesto } from './tipos'

const cats: Categoria[] = [
  { id: 'g', nombre: 'Internet', tipo: 'gasto', clave: null, activo: true, orden: 1 },
  { id: 'i', nombre: 'Mensualidades', tipo: 'ingreso', clave: 'mensualidad', activo: true, orden: 2 },
]
const pres: Presupuesto[] = [
  { id: '1', periodo: '2026-11', negocio_id: 'dev', categoria_id: 'g', monto: 300 },
  { id: '2', periodo: '2026-11', negocio_id: 'dev', categoria_id: 'i', monto: 5000 },
  { id: '3', periodo: '2026-11', negocio_id: 'sal', categoria_id: 'g', monto: 100 },
]
const mov = (tipo: 'gasto' | 'ingreso', categoria_id: string, monto: number, negocio_id = 'dev'): Movimiento => ({ fecha: '2026-11-05', tipo, negocio_id, categoria_id, cliente_id: null, monto, descripcion: '', origen: 'gasto' })

describe('presupuesto', () => {
  it('compara lo planeado con lo real por negocio', () => {
    const l = lineasPresupuesto(cats, pres, [mov('gasto', 'g', 350), mov('ingreso', 'i', 4000), mov('gasto', 'g', 20, 'sal')], '2026-11', 'dev')
    expect(l[0]).toMatchObject({ plan: 300, real: 350, diferencia: -50 })
    expect(l[1]).toMatchObject({ plan: 5000, real: 4000, diferencia: -1000 })
  })

  it('sin negocio suma todos', () => {
    const l = lineasPresupuesto(cats, pres, [mov('gasto', 'g', 20, 'sal')], '2026-11', null)
    expect(l[0]).toMatchObject({ plan: 400, real: 20, diferencia: 380 })
  })

  it('copiar el mes anterior no pisa lo que ya existe', () => {
    const r = copiarMes([...pres, { id: '4', periodo: '2026-12', negocio_id: 'dev', categoria_id: 'g', monto: 999 }], '2026-11', '2026-12')
    expect(r).toHaveLength(2)
    expect(r.map((x) => x.categoria_id + x.negocio_id).sort()).toEqual(['gsal', 'idev'])
  })
})
