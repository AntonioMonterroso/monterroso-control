import { describe, expect, it } from 'vitest'
import { valorEn, type Cambio } from './historial'

const c = (desde: string, antes: string, despues: string, creado = '2026-01-01'): Cambio => ({ id: desde + creado, tabla: 'projects', registro_id: 'p', campo: 'mensualidad', desde, antes, despues, motivo: null, por: null, creado })

describe('lo que regía en cada mes', () => {
  it('sin cambios usa el valor de hoy', () => {
    expect(valorEn([], '2026-03', 350)).toBe(350)
  })
  it('antes del cambio usa lo de antes y desde el cambio lo nuevo', () => {
    const l = [c('2026-06', '350', '500')]
    expect(valorEn(l, '2026-05', 500)).toBe(350)
    expect(valorEn(l, '2026-06', 500)).toBe(500)
    expect(valorEn(l, '2026-11', 500)).toBe(500)
  })
  it('varios cambios se aplican en orden', () => {
    const l = [c('2026-09', '500', '650'), c('2026-03', '350', '500')]
    expect(valorEn(l, '2026-01', 650)).toBe(350)
    expect(valorEn(l, '2026-04', 650)).toBe(500)
    expect(valorEn(l, '2026-10', 650)).toBe(650)
  })
})
