import { describe, expect, it } from 'vitest'
import { colorDe, iniciales } from './Avatar'

const lum = (hex: string) => { const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2] }

describe('iniciales con color', () => {
  it('toma la primera y la última palabra', () => {
    expect(iniciales('Socio de prueba A')).toBe('SP')
    expect(iniciales('Panadería La Espiga')).toBe('PE')
  })
  it('el color es el mismo para el mismo nombre', () => {
    expect(colorDe('Cliente de prueba A')).toBe(colorDe('cliente de prueba a'))
  })
  it('el texto blanco sobre cada color pasa AA', () => {
    for (const n of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l']) expect((1.05) / (lum(colorDe(n)) + 0.05)).toBeGreaterThanOrEqual(4.5)
  })
})
