import { Layers, Settings, ChevronDown, Banknote, ReceiptText, BarChart3, FileText, Sparkles, Building, Building2, CalendarClock, ClipboardList, Landmark, Scale, UsersRound, ChevronRight, Code2, ChevronsLeft, CreditCard, FileSignature, FolderKanban, Globe, HandCoins, LayoutDashboard, LogOut, Menu, Moon, Package, Palette, PiggyBank, Receipt, ShoppingBag, Tags, Target, Sun, Users, Wallet, X } from 'lucide-react'
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

type Modo = 'todo' | 'dev' | 'canela' | 'salario' | 'sa'
type Enlace = { a: string; nombre: string; icono: ReactNode; fin?: boolean }
type Grupo = { titulo: string; enlaces: Enlace[] }

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
  dev: [
    { titulo: 'El dinero', enlaces: [
      { a: '/dev', nombre: 'Resumen', icono: <LayoutDashboard aria-hidden />, fin: true },
      { a: '/dev/cobros', nombre: 'Lo que me deben', icono: <HandCoins aria-hidden /> },
      { a: '/dev/pagos', nombre: 'Pagos que recibí', icono: <ReceiptText aria-hidden /> },
      { a: '/dev/gastos', nombre: 'Gastos', icono: <Receipt aria-hidden /> },
      { a: '/dev/presupuesto', nombre: 'Presupuesto', icono: <Target aria-hidden /> },
    ] },
    { titulo: 'El trabajo', enlaces: [
      { a: '/clientes', nombre: 'Clientes', icono: <Users aria-hidden /> },
      { a: '/proyectos', nombre: 'Proyectos', icono: <FolderKanban aria-hidden /> },
      { a: '/contratos', nombre: 'Contratos', icono: <FileSignature aria-hidden /> },
      { a: '/documentos', nombre: 'Documentos', icono: <FileText aria-hidden /> },
      { a: '/desarrollo', nombre: 'Desarrollo', icono: <Code2 aria-hidden /> },
      { a: '/precios', nombre: 'Precios y tarifas', icono: <Tags aria-hidden /> },
    ] },
  ],
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

const MODOS: { id: Modo; nombre: string; largo: string; icono: ReactNode; a: string }[] = [
  { id: 'todo', nombre: 'Todo', largo: 'Todos los negocios', icono: <Layers aria-hidden />, a: '/' },
  { id: 'dev', nombre: 'Dev Studio', largo: 'Dev Studio', icono: <FolderKanban aria-hidden />, a: '/dev' },
  { id: 'canela', nombre: 'Canela', largo: 'Hogar Canela', icono: <ShoppingBag aria-hidden />, a: '/tienda' },
  { id: 'salario', nombre: 'Salario', largo: 'Salario', icono: <Wallet aria-hidden />, a: '/salario' },
  { id: 'sa', nombre: 'S.A.', largo: 'Sociedad anónima', icono: <Building aria-hidden />, a: '/sa' },
]

const toca = (ruta: string, e: Enlace) => (e.fin ? ruta === e.a : ruta === e.a || ruta.startsWith(e.a + '/'))

function modosDeRuta(ruta: string): Modo[] {
  return (Object.keys(MENUS) as Modo[]).filter((m) => MENUS[m].some((g) => g.enlaces.some((e) => toca(ruta, e))))
}

export function dondeEstoy(ruta: string, preferido: Modo): { modo: Modo | null; enlace: Enlace | null } {
  const ms = modosDeRuta(ruta)
  const modo = ms.includes(preferido) ? preferido : ms[0] ?? null
  if (modo) {
    const enlaces = MENUS[modo].flatMap((g) => g.enlaces)
    return { modo, enlace: enlaces.find((e) => toca(ruta, e)) ?? null }
  }
  return { modo: null, enlace: AJUSTES.find((e) => toca(ruta, e)) ?? null }
}

function leerModo(): Modo {
  try { const v = localStorage.getItem('mc_modo'); return v === 'todo' || v === 'canela' || v === 'salario' || v === 'sa' || v === 'dev' ? v : 'todo' } catch { return 'todo' }
}

function leerCompacto(): boolean {
  try { return localStorage.getItem('mc_lateral') === 'compacto' } catch { return false }
}

export default function Marco({ children }: { children: ReactNode }) {
  const { correo, prueba, salir } = useSesion()
  const { clientes, ventas, tramites } = useModelo()
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
  const donde = dondeEstoy(lugar.pathname, modoGuardado)
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
    const deben = cobros.filter((c) => c.tipo !== 'salario' && c.saldo > 0 && (c.estado === 'vencido' || c.estado === 'por_cobrar'))
    const activos = clientes.filter((c) => c.activo).length
    const falta = deben.reduce((t, c) => t + Math.round(c.saldo * 100), 0) / 100
    const dev = [activos ? `${activos} ${activos === 1 ? 'cliente' : 'clientes'}` : '', falta > 0 ? `${quetzales(falta).replace(' ', '\u00a0')} por cobrar` : ''].filter(Boolean).join(' · ')
    const hoyPed = ventas.filter((v) => v.fecha.slice(0, 10) === hoyModos).length
    const canela = hoyPed ? `${hoyPed} ${hoyPed === 1 ? 'pedido' : 'pedidos'} hoy` : ''
    const per = hoyModos.slice(0, 7)
    const sal = cobros.find((c) => c.clave === `s:${per}`)
    const mes = nombreMes(Number(per.slice(0, 4)), Number(per.slice(5, 7))).slice(0, 3).toLowerCase()
    const salario = sal ? (sal.estado === 'pagado' || sal.estado === 'saldado' ? `Recibido ${mes}.` : 'Por recibir') : ''
    const listos = tramites.filter((x) => x.estado === 'hecho' || x.estado === 'no_aplica').length
    const sa = tramites.length ? `${listos} de ${tramites.length} trámites` : ''
    const todo = todosDeben ? `${todosDeben} ${todosDeben === 1 ? 'cobro vencido' : 'cobros vencidos'}` : ''
    return { todo, dev, canela, salario, sa }
  })()
  const moverModos = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const botones = [...e.currentTarget.querySelectorAll<HTMLButtonElement>('button[role="tab"]')]
    const i = botones.indexOf(document.activeElement as HTMLButtonElement)
    if (i < 0) return
    const cols = getComputedStyle(e.currentTarget).gridTemplateColumns.split(' ').filter(Boolean).length || 1
    const paso: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols }
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
        <div className="c-modos" role="tablist" aria-label="Qué negocio trabajar" aria-orientation={compacto || angosta ? 'vertical' : 'horizontal'} onKeyDown={moverModos}>
          {MODOS.map((m) => (
            <button key={m.id} type="button" role="tab" data-modo={m.id} aria-selected={modo === m.id} tabIndex={modo === m.id ? 0 : -1} aria-label={datosModo[m.id] ? `${m.nombre}: ${datosModo[m.id]}` : m.nombre} title={`Muestra el menú de ${m.nombre}${datosModo[m.id] ? ` · ${datosModo[m.id]}` : ''}`} onClick={() => elegirModo(m)}>
              {m.icono}<span className="m-txt c-modo-nombre">{m.nombre}</span>{datosModo[m.id] && <span className="m-txt c-modo-dato">{datosModo[m.id].split(' · ').map((x) => <span key={x}>{x}</span>)}</span>}
            </button>
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
