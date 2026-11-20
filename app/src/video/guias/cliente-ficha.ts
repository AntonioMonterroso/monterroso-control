import type { Escena, GuiaVideo, Pieza } from '../tipos'

const acciones = [{ t: 'Estado de cuenta', g: 'estado' }, { t: 'Borrar o archivar', g: 'borrar' }, { t: 'Más', g: 'mas' }, { t: 'Registrar pago', g: 'registrarPago', p: true }]

const kpis: Pieza = { k: 'cifras', g: 'kpis', l: [{ et: 'Me debe', v: 'Q 1,050.00', sub: '1 vencido' }, { et: 'Me ha pagado', v: 'Q 4,200.00', sub: '6 pagos' }, { et: 'Saldo a favor', v: 'Q 500.00', sub: 'de anticipos sin usar' }, { et: 'Ganancia', v: 'Q 3,720.00', sub: 'pagado menos costo (Q 480.00)' }] }

const indice: Pieza = { k: 'chips', g: 'indice', l: [{ t: 'Datos', g: 'iDatos' }, { t: 'Lo que debe', g: 'iDebe' }, { t: 'Pagos que hizo', g: 'iPagos' }, { t: 'Saldo a favor', g: 'iFavor' }, { t: 'Proyectos' }, { t: 'Documentos' }, { t: 'Desarrollo' }] }

const menuMas: Pieza = { k: 'menu', g: 'menuMas', l: [{ t: 'Agregar cobro', g: 'agregar' }, { t: 'Registrar anticipo', g: 'anticipo' }, { t: 'Proyecto nuevo', g: 'proyecto' }, { t: 'Contrato' }, { t: 'Documento' }] }

const datos: Pieza[] = [
  { k: 'subtitulo', g: 'datos', t: 'Datos' },
  { k: 'campos', g: 'camposDatos', l: [{ et: 'Negocio', v: 'Monterroso Dev Studio' }, { et: 'Rubro', v: 'Panadería' }, { et: 'WhatsApp', v: '5555 1234' }, { et: 'NIT', v: 'CF' }] },
  { k: 'botones', l: [{ t: 'Editar datos', g: 'lapizDatos' }] },
]

const debe = (marcadas: boolean): Pieza[] => [
  { k: 'subtitulo', g: 'debe', t: 'Lo que debe' },
  { k: 'botones', g: 'masa', l: marcadas ? [{ t: 'Desmarcar todas' }, { t: 'Registrar pago de las marcadas · 2', g: 'pagarMarcadas' }] : [{ t: 'Agregar cobro' }, { t: 'Marcar todas · 2', g: 'marcarTodas' }] },
  {
    k: 'tabla',
    g: 'tablaDebe',
    cab: ['Vence', 'Cobro', 'Estado', 'Falta'],
    filas: [
      { c: [`${marcadas ? '☑ ' : ''}05 nov 2026`, 'Mensualidad de noviembre', 'Vencido', 'Q 700.00'], g: 'fila1', acc: [{ t: 'Pago', g: 'pago1' }] },
      { c: [`${marcadas ? '☑ ' : ''}05 dic 2026`, 'Mensualidad de diciembre', 'Por cobrar', 'Q 350.00'], acc: [{ t: 'Pago' }] },
    ],
    pie: ['Total que debe', '', '', 'Q 1,050.00'],
  },
]

const pagosHizo: Pieza[] = [
  { k: 'subtitulo', g: 'pagos', t: 'Pagos que hizo' },
  { k: 'cifras', g: 'kpisPagos', l: [{ et: 'Pagó este año', v: 'Q 4,200.00', sub: '6 pagos' }, { et: 'Pagó desde siempre', v: 'Q 6,300.00', sub: '9 pagos' }, { et: 'Saldo a favor', v: 'Q 500.00', sub: 'de anticipos sin aplicar' }] },
]

const favor: Pieza[] = [
  { k: 'subtitulo', g: 'favor', t: 'Saldo a favor' },
  { k: 'tabla', g: 'tablaFavor', cab: ['Fecha', 'Forma', 'Dónde cayó', 'Monto', 'A favor'], filas: [{ c: ['10 sep 2026', 'Depósito', 'Personal · Banco Uno ••4821', 'Q 1,000.00', 'Q 500.00'], acc: [{ t: 'Aplicar anticipo', g: 'aplicar' }, { t: 'Sobrante' }] }] },
]

const ficha = (o: { menu?: boolean; marcadas?: boolean; abajo?: boolean } = {}): Escena => ({
  etiqueta: 'Cliente · Panadería',
  titulo: 'Panadería La Espiga',
  acciones,
  piezas: [
    ...(o.menu ? [menuMas] : []),
    kpis,
    indice,
    ...(o.abajo ? [...debe(!!o.marcadas), ...pagosHizo, ...favor] : [...datos, ...debe(!!o.marcadas)]),
  ],
})

const paso1: Escena['hoja'] = {
  titulo: 'Registrar pago',
  piezas: [
    { k: 'texto', t: 'Paso 1 de 2 · ¿Qué pagó?' },
    { k: 'campos', l: [{ et: 'Cliente', v: 'Panadería La Espiga' }] },
    { k: 'tabla', g: 'cobrosCliente', cab: ['Cobro', 'Estado', 'Falta'], filas: [{ c: ['☑ Mensualidad de noviembre · 05 nov 2026', 'Vencido', 'Q 700.00'] }, { c: ['☑ Mensualidad de diciembre · 05 dic 2026', 'Por cobrar', 'Q 350.00'] }] },
  ],
  pie: [{ t: 'Cancelar' }, { t: 'Siguiente · Q 1,050.00', g: 'siguiente', p: true }],
}

const hojaPago: Escena['hoja'] = {
  titulo: 'Registrar pago de 2 cobros',
  piezas: [
    { k: 'tabla', g: 'listaPago', cab: ['Cobro', 'Falta'], filas: [{ c: ['Mensualidad de noviembre · 05 nov 2026', 'Q 700.00'] }, { c: ['Mensualidad de diciembre · 05 dic 2026', 'Q 350.00'] }], pie: ['Total', 'Q 1,050.00'] },
    { k: 'campos', l: [{ et: 'Fecha del pago', v: '20 nov 2026' }] },
    { k: 'texto', g: 'usarSaldo', t: '☑ Usar saldo a favor (Q 500.00): se aplican Q 500.00; en dinero entran Q 550.00.' },
    { k: 'campos', g: 'formaCuenta', l: [{ et: 'Forma de pago', v: 'Transferencia' }, { et: 'Dónde cayó', v: 'Personal · Banco Uno ••4821' }, { et: 'Comprobante', v: 'Elegir, arrastrar o pegar (Ctrl/⌘ + V)' }] },
  ],
  pie: [{ t: 'Cancelar' }, { t: 'Registrar pago', g: 'okPago', p: true }],
}

const guia: GuiaVideo = {
  ruta: '/clientes/:id',
  menu: 'Clientes',
  caps: [
    {
      t: '1 · La ficha del cliente',
      e0: ficha(),
      tomas: [
        { t: 'Arriba ves lo que te debe, lo que te ha pagado, su saldo a favor y la ganancia.', en: 'kpis', ms: 4200 },
        { t: 'Los chips de abajo son un índice: te llevan a cada parte de la ficha.', en: 'indice' },
        { t: 'Toca «Lo que debe» para bajar a sus cobros.', en: 'iDebe', clic: true, luego: ficha({ abajo: true }) },
        { t: 'Después están «Pagos que hizo» y «Saldo a favor».', en: 'pagos' },
        { t: '«Más» guarda lo que usas menos: agregar cobro, registrar anticipo, proyecto nuevo, contrato o documento.', en: 'mas', clic: true, luego: ficha({ menu: true }) },
        { t: 'Sus datos se corrigen con el lápiz de «Datos».', en: 'lapizDatos', luego: ficha() },
      ],
    },
    {
      t: '2 · Registrar pago',
      e0: ficha(),
      tomas: [
        { t: 'Toca «Registrar pago»; el cliente ya viene elegido.', en: 'registrarPago', clic: true, luego: { hoja: paso1 } },
        { t: 'Marca lo que pagó y toca «Siguiente».', en: 'siguiente', clic: true, luego: { hoja: hojaPago } },
        { t: 'Si tiene saldo a favor, «Usar saldo a favor» lo aplica primero.', en: 'usarSaldo', ms: 4200 },
        { t: 'Elige la forma de pago, dónde cayó y el comprobante.', en: 'formaCuenta' },
        { t: 'Toca «Registrar pago»: cada cobro queda con su recibo.', en: 'okPago', clic: true, luego: { hoja: null, piezas: [kpis, indice, ...debe(false), { k: 'ok', g: 'listo', t: 'Se registraron 2 pagos por Q 1,050.00. Deshacer' }] } },
        { t: 'También puedes tocar «Pago» en una fila, o marcar varias.', en: 'marcarTodas', clic: true, luego: ficha({ marcadas: true }) },
        { t: '«Registrar pago de las marcadas» abre la misma ventana con esos cobros.', en: 'pagarMarcadas' },
      ],
    },
    {
      t: '3 · Agregar cobro y anticipo',
      e0: ficha({ menu: true }),
      tomas: [
        { t: 'En «Más», «Agregar cobro» le cobra algo aparte.', en: 'agregar', clic: true, luego: { piezas: ficha().piezas, hoja: { titulo: 'Agregar cobro', piezas: [{ k: 'campos', g: 'camposCobro', l: [{ et: 'Proyecto', v: 'Página de Panadería La Espiga' }, { et: 'Tipo', v: 'Servicio' }, { et: 'Vence', v: '30 nov 2026' }, { et: 'Concepto', v: 'Dominio 2027' }, { et: 'Monto', v: 'Q 150.00' }] }, { k: 'campos', g: 'regimen', l: [{ et: 'Régimen que le toca', v: 'El del cliente en ese mes' }] }], pie: [{ t: 'Cancelar' }, { t: 'Agregar cobro', g: 'guardarCobro', p: true }] } } },
        { t: 'Pon el tipo, cuándo vence, el concepto y el monto.', en: 'camposCobro' },
        { t: '«Régimen que le toca» sale solo del cliente; cámbialo solo si este cobro es distinto.', en: 'regimen' },
        { t: 'Toca «Agregar cobro»: se ve al momento y se puede deshacer.', en: 'guardarCobro', clic: true, luego: { hoja: null, piezas: ficha({ abajo: true }).piezas } },
        { t: 'En «Saldo a favor» ves sus anticipos; «Aplicar anticipo» los usa en lo que debe.', en: 'aplicar' },
        { t: '«Registrar anticipo», en «Más», anota un pago adelantado.', en: 'mas', clic: true, luego: { piezas: [menuMas, ...ficha({ abajo: true }).piezas] } },
      ],
    },
    {
      t: '4 · Estado de cuenta y archivar',
      e0: ficha(),
      tomas: [
        { t: 'Toca «Estado de cuenta» para ver lo que debe.', en: 'estado', clic: true, luego: { hoja: { titulo: 'Estado de cuenta', piezas: [{ k: 'tabla', g: 'pendienteEc', cab: ['Cobro', 'Falta'], filas: [{ c: ['Mensualidad de noviembre · Vencido', 'Q 700.00'] }, { c: ['Mensualidad de diciembre', 'Q 350.00'] }], pie: ['Total pendiente', 'Q 1,050.00'] }, { k: 'subtitulo', g: 'web', t: 'Versión web' }, { k: 'botones', g: 'botonesWeb', l: [{ t: 'Copiar link' }, { t: 'Enviar por WhatsApp' }, { t: 'Ver como el cliente' }, { t: 'Bajar PDF' }] }], pie: [{ t: 'PDF' }, { t: 'Copiar' }, { t: 'Enviar por WhatsApp', g: 'whats', p: true }] } } },
        { t: 'En «Versión web» copias un link para que el cliente lo vea en su teléfono.', en: 'botonesWeb', ms: 4200 },
        { t: 'O manda el mensaje con «Enviar por WhatsApp».', en: 'whats', clic: true, luego: { hoja: null } },
        { t: '«Borrar o archivar»: si no tiene movimientos se borra; si los tiene, se archiva.', en: 'borrar', clic: true, luego: { hoja: { titulo: 'Archivar cliente', piezas: [{ k: 'texto', g: 'porQue', t: 'Panadería La Espiga tiene 2 trabajos y 6 pagos: se archiva y no se pierde su historia.' }], pie: [{ t: 'Cancelar', g: 'cancelar' }, { t: 'Archivar', p: true }] } } },
        { t: 'Un cliente archivado vuelve con «Reactivar».', en: 'porQue' },
        { t: '«Cancelar» no hace nada.', en: 'cancelar', clic: true, luego: { hoja: null } },
      ],
    },
  ],
}

export default guia
