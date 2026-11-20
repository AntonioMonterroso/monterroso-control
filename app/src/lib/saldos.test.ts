import { describe, expect, it } from 'vitest'
import { saldoDe } from './saldos'

describe('saldo de cada caja y cuenta', () => {
  const entradas = [{ destino: 'e:papa', monto: 500, fecha: '2026-11-01' }, { destino: 'e:billetera', monto: 200, fecha: '2026-11-02' }]
  const salidas = [{ destino: 'e:billetera', monto: 50, fecha: '2026-11-03' }]
  const traspasos = [{ id: 't1', fecha: '2026-11-05', monto: 300, de: 'e:papa', a: 'e:billetera', nota: 'Papá me entregó', creado: '' }, { id: 't2', fecha: '2026-11-06', monto: 100, de: 'e:billetera', a: 'p:banco', nota: 'Depósito', creado: '' }]
  it('cada caja lleva su saldo por separado', () => {
    expect(saldoDe('e:papa', 0, entradas, salidas, traspasos).saldo).toBe(200)
    expect(saldoDe('e:billetera', 10, entradas, salidas, traspasos).saldo).toBe(360)
    expect(saldoDe('p:banco', 1000, entradas, salidas, traspasos).saldo).toBe(1100)
  })
  it('a una fecha solo cuenta lo de hasta ese día', () => {
    expect(saldoDe('e:billetera', 0, entradas, salidas, traspasos, '2026-11-03').saldo).toBe(150)
  })
})
