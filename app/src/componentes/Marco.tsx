import { BarChart3, Building2, ChevronRight, Code2, ChevronsLeft, CreditCard, FileSignature, FolderKanban, Globe, HandCoins, LayoutDashboard, LogOut, Menu, Moon, Package, Palette, PiggyBank, Receipt, ShoppingBag, Tags, Target, Sun, Users, Wallet, X } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useModelo } from '../lib/modelo'
import { useSesion } from '../lib/sesion'
import { useAvisosDev, useCobros } from '../lib/usos'
import { notificar } from '../lib/notificar'
import { guardarTemaEnUsuario, temaApi, traerTemaDelUsuario } from '../lib/tema'
import Temas from './Temas'

const GRUPOS: { titulo: string; modo?: Modo; enlaces: { a: string; nombre: string; icono: ReactNode; fin?: boolean }[] }[] = [
  { titulo: 'General', enlaces: [
    { a: '/', nombre: 'Inicio', icono: <LayoutDashboard aria-hidden />, fin: true },
    { a: '/reportes', nombre: 'Reportes', icono: <BarChart3 aria-hidden /> },
  ] },
  { titulo: 'Dev Studio', modo: 'dev', enlaces: [
    { a: '/clientes', nombre: 'Clientes', icono: <Users aria-hidden /> },
    { a: '/proyectos', nombre: 'Proyectos', icono: <FolderKanban aria-hidden /> },
    { a: '/cobros', nombre: 'Cobros', icono: <HandCoins aria-hidden /> },
    { a: '/contratos', nombre: 'Contratos', icono: <FileSignature aria-hidden /> },
    { a: '/desarrollo', nombre: 'Desarrollo', icono: <Code2 aria-hidden /> },
  ] },
  { titulo: 'Hogar Canela', modo: 'canela', enlaces: [
    { a: '/tienda', nombre: 'Resumen', icono: <LayoutDashboard aria-hidden />, fin: true },
    { a: '/tienda/pedidos', nombre: 'Pedidos', icono: <ShoppingBag aria-hidden /> },
    { a: '/tienda/pagos', nombre: 'Pagos', icono: <HandCoins aria-hidden /> },
    { a: '/tienda/productos', nombre: 'Productos', icono: <Package aria-hidden /> },
    { a: '/tienda/gastos', nombre: 'Gastos de la tienda', icono: <Receipt aria-hidden /> },
    { a: '/tienda/presupuesto', nombre: 'Presupuesto', icono: <Target aria-hidden /> },
  ] },
  { titulo: 'Salario', modo: 'salario', enlaces: [
    { a: '/salario', nombre: 'Mi salario', icono: <Wallet aria-hidden />, fin: true },
    { a: '/salario/gastos', nombre: 'Gastos del salario', icono: <Receipt aria-hidden /> },
    { a: '/salario/presupuesto', nombre: 'Presupuesto', icono: <Target aria-hidden /> },
  ] },
  { titulo: 'Empresa', enlaces: [
    { a: '/gastos', nombre: 'Gastos', icono: <Receipt aria-hidden /> },
    { a: '/deudas', nombre: 'Deudas y tarjeta', icono: <CreditCard aria-hidden /> },
    { a: '/presupuestos', nombre: 'Presupuestos', icono: <Target aria-hidden /> },
    { a: '/impuestos', nombre: 'Impuestos y facturas', icono: <PiggyBank aria-hidden /> },
    { a: '/precios', nombre: 'Precios y tarifas', icono: <Tags aria-hidden /> },
  ] },
  { titulo: 'Ajustes', enlaces: [
    { a: '/negocios', nombre: 'Negocios', icono: <Building2 aria-hidden /> },
    { a: '/categorias', nombre: 'Categorías', icono: <Tags aria-hidden /> },
    { a: '/mundo', nombre: 'Monterroso World', icono: <Globe aria-hidden /> },
  ] },
]

type Modo = 'dev' | 'canela' | 'salario'

const MODOS: { id: Modo; nombre: string; icono: ReactNode; a: string }[] = [
  { id: 'dev', nombre: 'Dev Studio', icono: <FolderKanban aria-hidden />, a: '/clientes' },
  { id: 'canela', nombre: 'Canela', icono: <ShoppingBag aria-hidden />, a: '/tienda' },
  { id: 'salario', nombre: 'Salario', icono: <Wallet aria-hidden />, a: '/salario' },
]

function modoDeRuta(ruta: string): Modo | null {
  const g = GRUPOS.find((x) => x.modo && x.enlaces.some((e) => ruta === e.a || ruta.startsWith(e.a + '/')))
  return g?.modo ?? null
}

function leerModo(): Modo {
  try { const v = localStorage.getItem('mc_modo'); return v === 'canela' || v === 'salario' ? v : 'dev' } catch { return 'dev' }
}

function leerCompacto(): boolean {
  try { return localStorage.getItem('mc_lateral') === 'compacto' } catch { return false }
}

export default function Marco({ children }: { children: ReactNode }) {
  const { correo, prueba, salir } = useSesion()
  const { clientes } = useModelo()
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
  const modo = modoDeRuta(lugar.pathname) ?? modoGuardado
  useEffect(() => {
    const m = modoDeRuta(lugar.pathname)
    if (m) { setModoGuardado(m); try { localStorage.setItem('mc_modo', m) } catch { return } }
  }, [lugar.pathname])
  const elegirModo = (m: (typeof MODOS)[number]) => {
    setModoGuardado(m.id)
    try { localStorage.setItem('mc_modo', m.id) } catch { void 0 }
    ir(m.a)
  }
  useEffect(() => { setAbierto(false) }, [lugar.pathname])
  useEffect(() => {
    if (!abierto) return
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setAbierto(false) }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [abierto])

  const avisosRef = useRef(avisosDev)
  avisosRef.current = avisosDev
  useEffect(() => {
    const correr = () => notificar(avisosRef.current, (a) => ir(a.proyecto_id ? `/proyectos/${a.proyecto_id}?ver=desarrollo` : `/desarrollo?ver=${a.tipo}`))
    const t0 = setTimeout(correr, 1500)
    const t = setInterval(correr, 3600000)
    return () => { clearTimeout(t0); clearInterval(t) }
  }, [ir])

  const cuentas: Record<string, number> = {
    '/desarrollo': avisosDev.length,
    '/clientes': clientes.filter((c) => c.activo).length,
    '/cobros': cobros.filter((c) => c.estado === 'vencido').length,
  }
  const alternar = () => {
    const v = !compacto
    setCompacto(v)
    try { localStorage.setItem('mc_lateral', v ? 'compacto' : 'normal') } catch { return }
  }
  const inicial = (correo ?? 'M').slice(0, 1).toUpperCase()

  return (
    <div className="m-app c-app" data-lateral={compacto || angosta ? 'compacto' : 'normal'} data-menu={abierto ? 'abierto' : 'cerrado'}>
      <header className="c-barra-movil">
        <button type="button" className="m-icono-btn" onClick={() => setAbierto(true)} aria-label="Abrir el menú" title="Abrir el menú"><Menu aria-hidden /></button>
        <span className="c-acceso-logo c-barra-logo"><img className="c-logo-oscuro" src="/marca/studio-oscuro.svg" alt="Studio Monterroso" /><img className="c-logo-claro" src="/marca/studio-claro.svg" alt="" aria-hidden="true" /></span>
      </header>
      <div className="c-velo" onClick={() => setAbierto(false)} aria-hidden />
      <nav className="m-lateral" aria-label="Menú principal">
        <div className="c-cerrar-fila">
          <button type="button" className="m-icono-btn c-cerrar-menu" onClick={() => setAbierto(false)} aria-label="Cerrar el menú" title="Cerrar el menú"><X aria-hidden /></button>
        </div>
        <div className="c-modos" role="tablist" aria-label="Qué negocio trabajar">
          {MODOS.map((m) => (
            <button key={m.id} type="button" role="tab" aria-selected={modo === m.id} title={m.nombre} onClick={() => elegirModo(m)}>
              {m.icono}<span className="m-txt">{m.nombre}</span>
            </button>
          ))}
        </div>
        {GRUPOS.filter((g) => !g.modo || g.modo === modo).map((g) => (
          <div key={g.titulo} className="c-grupo">
            <div className="m-grupo"><span className="m-txt">{g.titulo}</span></div>
            {g.enlaces.map((e) => (
              <NavLink key={e.a} to={e.a} end={e.fin} title={e.nombre}>
                {e.icono}
                <span className="m-txt">{e.nombre}</span>
                {cuentas[e.a] ? <span className="m-cuenta">{cuentas[e.a]}</span> : null}
                <ChevronRight className="m-flecha" aria-hidden />
              </NavLink>
            ))}
          </div>
        ))}
        <div className="m-lateral-pie">
          <span className="m-avatar">{inicial}</span>
          <span className="m-txt"><b>{prueba ? 'Modo de prueba' : 'Antonio'}</b><span>{prueba ? 'datos solo en este equipo' : correo}</span></span>
          <button type="button" id="bTema" onClick={alternarModo} aria-label="Cambiar entre claro y oscuro" title="Claro / oscuro"><Moon className="ico-luna" aria-hidden /><Sun className="ico-sol" aria-hidden /></button>
          <button type="button" onClick={() => setTemas(true)} aria-label="Elegir color" title="Elegir el color"><Palette aria-hidden /></button>
          <button type="button" onClick={() => void salir()} aria-label="Cerrar sesión" title={prueba ? 'Salir del modo de prueba' : 'Cerrar la sesión en este equipo'}><LogOut aria-hidden /></button>
          <button type="button" className="c-compactar" disabled={angosta} onClick={alternar} aria-label={compacto ? 'Mostrar el menú completo' : 'Dejar solo los íconos'} title={compacto ? 'Mostrar el menú completo' : 'Dejar solo los íconos'}><ChevronsLeft aria-hidden /></button>
        </div>
      </nav>
      <Temas abierta={temas} onCambio={temaCambio} onCerrar={() => setTemas(false)} />
      <main className="m-contenido" id="contenido">
        {prueba && <div className="m-franja c-franja-prueba">Modo de prueba: lo que guardes aquí vive solo en este navegador y no toca la base.</div>}
        {children}
      </main>
    </div>
  )
}
