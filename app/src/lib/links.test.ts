import { describe, expect, it } from 'vitest'
import { codigoValido, generarCodigo, limpiarCuerpo, publicoDeLink, whatsappNegocio, type LinkPublico } from './links'

const l = (extra: Partial<LinkPublico> = {}): LinkPublico => ({ id: 'l1', codigo: generarCodigo(), tipo: 'cotizacion', documento_id: 'd1', cliente_id: 'c1', pago_id: null, titulo: 'Cotización', area: 'web', cuerpo: '<h1>Cotización</h1>', vence: null, estado: 'activo', whatsapp: null, visto_primero: null, vistas: 0, aceptado_por: null, aceptado_el: null, creado: '', ...extra })

describe('documentos en la web', () => {
  it('el código es largo, aleatorio y válido', () => {
    const a = generarCodigo(), b = generarCodigo()
    expect(a).not.toBe(b)
    expect(codigoValido(a)).toBe(true)
    expect(a.length).toBe(40)
  })
  it('lo público no trae datos internos', () => {
    const p = publicoDeLink(l(), '2026-11-20')
    expect(p.estado).toBe('activo')
    expect(Object.keys(p)).not.toContain('cliente_id')
    expect(Object.keys(p)).not.toContain('documento_id')
    expect(Object.keys(p)).not.toContain('codigo')
  })
  it('el número de cotización y el teléfono personal no salen', () => {
    expect(limpiarCuerpo('<p>No. 2026-005</p><p>Tel. 3764 5139</p>')).toBe('<p></p><p>Tel. </p>')
    expect(whatsappNegocio('3764 5139')).toBeNull()
    expect(whatsappNegocio('5555 0101')).toBe('50255550101')
  })
  it('los contratos no salen nunca, aunque haya código', () => {
    expect(publicoDeLink(l({ tipo: 'acuerdo' as never }), '2026-11-20').estado).toBe('no_existe')
  })
  it('retirado no existe y pasado su vigencia está vencido', () => {
    expect(publicoDeLink(l({ estado: 'retirado' }), '2026-11-20').estado).toBe('no_existe')
    expect(publicoDeLink(l({ vence: '2026-11-01' }), '2026-11-20')).toMatchObject({ estado: 'vencido' })
    expect(publicoDeLink(undefined, '2026-11-20').estado).toBe('no_existe')
  })
})
