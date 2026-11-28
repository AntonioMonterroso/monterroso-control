import { pendientes, type Cobro } from './cobros'
import { aCentavos, deCentavos, quetzales } from './dinero'
import { entraDinero, posiblesRepetidos, type EntradaDinero } from './entradas'
import { fijosPendientes, movimientos, rangoMes, resultado, sumarMeses, type Resultado } from './finanzas'
import { diasEntre, fechaCorta, nombreMes, partes } from './fechas'
import type { Modelo } from './modelo'
import { FORMAS } from './pagosDestino'
import type { Cliente, ClaveNegocio } from './tipos'

export type NegocioAsistente = 'todos' | ClaveNegocio
export type Pantalla = 'resumen' | 'cobros' | 'pagos' | 'gastos' | 'cuentas' | 'cliente' | 'ninguna'
export type Tarea = 'anotar' | 'preguntar' | 'revisar'

export const TOPE_USD = 25
export const AVISO_USD = 20

export const NOMBRE_NEGOCIO: Record<NegocioAsistente, string> = {
  todos: 'Todos los negocios', dev: 'Dev Studio', musica: 'Música', diseno: 'Diseño', canela: 'Hogar Canela', salario: 'Salario', sa: 'Sociedad anónima',
}

export function negocioDeRuta(ruta: string): NegocioAsistente {
  const r = ruta.match(/^\/(dev|musica|diseno|tienda|salario|sa)(?:\/|$)/)
  if (!r) return 'todos'
  return r[1] === 'tienda' ? 'canela' : (r[1] as NegocioAsistente)
}

const RUTAS: Record<NegocioAsistente, Partial<Record<Pantalla, string>>> = {
  todos: { resumen: '/', cobros: '/cobros', pagos: '/pagos', gastos: '/gastos' },
  dev: { resumen: '/dev', cobros: '/dev/cobros', pagos: '/dev/pagos', gastos: '/dev/gastos' },
  musica: { resumen: '/musica', cobros: '/musica/cobros', pagos: '/musica/pagos', gastos: '/musica/gastos' },
  diseno: { resumen: '/diseno', cobros: '/diseno/cobros', pagos: '/diseno/pagos', gastos: '/diseno/gastos' },
  canela: { resumen: '/tienda', cobros: '/tienda/pagos', pagos: '/tienda/recibidos', gastos: '/tienda/gastos' },
  salario: { resumen: '/salario', cobros: '/salario', pagos: '/salario/recibidos', gastos: '/salario/gastos' },
  sa: { resumen: '/sa', cobros: '/cobros', pagos: '/pagos', gastos: '/gastos' },
}

export function rutaDe(neg: NegocioAsistente, pantalla: Pantalla, clienteId?: string | null): string | null {
  if (pantalla === 'ninguna') return null
  if (pantalla === 'cuentas') return '/cuentas'
  if (pantalla === 'cliente') return clienteId ? `/clientes/${encodeURIComponent(clienteId)}` : null
  return RUTAS[neg][pantalla] ?? RUTAS.todos[pantalla] ?? null
}

export const NOMBRE_PANTALLA: Record<Pantalla, string> = {
  resumen: 'Resumen', cobros: 'Lo que me deben', pagos: 'Pagos que recibí', gastos: 'Gastos', cuentas: 'Dónde está mi dinero', cliente: 'Ficha del cliente', ninguna: '',
}

export function nombrePeriodo(periodo: string): string {
  const [a, m] = partes(`${periodo}-01`)
  return nombreMes(a, m)
}

export function normalizar(t: string): string {
  return t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ ]+/g, ' ').replace(/\s+/g, ' ').trim()
}

const PREGUNTA = /^(cuanto|cuanta|cuantos|cuantas|quien|quienes|que|cual|cuales|como|donde|cuando|por que|porque|hay|tengo|debo|me debe|dime|muestrame|explicame|resume|resumen)\b/

export function tareaDe(texto: string): Exclude<Tarea, 'revisar'> {
  const t = texto.trim()
  if (/[¿?]/.test(t)) return 'preguntar'
  const n = normalizar(t)
  if (PREGUNTA.test(n)) return 'preguntar'
  if (/\d/.test(n) && /\b(pago|pague|pagaron|pagamos|gaste|gastamos|compre|cobre|recibi|me dio|deposito|deposite|transfirio|transferi|abono|abone|cancelo|cancele)\b/.test(n)) return 'anotar'
  if (/\bq ?\d/.test(n)) return 'anotar'
  return 'preguntar'
}

export function negocioId(m: Modelo, neg: NegocioAsistente): string | undefined {
  return neg === 'todos' ? undefined : m.negocios.find((n) => n.clave === neg)?.id
}

const q = (n: number) => quetzales(n)

export function buscarClientes(dicho: string, clientes: Cliente[]): Cliente[] {
  const d = normalizar(dicho)
  if (!d) return []
  const exactos = clientes.filter((c) => normalizar(c.nombre) === d)
  if (exactos.length === 1) return exactos
  const palabras = d.split(' ').filter((p) => p.length > 1)
  if (!palabras.length) return []
  return clientes.filter((c) => {
    const nombres = [c.nombre, ...(c.aka ?? [])].map(normalizar)
    return nombres.some((n) => palabras.every((p) => n.split(' ').some((w) => w.startsWith(p))))
  })
}

export interface ResumenRevision {
  periodo: string
  negocio: NegocioAsistente
  resultado: Resultado
  ingresosPorOrigen: { origen: string; monto: number }[]
  gastosPorCategoria: { categoria: string; monto: number }[]
  pagos: { cuantos: number; total: number }
  pendientes: { cuantos: number; total: number; vencidos: number; totalVencido: number }
  deudores: { cliente_id: string; nombre: string; saldo: number; vencido: number; masViejo: string | null }[]
  sinComprobante: { cuantos: number; total: number; ejemplos: { fecha: string; monto: number; quien: string }[] }
  sinForma: number
  sinDestino: number
  repetidos: { fecha: string; monto: number; quien: string; veces: number }[]
  fijosSinRegistrar: { nombre: string; monto: number }[]
  gastosSinFactura: number
}

const ORIGEN: Record<string, string> = { pago: 'Pagos de clientes', venta: 'Ventas de la tienda', salario: 'Salario' }

export function resumenDelMes(m: Modelo, cobros: Cobro[], entradas: EntradaDinero[], periodo: string, neg: NegocioAsistente): ResumenRevision {
  const [desde, hasta] = rangoMes(periodo)
  const nid = negocioId(m, neg)
  const movs = movimientos(m, desde, hasta).filter((x) => !nid || x.negocio_id === nid)
  const res = resultado(movs)
  const sumaPor = (l: { k: string; monto: number }[]) => [...l.reduce((g, x) => g.set(x.k, (g.get(x.k) ?? 0) + aCentavos(x.monto)), new Map<string, number>()).entries()].sort((a, b) => b[1] - a[1]).map(([k, c]) => ({ k, monto: deCentavos(c) }))
  const ingresosPorOrigen = sumaPor(movs.filter((x) => x.tipo === 'ingreso').map((x) => ({ k: ORIGEN[x.origen] ?? 'Otros', monto: x.monto }))).map((x) => ({ origen: x.k, monto: x.monto }))
  const cat = (id: string | null) => m.categorias.find((c) => c.id === id)?.nombre ?? 'Sin categoría'
  const gastosPorCategoria = sumaPor(movs.filter((x) => x.tipo === 'gasto').map((x) => ({ k: cat(x.categoria_id), monto: x.monto }))).slice(0, 10).map((x) => ({ categoria: x.k, monto: x.monto }))
  const nombre = (id: string | null) => m.clientes.find((c) => c.id === id)?.nombre ?? (id ? id : 'Sin cliente')
  const delNegocio = (clienteId: string | null) => !nid || m.clientes.find((c) => c.id === clienteId)?.negocio_id === nid
  const entMes = entradas.filter((e) => e.fecha >= desde && e.fecha <= hasta && (!nid || e.negocio_id === nid))
  const conDinero = entMes.filter(entraDinero)
  const sinComp = conDinero.filter((e) => !e.comprobantes.length)
  const pend = pendientes(cobros).filter((c) => c.tipo !== 'salario' && delNegocio(c.cliente_id) && (!c.vence || c.vence <= hasta))
  const porCliente = new Map<string, { saldo: number; vencido: number; masViejo: string | null }>()
  for (const c of pend) {
    const x = porCliente.get(c.cliente_id) ?? { saldo: 0, vencido: 0, masViejo: null }
    x.saldo += aCentavos(c.saldo)
    if (c.estado === 'vencido') x.vencido += aCentavos(c.saldo)
    if (c.vence && (!x.masViejo || c.vence < x.masViejo)) x.masViejo = c.vence
    porCliente.set(c.cliente_id, x)
  }
  const deudores = [...porCliente.entries()].sort((a, b) => b[1].saldo - a[1].saldo).slice(0, 10).map(([id, x]) => ({ cliente_id: id, nombre: nombre(id), saldo: deCentavos(x.saldo), vencido: deCentavos(x.vencido), masViejo: x.masViejo }))
  const rep = posiblesRepetidos(m.pagos)
  const vistos = new Set<string>()
  const repetidos: ResumenRevision['repetidos'] = []
  for (const p of m.pagos) {
    if (p.fecha < desde || p.fecha > hasta || !rep.has(p.id) || vistos.has(p.id) || !delNegocio(p.cliente_id)) continue
    const otros = rep.get(p.id) ?? []
    for (const o of otros) vistos.add(o)
    vistos.add(p.id)
    repetidos.push({ fecha: p.fecha, monto: p.monto, quien: nombre(p.cliente_id), veces: otros.length + 1 })
  }
  const total = (l: { monto: number }[]) => deCentavos(l.reduce((s, x) => s + aCentavos(x.monto), 0))
  const fijos = fijosPendientes(m.gastosFijos.filter((f) => !nid || f.negocio_id === nid), m.gastos, periodo)
  const gastosMes = m.gastos.filter((g) => g.fecha >= desde && g.fecha <= hasta && (!nid || g.negocio_id === nid))
  return {
    periodo, negocio: neg, resultado: res, ingresosPorOrigen, gastosPorCategoria,
    pagos: { cuantos: conDinero.length, total: total(conDinero) },
    pendientes: { cuantos: pend.length, total: total(pend.map((c) => ({ monto: c.saldo }))), vencidos: pend.filter((c) => c.estado === 'vencido').length, totalVencido: total(pend.filter((c) => c.estado === 'vencido').map((c) => ({ monto: c.saldo }))) },
    deudores,
    sinComprobante: { cuantos: sinComp.length, total: total(sinComp), ejemplos: sinComp.slice(0, 5).map((e) => ({ fecha: e.fecha, monto: e.monto, quien: e.cliente_id ? nombre(e.cliente_id) : e.concepto })) },
    sinForma: conDinero.filter((e) => !e.forma).length,
    sinDestino: conDinero.filter((e) => !e.destino).length,
    repetidos: repetidos.slice(0, 8),
    fijosSinRegistrar: fijos.slice(0, 8).map((f) => ({ nombre: f.nombre, monto: f.monto })),
    gastosSinFactura: gastosMes.filter((g) => !g.factura_numero && !g.archivo).length,
  }
}

export function textoRevision(r: ResumenRevision, hoy: string): string {
  const l: string[] = []
  l.push(`Mes: ${nombrePeriodo(r.periodo)}. Negocio: ${NOMBRE_NEGOCIO[r.negocio]}. Hoy: ${fechaCorta(hoy)}.`)
  l.push(`Lo que entró (ingresos): ${q(r.resultado.ingresos)}. Gastos: ${q(r.resultado.gastos)}. Lo que de verdad ganó (ingresos menos gastos): ${q(r.resultado.utilidad)}.`)
  if (r.ingresosPorOrigen.length) l.push(`Ingresos por origen: ${r.ingresosPorOrigen.map((x) => `${x.origen} ${q(x.monto)}`).join('; ')}.`)
  if (r.gastosPorCategoria.length) l.push(`Gastos por categoría: ${r.gastosPorCategoria.map((x) => `${x.categoria} ${q(x.monto)}`).join('; ')}.`)
  l.push(`Pagos con dinero recibidos en el mes: ${r.pagos.cuantos} por ${q(r.pagos.total)}.`)
  l.push(`Cobros pendientes hasta fin de mes: ${r.pendientes.cuantos} por ${q(r.pendientes.total)}; vencidos ${r.pendientes.vencidos} por ${q(r.pendientes.totalVencido)}.`)
  if (r.deudores.length) l.push(`Quién debe [cliente_id]: ${r.deudores.map((d) => `${d.nombre} [${d.cliente_id}] ${q(d.saldo)}${d.vencido > 0 ? ` (vencido ${q(d.vencido)}${d.masViejo ? `, desde ${fechaCorta(d.masViejo)}, ${diasEntre(d.masViejo, hoy)} días` : ''})` : ''}`).join('; ')}.`)
  l.push(`Pagos sin comprobante: ${r.sinComprobante.cuantos} por ${q(r.sinComprobante.total)}${r.sinComprobante.ejemplos.length ? ` (por ejemplo: ${r.sinComprobante.ejemplos.map((e) => `${fechaCorta(e.fecha)} ${e.quien} ${q(e.monto)}`).join('; ')})` : ''}.`)
  l.push(`Pagos sin forma de pago: ${r.sinForma}. Pagos sin decir dónde cayó: ${r.sinDestino}.`)
  l.push(r.repetidos.length ? `Posibles pagos repetidos: ${r.repetidos.map((x) => `${fechaCorta(x.fecha)} ${x.quien} ${q(x.monto)} (${x.veces} veces)`).join('; ')}.` : 'Posibles pagos repetidos: ninguno.')
  l.push(r.fijosSinRegistrar.length ? `Gastos fijos sin registrar este mes: ${r.fijosSinRegistrar.map((x) => `${x.nombre} ${q(x.monto)}`).join('; ')}.` : 'Gastos fijos sin registrar: ninguno.')
  l.push(`Gastos sin factura ni comprobante: ${r.gastosSinFactura}.`)
  return l.join('\n')
}

export function contextoPreguntas(m: Modelo, cobros: Cobro[], periodo: string, neg: NegocioAsistente, hoy: string): string {
  const l: string[] = []
  l.push(`Hoy: ${fechaCorta(hoy)}. Mes abierto en pantalla: ${nombrePeriodo(periodo)}. Negocio en pantalla: ${NOMBRE_NEGOCIO[neg]}.`)
  l.push('Resultado por mes (ingresos | gastos | ganado = ingresos menos gastos):')
  const negs = m.negocios.filter((n) => n.activo)
  for (let i = 11; i >= 0; i--) {
    const per = sumarMeses(periodo, -i)
    const [desde, hasta] = rangoMes(per)
    const movs = movimientos(m, desde, hasta)
    const t = resultado(movs)
    const partesN = negs.map((n) => ({ n, r: resultado(movs, n.id) })).filter((x) => x.r.ingresos || x.r.gastos).map((x) => `${x.n.nombre}: ${q(x.r.ingresos)} | ${q(x.r.gastos)} | ${q(x.r.utilidad)}`)
    l.push(`- ${nombrePeriodo(per)}: Todos: ${q(t.ingresos)} | ${q(t.gastos)} | ${q(t.utilidad)}${partesN.length ? `. ${partesN.join('. ')}` : ''}`)
  }
  const pend = pendientes(cobros).filter((c) => c.tipo !== 'salario')
  const deuda = new Map<string, { saldo: number; vencido: number }>()
  for (const c of pend) {
    const x = deuda.get(c.cliente_id) ?? { saldo: 0, vencido: 0 }
    x.saldo += aCentavos(c.saldo)
    if (c.estado === 'vencido') x.vencido += aCentavos(c.saldo)
    deuda.set(c.cliente_id, x)
  }
  const nombre = (id: string) => m.clientes.find((c) => c.id === id)?.nombre ?? id
  const negDe = (id: string) => m.negocios.find((n) => n.id === m.clientes.find((c) => c.id === id)?.negocio_id)?.nombre ?? ''
  const deudores = [...deuda.entries()].sort((a, b) => b[1].saldo - a[1].saldo).slice(0, 25)
  l.push(`Quién debe hoy (de más a menos; incluye cobros futuros ya generados): ${deudores.length ? deudores.map(([id, x]) => `${nombre(id)} (${negDe(id)}) ${q(deCentavos(x.saldo))}${x.vencido ? `, vencido ${q(deCentavos(x.vencido))}` : ''}`).join('; ') : 'nadie'}.`)
  const vencidoTotal = deCentavos(pend.filter((c) => c.estado === 'vencido').reduce((s, c) => s + aCentavos(c.saldo), 0))
  l.push(`Total vencido hoy: ${q(vencidoTotal)}.`)
  const desde12 = rangoMes(sumarMeses(periodo, -11))[0]
  const hasta = rangoMes(periodo)[1]
  const pagado = new Map<string, number>()
  for (const p of m.pagos) if (p.cliente_id && p.fecha >= desde12 && p.fecha <= hasta && p.forma !== 'anticipo') pagado.set(p.cliente_id, (pagado.get(p.cliente_id) ?? 0) + aCentavos(p.monto))
  const top = [...pagado.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25)
  l.push(`Lo que pagó cada cliente en los últimos 12 meses: ${top.length ? top.map(([id, c]) => `${nombre(id)} ${q(deCentavos(c))}`).join('; ') : 'nada'}.`)
  return l.join('\n')
}

export function contextoAnotar(m: Modelo, cobros: Cobro[], neg: NegocioAsistente, hoy: string, destinos: { valor: string; nombre: string }[]): string {
  const l: string[] = []
  l.push(`Hoy: ${hoy}. Negocio en pantalla: ${neg}.`)
  l.push(`Negocios (clave = nombre): ${m.negocios.filter((n) => n.activo).map((n) => `${n.clave} = ${n.nombre}`).join('; ')}.`)
  l.push(`Formas de pago: ${FORMAS.map((f) => `${f.valor} = ${f.nombre}`).join('; ')}.`)
  l.push(`Destinos (dónde cayó o de dónde salió el dinero; valor = nombre): ${destinos.map((d) => `${d.valor} = ${d.nombre}`).join('; ')}.`)
  l.push(`Categorías de gasto (id = nombre): ${m.categorias.filter((c) => c.tipo === 'gasto' && c.activo).map((c) => `${c.id} = ${c.nombre}`).join('; ')}.`)
  const pend = pendientes(cobros).filter((c) => c.tipo !== 'salario')
  l.push('Clientes (id | nombre | negocio | cobros pendientes clave = concepto, saldo, vence):')
  const claveNeg = (id: string) => m.negocios.find((n) => n.id === id)?.clave ?? ''
  for (const c of m.clientes.filter((x) => x.activo && !x.archivado)) {
    const suyos = pend.filter((x) => x.cliente_id === c.id).slice(0, 6)
    l.push(`- ${c.id} | ${c.nombre}${c.aka?.length ? ` (también ${c.aka.join(', ')})` : ''} | ${claveNeg(c.negocio_id)} | ${suyos.length ? suyos.map((x) => `${x.clave} = ${x.concepto}, ${x.saldo.toFixed(2)}, ${x.vence ?? 'sin fecha'}`).join('; ') : 'no debe nada'}`)
  }
  return l.join('\n')
}

export interface PropuestaCruda {
  tipo: 'pago' | 'gasto'
  cliente_dicho: string
  cliente_id: string
  cobro_clave: string
  monto: number
  fecha: string
  forma: string
  destino: string
  negocio_clave: string
  categoria_id: string
  descripcion: string
  nota: string
}

export type Lectura =
  | { tipo: 'pago'; cliente: Cliente; cobro: Cobro | null; monto: number; fecha: string; forma: string; destino: string; nota: string; problema: string | null }
  | { tipo: 'gasto'; cliente: Cliente | null; monto: number; fecha: string; forma: string; destino: string; negocio_id: string; categoria_id: string; descripcion: string; problema: string | null }
  | { tipo: 'elegir'; dicho: string; opciones: Cliente[]; cruda: PropuestaCruda }
  | { tipo: 'error'; texto: string }

const FECHA = /^\d{4}-\d{2}-\d{2}$/
const FORMAS_OK = new Set<string>(FORMAS.map((f) => f.valor))

export function elegirCliente(cruda: PropuestaCruda, clientes: Cliente[], neg: NegocioAsistente, m: Pick<Modelo, 'negocios'>): Cliente | { opciones: Cliente[] } | null {
  const activos = clientes.filter((c) => !c.archivado)
  const dicho = cruda.cliente_dicho.trim()
  const elegido = activos.find((c) => c.id === cruda.cliente_id) ?? null
  if (!dicho) return elegido
  let candidatos = buscarClientes(dicho, activos)
  const nid = neg === 'todos' ? undefined : m.negocios.find((n) => n.clave === neg)?.id
  if (candidatos.length > 1 && nid) {
    const aqui = candidatos.filter((c) => c.negocio_id === nid)
    if (aqui.length === 1) candidatos = aqui
  }
  if (candidatos.length === 1) return candidatos[0]
  if (candidatos.length > 1) return { opciones: candidatos.slice(0, 8) }
  return { opciones: [] }
}

export function leerPropuesta(cruda: PropuestaCruda, m: Modelo, cobros: Cobro[], neg: NegocioAsistente, hoy: string, clienteForzado?: Cliente): Lectura {
  const monto = Math.round(Number(cruda.monto) * 100) / 100
  if (!Number.isFinite(monto) || monto <= 0) return { tipo: 'error', texto: 'No entendí el monto. Escríbelo así: «Q850».' }
  const fecha = FECHA.test(cruda.fecha) && cruda.fecha <= hoy ? cruda.fecha : hoy
  const forma = FORMAS_OK.has(cruda.forma) ? cruda.forma : 'transferencia'
  const destino = cruda.destino?.trim() ?? ''
  const pick = clienteForzado ?? elegirCliente(cruda, m.clientes, neg, m)
  if (cruda.tipo === 'pago') {
    if (!pick) return { tipo: 'elegir', dicho: cruda.cliente_dicho, opciones: [], cruda }
    if (!('id' in pick)) return { tipo: 'elegir', dicho: cruda.cliente_dicho, opciones: pick.opciones, cruda }
    const suyos = pendientes(cobros).filter((c) => c.cliente_id === pick.id && c.tipo !== 'salario')
    const cobro = suyos.find((c) => c.clave === cruda.cobro_clave) ?? (suyos.length === 1 ? suyos[0] : suyos.find((c) => c.estado === 'vencido') ?? suyos[0] ?? null)
    const problema = !cobro ? `${pick.nombre} no debe nada. Si te pagó por adelantado, regístralo como anticipo.` : monto > cobro.saldo + 0.001 ? `El monto pasa lo pendiente de ese cobro (${quetzales(cobro.saldo)}).` : !destino ? 'Falta decir dónde cayó el dinero.' : null
    return { tipo: 'pago', cliente: pick, cobro, monto, fecha, forma, destino, nota: cruda.nota.trim(), problema }
  }
  const cliente = pick && 'id' in pick ? pick : null
  const negocio = m.negocios.find((n) => n.clave === cruda.negocio_clave) ?? (cliente ? m.negocios.find((n) => n.id === cliente.negocio_id) : undefined) ?? m.negocios.find((n) => n.clave === (neg === 'todos' ? 'dev' : neg))
  const categoria = m.categorias.find((c) => c.id === cruda.categoria_id && c.tipo === 'gasto')
  const descripcion = cruda.descripcion.trim().slice(0, 300)
  const problema = !negocio ? 'Falta el negocio.' : !categoria ? 'Falta la categoría.' : !descripcion ? 'Falta la descripción.' : null
  return { tipo: 'gasto', cliente, monto, fecha, forma, destino, negocio_id: negocio?.id ?? '', categoria_id: categoria?.id ?? '', descripcion, problema }
}

const CUENTA_DE_FORMA: Record<string, string> = { efectivo: 'Efectivo', transferencia: 'Transferencia', deposito: 'Depósito', tarjeta: 'Tarjeta', cheque: 'Banco', otro: 'Banco' }

export function cuentaDeForma(forma: string): string {
  return CUENTA_DE_FORMA[forma] ?? 'Banco'
}

export function usd(n: number): string {
  return `USD ${(Math.round((Number.isFinite(n) ? n : 0) * 100) / 100).toFixed(2)}`
}

export interface Hallazgo { titulo: string; detalle: string; gravedad: 'alta' | 'media' | 'baja'; pantalla: Pantalla; cliente_id: string }

const PANTALLAS = new Set<Pantalla>(['resumen', 'cobros', 'pagos', 'gastos', 'cuentas', 'cliente', 'ninguna'])

export function leerHallazgos(x: unknown): Hallazgo[] {
  if (!x || typeof x !== 'object') return []
  const l = (x as { hallazgos?: unknown }).hallazgos
  if (!Array.isArray(l)) return []
  return l.flatMap((h): Hallazgo[] => {
    if (!h || typeof h !== 'object') return []
    const o = h as Record<string, unknown>
    const titulo = typeof o.titulo === 'string' ? o.titulo.trim() : ''
    if (!titulo) return []
    const pantalla = PANTALLAS.has(o.pantalla as Pantalla) ? (o.pantalla as Pantalla) : 'ninguna'
    const gravedad = o.gravedad === 'alta' || o.gravedad === 'baja' ? o.gravedad : 'media'
    return [{ titulo: titulo.slice(0, 200), detalle: typeof o.detalle === 'string' ? o.detalle.trim().slice(0, 600) : '', gravedad, pantalla, cliente_id: typeof o.cliente_id === 'string' ? o.cliente_id : '' }]
  }).slice(0, 12)
}

const texto = (x: unknown) => (typeof x === 'string' ? x : '')

export function leerCruda(x: unknown): PropuestaCruda | null {
  if (!x || typeof x !== 'object') return null
  const o = x as Record<string, unknown>
  if (o.tipo !== 'pago' && o.tipo !== 'gasto') return null
  const monto = typeof o.monto === 'number' ? o.monto : Number(String(o.monto ?? '').replace(/[^\d.]/g, ''))
  return {
    tipo: o.tipo, cliente_dicho: texto(o.cliente_dicho), cliente_id: texto(o.cliente_id), cobro_clave: texto(o.cobro_clave), monto: Number.isFinite(monto) ? monto : 0,
    fecha: texto(o.fecha), forma: texto(o.forma), destino: texto(o.destino), negocio_clave: texto(o.negocio_clave), categoria_id: texto(o.categoria_id), descripcion: texto(o.descripcion), nota: texto(o.nota),
  }
}

export interface Uso { gastado: number; tope: number; aviso: boolean }

export type Respuesta =
  | ({ tipo: 'texto'; texto: string } & Uso)
  | ({ tipo: 'propuesta'; propuesta: PropuestaCruda; texto: string } & Uso)
  | ({ tipo: 'revision'; resumen: string; hallazgos: Hallazgo[] } & Uso)
  | ({ tipo: 'uso' } & Uso)

export function leerUso(x: unknown): Uso | null {
  if (!x || typeof x !== 'object') return null
  const o = x as Record<string, unknown>
  const gastado = Number(o.gastado)
  if (!Number.isFinite(gastado)) return null
  const tope = Number.isFinite(Number(o.tope)) && Number(o.tope) > 0 ? Number(o.tope) : TOPE_USD
  return { gastado, tope, aviso: gastado >= AVISO_USD }
}

export function leerRespuesta(x: unknown): Respuesta | null {
  const uso = leerUso(x)
  if (!uso || !x || typeof x !== 'object') return null
  const o = x as Record<string, unknown>
  if (o.tipo === 'uso') return { tipo: 'uso', ...uso }
  if (o.tipo === 'propuesta') {
    const p = leerCruda(o.propuesta)
    if (p) return { tipo: 'propuesta', propuesta: p, texto: texto(o.texto), ...uso }
  }
  if (o.tipo === 'revision' && o.revision && typeof o.revision === 'object') {
    return { tipo: 'revision', resumen: texto((o.revision as Record<string, unknown>).resumen).trim(), hallazgos: leerHallazgos(o.revision), ...uso }
  }
  const t = texto(o.texto).trim()
  return { tipo: 'texto', texto: t || 'No tengo una respuesta para eso.', ...uso }
}

export function estadoTope(gastado: number | null, tope = TOPE_USD): 'bien' | 'aviso' | 'tope' {
  if (gastado == null) return 'bien'
  if (gastado >= tope) return 'tope'
  return gastado >= AVISO_USD ? 'aviso' : 'bien'
}
