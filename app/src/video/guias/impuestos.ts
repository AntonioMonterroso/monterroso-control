import type { Escena, GuiaVideo, Pieza } from '../tipos'

const pestanas = (on: number): Pieza => ({ k: 'pestanas', g: 'pestanas', l: [{ t: 'Resumen del mes' }, { t: 'Facturas', g: 'pFacturas' }, { t: 'Régimen', g: 'pRegimen' }], on })
const mes: Pieza = { k: 'campos', g: 'mes', l: [{ et: 'Mes', v: 'noviembre 2026' }] }

const resumen = (): Escena => ({
  etiqueta: 'Para tu control, no se presenta nada',
  titulo: 'Impuestos y facturas',
  piezas: [
    mes,
    pestanas(0),
    { k: 'tabla', g: 'resumen', cab: ['Negocio', 'Facturado', 'Compras', 'A pagar'], filas: [
      { c: ['Monterroso Dev Studio · Pequeño contribuyente (5 %)', 'Q 4,200.00', 'Q 1,350.00', 'Q 210.00'] },
      { c: ['Hogar Canela · Pequeño contribuyente (5 %)', 'Q 2,450.00', 'Q 400.00', 'Q 122.50'] },
    ] },
  ],
})

const facturas = (ok = false): Partial<Escena> => ({
  acciones: [{ t: 'Recibida', g: 'recibida' }, { t: 'Emitida', g: 'emitida', p: true }],
  piezas: [
    mes,
    pestanas(1),
    ...(ok ? [{ k: 'ok', g: 'listo', t: '2 facturas recibidas agregadas desde Gastos.' } as Pieza] : [{ k: 'aviso', g: 'aviso', t: '2 gastos del mes tienen número de factura y no están aquí.' } as Pieza, { k: 'botones', l: [{ t: 'Traerlas', g: 'traer' }] } as Pieza]),
    { k: 'busca', t: 'Nombre, NIT o número' },
    { k: 'chips', g: 'chips', l: [{ t: 'Todas', on: true }, { t: 'Emitidas' }, { t: 'Recibidas' }] },
    { k: 'tabla', g: 'tabla', cab: ['Fecha', 'Tipo', 'Número', 'Nombre', 'Total'], filas: [{ c: ['05 nov 2026', 'Emitida', 'A-101', 'Panadería La Espiga', 'Q 700.00'], acc: [{ t: 'Editar' }, { t: 'Quitar' }] }] },
  ],
})

const guia: GuiaVideo = {
  ruta: '/impuestos',
  menu: 'Impuestos y facturas',
  caps: [
    {
      t: '1 · Resumen del mes',
      e0: resumen(),
      tomas: [
        { t: 'Usa las pestañas «Resumen del mes», «Facturas» y «Régimen».', en: 'pestanas' },
        { t: 'Elige el mes con las flechas del selector de mes.', en: 'mes' },
        { t: 'En «Resumen del mes» ves por negocio lo facturado, las compras y lo que toca pagar.', en: 'resumen', ms: 4200 },
      ],
    },
    {
      t: '2 · Facturas',
      e0: resumen(),
      tomas: [
        { t: 'Toca la pestaña «Facturas».', en: 'pFacturas', clic: true, luego: facturas() },
        { t: 'Toca «Emitida» o «Recibida» para agregar una factura.', en: 'emitida' },
        { t: 'Filtra con «Todas», «Emitidas» o «Recibidas».', en: 'chips' },
        { t: 'Si te avisa que hay gastos con número de factura, toca «Traerlas» para crearlas.', en: 'traer', clic: true, luego: facturas(true) },
      ],
    },
    {
      t: '3 · Régimen',
      e0: resumen(),
      tomas: [
        { t: 'Toca la pestaña «Régimen».', en: 'pRegimen', clic: true, luego: { acciones: [{ t: 'Cambiar régimen', g: 'cambiar', p: true }], piezas: [pestanas(2), { k: 'tabla', g: 'vigente', cab: ['Negocio', 'Este mes'], filas: [{ c: ['Monterroso Dev Studio', 'Pequeño contribuyente (5 %)'] }, { c: ['Hogar Canela', 'Pequeño contribuyente (5 %)'] }] }] } },
        { t: 'Aquí ves el régimen vigente de cada negocio este mes.', en: 'vigente' },
        { t: 'Toca «Cambiar régimen» para cambiarlo desde un mes; los meses anteriores se quedan como estaban.', en: 'cambiar', ms: 4200 },
      ],
    },
  ],
}

export default guia
