import { describe, expect, it } from 'vitest'
import { autoAplicables, planAplicar, saldoAFavor, saldoAnticipo, type Anticipo } from './anticipos'

const a = (id: string, monto: number, extra: Partial<Anticipo> = {}): Anticipo => ({ id, fecha: '2026-10-01', cliente_id: 'c1', proyecto_id: null, monto, forma: 'transferencia', destino: null, referencia: null, nota: null, comprobantes: [], aplicar_solo: true, estado: 'activo', devuelto_el: null, devuelto_monto: null, registrado_por: null, creado: '2026-10-01', ...extra })
const cb = (clave: string, saldo: number, vence: string, extra = {}) => ({ clave, cliente_id: 'c1', proyecto_id: 'p1', vence, saldo, ...extra })

describe('anticipos y saldo a favor', () => {
  it('el saldo baja con lo aplicado y lo devuelto', () => {
    const x = a('a1', 1000, { devuelto_monto: 100 })
    expect(saldoAnticipo(x, [{ anticipo_id: 'a1', monto: 350, cobro_clave: 'm:p1:2026-11', fecha: '2026-11-05' }])).toBe(550)
    expect(saldoAnticipo({ ...x, estado: 'devuelto' }, [])).toBe(0)
  })
  it('suma el saldo a favor del cliente', () => {
    expect(saldoAFavor('c1', [a('a1', 500), a('a2', 200), a('a3', 900, { cliente_id: 'c2' })], [{ anticipo_id: 'a1', monto: 100, cobro_clave: 'x', fecha: '2026-11-01' }])).toBe(600)
  })
  it('aplica primero al cobro más viejo, en parcial y total', () => {
    const plan = planAplicar([a('a1', 500)], [], [cb('m:p1:2026-12', 350, '2026-12-05'), cb('m:p1:2026-11', 350, '2026-11-05')])
    expect(plan).toEqual([{ anticipo_id: 'a1', cobro_clave: 'm:p1:2026-11', monto: 350 }, { anticipo_id: 'a1', cobro_clave: 'm:p1:2026-12', monto: 150 }])
  })
  it('respeta un tope y el proyecto del anticipo', () => {
    expect(planAplicar([a('a1', 500)], [], [cb('m:p1:2026-11', 350, '2026-11-05')], 100)).toEqual([{ anticipo_id: 'a1', cobro_clave: 'm:p1:2026-11', monto: 100 }])
    expect(planAplicar([a('a1', 500, { proyecto_id: 'p2' })], [], [cb('m:p1:2026-11', 350, '2026-11-05')])).toEqual([])
  })
  it('se aplica solo cuando el cobro ya venció', () => {
    const l = autoAplicables('2026-11-10', [a('a1', 1000)], [], [cb('m:p1:2026-11', 350, '2026-11-05'), cb('m:p1:2026-12', 350, '2026-12-05')])
    expect(l).toEqual([{ anticipo_id: 'a1', cobro_clave: 'm:p1:2026-11', monto: 350 }])
    expect(autoAplicables('2026-11-10', [a('a1', 1000, { aplicar_solo: false })], [], [cb('m:p1:2026-11', 350, '2026-11-05')])).toEqual([])
  })
})
