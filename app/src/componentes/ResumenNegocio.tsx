import { ArrowDownRight, ArrowUpRight, BarChart3, Building, CheckCircle2, ClipboardList, FolderKanban, HandCoins, Landmark, Minus, Package, PiggyBank, Receipt, ReceiptText, Scale, ShoppingBag, Target, Users, UsersRound } from 'lucide-react'
import { useMemo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { aCentavos, deCentavos, quetzales } from '../lib/dinero'
import { diasEntre, fechaCorta, nombreMes, partes } from '../lib/fechas'
import { aumentoVigente, fijosPendientes, movimientos, rangoMes, resultado, sumarMeses, type Resultado } from '../lib/finanzas'
import { useModelo } from '../lib/modelo'
import { lineasPresupuesto } from '../lib/presupuesto'
import { cobrosDeVentas, porCobrarTienda } from '../lib/tiendaPagos'
import { NEGOCIOS_SA } from '../lib/tipos'
import { useAvisosDev, useCobros, useHoy, usePeriodo } from '../lib/usos'
import Pasos from './Pasos'
import SelectorMes from './SelectorMes'

export type ClaveResumen = 'dev' | 'musica' | 'diseno' | 'canela' | 'salario' | 'sa'

interface Rutas { pagos: string; cobros: string; gastos: string; presupuesto: string; utilidad: string }
interface Atajo { a: string; nombre: string; icono: ReactNode }

const estudio = (k: 'dev' | 'musica' | 'diseno', extra: Atajo[]): { rutas: Rutas; atajos: Atajo[] } => ({
  rutas: { pagos: `/${k}/pagos`, cobros: `/${k}/cobros`, gastos: `/${k}/gastos`, presupuesto: `/${k}/presupuesto`, utilidad: '/reportes' },
  atajos: [
    { a: `/${k}/cobros`, nombre: 'Lo que me deben', icono: <HandCoins aria-hidden /> },
    { a: `/${k}/pagos`, nombre: 'Pagos que recibí', icono: <ReceiptText aria-hidden /> },
    { a: `/${k}/gastos`, nombre: 'Gastos', icono: <Receipt aria-hidden /> },
    { a: `/${k}/presupuesto`, nombre: 'Presupuesto', icono: <Target aria-hidden /> },
    ...extra,
  ],
})

const CONF: Record<ClaveResumen, { nombre: string; que: string; rutas: Rutas; atajos: Atajo[] }> = {
  dev: { nombre: 'Dev Studio', que: 'Páginas y sistemas para tus clientes', ...estudio('dev', [{ a: '/clientes', nombre: 'Clientes', icono: <Users aria-hidden /> }, { a: '/proyectos', nombre: 'Proyectos', icono: <FolderKanban aria-hidden /> }]) },
  musica: { nombre: 'Música', que: 'Tus clientes y proyectos de música', ...estudio('musica', [{ a: '/musica/clientes', nombre: 'Clientes', icono: <Users aria-hidden /> }, { a: '/musica/proyectos', nombre: 'Proyectos', icono: <FolderKanban aria-hidden /> }]) },
  diseno: { nombre: 'Diseño', que: 'Tus clientes y proyectos de diseño', ...estudio('diseno', [{ a: '/diseno/clientes', nombre: 'Clientes', icono: <Users aria-hidden /> }, { a: '/diseno/proyectos', nombre: 'Proyectos', icono: <FolderKanban aria-hidden /> }]) },
  canela: {
    nombre: 'Hogar Canela', que: 'Tu tienda en Shopify con Dropi',
    rutas: { pagos: '/tienda/recibidos', cobros: '/tienda/pagos', gastos: '/tienda/gastos', presupuesto: '/tienda/presupuesto', utilidad: '/reportes' },
    atajos: [
      { a: '/tienda/pedidos', nombre: 'Pedidos', icono: <ShoppingBag aria-hidden /> },
      { a: '/tienda/pagos', nombre: 'Pagos de pedidos', icono: <HandCoins aria-hidden /> },
      { a: '/tienda/productos', nombre: 'Productos', icono: <Package aria-hidden /> },
      { a: '/tienda/gastos', nombre: 'Gastos', icono: <Receipt aria-hidden /> },
      { a: '/tienda/presupuesto', nombre: 'Presupuesto', icono: <Target aria-hidden /> },
    ],
  },
  salario: {
    nombre: 'Salario', que: 'Tu sueldo fijo y lo que gastas de él',
    rutas: { pagos: '/salario/recibidos', cobros: '/salario/recibidos', gastos: '/salario/gastos', presupuesto: '/salario/presupuesto', utilidad: '/reportes' },
    atajos: [
      { a: '/salario/recibidos', nombre: 'Salario recibido', icono: <ReceiptText aria-hidden /> },
      { a: '/salario/gastos', nombre: 'Gastos', icono: <Receipt aria-hidden /> },
      { a: '/salario/presupuesto', nombre: 'Presupuesto', icono: <Target aria-hidden /> },
    ],
  },
  sa: {
    nombre: 'Sociedad anónima', que: 'Dev Studio, Música, Diseño y los gastos generales',
    rutas: { pagos: '/sa/bancos', cobros: '/cobros', gastos: '/sa/estados', presupuesto: '/presupuestos', utilidad: '/sa/estados' },
    atajos: [
      { a: '/sa/socios', nombre: 'Socios y capital', icono: <UsersRound aria-hidden /> },
      { a: '/sa/utilidades', nombre: 'Utilidades', icono: <PiggyBank aria-hidden /> },
      { a: '/sa/bancos', nombre: 'Bancos', icono: <Landmark aria-hidden /> },
      { a: '/sa/estados', nombre: 'Estados financieros', icono: <Scale aria-hidden /> },
      { a: '/sa/tramites', nombre: 'Trámites', icono: <ClipboardList aria-hidden /> },
    ],
  },
}

interface Tarea { id: string; texto: string; detalle?: string; tono: 'peligro' | 'aviso' | 'info'; boton: string; a: string }

function sumarRes(l: Resultado[]): Resultado {
  const c = (k: keyof Resultado) => deCentavos(l.reduce((s, r) => s + aCentavos(r[k]), 0))
  return { ingresos: c('ingresos'), gastos: c('gastos'), utilidad: c('utilidad') }
}

function Cambio({ ahora, antes, mesAntes, alReves }: { ahora: number; antes: number; mesAntes: string; alReves?: boolean }) {
  if (antes === 0 && ahora === 0) return <span className="c-rn-cambio" data-tono="igual"><Minus aria-hidden />igual que {mesAntes}</span>
  if (antes === 0) return <span className="c-rn-cambio" data-tono="igual"><Minus aria-hidden />{mesAntes} en cero</span>
  const pct = Math.round(((ahora - antes) / Math.abs(antes)) * 100)
  if (pct === 0) return <span className="c-rn-cambio" data-tono="igual"><Minus aria-hidden />igual que {mesAntes}</span>
  const sube = pct > 0
  const bueno = alReves ? !sube : sube
  return (
    <span className="c-rn-cambio" data-tono={bueno ? 'bien' : 'mal'}>
      {sube ? <ArrowUpRight aria-hidden /> : <ArrowDownRight aria-hidden />}
      {Math.abs(pct)} % vs {mesAntes}
    </span>
  )
}

function Barra({ nombre, valor, de, texto, tono }: { nombre: string; valor: number; de: number; texto: string; tono: 'entra' | 'sale' }) {
  const ancho = de > 0 ? Math.min(100, Math.round((valor / de) * 100)) : 0
  return (
    <div className="c-rn-barra" data-tono={tono}>
      <div className="c-rn-barra-fila"><span>{nombre}</span><b className="m-cifra">{quetzales(valor)}</b></div>
      <div className="c-rn-barra-pista" role="img" aria-label={`${nombre}: ${texto}`}><i style={{ transform: `scaleX(${ancho / 100})` }} /></div>
      <small>{texto}</small>
    </div>
  )
}

export default function ResumenNegocio({ clave, accion, titulo, children, periodo: periodoFuera, onPeriodo }: { clave: ClaveResumen; accion?: ReactNode; titulo?: string; children?: ReactNode; periodo?: string; onPeriodo?: (p: string) => void }) {
  const m = useModelo()
  const hoy = useHoy()
  const [periodoPropio, setPeriodoPropio] = usePeriodo()
  const periodo = periodoFuera ?? periodoPropio
  const setPeriodo = onPeriodo ?? setPeriodoPropio
  const conf = CONF[clave]
  const cobros = useCobros(periodo)
  const avisosDev = useAvisosDev()
  const [a, mes] = partes(`${periodo}-01`)
  const anterior = sumarMeses(periodo, -1)
  const [aa, ma] = partes(`${anterior}-01`)
  const mesAntes = nombreMes(aa, ma).split(' ')[0].slice(0, 3).toLowerCase() + '.'
  const nombreDelMes = nombreMes(a, mes).split(' ')[0].toLowerCase()
  const [desde, hasta] = rangoMes(periodo)
  const [desdeA, hastaA] = rangoMes(anterior)
  const ids = useMemo(() => m.negocios.filter((n) => (clave === 'sa' ? NEGOCIOS_SA.includes(n.clave) : n.clave === clave)).map((n) => n.id), [m.negocios, clave])
  const movs = useMemo(() => movimientos(m, desde, hasta, hoy).filter((x) => ids.includes(x.negocio_id)), [m, desde, hasta, hoy, ids])
  const movsA = useMemo(() => movimientos(m, desdeA, hastaA, hoy).filter((x) => ids.includes(x.negocio_id)), [m, desdeA, hastaA, hoy, ids])
  const r = sumarRes(ids.map((id) => resultado(movs, id)))
  const rA = sumarRes(ids.map((id) => resultado(movsA, id)))

  const negocioDeCliente = (id: string | null) => m.clientes.find((c) => c.id === id)?.negocio_id ?? ''
  const nombreCliente = (id: string | null) => m.clientes.find((c) => c.id === id)?.nombre ?? ''
  const deClientes = cobros.filter((c) => c.tipo !== 'salario' && c.saldo > 0 && ids.includes(negocioDeCliente(c.cliente_id)) && (!c.vence || c.vence <= hasta))
  const vencidos = deClientes.filter((c) => c.estado === 'vencido')
  const pronto = deClientes.filter((c) => c.estado !== 'vencido' && c.vence && c.vence >= hoy && diasEntre(hoy, c.vence) <= 7)
  const ventasHasta = m.ventas.filter((v) => v.fecha <= hasta)
  const pedidos = clave === 'canela' ? cobrosDeVentas(ventasHasta, m.partesTienda).filter((c) => c.saldo > 0) : []
  const salarioMes = clave === 'salario' ? cobros.find((c) => c.clave === `s:${periodo}`) : undefined
  const vigente = clave === 'salario' ? aumentoVigente(m.aumentos, periodo) : null

  const debe = clave === 'canela' ? porCobrarTienda(pedidos) : clave === 'salario' ? (salarioMes?.saldo ?? 0) : deCentavos(deClientes.reduce((s, c) => s + aCentavos(c.saldo), 0))
  const subDebe = clave === 'canela'
    ? `${pedidos.length} ${pedidos.length === 1 ? 'pedido' : 'pedidos'} sin pagar completo`
    : clave === 'salario'
      ? (salarioMes ? (salarioMes.saldo > 0 ? `salario de ${nombreDelMes}` : `${nombreDelMes} ya recibido`) : 'sin salario puesto')
      : vencidos.length ? `${vencidos.length} ${vencidos.length === 1 ? 'vencido' : 'vencidos'} · ${deClientes.length} en total` : `${deClientes.length} ${deClientes.length === 1 ? 'cobro' : 'cobros'} hasta fin de mes`

  const tareas: Tarea[] = []
  if (vencidos.length) tareas.push({ id: 'venc', tono: 'peligro', texto: `${vencidos.length} ${vencidos.length === 1 ? 'cobro vencido' : 'cobros vencidos'}`, detalle: quetzales(deCentavos(vencidos.reduce((s, c) => s + aCentavos(c.saldo), 0))), boton: 'Cobrar', a: conf.rutas.cobros })
  if (pronto.length) tareas.push({ id: 'pronto', tono: 'aviso', texto: `${pronto.length} ${pronto.length === 1 ? 'cobro vence' : 'cobros vencen'} esta semana`, detalle: quetzales(deCentavos(pronto.reduce((s, c) => s + aCentavos(c.saldo), 0))), boton: 'Ver', a: conf.rutas.cobros })
  if (pedidos.length) tareas.push({ id: 'pedidos', tono: 'aviso', texto: `${pedidos.length} ${pedidos.length === 1 ? 'pedido por cobrar' : 'pedidos por cobrar'}`, detalle: quetzales(debe), boton: 'Registrar pago', a: '/tienda/pagos' })
  if (clave === 'salario' && !vigente) tareas.push({ id: 'sal', tono: 'aviso', texto: 'Todavía no pusiste tu salario', boton: 'Ponerlo', a: '#propio' })
  if (salarioMes && salarioMes.saldo > 0) tareas.push({ id: 'salmes', tono: salarioMes.estado === 'vencido' ? 'peligro' : 'info', texto: `Salario de ${nombreDelMes} por recibir`, detalle: quetzales(salarioMes.saldo), boton: 'Marcar recibido', a: '#propio' })
  if (clave === 'dev' && avisosDev.length) tareas.push({ id: 'dev', tono: 'aviso', texto: `${avisosDev.length} ${avisosDev.length === 1 ? 'aviso' : 'avisos'} de desarrollo`, detalle: 'dominios, tokens o bases por revisar', boton: 'Revisar', a: '/desarrollo' })
  if (clave === 'sa') {
    const faltan = m.tramites.filter((x) => x.estado !== 'hecho' && x.estado !== 'no_aplica').length
    if (!m.sociedad) tareas.push({ id: 'ficha', tono: 'info', texto: 'La ficha de la sociedad está vacía', detalle: 'llénala cuando tengas la escritura', boton: 'Ver ficha', a: '#propio' })
    if (faltan) tareas.push({ id: 'tram', tono: 'aviso', texto: `${faltan} ${faltan === 1 ? 'trámite pendiente' : 'trámites pendientes'}`, boton: 'Ver trámites', a: '/sa/tramites' })
  }
  const fijos = fijosPendientes(m.gastosFijos.filter((f) => ids.includes(f.negocio_id)), m.gastos, periodo)
  if (fijos.length) tareas.push({ id: 'fijos', tono: 'info', texto: `${fijos.length} ${fijos.length === 1 ? 'gasto fijo' : 'gastos fijos'} por registrar`, detalle: quetzales(deCentavos(fijos.reduce((s, f) => s + aCentavos(f.monto), 0))), boton: 'Registrar', a: clave === 'sa' ? '/gastos' : conf.rutas.gastos })
  if (clave !== 'sa' && !m.presupuestos.some((p) => p.periodo === periodo && ids.includes(p.negocio_id))) tareas.push({ id: 'pres', tono: 'info', texto: `Sin presupuesto para ${nombreDelMes}`, detalle: 'pon cuánto piensas ganar y gastar', boton: 'Ponerlo', a: conf.rutas.presupuesto })

  const lineas = ids.flatMap((id) => lineasPresupuesto(m.categorias, m.presupuestos, movs, periodo, id))
  const plan = (t: 'ingreso' | 'gasto') => deCentavos(lineas.filter((l) => l.categoria.tipo === t).reduce((s, l) => s + aCentavos(l.plan), 0))
  const planIn = plan('ingreso')
  const planGa = plan('gasto')
  const tope = Math.max(r.ingresos, r.gastos, 1)
  const ultimos = [...movs].sort((x, y) => y.fecha.localeCompare(x.fecha)).slice(0, 6)

  const irA = (t: Tarea) => {
    if (!t.a.startsWith('#')) return
    document.getElementById(t.a.slice(1))?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })
  }

  const kpi = (et: string, valor: number, sub: string, a: string, tono: string, cambio: ReactNode, titulo: string) => (
    <Link className={`erp-kpi c-rn-kpi ${tono}`} to={a} title={titulo}>
      <span className="m-etiqueta">{et}</span>
      <b className={valor < 0 ? 'm-negativo' : undefined}>{quetzales(valor)}</b>
      <small>{sub}</small>
      {cambio}
    </Link>
  )

  return (
    <>
      <div className="c-cabeza c-rn-cabeza">
        <div>
          <span className="m-etiqueta">Resumen · {nombreMes(a, mes)}</span>
          <h1 className="erp-titulo">{conf.nombre}</h1><Pasos />
          <p className="c-subtitulo">{conf.que}</p>
        </div>
        <div className="c-cabeza-acciones">
          <SelectorMes periodo={periodo} onCambio={setPeriodo} />
          {accion}
        </div>
      </div>

      <div className="erp-kpis c-rn-kpis">
        {kpi('Entró', r.ingresos, clave === 'canela' ? 'ventas de los pedidos' : clave === 'salario' ? 'salario recibido' : 'pagos de clientes', conf.rutas.pagos, 'exito', <Cambio ahora={r.ingresos} antes={rA.ingresos} mesAntes={mesAntes} />, 'Abre lo que entró')}
        {kpi(clave === 'salario' ? 'Por recibir' : 'Me deben', debe, subDebe, conf.rutas.cobros, vencidos.length ? 'peligro' : 'aviso', <span className="c-rn-cambio" data-tono="igual">hasta fin de {nombreDelMes}</span>, 'Abre lo que te deben')}
        {kpi('Gastos', r.gastos, clave === 'canela' ? 'costo de pedidos y gastos' : clave === 'salario' ? 'lo que gastaste del salario' : 'del negocio y de cada cliente', clave === 'sa' ? '/sa/estados' : conf.rutas.gastos, 'peligro', <Cambio ahora={r.gastos} antes={rA.gastos} mesAntes={mesAntes} alReves />, 'Abre los gastos')}
        {kpi('Utilidad', r.utilidad, 'lo que entró menos los gastos', conf.rutas.utilidad, '', <Cambio ahora={r.utilidad} antes={rA.utilidad} mesAntes={mesAntes} />, 'Abre el reporte de utilidad')}
      </div>

      <section className="c-rn-tareas" aria-labelledby="rn-tareas">
        <h2 className="m-seccion-titulo" id="rn-tareas">Lo que toca hacer</h2>
        {tareas.length ? (
          <ul className="m-tarjeta c-rn-lista">
            {tareas.map((t) => (
              <li key={t.id} data-tono={t.tono}>
                <i aria-hidden />
                <span className="c-rn-tarea-texto"><b>{t.texto}</b>{t.detalle && <small>{t.detalle}</small>}</span>
                {t.a.startsWith('#')
                  ? <button type="button" className="m-btn m-btn-secundario m-btn-sm" onClick={() => irA(t)} title={`${t.boton}: baja a esa parte de la pantalla`}>{t.boton}</button>
                  : <Link className="m-btn m-btn-secundario m-btn-sm" to={t.a} title={`${t.boton}: abre la pantalla donde se hace`}>{t.boton}</Link>}
              </li>
            ))}
          </ul>
        ) : (
          <div className="m-tarjeta c-rn-ok"><CheckCircle2 aria-hidden /><span><b>Todo al día</b><small>No hay nada pendiente en {nombreDelMes}.</small></span></div>
        )}
      </section>

      <nav className="c-rn-atajos" aria-label={`Ir a otra parte de ${conf.nombre}`}>
        {conf.atajos.map((x) => <Link key={x.a} to={x.a} title={`Abre ${x.nombre}`}>{x.icono}<span>{x.nombre}</span></Link>)}
        {clave !== 'sa' && <Link to="/reportes" title="Abre los reportes"><BarChart3 aria-hidden /><span>Reportes</span></Link>}
        {clave === 'sa' && <Link to="/sa/recordatorios" title="Abre los recordatorios"><Building aria-hidden /><span>Recordatorios</span></Link>}
      </nav>

      <div className="c-dos">
        <section aria-labelledby="rn-movs">
          <h2 className="m-seccion-titulo" id="rn-movs">Últimos movimientos</h2>
          {ultimos.length ? (
            <ul className="m-tarjeta c-rn-movs">
              {ultimos.map((x, i) => (
                <li key={`${x.fecha}-${i}`} data-tipo={x.tipo}>
                  <span className="c-rn-signo" aria-hidden>{x.tipo === 'ingreso' ? '+' : '−'}</span>
                  <span className="c-rn-mov-texto"><b>{x.cliente_id ? nombreCliente(x.cliente_id) : x.descripcion}</b><small>{x.cliente_id ? `${x.descripcion} · ` : ''}{fechaCorta(x.fecha)}</small></span>
                  <b className="m-cifra">{x.tipo === 'ingreso' ? '' : '− '}{quetzales(x.monto)}</b>
                </li>
              ))}
            </ul>
          ) : (
            <div className="m-vacio c-vacio-chico"><b>Sin movimientos en {nombreDelMes}</b><span>Lo que entre o salga aparece aquí.</span></div>
          )}
        </section>
        <section aria-labelledby="rn-mes">
          <h2 className="m-seccion-titulo" id="rn-mes">Cómo va el mes</h2>
          <div className="m-tarjeta c-rn-barras">
            <Barra nombre="Entró" valor={r.ingresos} de={planIn || tope} tono="entra" texto={planIn ? `de ${quetzales(planIn)} que planeaste` : 'sin meta de ingresos este mes'} />
            <Barra nombre="Gastó" valor={r.gastos} de={planGa || tope} tono="sale" texto={planGa ? `de ${quetzales(planGa)} que planeaste` : 'sin tope de gastos este mes'} />
            <p className="c-rn-neto">Te quedan <b className={`m-cifra${r.utilidad < 0 ? ' m-negativo' : ''}`}>{quetzales(r.utilidad)}</b> en {nombreDelMes}.</p>
          </div>
        </section>
      </div>

      {children && (
        <section className="c-rn-propio" id="propio" aria-label={titulo ?? `Lo de ${conf.nombre}`}>
          <h2 className="c-rn-propio-titulo">{titulo ?? `Lo de ${conf.nombre}`}</h2>
          {children}
        </section>
      )}
    </>
  )
}
