import type { Escena, GuiaVideo, Pieza } from '../tipos'

const acciones = [{ t: 'Excel', g: 'excel' }, { t: 'PDF', g: 'pdf' }]

const pestanas = (on: number): Pieza => ({ k: 'pestanas', g: 'pestanas', l: [{ t: 'Estado de resultados', g: 'pResultados' }, { t: 'Flujo de caja', g: 'pFlujo' }, { t: 'Por forma y cuenta', g: 'pDinero' }, { t: 'Ganancia por cliente', g: 'pClientes' }], on })

const herramientas: Pieza[] = [
  { k: 'chips', g: 'anios', l: [{ t: '2026', on: true }, { t: '2025' }] },
  { k: 'chips', g: 'negocios', l: [{ t: 'Todos', on: true }, { t: 'Monterroso Dev Studio' }, { t: 'Hogar Canela' }] },
]

const resultados = (): Escena => ({
  etiqueta: 'Todos los negocios',
  titulo: 'Reportes',
  acciones,
  piezas: [
    pestanas(0),
    ...herramientas,
    { k: 'cifras', g: 'kpis', l: [{ et: 'Ingresos 2026', v: 'Q 48,600.00' }, { et: 'Gastos 2026', v: 'Q 19,350.00' }, { et: 'Utilidad 2026', v: 'Q 29,250.00' }] },
    { k: 'tabla', g: 'mesAMes', cab: ['Mes', 'Ingresos', 'Gastos', 'Utilidad'], filas: [{ c: ['Octubre', 'Q 4,350.00', 'Q 1,620.00', 'Q 2,730.00'] }, { c: ['Noviembre', 'Q 4,200.00', 'Q 1,350.00', 'Q 2,850.00'] }] },
  ],
})

const dinero: Partial<Escena> = {
  piezas: [
    pestanas(2),
    ...herramientas,
    { k: 'campos', g: 'filtros', l: [{ et: 'Forma de pago', v: 'Todas' }, { et: 'Dónde cayó', v: 'Todas' }] },
    { k: 'tabla', g: 'porForma', cab: ['Forma', 'Monto'], filas: [{ c: ['Transferencia', 'Q 31,200.00'] }, { c: ['Efectivo', 'Q 9,400.00'] }, { c: ['Depósito', 'Q 8,000.00'] }], pie: ['Total', 'Q 48,600.00'] },
    { k: 'tabla', g: 'porCuenta', cab: ['Cuenta', 'Monto'], filas: [{ c: ['Banco Uno · 4821', 'Q 29,850.00'] }, { c: ['Banco Dos · 1290', 'Q 9,350.00'] }, { c: ['Efectivo / caja', 'Q 9,400.00'] }], pie: ['Total', 'Q 48,600.00'] },
  ],
}

const guia: GuiaVideo = {
  ruta: '/reportes',
  menu: 'Reportes',
  caps: [
    {
      t: '1 · Estado de resultados',
      e0: resultados(),
      tomas: [
        { t: 'Las pestañas cambian el reporte.', en: 'pestanas' },
        { t: 'Toca el año que quieres ver.', en: 'anios' },
        { t: '«Todos» o un negocio para ver solo sus números.', en: 'negocios' },
        { t: 'Ves ingresos, gastos y utilidad del año.', en: 'kpis', ms: 4200 },
        { t: 'La tabla «Mes a mes» compara cada mes.', en: 'mesAMes' },
      ],
    },
    {
      t: '2 · Por forma y cuenta',
      e0: resultados(),
      tomas: [
        { t: 'Toca «Por forma y cuenta».', en: 'pDinero', clic: true, luego: dinero },
        { t: 'Filtra por forma de pago o por dónde cayó.', en: 'filtros' },
        { t: '«Por forma de pago» suma lo que entró en transferencia, efectivo y demás.', en: 'porForma' },
        { t: '«Por cuenta de destino» suma lo que cayó en cada cuenta.', en: 'porCuenta' },
        { t: '«Excel» baja el reporte que ves; «PDF» lo abre para guardarlo o imprimirlo.', en: 'excel' },
      ],
    },
  ],
}

export default guia
