import type { Escena, GuiaVideo, Pieza } from '../tipos'

const tablas = (montoHosting: string, conLapiz: boolean): Pieza[] => [
  { k: 'tabla', g: 'ingresos', cab: ['Categoría', 'Presupuesto', 'Real', 'Diferencia'], filas: [{ c: ['Mensualidades', 'Q 4,000.00', 'Q 4,200.00', 'Q 200.00'], acc: conLapiz ? [{ t: 'Editar' }] : [] }] },
  { k: 'tabla', g: 'gastos', cab: ['Categoría', 'Presupuesto', 'Real', 'Diferencia'], filas: [
    { c: ['Hosting y dominios', montoHosting, 'Q 450.00', 'Q 150.00'], acc: conLapiz ? [{ t: 'Editar', g: 'lapiz1' }] : [] },
    { c: ['Publicidad', 'Q 700.00', 'Q 800.00', '-Q 100.00'], acc: conLapiz ? [{ t: 'Editar' }] : [] },
  ] },
]

const pantalla = (todos = false, monto = 'Q 600.00', ok = false): Escena => ({
  etiqueta: 'Planeado contra real',
  titulo: 'Presupuestos',
  acciones: [{ t: 'Copiar mes anterior', g: 'copiar' }],
  piezas: [
    { k: 'campos', g: 'mes', l: [{ et: 'Mes', v: 'noviembre 2026' }] },
    { k: 'chips', g: 'chips', l: [{ t: 'Monterroso Dev Studio', on: !todos }, { t: 'Hogar Canela' }, { t: 'Salario' }, { t: 'Todos juntos', on: todos, g: 'todos' }] },
    ...(ok ? [{ k: 'ok', g: 'listo', t: 'Se copiaron 4 montos del mes anterior.' } as Pieza] : []),
    { k: 'cifras', g: 'kpis', l: [{ et: 'Ingresos', v: 'Q 4,200.00', sub: 'de Q 4,000.00 planeados' }, { et: 'Gastos', v: 'Q 1,250.00', sub: 'de Q 1,300.00 planeados' }, { et: 'Utilidad real', v: 'Q 2,950.00', sub: 'planeada Q 2,700.00' }] },
    ...tablas(monto, !todos),
  ],
})

const guia: GuiaVideo = {
  ruta: '/presupuestos',
  menu: 'Presupuestos',
  caps: [
    {
      t: '1 · Planeado contra real',
      e0: pantalla(),
      tomas: [
        { t: 'Elige el mes con las flechas del selector de mes.', en: 'mes' },
        { t: 'Toca un negocio para poner su presupuesto.', en: 'chips' },
        { t: 'Arriba ves ingresos, gastos y utilidad reales contra lo planeado.', en: 'kpis', ms: 4200 },
        { t: '«Todos juntos» muestra la suma de todos los negocios, solo para ver.', en: 'todos', clic: true, luego: pantalla(true) },
      ],
    },
    {
      t: '2 · Poner los montos',
      e0: pantalla(),
      tomas: [
        { t: 'Toca el lápiz de una categoría para poner su monto presupuestado.', en: 'lapiz1', clic: true, luego: { hoja: { titulo: 'Monto presupuestado', piezas: [{ k: 'campos', g: 'monto', l: [{ et: 'Monto del mes', v: 'Q 650.00' }] }], pie: [{ t: 'Cancelar' }, { t: 'Guardar', g: 'guardar', p: true }] } } },
        { t: 'Pon 0 para quitarlo.', en: 'monto' },
        { t: 'Toca «Guardar».', en: 'guardar', clic: true, luego: { ...pantalla(false, 'Q 650.00'), hoja: null } },
        { t: 'Toca «Copiar mes anterior» para traer los montos del mes pasado sin tocar los que ya pusiste.', en: 'copiar', clic: true, luego: pantalla(false, 'Q 650.00', true) },
      ],
    },
  ],
}

export default guia
