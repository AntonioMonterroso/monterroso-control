import { describe, expect, it } from 'vitest'
import { posiblesRepetidos, sugerirClave } from './entradas'

describe('pagos de World difíciles de reconocer', () => {
  it('marca como posible repetido el mismo proyecto, monto y fecha', () => {
    const r = posiblesRepetidos([
      { id: 'a', fecha: '2026-11-17', monto: 350, proyecto_id: 'p1', cobro_clave: 'a:p1', forma: null },
      { id: 'b', fecha: '2026-11-17', monto: 350, proyecto_id: 'p1', cobro_clave: 'm:p1:2026-11', forma: 'transferencia' },
      { id: 'c', fecha: '2026-11-18', monto: 350, proyecto_id: 'p1', cobro_clave: 'm:p1:2026-12', forma: null },
    ])
    expect(r.get('a')).toEqual(['b'])
    expect(r.has('c')).toBe(false)
  })
  it('marca la misma inscripción pagada dos veces', () => {
    const r = posiblesRepetidos([
      { id: 'a', fecha: '2026-10-01', monto: 1000, proyecto_id: 'p1', cobro_clave: 'i:p1:1', forma: null },
      { id: 'b', fecha: '2026-11-01', monto: 1000, proyecto_id: 'p1', cobro_clave: 'i:p1:1', forma: null },
    ])
    expect(r.get('b')).toEqual(['a'])
  })
  it('sugiere a qué cobro va por la nota de World', () => {
    const o = [{ clave: 'i:p1:1', tipo: 'inscripcion', vence: null }, { clave: 'm:p1:2026-10', tipo: 'mensualidad', vence: '2026-10-05' }, { clave: 'm:p1:2026-11', tipo: 'mensualidad', vence: '2026-11-05' }]
    expect(sugerirClave('Noviembre, Mensualidad', o)).toBe('m:p1:2026-11')
    expect(sugerirClave('Instalación', o)).toBe('i:p1:1')
    expect(sugerirClave('Otra cosa', o)).toBeNull()
  })
})
