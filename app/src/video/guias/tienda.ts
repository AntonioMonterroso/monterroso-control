import { capsResumen } from '../resumen'
import type { Escena, GuiaVideo } from '../tipos'

const pantalla = (): Escena => ({
  etiqueta: 'Noviembre 2026',
  titulo: 'Hogar Canela',
  piezas: [
    { k: 'cifras', g: 'kpis', l: [{ et: 'Ventas del mes', v: 'Q 2,450.00', sub: '9 pedidos' }, { et: 'Costo de los pedidos', v: 'Q 1,380.00', sub: 'producto, envío y comisiones' }, { et: 'Utilidad de los pedidos', v: 'Q 1,070.00', sub: 'menos gastos de la tienda: Q 820.00' }, { et: 'Por cobrar', v: 'Q 525.00', sub: '2 pedidos sin pagar completo' }] },
    { k: 'subtitulo', t: 'Pedidos por cobrar' },
    { k: 'botones', l: [{ t: 'Registrar pago', g: 'registrar' }] },
    { k: 'tabla', g: 'tabla', cab: ['Fecha', 'Pedido', 'Estado', 'Venta', 'Debe'], filas: [
      { c: ['14 nov 2026', '#1021 · Juego de sábanas', 'Por cobrar', 'Q 325.00', 'Q 325.00'] },
      { c: ['17 nov 2026', '#1024 · Lámpara de mesa', 'Pago parcial', 'Q 400.00', 'Q 200.00'] },
    ] },
  ],
})

const guia: GuiaVideo = {
  ruta: '/tienda',
  menu: 'Resumen',
  caps: [
    ...capsResumen('Hogar Canela', 'Tu tienda en Shopify con Dropi'),
    {
      t: '4 · El mes de la tienda',
      e0: pantalla(),
      tomas: [
        { t: 'Arriba ves las ventas, el costo, la utilidad y lo que falta cobrar de los pedidos del mes.', en: 'kpis', ms: 4200 },
        { t: 'La tabla «Pedidos por cobrar» lista los pedidos que no se han pagado completos.', en: 'tabla' },
        { t: 'Los encabezados de columna ordenan la lista por fecha, estado o lo que debe.', en: 'tabla' },
        { t: 'Toca «Registrar pago» para ir a registrar un pago de la tienda.', en: 'registrar' },
      ],
    },
  ],
}

export default guia
