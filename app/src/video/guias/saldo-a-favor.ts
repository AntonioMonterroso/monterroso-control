import type { Escena, GuiaVideo, Pieza } from '../tipos'

const kpis: Pieza = { k: 'cifras', g: 'kpis', l: [{ et: 'Saldo a favor hoy', v: 'Q 1,500.00', sub: '2 clientes' }, { et: 'Usado este mes', v: 'Q 350.00', sub: 'aplicado a sus cobros' }] }

const chips = (todos: boolean): Pieza => ({ k: 'chips', g: 'chips', l: [{ t: 'Con saldo', on: !todos, g: 'conSaldo' }, { t: 'Todos', on: todos, g: 'todos' }] })

const tabla = (todos: boolean): Pieza => ({
  k: 'tabla',
  g: 'tabla',
  cab: ['Fecha', 'Cliente', 'Proyecto', 'Forma', 'Dónde cayó', 'Monto', 'A favor'],
  filas: [
    { c: ['10 sep 2026', 'Panadería La Espiga', 'Cualquiera', 'Depósito', 'Personal · Banco Uno ••4821', 'Q 1,350.00', 'Q 1,000.00'], g: 'fila1', acc: [{ t: 'Aplicar anticipo', g: 'aplicar' }, { t: 'Sobrante', g: 'sobrante' }, { t: 'Editar anticipo' }] },
    { c: ['02 oct 2026', 'Taller El Pistón', 'Página del taller', 'Efectivo', 'Efectivo · Efectivo billetera', 'Q 500.00', 'Q 500.00'], acc: [{ t: 'Aplicar anticipo' }, { t: 'Sobrante' }, { t: 'Editar anticipo' }] },
    ...(todos ? [{ c: ['15 ago 2026', 'Panadería La Espiga', 'Cualquiera', 'Transferencia', 'Personal · Banco Uno ••4821', 'Q 700.00', 'Q 0.00'], g: 'usado', acc: [{ t: 'Editar anticipo' }] }] : []),
  ],
})

const pantalla = (todos = false): Escena => ({
  etiqueta: 'Dinero',
  titulo: 'Saldo a favor de clientes',
  acciones: [{ t: 'Registrar anticipo', g: 'nuevo', p: true }],
  piezas: [kpis, { k: 'busca', g: 'busca', t: 'Cliente, referencia o monto' }, chips(todos), tabla(todos)],
})

const guia: GuiaVideo = {
  ruta: '/saldo-a-favor',
  menu: 'Saldo a favor',
  caps: [
    {
      t: '1 · Lo que tienen a favor',
      e0: pantalla(),
      tomas: [
        { t: 'Arriba ves cuánto saldo a favor tienen hoy tus clientes y cuánto se usó este mes.', en: 'kpis', ms: 4200 },
        { t: 'Cada fila es un anticipo: lo que pagó y lo que todavía queda a favor.', en: 'tabla' },
        { t: '«Con saldo» muestra solo los anticipos que aún tienen dinero; «Todos» incluye los ya usados.', en: 'todos', clic: true, luego: pantalla(true) },
        { t: 'Un anticipo usado por completo queda en Q 0.00.', en: 'usado' },
        { t: 'Busca por cliente, referencia o monto.', en: 'busca' },
      ],
    },
    {
      t: '2 · Registrar anticipo',
      e0: pantalla(),
      tomas: [
        { t: 'Toca «Registrar anticipo» cuando un cliente te pague antes de que exista el cobro.', en: 'nuevo', clic: true, luego: { hoja: { titulo: 'Registrar anticipo', piezas: [{ k: 'campos', g: 'campos', l: [{ et: 'Cliente', v: 'Panadería La Espiga' }, { et: 'Proyecto', v: 'Cualquier proyecto' }, { et: 'Fecha', v: '20 nov 2026' }, { et: 'Monto', v: 'Q 1,350.00' }, { et: 'Forma de pago', v: 'Depósito' }, { et: 'Dónde cayó', v: 'Personal · Banco Uno ••4821' }] }, { k: 'texto', g: 'solo', t: '☑ Aplicarlo solo a cada cobro que venza' }], pie: [{ t: 'Cancelar' }, { t: 'Registrar anticipo', g: 'ok', p: true }] } } },
        { t: 'Pon el cliente, la fecha, el monto, la forma de pago y dónde cayó.', en: 'campos', ms: 4200 },
        { t: 'Con «Aplicarlo solo a cada cobro que venza» se usa sin que hagas nada.', en: 'solo' },
        { t: 'Toca «Registrar anticipo»: queda como saldo a favor y se puede deshacer.', en: 'ok', clic: true, luego: { hoja: null } },
      ],
    },
    {
      t: '3 · Aplicar anticipo y sobrante',
      e0: pantalla(),
      tomas: [
        { t: '«Aplicar anticipo» lo usa en los cobros que el cliente debe.', en: 'aplicar', clic: true, luego: { hoja: { titulo: 'Aplicar anticipo', piezas: [{ k: 'texto', t: 'Quedan Q 1,000.00 a favor. Se aplica primero a lo más viejo.' }, { k: 'tabla', g: 'cobros', cab: ['Cobro', 'Falta'], filas: [{ c: ['☑ Mensualidad de noviembre · 05 nov 2026', 'Q 350.00'] }, { c: ['☑ Mensualidad de diciembre · 05 dic 2026', 'Q 350.00'] }] }, { k: 'campos', g: 'cuanto', l: [{ et: 'Cuánto aplicar (parcial o total)', v: 'Q 700.00' }] }], pie: [{ t: 'Cancelar' }, { t: 'Aplicar', g: 'okAplicar', p: true }] } } },
        { t: 'Marca los cobros y escribe cuánto aplicar: parte o todo.', en: 'cuanto' },
        { t: 'Toca «Aplicar»: esos cobros quedan pagados con su saldo a favor.', en: 'okAplicar', clic: true, luego: { hoja: null } },
        { t: '«Sobrante» es para lo que queda al cerrar el proyecto.', en: 'sobrante', clic: true, luego: { hoja: { titulo: 'Lo que sobró del anticipo', piezas: [{ k: 'texto', g: 'opciones', t: '◉ Devolverlo al cliente (Q 300.00)   ○ Dejarlo a favor para un trabajo futuro' }, { k: 'campos', l: [{ et: 'Fecha de la devolución', v: '20 nov 2026' }] }], pie: [{ t: 'Cancelar' }, { t: 'Guardar', g: 'okSobrante', p: true }] } } },
        { t: 'Elige devolverlo o dejarlo a favor para un trabajo futuro.', en: 'opciones' },
        { t: 'Toca «Guardar»; se puede deshacer.', en: 'okSobrante', clic: true, luego: { hoja: null } },
      ],
    },
  ],
}

export default guia
