import type { Capitulo, Escena, Pieza } from './tipos'

export function capsResumen(nombre: string, que: string): Capitulo[] {
  const kpis: Pieza = { k: 'cifras', g: 'kpis', l: [
    { et: 'Entró', v: 'Q 4,200.00', sub: '12 % vs oct.', g: 'entro' },
    { et: 'Me deben', v: 'Q 1,050.00', sub: '1 vencido · 3 en total', g: 'deben' },
    { et: 'Gastos', v: 'Q 1,350.00', sub: '5 % vs oct.' },
    { et: 'Utilidad', v: 'Q 2,850.00', sub: '18 % vs oct.' },
  ] }
  const tareas: Pieza[] = [
    { k: 'subtitulo', g: 'tareas', t: 'Lo que toca hacer' },
    { k: 'tabla', g: 'listaTareas', cab: ['Pendiente', 'Detalle'], filas: [
      { c: ['1 cobro vencido', 'Q 700.00'], acc: [{ t: 'Cobrar', g: 'cobrar' }] },
      { c: ['Sin presupuesto para noviembre', 'pon cuánto piensas ganar y gastar'], acc: [{ t: 'Ponerlo' }] },
    ] },
  ]
  const atajos: Pieza = { k: 'botones', g: 'atajos', l: [{ t: 'Lo que me deben' }, { t: 'Pagos que recibí' }, { t: 'Gastos' }, { t: 'Presupuesto' }] }
  const mes: Pieza[] = [
    { k: 'subtitulo', g: 'movs', t: 'Últimos movimientos' },
    { k: 'tabla', cab: ['', 'Detalle', 'Monto'], filas: [{ c: ['+', 'Panadería La Espiga · 26 nov 2026', 'Q 700.00'] }, { c: ['−', 'Internet · 25 nov 2026', '− Q 120.00'] }] },
    { k: 'subtitulo', g: 'comoVa', t: 'Cómo va el mes' },
    { k: 'texto', g: 'barras', t: 'Entró Q 4,200.00 de Q 5,000.00 que planeaste · Gastó Q 1,350.00 de Q 2,000.00 que planeaste' },
  ]
  const e = (piezas: Pieza[]): Escena => ({ etiqueta: 'Resumen · Noviembre 2026', titulo: nombre, acciones: [{ t: 'Mes anterior', g: 'mesAntes' }], piezas: [{ k: 'texto', t: que }, ...piezas] })
  return [
    {
      t: '1 · Las cifras del mes',
      e0: e([kpis]),
      tomas: [
        { t: `Este es el Resumen de ${nombre}: todo lo del mes en una sola pantalla.`, ms: 3800 },
        { t: 'Arriba: lo que entró, lo que te deben, los gastos y la utilidad. La flechita compara con el mes pasado.', en: 'kpis', ms: 4600 },
        { t: 'Toca una cifra para abrir su pantalla. «Me deben» abre la lista de cobros de este negocio.', en: 'deben' },
        { t: 'Con las flechas del mes ves el Resumen de otro mes.', en: 'mesAntes' },
      ],
    },
    {
      t: '2 · Lo que toca hacer',
      e0: e([...tareas, atajos]),
      tomas: [
        { t: '«Lo que toca hacer» junta lo pendiente: cobros vencidos, gastos fijos sin registrar, presupuesto sin poner.', en: 'tareas', ms: 4600 },
        { t: 'Cada pendiente tiene su botón; «Cobrar» te lleva directo a cobrarlo.', en: 'cobrar' },
        { t: 'Si no hay nada, sale «Todo al día».', en: 'listaTareas' },
        { t: 'Debajo están los atajos a las otras partes del negocio.', en: 'atajos' },
      ],
    },
    {
      t: '3 · Cómo va el mes',
      e0: e(mes),
      tomas: [
        { t: '«Últimos movimientos» muestra lo último que entró (+) y salió (−).', en: 'movs', ms: 4200 },
        { t: '«Cómo va el mes» compara lo que entró y gastaste con lo que planeaste en el presupuesto.', en: 'barras', ms: 4600 },
      ],
    },
  ]
}
