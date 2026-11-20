import type { Escena, GuiaVideo, Pieza } from '../tipos'

const acciones = [{ t: 'Más', g: 'mas' }, { t: 'Registrar traspaso', g: 'traspaso', p: true }]

const kpis: Pieza = { k: 'cifras', g: 'kpis', l: [{ et: 'Tengo hoy (cuentas y efectivo)', v: 'Q 6,950.00', sub: '3 lugares' }, { et: 'Entró este mes', v: 'Q 4,200.00', sub: 'pagos y anticipos' }, { et: 'Falta pasar a la S.A.', v: 'Q 1,350.00', sub: '2 pagos' }] }

const saldos = (traspasado: boolean): Pieza[] => [
  { k: 'subtitulo', g: 'saldosTitulo', t: 'Saldo de cada cuenta y caja' },
  {
    k: 'tabla',
    g: 'saldos',
    cab: ['Grupo', 'Dónde', 'Entró', 'Salió', 'Traspasos', 'Saldo hoy'],
    filas: [
      { c: ['Cuenta personal', 'Banco Uno ••4821', 'Q 3,500.00', 'Q 450.00', traspasado ? 'Q 500.00' : 'Q 0.00', traspasado ? 'Q 3,550.00' : 'Q 3,050.00'], g: 'filaBanco', acc: [{ t: 'Editar', g: 'lapiz' }] },
      { c: ['Efectivo', 'Efectivo billetera', 'Q 1,200.00', 'Q 300.00', 'Q 0.00', 'Q 900.00'], acc: [{ t: 'Editar' }] },
      { c: ['Efectivo', 'Efectivo Papá', 'Q 3,000.00', 'Q 0.00', traspasado ? '-Q 500.00' : 'Q 0.00', traspasado ? 'Q 2,500.00' : 'Q 3,000.00'], acc: [{ t: 'Editar' }] },
    ],
    pie: ['Total', '', '', '', '', 'Q 6,950.00'],
  },
]

const traspasos = (nuevo: boolean): Pieza[] => [
  { k: 'subtitulo', g: 'traspasosTitulo', t: 'Traspasos entre cuentas y cajas' },
  {
    k: 'tabla',
    g: 'traspasos',
    cab: ['Fecha', 'De', 'A', 'Nota', 'Monto'],
    filas: [
      ...(nuevo ? [{ c: ['20 nov 2026', 'Efectivo · Efectivo Papá', 'Personal · Banco Uno ••4821', 'Depósito al banco', 'Q 500.00'], g: 'nuevoTraspaso', acc: [{ t: 'Quitar traspaso', g: 'quitarTraspaso' }] }] : []),
      { c: ['02 nov 2026', 'Efectivo · Efectivo Papá', 'Efectivo · Efectivo billetera', 'Papá me entregó', 'Q 300.00'], acc: [{ t: 'Quitar traspaso' }] },
    ],
  },
]

const faltaSA = (marcadas: boolean): Pieza[] => [
  { k: 'subtitulo', g: 'faltaTitulo', t: 'Falta pasar a la S.A.' },
  { k: 'aviso', g: 'avisoSocio', t: 'Son cobros de la S.A. que cayeron en tu cuenta o en tu efectivo. Mientras no se trasladen, en los estados de la S.A. salen como cuenta por cobrar al socio o administrador.' },
  { k: 'botones', g: 'masa', l: marcadas ? [{ t: 'Desmarcar todas' }, { t: 'Registrar traslado a la S.A. · 2', g: 'trasladoMarcadas' }] : [{ t: 'Marcar todas · 2', g: 'marcarTodas' }] },
  {
    k: 'tabla',
    g: 'pendientes',
    cab: ['Fecha', 'Pago', 'Cayó en', 'Monto'],
    filas: [
      { c: [`${marcadas ? '☑ ' : ''}06 nov 2026`, 'Panadería La Espiga · Mensualidad', 'Personal · Banco Uno ••4821', 'Q 700.00'], acc: [{ t: 'Registrar traslado a la S.A.', g: 'trasladoFila' }] },
      { c: [`${marcadas ? '☑ ' : ''}12 nov 2026`, 'Taller El Pistón · Dominio', 'Personal · Banco Uno ••4821', 'Q 650.00'], acc: [{ t: 'Registrar traslado a la S.A.' }] },
    ],
    pie: ['Total', '', '', 'Q 1,350.00'],
  },
]

const pantalla = (o: { menu?: boolean; traspasado?: boolean; sa?: boolean; marcadas?: boolean } = {}): Escena => ({
  etiqueta: 'Dinero',
  titulo: 'Dónde está mi dinero',
  acciones,
  piezas: [
    ...(o.menu ? [{ k: 'menu' as const, g: 'menuMas', l: [{ t: 'Agregar cuenta personal', g: 'cuentaPersonal' }, { t: 'Agregar caja de efectivo', g: 'caja' }] }] : []),
    kpis,
    ...(o.sa ? faltaSA(!!o.marcadas) : [...saldos(!!o.traspasado), ...traspasos(!!o.traspasado)]),
  ],
})

const guia: GuiaVideo = {
  ruta: '/cuentas',
  menu: 'Dónde está mi dinero',
  caps: [
    {
      t: '1 · El saldo de cada cuenta y caja',
      e0: pantalla(),
      tomas: [
        { t: 'Arriba ves cuánto tienes hoy entre cuentas y efectivo, lo que entró este mes y lo que falta pasar a la S.A.', en: 'kpis', ms: 4600 },
        { t: '«Saldo de cada cuenta y caja» dice lo que entró, lo que salió y el saldo de hoy de cada lugar.', en: 'saldos', ms: 4200 },
        { t: 'Ya vienen dos cajas: «Efectivo billetera» y «Efectivo Papá».', en: 'saldosTitulo' },
        { t: 'El lápiz renombra la cuenta o caja, le pone su saldo inicial o la apaga.', en: 'lapiz' },
        { t: '«Más» agrega otra cuenta o caja.', en: 'mas', clic: true, luego: pantalla({ menu: true }) },
        { t: '«Agregar cuenta personal» es para una cuenta de banco tuya; del número solo se guardan los últimos 4.', en: 'cuentaPersonal' },
        { t: '«Agregar caja de efectivo» es para otro lugar con efectivo.', en: 'caja', clic: true, luego: { piezas: pantalla().piezas, hoja: { titulo: 'Nueva caja de efectivo', piezas: [{ k: 'campos', g: 'camposCaja', l: [{ et: 'Nombre de la caja', v: 'Efectivo oficina' }, { et: 'Saldo con el que empieza', v: 'Q 0.00' }, { et: 'Se puede elegir al registrar pagos', v: '☑' }] }], pie: [{ t: 'Cancelar' }, { t: 'Guardar', p: true }] } } },
      ],
    },
    {
      t: '2 · Registrar traspaso',
      e0: pantalla(),
      tomas: [
        { t: 'Un traspaso es dinero que pasa de una caja o cuenta tuya a otra.', en: 'traspaso', clic: true, luego: { hoja: { titulo: 'Registrar traspaso', piezas: [{ k: 'campos', g: 'camposTraspaso', l: [{ et: 'Sale de', v: 'Efectivo · Efectivo Papá' }, { et: 'Entra a', v: 'Personal · Banco Uno ••4821' }, { et: 'Monto', v: 'Q 500.00' }, { et: 'Fecha', v: '20 nov 2026' }, { et: 'Nota', v: 'Depósito al banco' }] }], pie: [{ t: 'Cancelar' }, { t: 'Registrar traspaso', g: 'okTraspaso', p: true }] } } },
        { t: 'Elige de dónde sale, a dónde entra, el monto, la fecha y una nota.', en: 'camposTraspaso', ms: 4200 },
        { t: 'Toca «Registrar traspaso»; se puede deshacer.', en: 'okTraspaso', clic: true, luego: { hoja: null, piezas: pantalla({ traspasado: true }).piezas } },
        { t: 'Los saldos cambian al momento.', en: 'filaBanco' },
        { t: 'Queda en «Traspasos entre cuentas y cajas».', en: 'nuevoTraspaso' },
        { t: 'Si fue por error, el basurero lo quita.', en: 'quitarTraspaso' },
      ],
    },
    {
      t: '3 · Pasar a la S.A.',
      e0: pantalla({ sa: true }),
      tomas: [
        { t: '«Falta pasar a la S.A.» junta los cobros de la S.A. que cayeron en tu cuenta o tu efectivo.', en: 'faltaTitulo' },
        { t: 'Mientras no los trasladas, en los estados salen como cuenta por cobrar al socio o administrador.', en: 'avisoSocio', ms: 4600 },
        { t: 'Marca los pagos, o toca «Marcar todas».', en: 'marcarTodas', clic: true, luego: pantalla({ sa: true, marcadas: true }) },
        { t: 'Toca «Registrar traslado a la S.A.».', en: 'trasladoMarcadas', clic: true, luego: { hoja: { titulo: 'Registrar traslado a la S.A.', piezas: [{ k: 'campos', g: 'camposTraslado', l: [{ et: 'Fecha del traslado', v: '20 nov 2026' }, { et: 'Entra a la cuenta de la S.A.', v: 'Banco Dos ••1290' }, { et: 'Nota', v: '' }] }, { k: 'tabla', cab: ['Pago', 'Monto'], filas: [{ c: ['Panadería La Espiga · Mensualidad', 'Q 700.00'] }, { c: ['Taller El Pistón · Dominio', 'Q 650.00'] }] }], pie: [{ t: 'Cancelar' }, { t: 'Registrar traslado', g: 'okTraslado', p: true }] } } },
        { t: 'Pon la fecha y la cuenta de la S.A. donde entró.', en: 'camposTraslado' },
        { t: '«Registrar traslado» anota la salida de tu cuenta y la entrada en el banco de la S.A.; se puede deshacer.', en: 'okTraslado', clic: true, luego: { hoja: null, piezas: [kpis, { k: 'ok', g: 'listo', t: 'Traslado de Q 1,350.00 a Banco Dos registrado. Deshacer' }] } },
      ],
    },
  ],
}

export default guia
