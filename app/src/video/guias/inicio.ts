import type { Escena, GuiaVideo, Pieza } from '../tipos'

const kpis: Pieza = {
  k: 'cifras',
  g: 'kpis',
  l: [
    { et: 'Entró este mes', v: 'Q 8,450.00', sub: 'cobros, ventas de la tienda y salario recibido' },
    { et: 'Me deben', v: 'Q 2,100.00', sub: 'hasta fin de mes, con lo vencido' },
    { et: 'Gastos del mes', v: 'Q 3,275.50', sub: 'empresa, clientes, deudas y pedidos' },
    { et: 'Utilidad del mes', v: 'Q 5,174.50', sub: 'lo que entró menos los gastos' },
  ],
}

const chips = (todos: boolean): Pieza => ({ k: 'chips', g: 'chips', l: [{ t: 'Todos', on: todos }, { t: 'Monterroso Dev Studio' }, { t: 'Hogar Canela', on: !todos, g: 'canela' }, { t: 'Salario' }] })

const porNegocio: Pieza = {
  k: 'tabla',
  g: 'porNegocio',
  cab: ['Negocio', 'Ingresos', 'Gastos', 'Utilidad'],
  filas: [
    { c: ['Monterroso Dev Studio', 'Q 4,200.00', 'Q 1,350.00', 'Q 2,850.00'] },
    { c: ['Hogar Canela', 'Q 1,250.00', 'Q 925.50', 'Q 324.50'] },
    { c: ['Salario', 'Q 3,000.00', 'Q 1,000.00', 'Q 2,000.00'] },
  ],
  pie: ['Total', 'Q 8,450.00', 'Q 3,275.50', 'Q 5,174.50'],
}

const presupuesto: Pieza[] = [
  { k: 'subtitulo', g: 'presupuesto', t: 'Presupuesto del mes' },
  { k: 'tabla', g: 'barras', cab: ['Categoría', 'Real', 'Planeado'], filas: [{ c: ['Hosting y dominios', 'Q 450.00', 'Q 600.00'] }, { c: ['Publicidad', 'Q 800.00', 'Q 700.00'] }] },
]

const cobros: Pieza[] = [
  { k: 'subtitulo', g: 'cobros', t: 'Lo que me deben: vencido y esta semana' },
  { k: 'tabla', g: 'listaCobros', cab: ['Cliente', 'Concepto', 'Estado', 'Falta'], filas: [{ c: ['Panadería La Espiga', 'Mensualidad de noviembre', 'Vencido', 'Q 700.00'], g: 'cobro1' }, { c: ['Taller El Pistón', 'Mensualidad de noviembre', 'Por cobrar', 'Q 350.00'] }] },
  { k: 'botones', l: [{ t: 'Ver todo lo que me deben', g: 'verCobros' }] },
]

const avisos: Pieza[] = [
  { k: 'subtitulo', g: 'avisos', t: 'Para no olvidar' },
  { k: 'tabla', cab: ['Aviso', 'Detalle'], filas: [{ c: ['Dominio por renovar', 'vence en 6 días'], acc: [{ t: 'Ver', g: 'ver1' }] }, { c: ['Supabase sin uso', 'se pausa pronto'], acc: [{ t: 'Ver' }] }] },
]

const resumen = (todos = true): Escena => ({
  etiqueta: 'Noviembre 2026',
  titulo: 'Inicio',
  piezas: [chips(todos), kpis, ...(todos ? [porNegocio] : []), ...presupuesto],
})

const guia: GuiaVideo = {
  ruta: '/',
  menu: 'Inicio',
  caps: [
    {
      t: '1 · Los números del mes',
      e0: resumen(),
      tomas: [
        { t: 'Arriba ves el mes en curso: lo que entró, lo que te deben, los gastos y la utilidad del mes.', en: 'kpis', ms: 4200 },
        { t: 'La tabla «Por negocio» compara ingresos, gastos y utilidad de cada negocio cuando está elegido «Todos».', en: 'porNegocio' },
        { t: 'Toca el nombre de un negocio para ver solo sus números.', en: 'canela', clic: true, luego: resumen(false) },
        { t: 'Con un negocio elegido, la tabla «Por negocio» se esconde y los números son solo de ese negocio.', en: 'kpis' },
        { t: 'En «Presupuesto del mes» cada barra muestra lo real contra lo planeado de cada categoría.', en: 'presupuesto' },
      ],
    },
    {
      t: '2 · Lo que me deben y avisos',
      e0: { etiqueta: 'Noviembre 2026', titulo: 'Inicio', piezas: [...avisos, ...cobros] },
      tomas: [
        { t: 'Si aparece «Para no olvidar», toca «Ver» en cada aviso para ir a donde se arregla.', en: 'ver1' },
        { t: '«Lo que me deben: vencido y esta semana» junta lo que urge cobrar.', en: 'cobros' },
        { t: 'Toca el nombre del cliente para abrir su ficha.', en: 'cobro1' },
        { t: 'O toca «Ver todo lo que me deben» para abrir la lista completa.', en: 'verCobros' },
      ],
    },
    {
      t: '3 · Pagos que recibí',
      e0: { etiqueta: 'Noviembre 2026', titulo: 'Inicio', piezas: [{ k: 'subtitulo', g: 'ultimos', t: 'Pagos que recibí' }, { k: 'botones', l: [{ t: 'Ver todos', g: 'verTodos' }] }, { k: 'tabla', g: 'listaPagos', cab: ['Cliente', 'Detalle', 'Monto'], filas: [{ c: ['Panadería La Espiga', 'Mensualidad · 06 nov 2026 · transferencia', 'Q 700.00'], g: 'pago1' }, { c: ['Hogar Canela', 'Pedido #1024 · 18 nov 2026 · efectivo', 'Q 200.00'] }] }] },
      tomas: [
        { t: '«Pagos que recibí» muestra los últimos cinco pagos, con su fecha y forma de pago.', en: 'listaPagos', ms: 4200 },
        { t: 'Toca el nombre del cliente para abrir su ficha.', en: 'pago1' },
        { t: '«Ver todos» abre «Pagos que recibí» con todo el historial.', en: 'verTodos' },
      ],
    },
    {
      t: '4 · Cambiar de negocio en el menú',
      e0: { etiqueta: 'Menú', titulo: 'Qué negocio trabajar', piezas: [{ k: 'chips', g: 'modos', l: [{ t: 'Dev Studio', on: true, g: 'modoDev' }, { t: 'Canela', g: 'modoCanela' }, { t: 'Salario' }, { t: 'S.A.' }] }] },
      tomas: [
        { t: 'Arriba del menú están los cuatro negocios en cuadros; cada uno muestra un dato corto, como clientes y lo que te deben.', en: 'modos', ms: 4200 },
        { t: 'El negocio elegido se ve con el color principal.', en: 'modoDev' },
        { t: 'Toca otro cuadro, o muévete con las flechas y Enter, para cambiar el menú a ese negocio.', en: 'modoCanela', clic: true },
      ],
    },
  ],
}

export default guia
