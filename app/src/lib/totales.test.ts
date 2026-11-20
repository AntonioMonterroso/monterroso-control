import { describe, expect, it } from 'vitest'
import { columnasDeMonto, montoDeTexto, porcentaje, sumasPorColumna } from './totales'

describe('totales de las tablas', () => {
  it('lee montos con Q, comas, negativos y paréntesis', () => {
    expect(montoDeTexto('Q 1,350.00')).toBe(1350)
    expect(montoDeTexto('-Q 25.50')).toBe(-25.5)
    expect(montoDeTexto('(Q 10.00)')).toBe(-10)
    expect(montoDeTexto('Cliente')).toBeNull()
  })
  it('suma solo las columnas de montos de lo que se ve', () => {
    const filas = [['Cliente A', 'Q 350.00', '2', 'Q 0.10'], ['Cliente B', 'Q 1,250.50', '1', 'Q 0.20'], ['Cliente C', '—', '0', 'Q 0.70']]
    expect(columnasDeMonto(filas)).toEqual([false, true, false, true])
    expect(sumasPorColumna(filas)).toEqual([null, 1600.5, null, 1])
  })
  it('al filtrar suma solo lo filtrado', () => {
    const todas = [['A', 'Q 100.00'], ['B', 'Q 200.00'], ['C', 'Q 300.00']]
    expect(sumasPorColumna(todas.filter((f) => f[0] !== 'B'))).toEqual([null, 400])
  })
  it('porcentaje con un decimal', () => {
    expect(porcentaje(1, 3)).toBe('33.3 %')
    expect(porcentaje(5, 0)).toBe('0.0 %')
  })
})
