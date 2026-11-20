import { describe, expect, it } from 'vitest'
import { montoParaCopiar } from './copiarMonto'

describe('copiar un monto', () => {
  it('deja solo el número con dos decimales', () => {
    expect(montoParaCopiar('Q 1,350.00')).toBe('1350.00')
    expect(montoParaCopiar(' Q1,234,567.89 ')).toBe('1234567.89')
    expect(montoParaCopiar('-Q 25.50')).toBe('-25.50')
    expect(montoParaCopiar('US$ 10.00')).toBe('10.00')
  })
  it('no toca otros textos', () => {
    expect(montoParaCopiar('Cliente de prueba')).toBeNull()
    expect(montoParaCopiar('Q 1,350.00 de mensualidad')).toBeNull()
  })
})
