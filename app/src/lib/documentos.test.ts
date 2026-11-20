import { describe, expect, it } from 'vitest'
import { htmlDocumento, notaImpuestos, numeroVisible, siguienteNumero, totalRenglones, type Documento } from './documentos'

const base: Documento = { id: 'd', tipo: 'cotizacion', area: 'web', anio: 2026, numero: 3, cliente_id: 'ana', proyecto_id: null, fecha: '2026-11-20', vigencia_dias: 15, titulo: 'Cotización de página web', datos: { renglones: [{ concepto: 'Diseño', cantidad: 1, precio: 1500 }, { concepto: 'Hora de soporte', cantidad: 3, precio: 125.5 }] }, contenido: null, estado: 'borrador' }
const ctx = { cliente: 'Ana', nit: 'CF', proyecto: null, regimen: null, firmante: '', cargo: '', sitio: 'studiomonterroso.com', correo: '' }

describe('documentos', () => {
  it('número correlativo por año y tipo', () => {
    const docs = [{ tipo: 'cotizacion' as const, anio: 2026, numero: 1 }, { tipo: 'cotizacion' as const, anio: 2026, numero: 4 }, { tipo: 'cotizacion' as const, anio: 2025, numero: 9 }, { tipo: 'propuesta' as const, anio: 2026, numero: 7 }]
    expect(siguienteNumero(docs, 'cotizacion', 2026)).toBe(5)
    expect(siguienteNumero(docs, 'cotizacion', 2027)).toBe(1)
    expect(numeroVisible({ anio: 2026, numero: 5 })).toBe('2026-005')
  })

  it('total de la cotización sin perder centavos', () => {
    expect(totalRenglones(base.datos.renglones!)).toBe(1876.5)
  })

  it('arma la cotización con totales y vigencia, sin nombrar el IVA', () => {
    const h = htmlDocumento(base, { ...ctx, regimen: 'pequeno' })
    expect(h).toContain('Q 1,876.50')
    expect(h).toContain('5 de diciembre de 2026')
    expect(h).not.toMatch(/IVA/)
    expect(notaImpuestos('general')).not.toMatch(/IVA/)
  })

  it('el acuerdo lleva la nota de revisar con el abogado', () => {
    expect(htmlDocumento({ ...base, tipo: 'acuerdo', contenido: 'PRIMERA. OBJETO.' }, ctx)).toContain('revíselo con su abogado')
  })
})
