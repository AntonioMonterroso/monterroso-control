import { describe, expect, it } from 'vitest'
import { accionesPorSocio, capital, conciliar, distribuible, repartirPorAcciones, reservaLegal, saldoCuenta, siguienteFecha, type Accion, type CuentaBanco, type MovBanco } from './sa'

const acc = (socio_id: string, cantidad: number, fecha = '2026-01-10', valor_nominal = 100): Accion => ({ id: socio_id + cantidad, socio_id, serie: 'A', numero_desde: null, numero_hasta: null, cantidad, valor_nominal, fecha, titulo: null, estado: 'vigente', nota: null })

describe('sociedad anónima', () => {
  it('acciones por socio con transmisiones hasta la fecha', () => {
    const t = [{ id: 't', fecha: '2026-06-01', de_socio_id: 'a', a_socio_id: 'b', cantidad: 10, serie: 'A', precio: null, nota: null }]
    expect([...accionesPorSocio([acc('a', 60), acc('b', 40)], t, '2026-05-31')]).toEqual([['a', 60], ['b', 40]])
    expect(Object.fromEntries(accionesPorSocio([acc('a', 60), acc('b', 40)], t, '2026-12-31'))).toEqual({ a: 50, b: 50 })
  })

  it('capital suscrito y pagado', () => {
    const c = capital([acc('a', 60), acc('b', 40)], [{ id: '1', socio_id: 'a', fecha: '2026-01-10', monto: 6000, pagado: 6000, forma: 'efectivo', descripcion: null }, { id: '2', socio_id: 'b', fecha: '2026-01-10', monto: 4000, pagado: 1000, forma: 'especie', descripcion: null }])
    expect(c).toEqual({ suscrito: 10000, aportado: 10000, pagado: 7000, porPagar: 3000 })
  })

  it('reserva legal del 5 % de la utilidad neta y nada con pérdida', () => {
    expect(reservaLegal(10000)).toBe(500)
    expect(reservaLegal(-500)).toBe(0)
    expect(distribuible(12000, 2000)).toEqual({ neta: 10000, reserva: 500, distribuible: 9500 })
  })

  it('reparto por acciones con ISR de dividendos del 5 %, sin perder centavos', () => {
    const l = repartirPorAcciones(1000, new Map([['a', 1], ['b', 1], ['c', 1]]))
    expect(l.reduce((s, x) => s + Math.round(x.bruto * 100), 0)).toBe(100000)
    expect(l.map((x) => x.bruto).sort()).toEqual([333.33, 333.33, 333.34])
    const r = repartirPorAcciones(9500, new Map([['a', 60], ['b', 40]]))
    expect(r[0]).toMatchObject({ socio_id: 'a', porcentaje: 60, bruto: 5700, isr: 285, neto: 5415 })
    expect(r[1]).toMatchObject({ socio_id: 'b', porcentaje: 40, bruto: 3800, isr: 190, neto: 3610 })
  })

  it('saldo de banco y conciliación del mes', () => {
    const c: CuentaBanco = { id: 'c', banco: 'Banco', numero: '1', nombre: null, moneda: 'GTQ', saldo_inicial: 1000, fecha_saldo: '2026-11-01', activo: true }
    const mv = (id: string, fecha: string, tipo: 'ingreso' | 'egreso', monto: number, conciliado: boolean): MovBanco => ({ id, cuenta_id: 'c', fecha, tipo, monto, descripcion: 'x', origen: 'manual', origen_id: null, referencia: null, conciliado })
    const movs = [mv('1', '2026-11-05', 'ingreso', 500, true), mv('2', '2026-11-20', 'egreso', 200, false), mv('3', '2026-10-30', 'ingreso', 999, true), mv('4', '2026-12-02', 'ingreso', 50, false)]
    expect(saldoCuenta(c, movs)).toBe(1350)
    expect(saldoCuenta(c, movs, '2026-11-30')).toBe(1300)
    const k = conciliar(c, movs, '2026-11', 1500)
    expect(k).toMatchObject({ libros: 1300, transito: -200, ajustado: 1500, diferencia: 0 })
    expect(k.sinConciliar.map((x) => x.id)).toEqual(['2'])
  })

  it('recordatorios que se repiten', () => {
    expect(siguienteFecha('2026-01-31', 'mensual')).toBe('2026-02-28')
    expect(siguienteFecha('2026-11-30', 'trimestral')).toBe('2027-02-28')
    expect(siguienteFecha('2026-04-30', 'anual')).toBe('2027-04-30')
  })
})
