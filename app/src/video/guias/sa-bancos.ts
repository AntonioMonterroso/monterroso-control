import type { Escena, GuiaVideo, Pieza } from '../tipos'

const cuentas: Pieza = { k: 'tabla', g: 'cuentas', cab: ['Cuenta', 'Moneda', 'Saldo inicial', 'Saldo hoy'], filas: [{ c: ['Banco Dos 0012-1290 · Viendo', 'Quetzales', 'Q 5,000.00', 'Q 7,350.00'], g: 'cuenta1', acc: [{ t: 'Editar' }] }] }

const movs = (marcadas: boolean): Pieza => ({
  k: 'tabla',
  g: 'movs',
  cab: ['Fecha', 'Descripción', 'Origen', 'Entra', 'Sale', 'Conciliado'],
  filas: [
    { c: [`${marcadas ? '☑ ' : ''}06 nov 2026`, 'Taller El Pistón · Mensualidad', 'Cobro', 'Q 350.00', '', 'No'], g: 'mov1', acc: [{ t: 'Editar' }, { t: 'Quitar' }] },
    { c: [`${marcadas ? '☑ ' : ''}10 nov 2026`, 'Hosting y dominios', 'Gasto', '', 'Q 450.00', 'No'], acc: [{ t: 'Editar' }, { t: 'Quitar' }] },
    { c: [`${marcadas ? '☑ ' : ''}15 nov 2026`, 'Traslado desde cuenta personal', 'Traslado desde cuenta personal', 'Q 1,350.00', '', 'No'], acc: [{ t: 'Editar' }, { t: 'Quitar' }] },
  ],
})

const conciliacion: Pieza[] = [
  { k: 'subtitulo', g: 'concTitulo', t: 'Conciliación de noviembre 2026' },
  { k: 'campos', g: 'saldoBanco', l: [{ et: 'Saldo según el estado de cuenta', v: 'Q 7,350.00' }] },
  { k: 'botones', l: [{ t: 'Guardar saldo', g: 'guardarSaldo' }] },
  { k: 'campos', g: 'resumen', l: [{ et: 'Saldo en libros', v: 'Q 7,350.00' }, { et: 'Movimientos sin conciliar', v: 'Q 0.00 · 0' }, { et: 'Diferencia', v: 'Cuadra' }] },
]

const pantalla = (marcadas = false): Escena => ({
  etiqueta: 'Sociedad anónima',
  titulo: 'Bancos',
  acciones: [{ t: 'Cuenta', g: 'cuenta', p: true }],
  piezas: [
    { k: 'campos', g: 'mes', l: [{ et: 'Mes', v: 'noviembre 2026' }] },
    cuentas,
    { k: 'subtitulo', t: 'Movimientos de Banco Dos 0012-1290' },
    { k: 'botones', g: 'botonesMov', l: [{ t: 'Traer registrados (2)', g: 'traer' }, { t: 'Movimiento', g: 'movimiento' }] },
    { k: 'botones', g: 'masa', l: marcadas ? [{ t: 'Desmarcar todas' }, { t: 'Marcar conciliadas · 3', g: 'conciliadas' }, { t: 'Quitar conciliado · 3' }] : [{ t: 'Marcar todas · 3', g: 'marcarTodas' }] },
    movs(marcadas),
  ],
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
        { t: 'Elige el mes con las flechas del selector de mes.', en: 'mes' },
        { t: 'Toca una cuenta para ver sus movimientos abajo.', en: 'cuenta1' },
        { t: '«Traer registrados» trae cobros, gastos y anticipos ya registrados, sin duplicar.', en: 'traer', clic: true, luego: { hoja: { titulo: 'Traer movimientos registrados', piezas: [{ k: 'texto', t: '☑ Marcar todos' }, { k: 'tabla', g: 'candidatos', cab: ['Movimiento', 'Monto'], filas: [{ c: ['☑ Panadería La Espiga · anticipo · 18 nov 2026', 'Q 1,000.00'] }, { c: ['☑ Publicidad · 19 nov 2026', '−Q 300.00'] }] }], pie: [{ t: 'Cancelar' }, { t: 'Traer 2', g: 'traerOk', p: true }] } } },
        { t: 'Marca los que quieres y toca «Traer».', en: 'traerOk', clic: true, luego: { hoja: null } },
        { t: '«Movimiento» agrega uno a mano, como una comisión del banco.', en: 'movimiento' },
      ],
    },
    {
      t: '2 · Conciliar el mes',
      e0: { ...pantalla(), piezas: [...pantalla().piezas, ...conciliacion] },
      tomas: [
        { t: 'Marca lo que ya salió en el estado de cuenta, o toca «Marcar todas».', en: 'marcarTodas', clic: true, luego: { piezas: [...pantalla(true).piezas, ...conciliacion] } },
        { t: 'Toca «Marcar conciliadas».', en: 'conciliadas', clic: true, luego: { piezas: [...pantalla().piezas, ...conciliacion] } },
        { t: 'Escribe el saldo que dice el estado de cuenta del banco.', en: 'saldoBanco' },
        { t: 'Toca «Guardar saldo».', en: 'guardarSaldo' },
        { t: 'Si la diferencia es cero, dice «Cuadra».', en: 'resumen', ms: 4200 },
      ],
    },
  ],
}

export default guia
