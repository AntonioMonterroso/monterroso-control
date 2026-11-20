import { describe, expect, it } from 'vitest'
import { planBorrarCliente } from './clientesBorrar'

const vacio = { trabajos: 0, pagos: 0, contratos: [], facturas: [], cobros: [], modos: [], gastos: [], gastosFijos: [], extra: [] }

describe('borrar o archivar un cliente', () => {
  it('con trabajos o pagos se archiva y dice por qué', () => {
    const p = planBorrarCliente('ana', { ...vacio, trabajos: 2, pagos: 1 })
    expect(p.modo).toBe('archivar')
    expect(p.motivos).toEqual(['2 trabajos', '1 pago'])
    expect(p.borrar).toEqual([])
  })

  it('con contratos o facturas también se archiva', () => {
    expect(planBorrarCliente('ana', { ...vacio, contratos: [{ id: 'k', cliente_id: 'ana' }] }).modo).toBe('archivar')
  })

  it('sin nada se borra: quita sus cobros extra y su ficha, y solo desliga sus gastos', () => {
    const p = planBorrarCliente('ana', { ...vacio, cobros: [{ id: 'x', cliente_id: 'ana' }, { id: 'y', cliente_id: 'otro' }], gastos: [{ id: 'g', cliente_id: 'ana' }], extra: [{ id: 'e', cliente_id: null }] })
    expect(p.modo).toBe('borrar')
    expect(p.borrar).toEqual([{ t: 'ctl_cobros', ids: ['x'] }, { t: 'ctl_cliente_extra', ids: ['e'] }])
    expect(p.desligar).toEqual([{ t: 'ctl_gastos', ids: ['g'] }])
  })
})
