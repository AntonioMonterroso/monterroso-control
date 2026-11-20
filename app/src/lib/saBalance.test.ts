import { describe, expect, it } from 'vitest'
import { armarBalance, type DatosBalance } from './saBalance'

const base = (extra: Partial<DatosBalance> = {}): DatosBalance => ({
  corte: '2026-11-30', inicio: '2026-07-01', utilidad: 0, pagosEfectivo: [], anticipos: [], gastos: [], aportes: [], repartos: [], deudas: 0, bancos: 0, bancoInicial: 0, bancoManual: 0, trasladados: new Set(), ...extra,
})

describe('balance de la S.A.', () => {
  it('cuadra con cobros en cuenta personal, gastos del socio, anticipos, aportes pendientes y deudas', () => {
    const d = base({
      utilidad: 3000 + 2000 + 400 - 500 - 300 - 200,
      pagosEfectivo: [
        { id: 'p1', fecha: '2026-08-01', monto: 3000, destino: 'p:mia', ligado: false },
        { id: 'p2', fecha: '2026-08-02', monto: 2000, destino: 's:b1', ligado: true },
      ],
      anticipos: [{ id: 'a:1', fecha: '2026-09-01', monto: 1000, destino: 'e:billetera', ligado: false, saldo: 600 }],
      gastos: [
        { id: 'g1', fecha: '2026-08-05', monto: 500, destino: null, ligado: false },
        { id: 'g2', fecha: '2026-08-06', monto: 300, destino: 's:b1', ligado: true },
        { id: 'g3', fecha: '2026-08-07', monto: 200, destino: 'p:mia', ligado: false },
      ],
      aportes: [{ fecha: '2026-07-01', monto: 10000, pagado: 6000, forma: 'efectivo', ligado: true }],
      deudas: 1200,
      bancos: 6000 + 2000 - 300,
    })
    const b = armarBalance(d)
    expect(b.diferencia).toBe(0)
    expect(b.activoCorriente.find((x) => x.k === 'socio')?.monto).toBe(4000)
    expect(b.pasivoCorriente.find((x) => x.k === 'cxp')?.monto).toBe(700)
    expect(b.pasivoCorriente.find((x) => x.k === 'anticipos')?.monto).toBe(600)
    expect(b.patrimonio.find((x) => x.k === 'noPagado')?.monto).toBe(-4000)
    expect(b.activo).toBe(b.pasivo + b.totalPatrimonio)
  })
  it('lo trasladado deja de ser cuenta por cobrar al socio y sigue cuadrando', () => {
    const b = armarBalance(base({ utilidad: 3000, pagosEfectivo: [{ id: 'p1', fecha: '2026-08-01', monto: 3000, destino: 'p:mia', ligado: false }], bancos: 3000, trasladados: new Set(['p1']) }))
    expect(b.activoCorriente.find((x) => x.k === 'socio')).toBeUndefined()
    expect(b.diferencia).toBe(0)
  })
  it('lo de antes del inicio de la S.A. no cuenta', () => {
    const b = armarBalance(base({ gastos: [{ id: 'g1', fecha: '2026-05-01', monto: 900, destino: null, ligado: false }] }))
    expect(b.pasivo).toBe(0)
    expect(b.diferencia).toBe(0)
  })
  it('explica la diferencia cuando viene del saldo inicial o de movimientos a mano del banco', () => {
    const b = armarBalance(base({ bancos: 1500, bancoInicial: 1000, bancoManual: 500 }))
    expect(b.diferencia).toBe(1500)
    expect(b.explicacion).toContain('saldo con el que empezó')
  })
  it('un reparto con dividendos pagados por el banco cuadra', () => {
    const b = armarBalance(base({ utilidad: 10000, pagosEfectivo: [{ id: 'p1', fecha: '2026-08-01', monto: 10000, destino: 's:b1', ligado: true }], bancos: 10000 - 4275, repartos: [{ fecha: '2026-11-01', reserva: 500, isr_sociedad: 0, isr: 225, isr_pagado: false, lineas: [{ bruto: 4500, neto: 4275, pagado: true, ligado: true }] }] }))
    expect(b.diferencia).toBe(0)
    expect(b.pasivoCorriente.find((x) => x.k === 'isr')?.monto).toBe(225)
  })
})
