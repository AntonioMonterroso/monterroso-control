import type { Boton, Capitulo, Escena, GuiaVideo, Pieza } from '../tipos'

type Fila = [string, string, string, string, string, string]

interface Ejemplo { ruta: string; menu: string; etiqueta: string; tipo: 'todos' | 'tienda' | 'salario'; detalle?: string; filas: Fila[]; total: string }

export function guiaPagos(x: Ejemplo): GuiaVideo {
  const todos = x.tipo === 'todos'
  const tienda = x.tipo === 'tienda'
  const n = x.filas.length
  const acciones: Boton[] = [{ t: 'Excel', g: 'excel' }, { t: 'PDF', g: 'pdf' }, ...(todos ? [{ t: 'Más', g: 'mas' }, { t: 'Registrar pago', p: true }] : [])]
  const kpis: Pieza = { k: 'cifras', g: 'kpis', l: [{ et: 'Entró en este período', v: x.total, sub: `${n} pagos` }, { et: 'Falta decir dónde cayó', v: '1', sub: 'se completan con el lápiz o marcando varios', g: 'kpiFalta' }, { et: 'Sin comprobante', v: '1', sub: `de ${n}` }] }
  const periodo = (on: number): Pieza => ({ k: 'chips', g: 'periodo', l: ['Este mes', 'Mes anterior', 'Este año', 'Rango', 'Desde el inicio'].map((t, i) => ({ t, on: i === on, g: i === 2 ? 'anio' : undefined })) })
  const vistas = (on: number): Pieza => ({ k: 'chips', g: 'vistas', l: [{ t: 'Lista', on: on === 0, g: 'vLista' }, { t: 'Por mes', on: on === 1, g: 'vMes' }, { t: 'Por cliente', on: on === 2, g: 'vCliente' }] })
  const filtros: Pieza = { k: 'campos', g: 'filtros', l: [...(todos ? [{ et: 'Cliente', v: 'Todos' }, { et: 'Proyecto', v: 'Todos' }, { et: 'Negocio', v: 'Todos' }] : []), { et: 'Forma de pago', v: 'Todas' }, { et: 'Dónde cayó', v: 'Todas' }, { et: 'Comprobante', v: 'Con o sin' }] }
  const accFila = (i: number): Boton[] => {
    const borrar: Boton[] = tienda ? [] : [{ t: 'Eliminar pago', g: i === 0 ? 'borrar1' : undefined }]
    if (i === 0) return [...(todos ? [{ t: '¿Repetido?', g: 'repetido' }] : []), { t: 'Editar', g: 'lapiz1' }, ...borrar]
    if (i === 1) return [...(todos ? [{ t: 'Falta la forma', g: 'faltaForma' }] : []), { t: 'Falta decir dónde cayó', g: 'faltaDonde' }, { t: 'Editar' }, ...borrar]
    return [{ t: 'Editar' }, ...borrar]
  }
  const tabla = (marcadas: boolean): Pieza => ({
    k: 'tabla',
    g: 'tabla',
    cab: ['Fecha', 'Cliente', 'Concepto', 'Forma', 'Dónde cayó', 'Monto'],
    filas: x.filas.map((f, i) => ({ c: [`${marcadas ? '☑ ' : ''}${f[0]}`, ...f.slice(1)], g: i === 0 ? 'fila1' : undefined, acc: accFila(i) })),
    pie: [`Total · ${n} pagos`, '', '', '', '', x.total],
  })
  const masa = (marcadas: boolean): Pieza => ({ k: 'botones', g: 'masa', l: marcadas ? [{ t: 'Desmarcar todas' }, { t: `Completar forma y cuenta · ${n}`, g: 'completar' }, { t: `Eliminar los marcados · ${n}`, g: 'eliminarMarcados' }, { t: `Bajar recibos · ${n}` }] : [{ t: `Marcar todas · ${n}`, g: 'marcarTodas' }] })
  const pantalla = (o: { marcadas?: boolean; p?: number; v?: number; menu?: boolean } = {}): Escena => ({
    etiqueta: x.etiqueta,
    titulo: 'Pagos que recibí',
    acciones,
    piezas: [
      ...(o.menu ? [{ k: 'menu' as const, g: 'menuMas', l: [{ t: 'Registrar anticipo', g: 'anticipo' }] }] : []),
      kpis, periodo(o.p ?? 0), vistas(o.v ?? 0), filtros,
      ...(tienda ? [] : [masa(!!o.marcadas)]),
      tabla(!!o.marcadas),
    ],
  })
  const f1 = x.filas[1]
  const f0 = x.filas[0]
  const editarFalta: Escena['hoja'] = tienda
    ? { titulo: 'Pago de la tienda', piezas: [{ k: 'campos', g: 'camposFalta', l: [{ et: 'Dónde cayó', v: 'Efectivo · Efectivo billetera' }, { et: 'Comprobante', v: 'Elegir, arrastrar o pegar (Ctrl/⌘ + V)' }] }], pie: [{ t: 'Cancelar' }, { t: 'Guardar', g: 'guardarFalta', p: true }] }
    : { titulo: 'Editar pago', piezas: [{ k: 'campos', g: 'camposFalta', l: [{ et: 'Fecha del pago', v: f1[0] }, { et: 'Forma de pago', v: todos ? 'Efectivo' : f1[3] }, { et: 'Dónde cayó', v: 'Efectivo · Efectivo billetera' }] }], pie: [{ t: 'Cancelar' }, { t: 'Guardar', g: 'guardarFalta', p: true }] }
  const aplica = (dos: boolean): Pieza[] => [
    { k: 'subtitulo', g: 'aplica', t: 'A qué se aplicó (tipo y período)' },
    { k: 'campos', g: 'lineas', l: [{ et: 'Cobro', v: `${f0[2]} · falta ${f0[5]}` }, { et: 'Monto', v: dos ? 'Q 350.00' : f0[5] }, ...(dos ? [{ et: 'Cobro', v: 'Dominio 2027 · falta Q 350.00' }, { et: 'Monto', v: 'Q 350.00' }] : [])] },
    { k: 'botones', g: 'botonRepartir', l: [{ t: 'Repartir en otro cobro', g: 'repartir' }] },
    { k: 'campos', l: [{ et: 'Forma de pago', v: f0[3] }, { et: 'Dónde cayó', v: f0[4] }, { et: 'Comprobante', v: '1 comprobante' }] },
  ]
  const editarPago = (dos: boolean): Escena['hoja'] => ({ titulo: 'Editar pago', piezas: aplica(dos), pie: [{ t: 'Eliminar pago', g: 'eliminarEnEditor' }, { t: 'Cancelar' }, { t: 'Guardar', p: true }] })
  const eliminar: Escena['hoja'] = {
    titulo: 'Eliminar pago',
    piezas: [
      ...(todos ? [{ k: 'aviso' as const, g: 'avisoWorld', t: 'Este pago también se borra en Monterroso World. Solo se borra el pago; el proyecto y lo demás de World no se toca.' }] : []),
      { k: 'texto', g: 'vuelven', t: `${f0[1]} · ${f0[5]} · ${f0[0]} — «${f0[2]}» vuelve a quedar por cobrar.` },
    ],
    pie: [{ t: 'Cancelar', g: 'cancelarEliminar' }, { t: 'Eliminar pago', p: true }],
  }
  const eliminarVarios: Escena['hoja'] = {
    titulo: `Eliminar ${n} pagos`,
    piezas: [{ k: 'tabla', g: 'listaEliminar', cab: ['Pago', 'Qué pasa'], filas: x.filas.map((f) => ({ c: [`${f[1]} · ${f[5]} · ${f[0]}`, `«${f[2]}» vuelve a quedar por cobrar.`] })) }],
    pie: [{ t: 'Cancelar', g: 'cancelarVarios' }, { t: `Eliminar ${n}`, p: true }],
  }
  const detalle: Escena['hoja'] = {
    titulo: `${x.detalle ?? f0[2]} · ${f0[5]}`,
    piezas: [
      { k: 'aviso', g: 'avisoRepetido', t: '¿Repetido? Hay otro pago igual. Si es el mismo dinero anotado dos veces, elimina uno con «Editar» › «Eliminar pago».' },
      { k: 'campos', l: [{ et: 'Forma de pago', v: f0[3] }, { et: 'Dónde cayó', v: f0[4] }, { et: 'De dónde viene', v: 'Anotado en Monterroso World el 06/11/2026' }] },
      { k: 'subtitulo', t: 'Qué pagó' },
      { k: 'subtitulo', t: 'Comprobantes' },
    ],
    pie: [{ t: 'Recibo' }, { t: 'Editar' }, { t: 'Cerrar', g: 'cerrarDetalle' }],
  }

  const caps: Capitulo[] = [
    {
      t: '1 · Buscar y filtrar',
      e0: pantalla(),
      tomas: [
        { t: 'Arriba ves lo que entró en el período y cuántos pagos no dicen dónde cayó o no tienen comprobante.', en: 'kpis', ms: 4200 },
        { t: 'Elige el período: este mes, el anterior, el año, un rango o desde el inicio.', en: 'anio', clic: true, luego: pantalla({ p: 2 }) },
        { t: 'Filtra por forma de pago, dónde cayó o si tiene comprobante.', en: 'filtros' },
        { t: '«Por mes» agrupa con su subtotal; «Por cliente» junta los de cada cliente.', en: 'vMes', clic: true, luego: pantalla({ p: 2, v: 1 }) },
        { t: '«Excel» baja lo filtrado y «PDF» lo abre listo para guardar.', en: 'excel' },
      ],
    },
    {
      t: todos ? '2 · Completar lo que falta y repetidos' : '2 · Completar lo que falta',
      e0: pantalla(),
      tomas: [
        ...(todos ? [{ t: '«Falta la forma» avisa que no se anotó cómo te pagaron.', en: 'faltaForma' }] : []),
        { t: 'Toca «Falta decir dónde cayó»: se abre el pago para completarlo.', en: 'faltaDonde', clic: true, luego: { hoja: editarFalta } },
        { t: tienda ? 'Elige la cuenta o caja donde cayó y, si quieres, el comprobante.' : 'Elige la forma de pago y la cuenta o caja donde cayó.', en: 'camposFalta' },
        { t: 'Toca «Guardar».', en: 'guardarFalta', clic: true, luego: { hoja: null } },
        ...(todos ? [
          { t: '«¿Repetido?» sale cuando hay otro pago igual; tócalo para revisarlo.', en: 'repetido', clic: true, luego: { hoja: detalle } },
          { t: 'Si es el mismo dinero anotado dos veces, elimina uno.', en: 'avisoRepetido', ms: 4200 },
          { t: '«Cerrar» vuelve a la lista.', en: 'cerrarDetalle', clic: true, luego: { hoja: null } },
        ] : []),
      ],
    },
  ]
  if (!tienda) {
    caps.push({
      t: '3 · Editar y eliminar un pago',
      e0: pantalla(),
      tomas: [
        { t: 'El lápiz abre «Editar pago».', en: 'lapiz1', clic: true, luego: { hoja: editarPago(false) } },
        { t: '«A qué se aplicó (tipo y período)» dice qué cobro pagó; cámbialo si se anotó en otro.', en: 'aplica', ms: 4200 },
        { t: '«Repartir en otro cobro» divide el pago entre dos cobros del mismo cliente.', en: 'repartir', clic: true, luego: { hoja: editarPago(true) } },
        { t: '«Eliminar pago» pregunta antes de borrarlo.', en: 'eliminarEnEditor', clic: true, luego: { hoja: eliminar } },
        { t: 'Te dice qué cobro vuelve a quedar por cobrar.', en: 'vuelven' },
        ...(todos ? [{ t: 'Si vino de Monterroso World, avisa que allá también se borra.', en: 'avisoWorld', ms: 4200 }] : []),
        { t: '«Cancelar» no borra nada; si lo eliminas, se puede deshacer.', en: 'cancelarEliminar', clic: true, luego: { hoja: null } },
      ],
    })
    caps.push({
      t: todos ? '4 · Varios a la vez y anticipo' : '4 · Varios a la vez',
      e0: pantalla(),
      tomas: [
        { t: 'Toca «Marcar todas», o marca las casillas que quieras.', en: 'marcarTodas', clic: true, luego: pantalla({ marcadas: true }) },
        { t: '«Completar forma y cuenta» pone la forma y dónde cayó a todas las marcadas.', en: 'completar' },
        { t: '«Eliminar los marcados» primero muestra qué cobros vuelven a quedar por cobrar.', en: 'eliminarMarcados', clic: true, luego: { hoja: eliminarVarios } },
        { t: 'Revisa la lista; «Cancelar» no borra nada.', en: 'cancelarVarios', clic: true, luego: { hoja: null, piezas: pantalla().piezas } },
        ...(todos ? [
          { t: 'En «Más» está «Registrar anticipo».', en: 'mas', clic: true, luego: pantalla({ menu: true }) },
          { t: 'Anota un pago adelantado: queda como saldo a favor del cliente.', en: 'anticipo', clic: true, luego: { piezas: pantalla().piezas, hoja: { titulo: 'Registrar anticipo', piezas: [{ k: 'campos' as const, g: 'camposAnticipo', l: [{ et: 'Cliente', v: 'Panadería La Espiga' }, { et: 'Fecha', v: '20 nov 2026' }, { et: 'Monto', v: 'Q 1,350.00' }, { et: 'Forma de pago', v: 'Depósito' }, { et: 'Dónde cayó', v: 'Personal · Banco Uno ••4821' }] }], pie: [{ t: 'Cancelar' }, { t: 'Registrar anticipo', g: 'okAnticipo', p: true }] } } },
          { t: 'Toca «Registrar anticipo»; lo ves en «Saldo a favor».', en: 'okAnticipo', clic: true, luego: { hoja: null } },
        ] : []),
      ],
    })
  }
  return { ruta: x.ruta, menu: x.menu, caps }
}

const guia = guiaPagos({
  ruta: '/pagos',
  menu: 'Pagos que recibí',
  etiqueta: 'Dinero',
  tipo: 'todos',
  detalle: 'Mensualidad',
  filas: [
    ['06 nov 2026', 'Panadería La Espiga', 'Mensualidad de noviembre', 'Transferencia', 'Personal · Banco Uno ••4821', 'Q 700.00'],
    ['12 nov 2026', 'Taller El Pistón', 'Mensualidad de noviembre', '—', '—', 'Q 350.00'],
  ],
  total: 'Q 1,050.00',
})

export default guia
