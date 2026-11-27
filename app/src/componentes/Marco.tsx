import { Music, PenTool, Layers, Settings, ChevronDown, Banknote, ReceiptText, BarChart3, FileText, Sparkles, Building, Building2, CalendarClock, ClipboardList, Landmark, Scale, UsersRound, ChevronRight, Code2, ChevronsLeft, CreditCard, FileSignature, FolderKanban, Globe, HandCoins, LayoutDashboard, LogOut, Menu, Moon, Package, Palette, PiggyBank, Receipt, ShoppingBag, Tags, Target, Sun, Users, Wallet, X } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useModelo } from '../lib/modelo'
import { useSesion } from '../lib/sesion'
import { useAvisosDev, useCobros, useHoy } from '../lib/usos'
import { quetzales } from '../lib/dinero'
import { nombreMes } from '../lib/fechas'
import { notificar } from '../lib/notificar'
import { guardarTemaEnUsuario, temaApi, traerTemaDelUsuario } from '../lib/tema'
import Temas from './Temas'
import LogoStudio from './Logo'
import { rutaAviso } from '../pantallas/desarrollo/ParaNoOlvidar'

type Modo = 'todo' | 'dev' | 'musica' | 'diseno' | 'canela' | 'salario' | 'sa'
type Enlace = { a: string; nombre: string; icono: ReactNode; fin?: boolean }
type Grupo = { titulo: string; enlaces: Enlace[] }

function menuEstudio(k: 'dev' | 'musica' | 'diseno', trabajo: Enlace[]): Grupo[] {
  return [
    { titulo: 'El dinero', enlaces: [
      { a: `/${k}`, nombre: 'Resumen', icono: <LayoutDashboard aria-hidden />, fin: true },
      { a: `/${k}/cobros`, nombre: 'Lo que me deben', icono: <HandCoins aria-hidden /> },
      { a: `/${k}/pagos`, nombre: 'Pagos que recibí', icono: <ReceiptText aria-hidden /> },
      { a: `/${k}/gastos`, nombre: 'Gastos', icono: <Receipt aria-hidden /> },
      { a: `/${k}/presupuesto`, nombre: 'Presupuesto', icono: <Target aria-hidden /> },
    ] },
    { titulo: 'El trabajo', enlaces: trabajo },
  ]
}

const MENUS: Record<Modo, Grupo[]> = {
  todo: [
    { titulo: 'Todo junto', enlaces: [
      { a: '/', nombre: 'Inicio', icono: <LayoutDashboard aria-hidden />, fin: true },
      { a: '/cobros', nombre: 'Lo que me deben', icono: <HandCoins aria-hidden /> },
      { a: '/pagos', nombre: 'Pagos que recibí', icono: <ReceiptText aria-hidden /> },
      { a: '/gastos', nombre: 'Gastos', icono: <Receipt aria-hidden /> },
      { a: '/presupuestos', nombre: 'Presupuestos', icono: <Target aria-hidden /> },
    ] },
    { titulo: 'Mi dinero', enlaces: [
      { a: '/cuentas', nombre: 'Dónde está mi dinero', icono: <Banknote aria-hidden /> },
      { a: '/saldo-a-favor', nombre: 'Saldo a favor', icono: <PiggyBank aria-hidden /> },
      { a: '/deudas', nombre: 'Deudas y tarjeta', icono: <CreditCard aria-hidden /> },
      { a: '/impuestos', nombre: 'Impuestos y facturas', icono: <Landmark aria-hidden /> },
      { a: '/reportes', nombre: 'Reportes', icono: <BarChart3 aria-hidden /> },
    ] },
  ],
  dev: menuEstudio('dev', [
    { a: '/clientes', nombre: 'Clientes', icono: <Users aria-hidden /> },
    { a: '/proyectos', nombre: 'Proyectos', icono: <FolderKanban aria-hidden /> },
    { a: '/contratos', nombre: 'Contratos', icono: <FileSignature aria-hidden /> },
    { a: '/documentos', nombre: 'Documentos', icono: <FileText aria-hidden /> },
    { a: '/desarrollo', nombre: 'Desarrollo', icono: <Code2 aria-hidden /> },
    { a: '/precios', nombre: 'Precios y tarifas', icono: <Tags aria-hidden /> },
  ]),
  musica: menuEstudio('musica', [
    { a: '/musica/clientes', nombre: 'Clientes', icono: <Users aria-hidden /> },
    { a: '/musica/proyectos', nombre: 'Proyectos', icono: <FolderKanban aria-hidden /> },
  ]),
  diseno: menuEstudio('diseno', [
    { a: '/diseno/clientes', nombre: 'Clientes', icono: <Users aria-hidden /> },
    { a: '/diseno/proyectos', nombre: 'Proyectos', icono: <FolderKanban aria-hidden /> },
  ]),
  canela: [
    { titulo: 'El dinero', enlaces: [
      { a: '/tienda', nombre: 'Resumen', icono: <LayoutDashboard aria-hidden />, fin: true },
      { a: '/tienda/pagos', nombre: 'Pagos de pedidos', icono: <HandCoins aria-hidden /> },
      { a: '/tienda/recibidos', nombre: 'Pagos que recibí', icono: <ReceiptText aria-hidden /> },
      { a: '/tienda/gastos', nombre: 'Gastos', icono: <Receipt aria-hidden /> },
      { a: '/tienda/presupuesto', nombre: 'Presupuesto', icono: <Target aria-hidden /> },
    ] },
    { titulo: 'La tienda', enlaces: [
      { a: '/tienda/pedidos', nombre: 'Pedidos', icono: <ShoppingBag aria-hidden /> },
      { a: '/tienda/productos', nombre: 'Productos', icono: <Package aria-hidden /> },
    ] },
  ],
  salario: [
    { titulo: 'El dinero', enlaces: [
      { a: '/salario', nombre: 'Resumen', icono: <LayoutDashboard aria-hidden />, fin: true },
      { a: '/salario/recibidos', nombre: 'Salario recibido', icono: <ReceiptText aria-hidden /> },
      { a: '/salario/gastos', nombre: 'Gastos', icono: <Receipt aria-hidden /> },
      { a: '/salario/presupuesto', nombre: 'Presupuesto', icono: <Target aria-hidden /> },
    ] },
  ],
  sa: [
    { titulo: 'El dinero', enlaces: [
      { a: '/sa', nombre: 'Resumen', icono: <LayoutDashboard aria-hidden />, fin: true },
      { a: '/sa/socios', nombre: 'Socios y capital', icono: <UsersRound aria-hidden /> },
      { a: '/sa/utilidades', nombre: 'Utilidades', icono: <PiggyBank aria-hidden /> },
      { a: '/sa/bancos', nombre: 'Bancos', icono: <Landmark aria-hidden /> },
      { a: '/sa/estados', nombre: 'Estados financieros', icono: <Scale aria-hidden /> },
    ] },
    { titulo: 'Los papeles', enlaces: [
      { a: '/sa/tramites', nombre: 'Trámites', icono: <ClipboardList aria-hidden /> },
      { a: '/sa/recordatorios', nombre: 'Recordatorios', icono: <CalendarClock aria-hidden /> },
    ] },
  ],
}

const AJUSTES: Enlace[] = [
  { a: '/negocios', nombre: 'Negocios', icono: <Building2 aria-hidden /> },
  { a: '/categorias', nombre: 'Categorías', icono: <Tags aria-hidden /> },
  { a: '/marca', nombre: 'Mi marca', icono: <Sparkles aria-hidden /> },
  { a: '/mundo', nombre: 'Monterroso World', icono: <Globe aria-hidden /> },
]

type Zona = 'todo' | 'sa' | 'aparte'

const MODOS: { id: Modo; nombre: string; largo: string; que: string; zona: Zona; icono: ReactNode; a: string }[] = [
  { id: 'todo', nombre: 'Todo', largo: 'Todos los negocios', que: 'todos los negocios juntos', zona: 'todo', icono: <Layers aria-hidden />, a: '/' },
  { id: 'dev', nombre: 'Dev Studio', largo: 'Dev Studio', que: 'Páginas y sistemas', zona: 'sa', icono: <Code2 aria-hidden />, a: '/dev' },
  { id: 'musica', nombre: 'Música', largo: 'Música', que: 'Clientes de música', zona: 'sa', icono: <Music aria-hidden />, a: '/musica' },
  { id: 'diseno', nombre: 'Diseño', largo: 'Diseño', que: 'Clientes de diseño', zona: 'sa', icono: <PenTool aria-hidden />, a: '/diseno' },
  { id: 'sa', nombre: 'S.A. general', largo: 'Sociedad anónima', que: 'Socios y trámites', zona: 'sa', icono: <Building aria-hidden />, a: '/sa' },
  { id: 'canela', nombre: 'Hogar Canela', largo: 'Hogar Canela', que: 'Tienda en Shopify', zona: 'aparte', icono: <ShoppingBag aria-hidden />, a: '/tienda' },
  { id: 'salario', nombre: 'Salario', largo: 'Salario', que: 'Tu sueldo', zona: 'aparte', icono: <Wallet aria-hidden />, a: '/salario' },
]

const ZONAS: { id: Zona; titulo: string }[] = [
  { id: 'todo', titulo: '' },
  { id: 'sa', titulo: 'De la S.A.' },
  { id: 'aparte', titulo: 'Aparte' },
]

const toca = (ruta: string, e: Enlace) => (e.fin ? ruta === e.a : ruta === e.a || ruta.startsWith(e.a + '/'))

function modosDeRuta(ruta: string): Modo[] {
  return (Object.keys(MENUS) as Modo[]).filter((m) => MENUS[m].some((g) => g.enlaces.some((e) => toca(ruta, e))))
}

export function dondeEstoy(ruta: string, preferido: Modo, dueno?: Modo | null): { modo: Modo | null; enlace: Enlace | null } {
  const det = ruta.match(/^\/(clientes|proyectos)\/./)
  if (det && dueno && dueno !== 'dev') {
    const e = MENUS[dueno].flatMap((g) => g.enlaces).find((x) => x.a === `/${dueno}/${det[1]}`)
    if (e) return { modo: dueno, enlace: e }
  }
  const ms = modosDeRuta(ruta)
  const modo = ms.includes(preferido) ? preferido : ms[0] ?? null
  if (modo) {
    const enlaces = MENUS[modo].flatMap((g) => g.enlaces)
    return { modo, enlace: enlaces.find((e) => toca(ruta, e)) ?? null }
  }
  return { modo: null, enlace: AJUSTES.find((e) => toca(ruta, e)) ?? null }
}

function leerModo(): Modo {
  try { const v = localStorage.getItem('mc_modo'); return MODOS.some((x) => x.id === v) ? (v as Modo) : 'todo' } catch { return 'todo' }
}

function leerCompacto(): boolean {
  try { return localStorage.getItem('mc_lateral') === 'compacto' } catch { return false }
}

export default function Marco({ children }: { children: ReactNode }) {
  const { correo, prueba, salir } = useSesion()
  const { clientes, ventas, tramites, negocios, proyectos } = useModelo()
  const cobros = useCobros()
  const avisosDev = useAvisosDev()
  const [compacto, setCompacto] = useState(leerCompacto)
  const [abierto, setAbierto] = useState(false)
  const [temas, setTemas] = useState(false)
  const [angosta, setAngosta] = useState(() => window.innerWidth < 1100 && window.innerWidth > 860)
  useEffect(() => {
    const f = () => setAngosta(window.innerWidth < 1100 && window.innerWidth > 860)
    window.addEventListener('resize', f)
    return () => window.removeEventListener('resize', f)
  }, [])
  useEffect(() => { if (!prueba) void traerTemaDelUsuario() }, [prueba])
  const temaCambio = () => { if (!prueba) guardarTemaEnUsuario() }
  const alternarModo = () => { temaApi()?.alternarModo(); temaCambio() }
  const lugar = useLocation()
  const ir = useNavigate()
  const [modoGuardado, setModoGuardado] = useState<Modo>(leerModo)
  const dueno = ((): Modo | null => {
    const d = lugar.pathname.match(/^\/(clientes|proyectos)\/([^/]+)/)
    if (!d) return null
    const id = decodeURIComponent(d[2])
    const cid = d[1] === 'clientes' ? id : proyectos.find((p) => p.id === id)?.cliente_id
    const clave = negocios.find((n) => n.id === clientes.find((c) => c.id === cid)?.negocio_id)?.clave
    return clave === 'musica' || clave === 'diseno' ? clave : 'dev'
  })()
  const donde = dondeEstoy(lugar.pathname, modoGuardado, dueno)
  const modo = donde.modo ?? modoGuardado
  const modoInfo = MODOS.find((x) => x.id === modo) ?? MODOS[0]
  const enAjustes = !donde.modo && !!donde.enlace
  const [ajustes, setAjustes] = useState(enAjustes)
  useEffect(() => { if (enAjustes) setAjustes(true) }, [enAjustes])
  useEffect(() => {
    const m = donde.modo
    if (m && m !== modoGuardado) { setModoGuardado(m); try { localStorage.setItem('mc_modo', m) } catch { return } }
  }, [donde.modo, modoGuardado])
  const elegirModo = (m: (typeof MODOS)[number]) => {
    setModoGuardado(m.id)
    try { localStorage.setItem('mc_modo', m.id) } catch { void 0 }
    ir(m.a)
  }
  useEffect(() => {
    setAbierto(false)
    const m = document.getElementById('contenido')
    if (m) m.style.minHeight = ''
    window.scrollTo({ top: 0 })
  }, [lugar.pathname])
  useEffect(() => {
    const m = document.getElementById('contenido')
    if (!m) return
    const sostener = () => { m.style.minHeight = `${m.offsetHeight}px` }
    m.addEventListener('pointerdown', sostener, true)
    m.addEventListener('keydown', sostener, true)
    return () => { m.removeEventListener('pointerdown', sostener, true); m.removeEventListener('keydown', sostener, true) }
  }, [])
  useEffect(() => {
    if (!abierto) return
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setAbierto(false) }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [abierto])

  const avisosRef = useRef(avisosDev)
  avisosRef.current = avisosDev
  useEffect(() => {
    const correr = () => notificar(avisosRef.current, (a) => ir(rutaAviso(a)))
    const t0 = setTimeout(correr, 1500)
    const t = setInterval(correr, 3600000)
    return () => { clearTimeout(t0); clearInterval(t) }
  }, [ir])

  const vencidosDev = cobros.filter((c) => c.estado === 'vencido' && c.tipo !== 'salario').length
  const cuentas: Record<string, number> = {
    '/desarrollo': avisosDev.length,
    '/clientes': clientes.filter((c) => c.activo).length,
    '/cobros': cobros.filter((c) => c.estado === 'vencido').length,
    '/dev/cobros': vencidosDev,
  }
  const hoyModos = useHoy()
  const datosModo: Record<Modo, string> = (() => {
    const todosDeben = cobros.filter((c) => c.saldo > 0 && c.estado === 'vencido').length
    const deNegocio = (clave: string) => {
      const nid = negocios.find((n) => n.clave === clave)?.id
      const suyos = clientes.filter((c) => c.negocio_id === nid)
      const activos = suyos.filter((c) => c.activo).length
      const ids = new Set(suyos.map((c) => c.id))
      const falta = cobros.filter((c) => c.tipo !== 'salario' && c.saldo > 0 && (c.estado === 'vencido' || c.estado === 'por_cobrar') && c.cliente_id && ids.has(c.cliente_id)).reduce((t, c) => t + Math.round(c.saldo * 100), 0) / 100
      return [activos ? `${activos} ${activos === 1 ? 'cliente' : 'clientes'}` : '', falta > 0 ? `${quetzales(falta).replace(' ', '\u00a0')} por cobrar` : ''].filter(Boolean).join(' · ')
    }
    const hoyPed = ventas.filter((v) => v.fecha.slice(0, 10) === hoyModos).length
    const canela = hoyPed ? `${hoyPed} ${hoyPed === 1 ? 'pedido' : 'pedidos'} hoy` : ''
    const per = hoyModos.slice(0, 7)
    const sal = cobros.find((c) => c.clave === `s:${per}`)
    const mes = nombreMes(Number(per.slice(0, 4)), Number(per.slice(5, 7))).slice(0, 3).toLowerCase()
    const salario = sal ? (sal.estado === 'pagado' || sal.estado === 'saldado' ? `Recibido ${mes}.` : 'Por recibir') : ''
    const listos = tramites.filter((x) => x.estado === 'hecho' || x.estado === 'no_aplica').length
    const sa = tramites.length ? `${listos} de ${tramites.length} trámites` : ''
    const todo = todosDeben ? `${todosDeben} ${todosDeben === 1 ? 'cobro vencido' : 'cobros vencidos'}` : ''
    return { todo, dev: deNegocio('dev'), musica: deNegocio('musica'), diseno: deNegocio('diseno'), canela, salario, sa }
  })()
  const moverModos = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const botones = [...e.currentTarget.querySelectorAll<HTMLButtonElement>('button[data-modo]')]
    const i = botones.indexOf(document.activeElement as HTMLButtonElement)
    if (i < 0) return
    const paso: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }
    let j = i
    if (e.key === 'Home') j = 0
    else if (e.key === 'End') j = botones.length - 1
    else if (paso[e.key] != null) j = (i + paso[e.key] + botones.length) % botones.length
    else return
    e.preventDefault()
    botones[j].focus()
  }
  const alternar = () => {
    const v = !compacto
    setCompacto(v)
    try { localStorage.setItem('mc_lateral', v ? 'compacto' : 'normal') } catch { return }
  }
  const inicial = (correo ?? 'M').slice(0, 1).toUpperCase()

  return (
    <div className="m-app c-app" data-negocio={donde.modo ?? (enAjustes ? 'ajustes' : modo)} data-lateral={compacto || angosta ? 'compacto' : 'normal'} data-menu={abierto ? 'abierto' : 'cerrado'}>
      <header className="c-barra-movil">
        <button type="button" className="m-icono-btn" onClick={() => setAbierto(true)} aria-label="Abrir el menú" title="Abre el menú de pantallas"><Menu aria-hidden /></button>
        <LogoStudio className="c-acceso-logo c-barra-logo" />
      </header>
      <div className="c-velo" onClick={() => setAbierto(false)} aria-hidden />
      <nav className="m-lateral" aria-label="Menú principal">
        <div className="c-cerrar-fila">
          <button type="button" className="m-icono-btn c-cerrar-menu" onClick={() => setAbierto(false)} aria-label="Cerrar el menú" title="Cierra el menú (Esc)"><X aria-hidden /></button>
        </div>
        <div className="c-zonas" role="group" aria-label="Qué negocio trabajar" onKeyDown={moverModos}>
          {ZONAS.map((z) => (
            <div key={z.id} className="c-zona" data-zona={z.id}>
              {z.titulo && <div className="c-zona-titulo"><span className="m-txt">{z.titulo}</span></div>}
              <div className="c-modos">
                {MODOS.filter((m) => m.zona === z.id).map((m) => (
                  <button key={m.id} type="button" data-modo={m.id} aria-pressed={modo === m.id} aria-label={`${m.nombre}: ${m.que}${datosModo[m.id] ? `. ${datosModo[m.id]}` : ''}`} title={`Muestra el menú de ${m.largo}${datosModo[m.id] ? ` · ${datosModo[m.id]}` : ''}`} onClick={() => elegirModo(m)}>
                    {m.icono}
                    <span className="m-txt c-modo-textos">
                      <span className="c-modo-nombre">{m.nombre}</span>
                      <span className="c-modo-que">{m.que}</span>
                      {datosModo[m.id] && <span className="c-modo-dato">{datosModo[m.id].split(' · ').map((x) => <span key={x}>{x}</span>)}</span>}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        {MENUS[modo].map((g) => (
          <div key={g.titulo} className="c-grupo">
            <div className="m-grupo"><span className="m-txt">{g.titulo}</span></div>
            {g.enlaces.map((e) => (
              <NavLink key={e.a} to={e.a} end={e.fin} title={`Abre ${e.nombre} de ${modoInfo.largo}`}>
                {e.icono}
                <span className="m-txt">{e.nombre}</span>
                {cuentas[e.a] ? <span className="m-cuenta">{cuentas[e.a]}</span> : null}
                <ChevronRight className="m-flecha" aria-hidden />
              </NavLink>
            ))}
          </div>
        ))}
        <div className="c-grupo c-ajustes" data-abierto={ajustes ? 'si' : 'no'}>
          <button type="button" className="m-grupo c-ajustes-btn" aria-expanded={ajustes} onClick={() => setAjustes((v) => !v)} title={ajustes ? 'Esconde los ajustes' : 'Muestra negocios, categorías, tu marca y Monterroso World'}><Settings aria-hidden /><span className="m-txt">Ajustes</span><ChevronDown className="c-ajustes-flecha" aria-hidden /></button>
          {ajustes && AJUSTES.map((e) => (
            <NavLink key={e.a} to={e.a} title={`Abre ${e.nombre}`}>
              {e.icono}
              <span className="m-txt">{e.nombre}</span>
              <ChevronRight className="m-flecha" aria-hidden />
            </NavLink>
          ))}
        </div>
        <div className="m-lateral-pie">
          <span className="m-avatar">{inicial}</span>
          <span className="m-txt"><b>{prueba ? 'Modo de prueba' : 'Antonio'}</b><span>{prueba ? 'datos solo en este equipo' : correo}</span></span>
          <button type="button" id="bTema" onClick={alternarModo} aria-label="Cambiar entre claro y oscuro" title="Cambia entre modo claro y oscuro; se guarda en tu usuario"><Moon className="ico-luna" aria-hidden /><Sun className="ico-sol" aria-hidden /></button>
          <button type="button" onClick={() => setTemas(true)} aria-label="Elegir color" title="Abre la ventana para elegir el color del sistema"><Palette aria-hidden /></button>
          <button type="button" onClick={() => void salir()} aria-label="Cerrar sesión" title={prueba ? 'Salir del modo de prueba' : 'Cerrar la sesión en este equipo'}><LogOut aria-hidden /></button>
          <button type="button" className="c-compactar" disabled={angosta} onClick={alternar} aria-label={compacto ? 'Mostrar el menú completo' : 'Dejar solo los íconos'} title={compacto ? 'Mostrar el menú completo' : 'Dejar solo los íconos'}><ChevronsLeft aria-hidden /></button>
        </div>
      </nav>
      <Temas abierta={temas} onCambio={temaCambio} onCerrar={() => setTemas(false)} />
      <main className="m-contenido" id="contenido">
        {prueba && <div className="m-franja c-franja-prueba">Modo de prueba: lo que guardes aquí vive solo en este navegador y no toca la base.</div>}
        {donde.enlace && (
          <nav className="c-ruta" aria-label="Dónde estás">
            {donde.modo ? <button type="button" className="c-ruta-negocio" onClick={() => ir(modoInfo.a)} title={`Ir al inicio de ${modoInfo.largo}`}><i aria-hidden />{modoInfo.largo}</button> : <span className="c-ruta-negocio"><i aria-hidden />Ajustes</span>}
            <ChevronRight aria-hidden />
            <span aria-current="page">{donde.enlace.nombre}</span>
          </nav>
        )}
        {children}
      </main>
    </div>
  )
}
