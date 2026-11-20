import type { Escena, GuiaVideo, Pieza } from '../tipos'

const acciones = [{ t: 'Más', g: 'mas' }, { t: 'Registrar pago', g: 'registrarPago', p: true }]

const kpis: Pieza = { k: 'cifras', g: 'kpis', l: [{ et: 'Me deben en total', v: 'Q 1,400.00', sub: '3 cobros' }, { et: 'Vencido', v: 'Q 700.00', sub: '1 vencidos' }, { et: 'Falta de este mes', v: 'Q 700.00', sub: '2 cobros' }, { et: 'Entró este mes', v: 'Q 3,850.00', sub: '7 pagos · ver' }] }

const urgente: Pieza[] = [
  { k: 'aviso', g: 'urgente', t: '1 cobros vencidos por Q 700.00. Es lo primero por cobrar.' },
  { k: 'botones', g: 'botonUrgente', l: [{ t: 'Ver solo vencidos', g: 'soloVencidos' }] },
]

const chips = (on: number): Pieza => ({ k: 'chips', g: 'chips', l: ['Por cobrar', 'Vencidos', 'Pagados del mes', 'Saldados', 'Todos del mes'].map((t, i) => ({ t, on: i === on })) })

const dims: Pieza = { k: 'campos', g: 'dims', l: [{ et: 'Cliente', v: 'Todos' }, { et: 'Proyecto', v: 'Todos' }, { et: 'Rubro', v: 'Todos' }, { et: 'Negocio', v: 'Todos' }, { et: 'Ver por', v: 'Sin agrupar' }] }

const filas = [
  { vence: '05 nov 2026', cliente: 'Panadería La Espiga', concepto: 'Mensualidad de noviembre', estado: 'Vencido', monto: 'Q 700.00', falta: 'Q 700.00' },
  { vence: '25 nov 2026', cliente: 'Taller El Pistón', concepto: 'Mensualidad de noviembre', estado: 'Por cobrar', monto: 'Q 350.00', falta: 'Q 350.00' },
  { vence: '30 nov 2026', cliente: 'Taller El Pistón', concepto: 'Dominio 2027', estado: 'Por cobrar', monto: 'Q 350.00', falta: 'Q 350.00' },
]

const tabla = (marcadas: boolean, soloVencidos = false): Pieza => ({
  k: 'tabla',
  g: 'tabla',
  cab: ['Vence', 'Cliente', 'Concepto', 'Estado', 'Monto', 'Falta'],
  filas: (soloVencidos ? filas.slice(0, 1) : filas).map((f, i) => ({
    c: [`${marcadas ? '☑ ' : ''}${f.vence}`, f.cliente, f.concepto, f.estado, f.monto, f.falta],
    g: i === 0 ? 'fila1' : undefined,
    acc: i === 0 ? [{ t: 'Pago', g: 'pago1' }, { t: 'Saldar', g: 'saldar1' }] : [{ t: 'Pago' }, { t: 'Saldar' }],
  })),
})

const pantalla = (o: { marcadas?: boolean; chip?: number; menu?: boolean } = {}): Escena => ({
  etiqueta: 'Dinero',
  titulo: 'Lo que me deben',
  acciones,
  piezas: [
    ...(o.menu ? [{ k: 'menu' as const, g: 'menuMas', l: [{ t: 'Agregar cobro', g: 'agregar' }, { t: 'Registrar anticipo', g: 'anticipo' }, { t: 'Recordatorios por WhatsApp', g: 'recordatorios' }] }] : []),
    kpis,
    ...(o.chip === 1 ? [] : urgente),
    chips(o.chip ?? 0),
    dims,
    o.marcadas
      ? { k: 'botones', g: 'barraMasa', l: [{ t: 'Quitar marcas' }, { t: 'Marcar como pagados', g: 'pagados', p: true }] }
      : { k: 'texto', g: 'suma', t: o.chip === 1 ? '1 cobros · pendiente Q 700.00' : '3 cobros · pendiente Q 1,400.00' },
    tabla(!!o.marcadas, o.chip === 1),
  ],
})

const paso1 = (marcados: boolean): Escena['hoja'] => ({
  titulo: 'Registrar pago',
  piezas: [
    { k: 'texto', t: 'Paso 1 de 2 · ¿Qué pagó?' },
    { k: 'campos', g: 'elegirCliente', l: [{ et: 'Cliente', v: 'Taller El Pistón' }] },
    { k: 'tabla', g: 'cobrosCliente', cab: ['Cobro', 'Estado', 'Falta'], filas: [{ c: [`${marcados ? '☑' : '☐'} Mensualidad de noviembre · 25 nov 2026`, 'Por cobrar', 'Q 350.00'], g: 'marcaCobro' }, { c: [`${marcados ? '☑' : '☐'} Dominio 2027 · 30 nov 2026`, 'Por cobrar', 'Q 350.00'] }] },
  ],
  pie: [{ t: 'Cancelar' }, { t: `Siguiente · ${marcados ? 'Q 700.00' : 'Q 0.00'}`, g: 'siguiente', p: true }],
})

const ventanaPago = (titulo: string, filasPago: [string, string][], total: string): Escena['hoja'] => ({
  titulo,
  piezas: [
    { k: 'tabla', g: 'listaPago', cab: ['Cobro', 'Falta'], filas: filasPago.map((c) => ({ c })), pie: ['Total', total] },
    { k: 'campos', g: 'datosPago', l: [{ et: 'Fecha del pago', v: '20 nov 2026' }, { et: 'Forma de pago', v: 'Transferencia' }, { et: 'Dónde cayó', v: 'Personal · Banco Uno ••4821' }, { et: 'Referencia o número de boleta', v: '884512' }, { et: 'Comprobante', v: 'Elegir, arrastrar o pegar (Ctrl/⌘ + V)' }] },
  ],
  pie: [{ t: 'Cancelar' }, { t: 'Registrar pago', g: 'okPago', p: true }],
})

const guia: GuiaVideo = {
  ruta: '/cobros',
  menu: 'Lo que me deben',
  caps: [
    {
      t: '1 · Lo que me deben',
      e0: pantalla(),
      tomas: [
        { t: 'Arriba ves lo que te deben en total, lo vencido, lo que falta de este mes y lo que entró.', en: 'kpis', ms: 4200 },
        { t: 'La franja roja avisa lo vencido: es lo primero por cobrar.', en: 'urgente' },
        { t: '«Ver solo vencidos» deja en la lista solo esos cobros.', en: 'soloVencidos', clic: true, luego: pantalla({ chip: 1 }) },
        { t: 'Los chips cambian la lista: por cobrar, vencidos, pagados del mes, saldados o todos del mes.', en: 'chips', ms: 4200 },
        { t: 'Elige cliente, proyecto, rubro o negocio; «Ver por» agrupa la lista.', en: 'dims' },
        { t: '«Pago» registra lo que pagó de ese cobro; «Saldar» lo deja de cobrar a propósito.', en: 'pago1' },
      ],
    },
    {
      t: '2 · Registrar pago',
      e0: pantalla(),
      tomas: [
        { t: 'Toca «Registrar pago».', en: 'registrarPago', clic: true, luego: { hoja: paso1(false) } },
        { t: 'Paso 1: elige el cliente que te pagó.', en: 'elegirCliente' },
        { t: 'Marca los cobros que pagó; lo vencido ya viene marcado.', en: 'marcaCobro', clic: true, luego: { hoja: paso1(true) } },
        { t: 'Toca «Siguiente»: el botón dice cuánto suma lo marcado.', en: 'siguiente', clic: true, luego: { hoja: ventanaPago('Registrar pago de 2 cobros', [['Mensualidad de noviembre · 25 nov 2026', 'Q 350.00'], ['Dominio 2027 · 30 nov 2026', 'Q 350.00']], 'Q 700.00') } },
        { t: 'Paso 2: pon la fecha, la forma de pago, dónde cayó y, si quieres, el comprobante.', en: 'datosPago', ms: 4600 },
        { t: 'Toca «Registrar pago»: cada cobro queda pagado con su recibo y se puede deshacer.', en: 'okPago', clic: true, luego: { hoja: null, piezas: [{ k: 'ok', g: 'listo', t: 'Se registraron 2 pagos por Q 700.00. Deshacer' }, ...pantalla().piezas] } },
      ],
    },
    {
      t: '3 · Varios a la vez',
      e0: pantalla(),
      tomas: [
        { t: 'Marca las filas que quieres pagar juntas.', en: 'fila1', clic: true, luego: pantalla({ marcadas: true }) },
        { t: 'Toca «Marcar como pagados».', en: 'pagados', clic: true, luego: { hoja: ventanaPago('Registrar pago de 3 cobros', [['Mensualidad de noviembre · 05 nov 2026', 'Q 700.00'], ['Mensualidad de noviembre · 25 nov 2026', 'Q 350.00'], ['Dominio 2027 · 30 nov 2026', 'Q 350.00']], 'Q 1,400.00') } },
        { t: 'Una sola fecha, forma y dónde cayó para todos.', en: 'datosPago' },
        { t: 'Toca «Registrar pago»; se puede deshacer.', en: 'okPago', clic: true, luego: { hoja: null, piezas: pantalla().piezas } },
      ],
    },
    {
      t: '4 · Más: cobro, anticipo y recordatorios',
      e0: pantalla(),
      tomas: [
        { t: '«Más» guarda lo que usas menos.', en: 'mas', clic: true, luego: pantalla({ menu: true }) },
        { t: '«Agregar cobro» es para un cobro único, un servicio, una mensualidad adicional u otro.', en: 'agregar', clic: true, luego: { piezas: pantalla().piezas, hoja: { titulo: 'Agregar cobro', piezas: [{ k: 'campos', g: 'camposCobro', l: [{ et: 'Cliente', v: 'Taller El Pistón' }, { et: 'Tipo', v: 'Servicio' }, { et: 'Vence', v: '30 nov 2026' }, { et: 'Concepto', v: 'Dominio 2027' }, { et: 'Monto', v: 'Q 350.00' }] }], pie: [{ t: 'Cancelar', g: 'cancelarCobro' }, { t: 'Agregar cobro', p: true }] } } },
        { t: 'Llena los datos y toca «Agregar cobro», o «Cancelar».', en: 'cancelarCobro', clic: true, luego: { hoja: null } },
        { t: 'Abre «Más» otra vez.', en: 'mas', clic: true, luego: pantalla({ menu: true }) },
        { t: '«Registrar anticipo» anota un pago adelantado: queda como saldo a favor del cliente.', en: 'anticipo' },
        { t: '«Recordatorios por WhatsApp» lista a cada cliente que debe.', en: 'recordatorios', clic: true, luego: { piezas: pantalla().piezas, hoja: { titulo: 'Recordatorios por WhatsApp', piezas: [{ k: 'tabla', g: 'deudores', cab: ['Cliente', 'Debe'], filas: [{ c: ['Panadería La Espiga', 'Q 700.00'], acc: [{ t: 'Enviar' }] }, { c: ['Taller El Pistón', 'Q 700.00'], acc: [{ t: 'Enviar' }] }] }] } } },
        { t: 'Toca «Enviar» en cada uno; se marca al abrirlo.', en: 'deudores' },
      ],
    },
  ],
}

export default guia
