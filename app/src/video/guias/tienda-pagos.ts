import type { Escena, GuiaVideo, Pieza } from '../tipos'

const tabla: Pieza = {
  k: 'tabla',
  g: 'tabla',
  cab: ['Fecha', 'Medio', 'Pedidos', 'Monto'],
  filas: [
    { c: ['15 nov 2026', 'Shopify', '#1021', 'Q 325.00'], acc: [{ t: 'Editar', g: 'lapiz1' }, { t: 'Quitar', g: 'bote1' }] },
    { c: ['18 nov 2026', 'Contra entrega', '#1024', 'Q 200.00'], acc: [{ t: 'Editar' }, { t: 'Quitar' }] },
  ],
  pie: ['Total del mes', '', '', 'Q 525.00'],
}

const pantalla = (): Escena => ({
  etiqueta: 'Hogar Canela',
  titulo: 'Pagos de la tienda',
  acciones: [{ t: 'Registrar pago', g: 'registrar', p: true }],
  piezas: [{ k: 'campos', g: 'mes', l: [{ et: 'Mes', v: 'noviembre 2026' }] }, tabla],
})

const guia: GuiaVideo = {
  ruta: '/tienda/pagos',
  menu: 'Pagos',
  caps: [
    {
      t: '1 · Registrar un pago',
      e0: pantalla(),
      tomas: [
        { t: 'Elige el mes con las flechas del selector de mes.', en: 'mes' },
        { t: 'Toca «Registrar pago» para anotar lo que entró y ligarlo a sus pedidos.', en: 'registrar', clic: true, luego: { hoja: { titulo: 'Registrar pago de la tienda', piezas: [{ k: 'campos', g: 'datos', l: [{ et: 'Fecha', v: '20 nov 2026' }, { et: 'Medio', v: 'Shopify' }, { et: 'Referencia', v: '' }] }, { k: 'campos', g: 'destino', l: [{ et: 'Dónde cayó', v: 'Banco Uno · 4821' }] }, { k: 'campos', g: 'comprobante', l: [{ et: 'Comprobante', v: 'Elegir, arrastrar o pegar (Ctrl/⌘ + V)' }] }, { k: 'tabla', g: 'pedidos', cab: ['Pedido', 'Debe', 'Monto'], filas: [{ c: ['☑ #1024 · 17 nov 2026', 'Q 200.00', 'Q 200.00'] }, { c: ['#1025 · 19 nov 2026', 'Q 275.00', ''] }] }], pie: [{ t: 'Cancelar' }, { t: 'Registrar · Q 200.00', g: 'guardar', p: true }] } } },
        { t: 'En la ventana elige la fecha y el «Medio».', en: 'datos' },
        { t: 'En «Dónde cayó» elige la cuenta a la que entró el dinero.', en: 'destino' },
        { t: 'En «Comprobante» elige el archivo, arrástralo o pégalo con Ctrl/⌘ + V.', en: 'comprobante', ms: 4200 },
        { t: 'Marca los pedidos que cubre el pago.', en: 'pedidos' },
        { t: 'Toca «Registrar» para guardarlo.', en: 'guardar', clic: true, luego: { hoja: null } },
      ],
    },
    {
      t: '2 · Corregir o quitar',
      e0: pantalla(),
      tomas: [
        { t: 'Edita un pago con su lápiz para corregir la fecha, el medio o la referencia.', en: 'lapiz1' },
        { t: 'Si quitas un pago, pide confirmar.', en: 'bote1', clic: true, luego: { hoja: { titulo: 'Quitar pago', piezas: [{ k: 'texto', g: 'aviso', t: 'Se quita el pago de Q 325.00 del 15 nov 2026 y sus pedidos vuelven a quedar por cobrar.' }], pie: [{ t: 'Cancelar', g: 'cancelar' }, { t: 'Quitar el pago', p: true }] } } },
        { t: 'Sus pedidos vuelven a quedar por cobrar.', en: 'aviso' },
        { t: '«Cancelar» no hace nada.', en: 'cancelar', clic: true, luego: { hoja: null } },
      ],
    },
  ],
}

export default guia
