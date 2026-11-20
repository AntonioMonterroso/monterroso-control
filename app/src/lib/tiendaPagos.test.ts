import { describe, expect, it } from 'vitest'
import { cobrosDeVentas, porCobrarTienda, repartirPago } from './tiendaPagos'
import type { VentaTienda } from './tipos'

const v = (id: string, precio: number, estado: VentaTienda['estado'] = 'entregado'): VentaTienda => ({ id, pedido: '#' + id, fecha: '2026-11-01', cliente_nombre: null, descripcion: 'x', cantidad: 1, precio_venta: precio, costo_producto: 0, envio: 0, comision: 0, otros: 0, estado, origen: 'manual' })

describe('pagos de la tienda', () => {
  it('estado por pedido: pagado, parcial, por cobrar y devuelto', () => {
    const c = cobrosDeVentas([v('a', 100), v('b', 200), v('c', 50), v('d', 80, 'devuelto')], [
      { id: '1', pago_id: 'p', venta_id: 'a', monto: 100 },
      { id: '2', pago_id: 'p', venta_id: 'b', monto: 120.5 },
    ])
    expect(c.map((x) => x.estado)).toEqual(['pagado', 'parcial', 'por_cobrar', 'devuelto'])
    expect(c[1].saldo).toBe(79.5)
    expect(porCobrarTienda(c)).toBe(129.5)
  })

  it('una liquidación se reparte en orden sin pasarse', () => {
    expect(repartirPago(250, [{ id: 'a', saldo: 100 }, { id: 'b', saldo: 200 }, { id: 'c', saldo: 10 }])).toEqual([{ venta_id: 'a', monto: 100 }, { venta_id: 'b', monto: 150 }])
  })
})
