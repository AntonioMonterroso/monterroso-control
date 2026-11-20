import type { Escena, GuiaVideo, Pieza } from '../tipos'

const tabla = (marcadas: boolean): Pieza => ({
  k: 'tabla',
  g: 'tabla',
  cab: ['Producto', 'Costo', 'Precio', 'Margen', 'Página'],
  filas: [
    { c: [`${marcadas ? '☑ ' : ''}Juego de sábanas`, 'Q 190.00', 'Q 325.00', '35.4 %', 'Compartido'], acc: [{ t: 'Editar', g: 'lapiz1' }, { t: 'Quitar', g: 'bote1' }] },
    { c: [`${marcadas ? '☑ ' : ''}Lámpara de mesa`, 'Q 240.00', 'Q 400.00', '33.8 %', 'No'], acc: [{ t: 'Editar' }, { t: 'Quitar' }] },
  ],
})

const pantalla = (marcadas = false): Escena => ({
  etiqueta: 'Hogar Canela',
  titulo: 'Productos',
  acciones: [{ t: 'Nuevo producto', g: 'nuevo', p: true }],
  piezas: [
    { k: 'busca', g: 'busca', t: 'Nombre o SKU' },
    { k: 'botones', l: marcadas ? [{ t: 'Desmarcar todas' }, { t: 'Quitar las marcadas · 2', g: 'quitarMarcadas' }] : [{ t: 'Marcar todas · 2', g: 'marcarTodas' }] },
    tabla(marcadas),
  ],
})

const guia: GuiaVideo = {
  ruta: '/tienda/productos',
  menu: 'Productos',
  caps: [
    {
      t: '1 · Tus productos',
      e0: pantalla(),
      tomas: [
        { t: 'Toca «Nuevo producto» para agregar un producto.', en: 'nuevo' },
        { t: 'Escribe el nombre o el SKU en el buscador.', en: 'busca' },
        { t: 'Edita un producto con su lápiz; ahí también lo marcas para compartirlo con la página.', en: 'lapiz1', clic: true, luego: { hoja: { titulo: 'Editar producto', piezas: [{ k: 'campos', g: 'form', l: [{ et: 'Nombre', v: 'Juego de sábanas' }, { et: 'Costo', v: 'Q 190.00' }, { et: 'Precio de venta', v: 'Q 325.00' }, { et: 'Compartir este precio con la página', v: 'Sí' }] }], pie: [{ t: 'Cancelar' }, { t: 'Guardar', g: 'guardar', p: true }] } } },
        { t: 'Toca «Guardar».', en: 'guardar', clic: true, luego: { hoja: null } },
        { t: 'Quitar un producto se puede deshacer y no cambia los pedidos ya registrados.', en: 'bote1' },
        { t: 'Para varios, toca «Marcar todas · 2».', en: 'marcarTodas', clic: true, luego: pantalla(true) },
        { t: 'Luego «Quitar las marcadas» para quitarlos juntos.', en: 'quitarMarcadas' },
      ],
    },
  ],
}

export default guia
