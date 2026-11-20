import { describe, expect, it } from 'vitest'
import { aCSV, leerCSV } from './csv'
import { importarShopify, margen, utilidadVenta } from './shopify'
import type { Producto } from './tipos'

const csv = [
  'Name,Email,Financial Status,Total,Shipping,Created at,Lineitem quantity,Lineitem name,Lineitem sku,Billing Name,Cancelled at',
  '#1001,a@x.com,paid,250.00,25.00,2026-11-02 10:00:00 -0600,2,"Taza, grande",TZ-1,Ana López,',
  '#1001,,,,,2026-11-02 10:00:00 -0600,1,Plato,PL-1,,',
  '#1002,b@x.com,refunded,99.00,0,2026-11-03 09:00:00 -0600,1,Plato,PL-1,Luis,2026-11-04',
  '#1000,c@x.com,paid,50.00,0,2026-11-01 09:00:00 -0600,1,Plato,PL-1,Eva,',
].join('\n')

const productos: Producto[] = [
  { id: '1', sku: 'TZ-1', nombre: 'Taza', costo: 40, precio: 90, envio_estimado: 0, activo: true, compartir: false },
  { id: '2', sku: null, nombre: 'Plato', costo: 30.5, precio: 60, envio_estimado: 0, activo: true, compartir: false },
]

describe('importar pedidos de Shopify', () => {
  it('agrupa las líneas de un pedido y calcula el costo con los productos', () => {
    const r = importarShopify(csv, [], productos)
    const p = r.nuevos.find((x) => x.pedido === '#1001')
    expect(p).toMatchObject({ fecha: '2026-11-02', cantidad: 3, precio_venta: 250, envio: 25, costo_producto: 110.5, cliente_nombre: 'Ana López', estado: 'entregado' })
    expect(p?.descripcion).toBe('Taza, grande ×2, Plato')
  })

  it('no duplica los pedidos que ya están', () => {
    const r = importarShopify(csv, ['#1000'], productos)
    expect(r.repetidos).toEqual(['#1000'])
    expect(r.nuevos.map((x) => x.pedido)).toEqual(['#1001', '#1002'])
  })

  it('los cancelados entran como devueltos y sin utilidad', () => {
    const r = importarShopify(csv, [], productos)
    const p = r.nuevos.find((x) => x.pedido === '#1002')!
    expect(p.estado).toBe('devuelto')
    expect(utilidadVenta(p)).toBe(0)
  })

  it('rechaza un archivo que no es de Shopify', () => {
    expect(importarShopify('a,b\n1,2', [], []).errores[0]).toMatch(/Shopify/)
  })

  it('utilidad y margen', () => {
    expect(utilidadVenta({ precio_venta: 250, costo_producto: 110.5, envio: 25, comision: 10, otros: 0, estado: 'entregado' })).toBe(104.5)
    expect(margen(90, 40)).toBe(55.6)
  })

  it('CSV ida y vuelta con comas y comillas', () => {
    const t = aCSV([['a', 'b, c', 'd "e"'], [1, null, 2]])
    expect(leerCSV(t)).toEqual([['a', 'b, c', 'd "e"'], ['1', '', '2']])
  })
})
