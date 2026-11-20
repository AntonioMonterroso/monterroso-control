import type { Escena, GuiaVideo, Pieza } from '../tipos'

const tarjetas: Pieza = { k: 'cifras', g: 'tarjetas', l: [
  { et: 'Banco Uno · ···1290 · Quetzales', v: 'Q 7,350.00', sub: 'saldo en libros hoy', g: 'tarjeta1' },
  { et: 'Banco Dos · ···0457 · Quetzales', v: 'Q 1,200.00', sub: 'saldo en libros hoy', g: 'tarjeta2' },
] }

const delMes: Pieza = { k: 'cifras', g: 'delMes', l: [{ et: 'Saldo inicial del mes', v: 'Q 6,100.00' }, { et: 'Entró', v: 'Q 1,700.00' }, { et: 'Salió', v: 'Q 450.00' }, { et: 'Saldo final del mes', v: 'Q 7,350.00' }] }

const movs = (marcadas: boolean, conciliadas: boolean): Pieza => {
  const m = marcadas ? '☑ ' : ''
  const c = conciliadas ? 'Sí' : 'No'
  return {
    k: 'tabla',
    g: 'movs',
    cab: ['Fecha', 'Descripción', 'Origen', 'Entra', 'Sale', 'Saldo', 'Conciliado'],
    filas: [
      { c: [`${m}06 nov 2026`, 'Taller Ejemplo · Mensualidad', 'Cobro', 'Q 350.00', '', 'Q 6,450.00', c], g: 'mov1', acc: [{ t: 'Editar' }, { t: 'Quitar' }] },
      { c: [`${m}10 nov 2026`, 'Hosting y dominios', 'Gasto', '', 'Q 450.00', 'Q 6,000.00', c], acc: [{ t: 'Editar' }, { t: 'Quitar' }] },
      { c: [`${m}12 nov 2026`, 'Aportación del primer socio', 'Aportación', 'Q 1,000.00', '', 'Q 7,000.00', c], acc: [{ t: 'Editar' }, { t: 'Quitar' }] },
      { c: [`${m}15 nov 2026`, 'Traslado desde cuenta personal', 'Traslado', 'Q 350.00', '', 'Q 7,350.00', c], g: 'mov4', acc: [{ t: 'Editar' }, { t: 'Quitar' }] },
    ],
  }
}

const conciliacion = (cuadra: boolean): Pieza[] => [
  { k: 'subtitulo', g: 'concTitulo', t: 'Conciliación de noviembre 2026' },
  { k: 'campos', g: 'saldoBanco', l: [{ et: 'Saldo según el estado de cuenta', v: 'Q 7,350.00' }] },
  { k: 'botones', l: [{ t: 'Guardar saldo', g: 'guardarSaldo' }] },
  { k: 'campos', g: 'resumen', l: [{ et: 'Saldo en libros al 30 nov 2026', v: 'Q 7,350.00' }, { et: 'Movimientos sin conciliar', v: cuadra ? 'Q 0.00 · 0' : 'Q 1,250.00 · 4' }, { et: 'Saldo del banco', v: cuadra ? 'Q 7,350.00' : 'Sin anotar' }, { et: 'Diferencia', v: cuadra ? 'Cuadra' : '—' }] },
]

const piezas = (marcadas = false, conciliadas = false): Pieza[] => [
  { k: 'campos', g: 'mes', l: [{ et: 'Mes', v: 'noviembre 2026' }] },
  tarjetas,
  { k: 'subtitulo', t: 'Movimientos de Banco Uno 0012-1290' },
  { k: 'botones', g: 'botonesMov', l: [{ t: 'Traer registrados (2)', g: 'traer' }, { t: 'Movimiento', g: 'movimiento' }] },
  delMes,
  { k: 'botones', g: 'masa', l: marcadas ? [{ t: 'Desmarcar todas' }, { t: 'Marcar conciliadas · 4', g: 'conciliadas' }, { t: 'Quitar conciliado · 4' }, { t: 'Quitar las marcadas · 4' }] : [{ t: 'Marcar todas · 4', g: 'marcarTodas' }] },
  movs(marcadas, conciliadas),
]

const pantalla = (): Escena => ({
  etiqueta: 'Sociedad anónima',
  titulo: 'Bancos',
  acciones: [{ t: 'Cuenta', g: 'cuenta', p: true }],
  piezas: piezas(),
})

const guia: GuiaVideo = {
  ruta: '/sa/bancos',
  menu: 'Bancos',
  caps: [
    {
      t: '1 · Cuentas y movimientos',
      e0: pantalla(),
      tomas: [
        { t: 'Toca «Cuenta» para agregar una cuenta bancaria de la sociedad.', en: 'cuenta' },
        { t: 'Cada tarjeta muestra el banco, los últimos 4 números, la moneda y el saldo en libros de hoy.', en: 'tarjetas', ms: 5200 },
        { t: 'Toca una tarjeta para ver los movimientos de esa cuenta.', en: 'tarjeta1', clic: true },
        { t: 'Elige el mes con las flechas del selector de mes.', en: 'mes' },
        { t: 'Arriba de los movimientos ves «Saldo inicial del mes», «Entró», «Salió» y «Saldo final del mes».', en: 'delMes', ms: 5200 },
        { t: 'Cada movimiento lleva su origen (Cobro, Gasto, Aportación, Traslado, A mano…) y la columna «Saldo» va sumando.', en: 'mov4', ms: 5600 },
      ],
    },
    {
      t: '2 · Traer y agregar',
      e0: pantalla(),
      tomas: [
        { t: '«Traer registrados» trae cobros, gastos, aportaciones y pagos de deudas ya registrados, sin duplicar.', en: 'traer', clic: true, luego: { hoja: { titulo: 'Traer movimientos registrados', piezas: [{ k: 'texto', t: '☑ Marcar todos' }, { k: 'tabla', g: 'candidatos', cab: ['Movimiento', 'Monto'], filas: [{ c: ['☑ Panadería Ejemplo · anticipo · 18 nov 2026', 'Q 1,000.00'] }, { c: ['☑ Publicidad · 19 nov 2026', '−Q 300.00'] }] }], pie: [{ t: 'Cancelar' }, { t: 'Traer 2', g: 'traerOk', p: true }] } } },
        { t: 'Marca los que quieres y toca «Traer».', en: 'traerOk', clic: true, luego: { hoja: null } },
        { t: '«Movimiento» agrega uno a mano, como una comisión del banco; sale con el origen «A mano».', en: 'movimiento' },
      ],
    },
    {
      t: '3 · Conciliar el mes',
      e0: { ...pantalla(), piezas: [...piezas(), ...conciliacion(false)] },
      tomas: [
        { t: 'Marca lo que ya salió en el estado de cuenta, o toca «Marcar todas».', en: 'marcarTodas', clic: true, luego: { piezas: [...piezas(true), ...conciliacion(false)] } },
        { t: 'Toca «Marcar conciliadas».', en: 'conciliadas', clic: true, luego: { piezas: [...piezas(false, true), ...conciliacion(false)] } },
        { t: 'Escribe el saldo que dice el estado de cuenta del banco.', en: 'saldoBanco' },
        { t: 'Toca «Guardar saldo».', en: 'guardarSaldo', clic: true, luego: { piezas: [{ k: 'ok', g: 'listo', t: 'Saldo del estado de cuenta guardado.' }, ...piezas(false, true), ...conciliacion(true)] } },
        { t: 'Si la diferencia es cero, dice «Cuadra».', en: 'resumen', ms: 4200 },
      ],
    },
  ],
}

export default guia
