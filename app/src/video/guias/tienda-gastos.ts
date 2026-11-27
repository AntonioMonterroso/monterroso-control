import type { Escena, GuiaVideo, Pieza } from '../tipos'

const pestanas = (on: number): Pieza => ({ k: 'pestanas', g: 'pestanas', l: [{ t: 'Gastos del mes' }, { t: 'Gastos fijos', g: 'pFijos' }], on })

const fijosPendientes: Pieza[] = [
  { k: 'subtitulo', g: 'pendientes', t: 'Gastos fijos por registrar este mes' },
  { k: 'tabla', cab: ['Gasto fijo', 'Día', 'Monto'], filas: [{ c: ['Plan de Shopify', '10', 'Q 295.00'], acc: [{ t: 'Registrar', g: 'registrar1' }] }] },
]

const tabla: Pieza = {
  k: 'tabla',
  g: 'tabla',
  cab: ['Fecha', 'Descripción', 'Categoría', 'Factura', 'Monto'],
  filas: [
    { c: ['06 nov 2026', 'Publicidad en redes', 'Publicidad', 'Sin factura', 'Q 400.00'], acc: [{ t: 'Editar', g: 'lapiz1' }, { t: 'Quitar' }] },
    { c: ['12 nov 2026', 'Empaques', 'Materiales', 'B-220', 'Q 125.00'], acc: [{ t: 'Editar' }, { t: 'Quitar' }] },
  ],
  pie: ['Total', '', '', '', 'Q 525.00'],
}

const delMes = (conFijos = true, ok = false): Escena => ({
  etiqueta: 'Hogar Canela',
  titulo: 'Gastos de la tienda',
  acciones: [{ t: 'Nuevo gasto', g: 'nuevo', p: true }],
  piezas: [
    { k: 'campos', g: 'mes', l: [{ et: 'Mes', v: 'noviembre 2026' }] },
    pestanas(0),
    ...(ok ? [{ k: 'ok', g: 'listo', t: 'Plan de Shopify registrado en el mes.' } as Pieza] : []),
    ...(conFijos ? fijosPendientes : []),
    { k: 'busca', g: 'busca', t: 'Descripción, proveedor, NIT o factura' },
    tabla,
  ],
})

const guia: GuiaVideo = {
  ruta: '/tienda/gastos',
  menu: 'Gastos',
  caps: [
    {
      t: '1 · Gastos del mes',
      e0: delMes(),
      tomas: [
        { t: 'Elige el mes con las flechas del selector de mes.', en: 'mes' },
        { t: 'Usa las pestañas «Gastos del mes» y «Gastos fijos».', en: 'pestanas' },
        { t: 'Toca «Nuevo gasto» para registrar un gasto de la tienda; en «De dónde salió el dinero» eliges la cuenta o caja.', en: 'nuevo' },
        { t: 'Si aparece «Gastos fijos por registrar este mes», toca «Registrar» en cada uno.', en: 'registrar1', clic: true, luego: delMes(false, true) },
        { t: 'Escribe descripción, proveedor, NIT o factura en el buscador; cada gasto se edita con su lápiz.', en: 'lapiz1' },
      ],
    },
    {
      t: '2 · Gastos fijos',
      e0: delMes(false),
      tomas: [
        { t: 'Toca la pestaña «Gastos fijos».', en: 'pFijos', clic: true, luego: { acciones: [{ t: 'Gasto fijo', g: 'nuevoFijo', p: true }], piezas: [pestanas(1), { k: 'tabla', g: 'tablaFijos', cab: ['Nombre', 'Día', 'Categoría', 'Monto'], filas: [{ c: ['Plan de Shopify', '10', 'Suscripciones', 'Q 295.00'], acc: [{ t: 'Editar' }, { t: 'Quitar' }] }] }] } },
        { t: 'Toca «Gasto fijo» para agregar uno que se repite cada mes.', en: 'nuevoFijo' },
        { t: 'Cada mes aparecen en «Gastos del mes» para registrarlos con un toque.', en: 'tablaFijos' },
      ],
    },
  ],
}

export default guia
