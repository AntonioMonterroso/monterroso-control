import { describe, expect, it } from 'vitest'
import { partesDeForma, problemasInscripcion, sumaPartes } from './inscripcion'

describe('inscripción en partes', () => {
  it('completa al firmar deja una sola parte', () => {
    const p = partesDeForma(1500, 'completa')
    expect(p).toHaveLength(1)
    expect(p[0]).toMatchObject({ momento: 'firma', monto: 1500 })
  })

  it('50 y 50 reparte los centavos sin perder nada', () => {
    const p = partesDeForma(1000.01, 'mitad')
    expect(p.map((x) => x.monto)).toEqual([500.01, 500])
    expect(p.map((x) => x.momento)).toEqual(['firma', 'entrega'])
    expect(sumaPartes(p)).toBe(1000.01)
  })

  it('personalizada conserva las partes que ya tenía', () => {
    const actuales = [
      { orden: 5, concepto: 'Anticipo', momento: 'firma' as const, fecha: null, monto: 300 },
      { orden: 9, concepto: 'Resto', momento: 'fecha' as const, fecha: '2026-12-15', monto: 700 },
    ]
    const p = partesDeForma(1000, 'personalizada', actuales)
    expect(p.map((x) => x.orden)).toEqual([1, 2])
    expect(p[1].fecha).toBe('2026-12-15')
  })

  it('sin inscripción no hay partes ni problemas', () => {
    expect(partesDeForma(0, 'mitad')).toEqual([])
    expect(problemasInscripcion(0, null, [])).toEqual([])
  })

  it('no hay forma por defecto: con monto obliga a elegirla', () => {
    expect(problemasInscripcion(800, null, [])).toContain('Elige cómo se divide la inscripción.')
  })

  it('avisa cuando las partes no suman el total', () => {
    const p = [{ orden: 1, concepto: 'A', momento: 'firma' as const, fecha: null, monto: 400 }]
    expect(problemasInscripcion(500, 'personalizada', p)[0]).toMatch(/suman 400.00/)
  })

  it('una parte en fecha necesita la fecha', () => {
    const p = [{ orden: 1, concepto: 'A', momento: 'fecha' as const, fecha: null, monto: 500 }]
    expect(problemasInscripcion(500, 'personalizada', p)).toContain('La parte 1 necesita su fecha.')
  })

  it('partes correctas no dan problemas', () => {
    expect(problemasInscripcion(1000.01, 'mitad', partesDeForma(1000.01, 'mitad'))).toEqual([])
  })
})
