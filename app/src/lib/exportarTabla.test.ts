import { describe, expect, it } from 'vitest'
import { armarExport, exportCSV, exportHtml } from './exportarTabla'

const cab = ['Cliente', 'Debe', 'Mensualidad']
describe('exportar tablas', () => {
  it('agrega la fila Total con la suma de lo que se exporta', () => {
    const r = armarExport({ titulo: 'Clientes', cab, secciones: [{ filas: [['A', 'Q 100.50', 'Q 350.00'], ['B', '—', 'Q 1,000.00']] }] })
    expect(r.at(-1)).toEqual({ tipo: 'total', c: ['Total · 2', 'Q 100.50', 'Q 1,350.00'] })
  })
  it('pone subtotal por grupo y total general', () => {
    const r = armarExport({ titulo: 'Cobros', cab, secciones: [{ titulo: 'Vencido', filas: [['A', 'Q 10.00', 'Q 1.00']] }, { titulo: 'Por cobrar', filas: [['B', 'Q 5.25', 'Q 2.00'], ['C', 'Q 4.75', 'Q 3.00']] }] })
    expect(r.filter((x) => x.tipo === 'subtotal').map((x) => x.c)).toEqual([['Subtotal Vencido', 'Q 10.00', 'Q 1.00'], ['Subtotal Por cobrar', 'Q 10.00', 'Q 5.00']])
    expect(r.at(-1)?.c).toEqual(['Total · 3', 'Q 20.00', 'Q 6.00'])
  })
  it('respeta un pie propio y en Excel deja los montos como número', () => {
    const csv = exportCSV({ titulo: 'P', cab: ['Categoría', 'Real'], secciones: [{ filas: [['X', 'Q 1,250.50']], pie: ['Total', 'Q 1,250.50'] }] })
    expect(csv).toEqual([['Categoría', 'Real'], ['X', 1250.5], ['Total', 1250.5]])
  })
  it('el PDF lleva la fila total', () => {
    expect(exportHtml({ titulo: 'G', cab: ['Gasto', 'Monto'], secciones: [{ filas: [['a', 'Q 1.00'], ['b', 'Q 2.00']] }] })).toContain('Q 3.00')
  })
})
