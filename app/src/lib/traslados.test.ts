import { describe, expect, it } from 'vitest'
import { pendienteAl, pendientesTrasladar, totalPendiente, type Entrada } from './traslados'

const e = (id: string, fecha: string, monto: number, destino: string | null, negocio = 'dev', forma: string | null = 'transferencia'): Entrada => ({ id, fecha, monto, destino, forma, negocio_id: negocio, texto: id })

describe('cobrado en cuenta personal: pendiente de pasar a la S.A.', () => {
  const l = [e('g1', '2026-06-10', 500, 'p:mia'), e('g2', '2026-08-10', 300, 'p:mia'), e('g3', '2026-08-11', 200, 's:banco'), e('g4', '2026-08-12', 100, 'p:mia', 'canela'), e('g5', '2026-09-01', 250, 'p:mia', 'dev', 'anticipo')]
  it('solo cuenta pagos de negocios de la S.A., desde su inicio, en cuenta personal', () => {
    expect(pendientesTrasladar(l, ['dev'], '2026-07-01', []).map((x) => x.id)).toEqual(['g2'])
  })
  it('lo trasladado ya no está pendiente', () => {
    expect(totalPendiente(pendientesTrasladar(l, ['dev'], '2026-07-01', [{ id: 't1', fecha: '2026-09-01', monto: 300, de_destino: 'p:mia', banco_id: 'b', pagos: ['g2'], nota: null, creado: '' }]))).toBe(0)
  })
  it('al cierre de un mes solo cuenta lo trasladado hasta esa fecha', () => {
    const t = [{ id: 't1', fecha: '2026-09-01', monto: 300, de_destino: 'p:mia', banco_id: 'b', pagos: ['g2'], nota: null, creado: '' }]
    expect(pendienteAl(l, ['dev'], '2026-07-01', t, '2026-08-31')).toBe(300)
    expect(pendienteAl(l, ['dev'], '2026-07-01', t, '2026-09-30')).toBe(0)
  })
  it('sin S.A. no hay nada pendiente', () => {
    expect(pendientesTrasladar(l, ['dev'], null, [])).toEqual([])
  })
})
