import type { Escena, GuiaVideo, Pieza } from '../tipos'

const tabla = (marcadas: boolean, conImportados = false): Pieza => ({
  k: 'tabla',
  g: 'tabla',
  cab: ['Fecha', 'Pedido', 'Estado', 'Cobro', 'Venta', 'Costo', 'Utilidad'],
  filas: [
    ...(conImportados ? [{ c: [`${marcadas ? '☑ ' : ''}19 nov 2026`, '#1025 · Cortina de lino', 'Pendiente', 'Por cobrar', 'Q 275.00', 'Q 0.00', 'Q 275.00'], g: 'nuevaFila' }] : []),
    { c: [`${marcadas ? '☑ ' : ''}14 nov 2026`, '#1021 · Juego de sábanas', 'Entregado', 'Pagado', 'Q 325.00', 'Q 190.00', 'Q 135.00'], acc: [{ t: 'Editar', g: 'lapiz1' }, { t: 'Quitar' }] },
    { c: [`${marcadas ? '☑ ' : ''}17 nov 2026`, '#1024 · Lámpara de mesa', 'Pendiente', 'Pago parcial', 'Q 400.00', 'Q 240.00', 'Q 160.00'], acc: [{ t: 'Editar' }, { t: 'Quitar' }] },
  ],
})

const pantalla = (marcadas = false, conImportados = false): Escena => ({
  etiqueta: 'Hogar Canela',
  titulo: 'Pedidos',
  acciones: [{ t: 'Importar de Shopify', g: 'importar' }, { t: 'Nuevo pedido', g: 'nuevo', p: true }],
  piezas: [
    { k: 'campos', g: 'mes', l: [{ et: 'Mes', v: 'noviembre 2026' }] },
    { k: 'cifras', l: [{ et: 'Ventas', v: 'Q 725.00' }, { et: 'Costos', v: 'Q 430.00' }, { et: 'Utilidad', v: 'Q 295.00' }] },
    { k: 'busca', g: 'busca', t: 'Pedido, producto o cliente' },
    { k: 'botones', l: marcadas ? [{ t: 'Desmarcar todas' }, { t: 'Quitar las marcadas · 2', g: 'quitarMarcadas' }] : [{ t: 'Marcar todas · 2', g: 'marcarTodas' }] },
    tabla(marcadas, conImportados),
  ],
})

const guia: GuiaVideo = {
  ruta: '/tienda/pedidos',
  menu: 'Pedidos',
  caps: [
    {
      t: '1 · Traer los pedidos',
      e0: pantalla(),
      tomas: [
        { t: 'Elige el mes con las flechas del selector de mes.', en: 'mes' },
        { t: 'Toca «Importar de Shopify» y elige el CSV de pedidos.', en: 'importar', clic: true, luego: { hoja: { titulo: 'Importar pedidos de Shopify', piezas: [{ k: 'texto', g: 'resumenImp', t: '1 pedidos nuevos · 2 ya estaban y no se duplican' }, { k: 'texto', t: '#1025 · Cortina de lino · Q 275.00' }], pie: [{ t: 'Cancelar' }, { t: 'Importar 1 pedidos', g: 'confirmar', p: true }] } } },
        { t: 'Entran solo los nuevos, sin duplicar.', en: 'resumenImp' },
        { t: 'Confirma y el pedido nuevo aparece en la lista.', en: 'confirmar', clic: true, luego: { ...pantalla(false, true), hoja: null } },
        { t: 'Toca «Nuevo pedido» para registrar uno a mano.', en: 'nuevo' },
      ],
    },
    {
      t: '2 · Corregir y quitar',
      e0: pantalla(),
      tomas: [
        { t: 'Escribe el pedido, producto o cliente en el buscador.', en: 'busca' },
        { t: 'Edita un pedido con su lápiz, por ejemplo para poner el costo real.', en: 'lapiz1' },
        { t: 'Para quitar varios, toca «Marcar todas · 2».', en: 'marcarTodas', clic: true, luego: pantalla(true) },
        { t: 'Luego «Quitar las marcadas» para quitarlos juntos.', en: 'quitarMarcadas' },
      ],
    },
  ],
}

export default guia
