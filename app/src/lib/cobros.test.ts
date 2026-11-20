import { describe, expect, it } from 'vitest'
import { generarCobros, textoEstadoCuenta, totalSaldo } from './cobros'
import type { CobroGuardado, Pago, Proyecto } from './tipos'

const proyecto: Proyecto = {
  id: 'p1', cliente_id: 'c1', nombre: 'Página', descripcion: null, estado: 'en_curso', fecha_firma: '2026-10-01', fecha_entrega: null,
  inscripcion_total: 1000, inscripcion_forma: 'mitad', mensualidad: 300, dia_cobro: 5, mensualidad_inicio: '2026-10-01', mensualidad_fin: null, creado: '2026-10-01',
  partes: [
    { id: 'a', orden: 1, concepto: 'Primera mitad', momento: 'firma', fecha: null, monto: 500 },
    { id: 'b', orden: 2, concepto: 'Segunda mitad', momento: 'entrega', fecha: null, monto: 500 },
  ],
}

const pago = (clave: string, monto: number): Pago => ({ id: clave + monto, cliente_id: 'c1', cobro_clave: clave, fecha: '2026-10-02', monto, cuenta: 'Banco', referencia: null, nota: null, recibo_numero: 1, creado: '' })

describe('cobros', () => {
  it('genera inscripción y mensualidades hasta la fecha', () => {
    const c = generarCobros([proyecto], [], [], '2026-11-30', '2026-11-19')
    expect(c.map((x) => x.clave)).toEqual(['i:p1:1', 'm:p1:2026-10', 'm:p1:2026-11', 'i:p1:2'])
  })

  it('marca pagado, vencido y por cobrar', () => {
    const c = generarCobros([proyecto], [], [pago('i:p1', 500), pago('m:p1:2026-10', 100)], '2026-11-30', '2026-11-19')
    const e = Object.fromEntries(c.map((x) => [x.clave, x.estado]))
    expect(e['i:p1:1']).toBe('pagado')
    expect(e['m:p1:2026-10']).toBe('vencido')
    expect(e['m:p1:2026-11']).toBe('vencido')
    expect(e['i:p1:2']).toBe('por_cobrar')
    expect(c.find((x) => x.clave === 'm:p1:2026-10')?.saldo).toBe(200)
  })

  it('dar por saldado saca el cobro de lo pendiente', () => {
    const g: CobroGuardado = { id: 'g', clave: 'm:p1:2026-10', cliente_id: 'c1', proyecto_id: 'p1', tipo: 'mensualidad', concepto: null, vence: null, monto: null, saldado: true, nota: 'Descuento' }
    const c = generarCobros([proyecto], [g], [], '2026-10-31', '2026-11-19')
    expect(c.find((x) => x.clave === 'm:p1:2026-10')?.estado).toBe('saldado')
    expect(totalSaldo(c)).toBe(1000)
  })

  it('lo pagado de inscripción en World se reparte en las partes en orden', () => {
    const c = generarCobros([proyecto], [], [pago('i:p1', 700)], '2026-10-31', '2026-11-19')
    expect(c.find((x) => x.clave === 'i:p1:1')?.estado).toBe('pagado')
    expect(c.find((x) => x.clave === 'i:p1:2')?.saldo).toBe(300)
  })

  it('el monto único del trabajo de World es su propio cobro', () => {
    const c = generarCobros([{ ...proyecto, monto_unico: 900, fecha_entrega: '2026-12-01' }], [], [pago('a:p1', 400)], '2026-10-31', '2026-11-19')
    expect(c.find((x) => x.clave === 'a:p1')).toMatchObject({ monto: 900, saldo: 500, estado: 'por_cobrar' })
  })

  it('las propuestas no generan cobros y los extras sí', () => {
    const x: CobroGuardado = { id: 'x', clave: 'x:1', cliente_id: 'c1', proyecto_id: null, tipo: 'extra', concepto: 'Dominio', vence: '2026-12-01', monto: 150, saldado: false, nota: null }
    const c = generarCobros([{ ...proyecto, estado: 'propuesta' }], [x], [], '2026-12-31', '2026-11-19')
    expect(c.map((y) => y.clave)).toEqual(['x:1'])
  })

  it('el estado de cuenta lista lo pendiente con total', () => {
    const c = generarCobros([proyecto], [], [pago('i:p1', 500)], '2026-10-31', '2026-11-19')
    const t = textoEstadoCuenta('Ana', c, '2026-11-19')
    expect(t).toContain('Mensualidad de octubre 2026')
    expect(t).toContain('Total pendiente: Q 800.00')
  })
})

describe('salario como cobro', () => {
  it('cada mes sale el neto vigente con sus aumentos y se marca recibido con su pago', () => {
    const aumentos = [
      { id: 'a', desde: '2026-09-01', bruto: 5000, descuentos: 500, dia_pago: 30, nota: null },
      { id: 'b', desde: '2026-11-01', bruto: 6000, descuentos: 600, dia_pago: 30, nota: null },
    ]
    const c = generarCobros([], [], [pago('s:2026-09', 4500)], '2026-11-30', '2026-11-19', aumentos)
    expect(c.map((x) => [x.clave, x.monto, x.estado])).toEqual([
      ['s:2026-09', 4500, 'pagado'],
      ['s:2026-10', 4500, 'vencido'],
      ['s:2026-11', 5400, 'por_cobrar'],
    ])
    expect(c[0].tipo).toBe('salario')
  })
})
