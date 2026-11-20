import { describe, expect, it } from 'vitest'
import { aumentoVigente, cuotasPagadas, fijosPendientes, mesesEntre, netoSalario, regimenVigente, resumenImpuesto, saldoDeuda, sumarMeses } from './finanzas'
import type { AumentoSalario, Deuda, Factura, GastoFijo, ModoImpuesto } from './tipos'

const aum = (desde: string, bruto: number, descuentos = 0): AumentoSalario => ({ id: desde, desde, bruto, descuentos, dia_pago: 30, nota: null })

describe('finanzas', () => {
  it('meses', () => {
    expect(sumarMeses('2026-12', 1)).toBe('2027-01')
    expect(sumarMeses('2026-01', -1)).toBe('2025-12')
    expect(mesesEntre('2026-11', '2027-02')).toEqual(['2026-11', '2026-12', '2027-01', '2027-02'])
  })

  it('el salario usa el último aumento vigente', () => {
    const l = [aum('2026-01-01', 8000, 500), aum('2026-07-01', 9000, 600)]
    expect(netoSalario(aumentoVigente(l, '2026-06'))).toBe(7500)
    expect(netoSalario(aumentoVigente(l, '2026-07'))).toBe(8400)
    expect(aumentoVigente(l, '2025-12')).toBeNull()
  })

  it('saldo y cuotas de una compra a cuotas', () => {
    const d: Deuda = { id: 'd', nombre: 'Computadora', tipo: 'cuotas', negocio_id: 'n', categoria_id: 'c', total: 12000, cuotas: 12, cuota: 1000, dia_pago: 15, inicio: '2026-01-01', limite: null, saldo_inicial: 0, activo: true, nota: null }
    const movs = [{ id: '1', deuda_id: 'd', tipo: 'pago' as const, fecha: '2026-01-15', monto: 1000, nota: null }, { id: '2', deuda_id: 'd', tipo: 'pago' as const, fecha: '2026-02-15', monto: 1500, nota: null }]
    expect(saldoDeuda(d, movs)).toBe(9500)
    expect(cuotasPagadas(d, movs)).toBe(2)
  })

  it('la tarjeta suma cargos y resta pagos', () => {
    const d: Deuda = { id: 't', nombre: 'Tarjeta', tipo: 'tarjeta', negocio_id: 'n', categoria_id: 'c', total: 0, cuotas: null, cuota: null, dia_pago: 20, inicio: '2026-01-01', limite: 10000, saldo_inicial: 2000, activo: true, nota: null }
    const movs = [{ id: '1', deuda_id: 't', tipo: 'cargo' as const, fecha: '2026-01-05', monto: 500.5, nota: null }, { id: '2', deuda_id: 't', tipo: 'pago' as const, fecha: '2026-01-20', monto: 1000, nota: null }]
    expect(saldoDeuda(d, movs)).toBe(1500.5)
  })

  it('gastos fijos pendientes del mes sin duplicar', () => {
    const f: GastoFijo = { id: 'f', nombre: 'Internet', negocio_id: 'n', categoria_id: 'c', cliente_id: null, monto: 300, dia: 5, inicio: '2026-01-01', fin: null, activo: true }
    expect(fijosPendientes([f], [], '2026-11')).toHaveLength(1)
    const g = { gasto_fijo_id: 'f', periodo: '2026-11' } as never
    expect(fijosPendientes([f], [g], '2026-11')).toHaveLength(0)
    expect(fijosPendientes([{ ...f, fin: '2026-10-31' }], [], '2026-11')).toHaveLength(0)
  })

  it('régimen: el del cliente gana al del negocio y cambia desde un mes', () => {
    const modos: ModoImpuesto[] = [
      { id: '1', ambito: 'negocio', negocio_id: 'n', cliente_id: null, regimen: 'pequeno', desde: '2026-01-01' },
      { id: '2', ambito: 'negocio', negocio_id: 'n', cliente_id: null, regimen: 'general', desde: '2026-09-01' },
      { id: '3', ambito: 'cliente', negocio_id: null, cliente_id: 'c', regimen: 'sin_iva', desde: '2026-01-01' },
    ]
    expect(regimenVigente(modos, '2026-08', 'n')).toBe('pequeno')
    expect(regimenVigente(modos, '2026-09', 'n')).toBe('general')
    expect(regimenVigente(modos, '2026-09', 'n', 'c')).toBe('sin_iva')
    expect(regimenVigente([], '2026-09', 'n')).toBe('sin_iva')
  })

  it('resumen de impuestos por régimen', () => {
    const f = (tipo: 'emitida' | 'recibida', total: number, anulada = false): Factura => ({ id: String(Math.random()), tipo, fecha: '2026-11-10', serie: null, numero: '1', nit: null, nombre: 'x', total, negocio_id: 'n', cliente_id: null, pago_id: null, gasto_id: null, archivo: null, anulada })
    const fs = [f('emitida', 1120), f('emitida', 5000, true), f('recibida', 224)]
    const peq = resumenImpuesto(fs, [{ id: '1', ambito: 'negocio', negocio_id: 'n', cliente_id: null, regimen: 'pequeno', desde: '2026-01-01' }], 'n', '2026-11')
    expect(peq.impuesto).toBe(56)
    const gen = resumenImpuesto(fs, [{ id: '1', ambito: 'negocio', negocio_id: 'n', cliente_id: null, regimen: 'general', desde: '2026-01-01' }], 'n', '2026-11')
    expect([gen.debito, gen.credito, gen.aPagar]).toEqual([120, 24, 96])
    expect(resumenImpuesto(fs, [], 'n', '2026-11').impuesto).toBe(0)
  })
})
