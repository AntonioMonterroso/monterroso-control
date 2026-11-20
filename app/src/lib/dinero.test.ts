import { describe, expect, it } from 'vitest'
import { leerMonto, quetzales } from './dinero'

describe('dinero', () => {
  it('formato Q con dos decimales', () => {
    expect(quetzales(1350)).toBe('Q 1,350.00')
    expect(quetzales(0.5)).toBe('Q 0.50')
    expect(quetzales(-20)).toBe('-Q 20.00')
  })

  it('lee montos escritos con Q y comas', () => {
    expect(leerMonto('Q 1,350.50')).toBe(1350.5)
    expect(leerMonto('')).toBe(0)
    expect(leerMonto('12.345')).toBeNull()
    expect(leerMonto('abc')).toBeNull()
  })
})
