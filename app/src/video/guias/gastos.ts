import type { Escena, GuiaVideo, Pieza } from '../tipos'

const pestanas = (on: number): Pieza => ({ k: 'pestanas', g: 'pestanas', l: [{ t: 'Gastos del mes' }, { t: 'Gastos fijos', g: 'pFijos' }, { t: 'Costo y ganancia por cliente', g: 'pClientes' }], on })

const fijosPendientes: Pieza[] = [
  { k: 'subtitulo', g: 'pendientes', t: 'Gastos fijos por registrar este mes' },
  { k: 'tabla', cab: ['Gasto fijo', 'Día', 'Monto'], filas: [{ c: ['Internet de la oficina', '5', 'Q 350.00'], acc: [{ t: 'Registrar', g: 'registrar1' }] }] },
]

const tabla = (marcadas: boolean): Pieza => ({
  k: 'tabla',
  g: 'tabla',
  cab: ['Fecha', 'Descripción', 'Categoría', 'Negocio', 'Factura', 'Monto'],
  filas: [
    { c: [`${marcadas ? '☑ ' : ''}03 nov 2026`, 'Hosting anual', 'Hosting y dominios', 'Monterroso Dev Studio', 'A-1520', 'Q 1,350.00'], acc: [{ t: 'Editar', g: 'lapiz1' }, { t: 'Quitar' }] },
    { c: [`${marcadas ? '☑ ' : ''}11 nov 2026`, 'Publicidad en redes', 'Publicidad', 'Hogar Canela', 'Sin factura', 'Q 400.00'], acc: [{ t: 'Editar' }, { t: 'Quitar' }] },
  ],
  pie: ['Total', '', '', '', '', 'Q 1,750.00'],
})

const delMes = (marcadas = false, conFijos = true): Escena => ({
  etiqueta: 'Empresa',
  titulo: 'Gastos',
  acciones: [{ t: 'Nuevo gasto', g: 'nuevo', p: true }],
  piezas: [
    { k: 'campos', g: 'mes', l: [{ et: 'Mes', v: 'noviembre 2026' }] },
    pestanas(0),
    ...(conFijos ? fijosPendientes : []),
    { k: 'busca', g: 'busca', t: 'Descripción, proveedor, NIT o factura' },
    { k: 'chips', g: 'chips', l: [{ t: 'Todos', on: true }, { t: 'Monterroso Dev Studio' }, { t: 'Hogar Canela' }, { t: 'Salario' }] },
    { k: 'botones', l: marcadas ? [{ t: 'Desmarcar todas' }, { t: 'Quitar las marcadas · 2', g: 'quitarMarcadas' }] : [{ t: 'Marcar todas · 2', g: 'marcarTodas' }] },
    tabla(marcadas),
  ],
})

const guia: GuiaVideo = {
  ruta: '/gastos',
  menu: 'Gastos',
  caps: [
    {
      t: '1 · Registrar gastos',
      e0: delMes(),
      tomas: [
        { t: 'Elige el mes con las flechas del selector de mes.', en: 'mes' },
        { t: 'Usa las pestañas «Gastos del mes», «Gastos fijos» y «Costo y ganancia por cliente».', en: 'pestanas', ms: 4200 },
        { t: 'Toca «Nuevo gasto» para registrar un gasto; en «De dónde salió el dinero» eliges la cuenta o caja.', en: 'nuevo' },
        { t: 'Si aparece «Gastos fijos por registrar este mes», toca «Registrar» en cada uno.', en: 'registrar1', clic: true, luego: { ...delMes(false, false), piezas: [{ k: 'ok', g: 'listo', t: 'Internet de la oficina registrado en el mes.' }, ...delMes(false, false).piezas] } },
        { t: 'Escribe en el buscador o toca «Todos» o un negocio para filtrar.', en: 'chips' },
      ],
    },
    {
      t: '2 · Corregir y quitar',
      e0: delMes(false, false),
      tomas: [
        { t: 'Cada gasto se edita con su lápiz.', en: 'lapiz1' },
        { t: 'Para varios, toca «Marcar todas · 2».', en: 'marcarTodas', clic: true, luego: delMes(true, false) },
        { t: 'Luego «Quitar las marcadas» para quitarlos juntos.', en: 'quitarMarcadas' },
      ],
    },
    {
      t: '3 · Gastos fijos y clientes',
      e0: delMes(false, false),
      tomas: [
        { t: 'Toca «Gastos fijos».', en: 'pFijos', clic: true, luego: { acciones: [{ t: 'Gasto fijo', g: 'nuevoFijo', p: true }], piezas: [pestanas(1), { k: 'tabla', g: 'tablaFijos', cab: ['Nombre', 'Día', 'Categoría', 'Negocio', 'Monto'], filas: [{ c: ['Internet de la oficina', '5', 'Servicios', 'Monterroso Dev Studio', 'Q 350.00'], acc: [{ t: 'Editar' }, { t: 'Quitar' }] }] }] } },
        { t: 'Toca «Gasto fijo» para agregar uno que se repite cada mes.', en: 'nuevoFijo' },
        { t: 'En «Costo y ganancia por cliente» ves lo que te deja cada cliente.', en: 'pClientes', clic: true, luego: { acciones: [{ t: 'Nuevo gasto', p: true }], piezas: [pestanas(2), { k: 'tabla', g: 'porCliente', cab: ['Cliente', 'Ingresos', 'Costo', 'Ganancia'], filas: [{ c: ['Panadería La Espiga', 'Q 2,200.00', 'Q 480.00', 'Q 1,720.00'] }] }] } },
      ],
    },
  ],
}

export default guia
