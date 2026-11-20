import { describe, expect, it } from 'vitest'
import { fechasDeCobro, mensualidadDelMes, problemasMensualidad, proximoCobro, type DatosMensualidad } from './mensualidad'

const base: DatosMensualidad = { mensualidad: 350, dia_cobro: 31, mensualidad_inicio: '2026-01-10', mensualidad_fin: null, estado: 'en_curso' }

describe('mensualidad', () => {
  it('el día 31 cae en el último día de los meses cortos', () => {
    expect(fechasDeCobro(base, '2026-01-01', '2026-04-30')).toEqual(['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30'])
  })

  it('no cobra antes del inicio en el primer mes', () => {
    const p = { ...base, dia_cobro: 5 }
    expect(fechasDeCobro(p, '2026-01-01', '2026-03-31')).toEqual(['2026-02-05', '2026-03-05'])
  })

  it('respeta la fecha de fin', () => {
    const p = { ...base, dia_cobro: 15, mensualidad_fin: '2026-03-20' }
    expect(fechasDeCobro(p, '2026-01-01', '2026-12-31')).toEqual(['2026-01-15', '2026-02-15', '2026-03-15'])
  })

  it('cruza de año', () => {
    const p = { ...base, dia_cobro: 1, mensualidad_inicio: '2026-11-01' }
    expect(fechasDeCobro(p, '2026-11-01', '2027-02-01')).toEqual(['2026-11-01', '2026-12-01', '2027-01-01', '2027-02-01'])
  })

  it('el próximo cobro es hoy o después', () => {
    const p = { ...base, dia_cobro: 19 }
    expect(proximoCobro(p, '2026-11-19')).toBe('2026-11-19')
    expect(proximoCobro(p, '2026-11-20')).toBe('2026-12-19')
  })

  it('propuestas y cerrados no cobran', () => {
    expect(proximoCobro({ ...base, estado: 'propuesta' }, '2026-11-19')).toBeNull()
    expect(proximoCobro({ ...base, estado: 'cerrado' }, '2026-11-19')).toBeNull()
  })

  it('suma lo que toca cobrar en el mes', () => {
    const lista: DatosMensualidad[] = [
      base,
      { ...base, mensualidad: 150.5, dia_cobro: 10 },
      { ...base, mensualidad: 999, estado: 'propuesta' },
      { ...base, mensualidad: 200, mensualidad_inicio: '2027-01-01' },
    ]
    expect(mensualidadDelMes(lista, 2026, 11)).toBe(500.5)
  })

  it('pide día e inicio si hay mensualidad', () => {
    expect(problemasMensualidad({ ...base, dia_cobro: null, mensualidad_inicio: null })).toHaveLength(2)
    expect(problemasMensualidad({ ...base, mensualidad: 0, dia_cobro: null })).toEqual([])
  })
})
