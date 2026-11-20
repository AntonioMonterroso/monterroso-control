import { CheckCheck, ChevronDown, FolderKanban, HandCoins, MessageCircle, Plus, Printer, Trash2, Undo2, User, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAvisar } from '../../componentes/Avisos'
import Buscador, { coincide } from '../../componentes/Buscador'
import Confirmar from '../../componentes/Confirmar'
import Pestanas from '../../componentes/Pestanas'
import SelectorMes from '../../componentes/SelectorMes'
import Tabla, { type Columna } from '../../componentes/Tabla'
import { conceptoDePago, pendientes, totalSaldo, type Cobro } from '../../lib/cobros'
import { useDatos } from '../../lib/datos'
import { aCentavos, deCentavos, quetzales } from '../../lib/dinero'
import { fechaCorta } from '../../lib/fechas'
import { periodoDe } from '../../lib/finanzas'
import { useModelo } from '../../lib/modelo'
import { useCobros, useHoy, usePeriodo } from '../../lib/usos'
import { CUENTAS, type Pago } from '../../lib/tipos'
import { useEscribir } from '../../lib/escribir'
import Ventana from '../../componentes/Ventana'
import { imprimirRecibo } from './documentos'
import { VentanaExtra, VentanaPago, VentanaRecordatorios, VentanaSaldar } from './Ventanas'

type Filtro = 'pendientes' | 'vencidos' | 'pagados' | 'saldados' | 'todos'
type VerPor = 'nada' | 'cliente' | 'proyecto' | 'rubro' | 'negocio'
type Dim = 'cliente' | 'proyecto' | 'rubro' | 'negocio'

const NOMBRE_ESTADO: Record<Cobro['estado'], [string, string]> = { pagado: ['Pagado', 'aprobado'], por_cobrar: ['Por cobrar', 'pendiente'], vencido: ['Vencido', 'error'], saldado: ['Dado por saldado', 'bloqueado'] }

export function EstadoCobro({ c }: { c: Cobro }) {
  const [n, k] = NOMBRE_ESTADO[c.estado]
  const t = c.tipo === 'salario' ? (c.estado === 'pagado' ? 'Recibido' : c.estado === 'por_cobrar' ? 'Por recibir' : n) : n
  return <span className={`m-estado ${k}`}>{t}</span>
}

const ORDEN_ESTADO: Record<Cobro['estado'], number> = { vencido: 0, por_cobrar: 1, pagado: 2, saldado: 3 }

export function subtotales(l: Cobro[]) {
  const s = (f: (c: Cobro) => boolean, k: 'saldo' | 'pagado' | 'monto') => deCentavos(l.filter(f).reduce((t, c) => t + aCentavos(c[k]), 0))
  return {
    porCobrar: s((c) => c.estado === 'por_cobrar', 'saldo'),
    vencido: s((c) => c.estado === 'vencido', 'saldo'),
    pagado: s(() => true, 'pagado'),
    saldado: s((c) => c.estado === 'saldado', 'saldo'),
  }
}

function Sub({ s }: { s: ReturnType<typeof subtotales> }) {
  return (
    <span className="c-subtotales">
      {s.vencido > 0 && <span className="m-estado error">Vencido {quetzales(s.vencido)}</span>}
      {s.porCobrar > 0 && <span className="m-estado pendiente">Por cobrar {quetzales(s.porCobrar)}</span>}
      {s.pagado > 0 && <span className="m-estado aprobado">Pagado {quetzales(s.pagado)}</span>}
      {s.saldado > 0 && <span className="m-estado bloqueado">Saldado {quetzales(s.saldado)}</span>}
    </span>
  )
}

export default function Cobros() {
  const m = useModelo()
  const { guardar } = useDatos()
  const esc = useEscribir()
  const avisar = useAvisar()
  const ir = useNavigate()
  const hoy = useHoy()
  const [periodo, setPeriodo] = usePeriodo()
  const todos = useCobros(periodo)
  const [vista, setVista] = useState<'cobros' | 'pagos'>('cobros')
  const [filtro, setFiltro] = useState<Filtro>('pendientes')
  const [verPor, setVerPor] = useState<VerPor>('nada')
  const [dims, setDims] = useState<Partial<Record<Dim, string>>>({})
  const [cerrados, setCerrados] = useState<string[]>([])
  const [q, setQ] = useState('')
  const [pagar, setPagar] = useState<Cobro | null>(null)
  const [saldar, setSaldar] = useState<Cobro | null>(null)
  const [extra, setExtra] = useState(false)
  const [avisos, setAvisos] = useState(false)
  const [quitarPago, setQuitarPago] = useState<Pago | null>(null)
  const [marcadas, setMarcadas] = useState<Set<string>>(new Set())
  const [masa, setMasa] = useState(false)
  const [masaFecha, setMasaFecha] = useState(hoy)
  const [masaCuenta, setMasaCuenta] = useState('Banco')
  const [ocupado, setOcupado] = useState(false)

  const salario = m.negocios.find((n) => n.clave === 'salario')
  const cliente = (id: string | null) => m.clientes.find((c) => c.id === id)
  const proyecto = (id: string | null) => m.proyectos.find((p) => p.id === id)?.nombre ?? ''
  const valorDim = (c: Cobro, d: Dim): [string, string] => {
    const cl = cliente(c.cliente_id)
    if (d === 'cliente') return c.tipo === 'salario' ? ['salario', 'Mi salario'] : [c.cliente_id, cl?.nombre ?? 'Sin cliente']
    if (d === 'proyecto') return c.proyecto_id ? [c.proyecto_id, proyecto(c.proyecto_id)] : c.tipo === 'salario' ? ['salario', 'Salario'] : ['sin', 'Sin proyecto']
    if (d === 'rubro') return c.tipo === 'salario' ? ['salario', 'Salario'] : [cl?.rubro?.trim().toLowerCase() || 'sin', cl?.rubro?.trim() || 'Sin rubro']
    const nid = c.tipo === 'salario' ? salario?.id ?? '' : cl?.negocio_id ?? ''
    return [nid, m.negocios.find((n) => n.id === nid)?.nombre ?? 'Sin negocio']
  }
  const opciones = (d: Dim) => [...new Map(todos.map((c) => valorDim(c, d))).entries()].sort((a, b) => a[1].localeCompare(b[1], 'es'))

  const delMes = todos.filter((c) => c.vence && periodoDe(c.vence) === periodo)
  const atrasados = todos.filter((c) => c.estado === 'vencido' && c.vence && periodoDe(c.vence) < periodo)
  const sinFecha = todos.filter((c) => !c.vence && c.estado === 'por_cobrar')
  const base = filtro === 'pendientes' ? [...atrasados, ...pendientes(delMes), ...sinFecha]
    : filtro === 'vencidos' ? todos.filter((c) => c.estado === 'vencido')
    : filtro === 'pagados' ? delMes.filter((c) => c.estado === 'pagado')
    : filtro === 'saldados' ? todos.filter((c) => c.estado === 'saldado')
    : delMes
  const lista = base.filter((c) => (Object.entries(dims) as [Dim, string][]).every(([d, v]) => !v || valorDim(c, d)[0] === v) && coincide(q, cliente(c.cliente_id)?.nombre, c.concepto, proyecto(c.proyecto_id)))
  const st = subtotales(lista)
  const pagosMes = m.pagos.filter((p) => periodoDe(p.fecha) === periodo && coincide(q, cliente(p.cliente_id)?.nombre, p.referencia))
  const cobrado = deCentavos(pagosMes.reduce((s, p) => s + aCentavos(p.monto), 0))
  const porCobrarMes = totalSaldo(delMes)
  const vencido = totalSaldo(todos.filter((c) => c.estado === 'vencido'))
  const conceptoDe = (clave: string) => conceptoDePago(clave, todos)
  const pagosDe = (clave: string) => m.pagos.filter((p) => p.cobro_clave === clave)
  const grupos = useMemo(() => {
    if (verPor === 'nada') return []
    const g = new Map<string, { nombre: string; filas: Cobro[] }>()
    for (const c of lista) { const [k, n] = valorDim(c, verPor); const x = g.get(k) ?? { nombre: n, filas: [] }; x.filas.push(c); g.set(k, x) }
    return [...g.entries()].sort((a, b) => a[1].nombre.localeCompare(b[1].nombre, 'es'))
  }, [lista, verPor])

  const quitarSaldado = async (c: Cobro) => {
    if (!c.guardado) return
    await guardar('ctl_cobros', c.guardado.id, { saldado: false })
    avisar('El cobro vuelve a estar pendiente.')
  }
  const reciboDe = (c: Cobro) => {
    const p = pagosDe(c.clave)[0]
    if (p) imprimirRecibo(p, cliente(p.cliente_id), c.concepto)
  }
  const ponerDim = (d: Dim, v: string) => setDims((x) => ({ ...x, [d]: v }))
  const nombreDim: Record<Dim, string> = { cliente: 'Cliente', proyecto: 'Proyecto', rubro: 'Rubro', negocio: 'Negocio' }

  const columnas: Columna<Cobro>[] = [
    { titulo: 'Vence', valor: (c) => (c.vence ? <>{fechaCorta(c.vence)}{c.vence === hoy && <span className="c-hoy">Hoy</span>}</> : <span className="m-vacia">Sin fecha</span>), orden: (c) => c.vence ?? '9999' },
    { titulo: 'Cliente', principal: true, oculto: verPor === 'cliente', valor: (c) => (c.tipo === 'salario' ? <Link to="/salario" className="c-enlace" onClick={(e) => e.stopPropagation()}>Mi salario</Link> : <Link to={`/clientes/${encodeURIComponent(c.cliente_id ?? "")}`} className="c-enlace" onClick={(e) => e.stopPropagation()}>{cliente(c.cliente_id)?.nombre}</Link>), orden: (c) => (c.tipo === 'salario' ? 'mi salario' : (cliente(c.cliente_id)?.nombre ?? '').toLowerCase()) },
    { titulo: 'Proyecto', oculto: verPor === 'proyecto', valor: (c) => (c.proyecto_id ? <Link to={`/proyectos/${c.proyecto_id}`} className="c-enlace-suave" onClick={(e) => e.stopPropagation()}>{proyecto(c.proyecto_id)}</Link> : <span className="m-vacia">{c.tipo === 'salario' ? 'Salario' : '—'}</span>), orden: (c) => proyecto(c.proyecto_id).toLowerCase() },
    { titulo: 'Concepto', principal: verPor === 'cliente', valor: (c) => <>{c.concepto}{c.guardado?.saldado && c.guardado.nota && <small>{c.guardado.nota}</small>}</> },
    { titulo: 'Estado', valor: (c) => <EstadoCobro c={c} />, orden: (c) => ORDEN_ESTADO[c.estado] },
    { titulo: 'Monto', num: true, valor: (c) => quetzales(c.monto), orden: (c) => c.monto },
    { titulo: 'Pendiente', num: true, valor: (c) => quetzales(c.saldo), orden: (c) => c.saldo },
  ]
  const acciones = (c: Cobro) => (
    <>
      {(c.estado === 'por_cobrar' || c.estado === 'vencido') && <button type="button" className="m-btn m-btn-primario m-btn-sm" onClick={() => setPagar(c)} title={c.tipo === 'salario' ? 'Marcar que ya recibiste el salario' : 'Registrar lo que pagó el cliente'}><HandCoins size={14} aria-hidden /> {c.tipo === 'salario' ? 'Recibido' : 'Pago'}</button>}
      {(c.estado === 'por_cobrar' || c.estado === 'vencido') && <button type="button" className="m-btn m-btn-fantasma m-btn-sm" onClick={() => setSaldar(c)} title="Dejar de contarlo como pendiente (por ejemplo un descuento)">Saldar</button>}
      {c.estado === 'saldado' && <button type="button" className="m-btn m-btn-fantasma m-btn-sm" onClick={() => void quitarSaldado(c)} title="Volver a contarlo como pendiente"><Undo2 size={14} aria-hidden /> Deshacer</button>}
      {c.tipo !== 'salario' && pagosDe(c.clave).length > 0 && <button type="button" className="m-icono-btn c-salida" onClick={() => reciboDe(c)} aria-label="Recibo" title="Abrir el recibo de este pago"><Printer aria-hidden /></button>}
    </>
  )
  const puedeMarcar = (c: Cobro) => c.estado === 'por_cobrar' || c.estado === 'vencido'
  const marcar = { puede: puedeMarcar, marcadas, cambiar: (ids: string[], si: boolean) => setMarcadas((x) => { const n = new Set(x); ids.forEach((k) => (si ? n.add(k) : n.delete(k))); return n }) }
  const elegidos = todos.filter((c) => marcadas.has(c.clave) && puedeMarcar(c))
  const totalMarcado = deCentavos(elegidos.reduce((t, c) => t + aCentavos(c.saldo), 0))
  const soloSalario = elegidos.length > 0 && elegidos.every((c) => c.tipo === 'salario')
  const registrarVarios = async () => {
    if (!elegidos.length || ocupado) return
    setOcupado(true)
    const deshacer: (() => Promise<void>)[] = []
    let usados = 0
    try {
      for (const c of elegidos) {
        const recibo = c.tipo === 'salario' ? null : esc.siguienteRecibo(usados++)
        deshacer.push(await esc.registrarPago(c, { fecha: masaFecha, monto: c.saldo, cuenta: masaCuenta, referencia: null, nota: null }, recibo))
      }
      setMasa(false); setMarcadas(new Set())
      avisar(`${deshacer.length} ${deshacer.length === 1 ? 'cobro marcado' : 'cobros marcados'} por ${quetzales(totalMarcado)}.`, 'bien', { texto: 'Deshacer', hacer: async () => { for (const f of [...deshacer].reverse()) await f(); avisar('Se deshizo: vuelven a quedar pendientes.') } })
    } catch (e) {
      for (const f of [...deshacer].reverse()) await f().catch(() => undefined)
      avisar(e instanceof Error ? e.message : 'No se pudo: no se registró ninguno.', 'error')
    }
    setOcupado(false)
  }
  const abrirFila = (c: Cobro) => ir(c.tipo === 'salario' ? '/salario' : c.proyecto_id ? `/proyectos/${c.proyecto_id}` : `/clientes/${encodeURIComponent(c.cliente_id ?? "")}`)

  return (
    <>
      <div className="c-cabeza">
        <div><span className="m-etiqueta">Dev Studio y salario</span><h1 className="erp-titulo">Cobros</h1></div>
        <div className="c-cabeza-acciones">
          <SelectorMes periodo={periodo} onCambio={setPeriodo} />
          <button type="button" className="m-btn m-btn-secundario" onClick={() => setAvisos(true)} title="Mandar el estado de cuenta por WhatsApp a cada cliente que debe"><MessageCircle size={16} aria-hidden /> Recordatorios</button>
          <button type="button" className="m-btn m-btn-primario" onClick={() => setExtra(true)} title="Agregar un cobro que no es inscripción ni mensualidad"><Plus size={16} aria-hidden /> Cobro extra</button>
        </div>
      </div>

      <div className="erp-kpis">
        <div className="erp-kpi"><span className="m-etiqueta">Cobrado en el mes</span><b>{quetzales(cobrado)}</b><small>{pagosMes.length} {pagosMes.length === 1 ? 'pago' : 'pagos'}</small></div>
        <div className="erp-kpi"><span className="m-etiqueta">Falta cobrar del mes</span><b>{quetzales(porCobrarMes)}</b><small>{pendientes(delMes).length} {pendientes(delMes).length === 1 ? 'cobro' : 'cobros'}</small></div>
        <div className="erp-kpi"><span className="m-etiqueta">Vencido a hoy</span><b className={vencido > 0 ? 'm-negativo' : undefined}>{quetzales(vencido)}</b><small>{todos.filter((c) => c.estado === 'vencido').length} vencidos</small></div>
      </div>

      <Pestanas etiqueta="Ver" valor={vista} onCambio={setVista} opciones={[{ valor: 'cobros', nombre: 'Lo que toca cobrar' }, { valor: 'pagos', nombre: 'Pagos recibidos', cuenta: pagosMes.length }]} />

      <div className="c-herramientas">
        <Buscador valor={q} onCambio={setQ} ayuda="Cliente, concepto o referencia" />
        {vista === 'cobros' && (
          <div className="c-chips" role="group" aria-label="Filtrar cobros por estado">
            {([['pendientes', 'Pendientes'], ['vencidos', 'Vencidos'], ['pagados', 'Pagados del mes'], ['saldados', 'Dados por saldado'], ['todos', 'Todos del mes']] as [Filtro, string][]).map(([f, n]) => (
              <button key={f} type="button" className="m-chip" aria-pressed={filtro === f} onClick={() => setFiltro(f)} title={`Ver ${n.toLowerCase()}`}>{n}</button>
            ))}
          </div>
        )}
      </div>

      {vista === 'cobros' ? (
        <>
          <div className="c-filtros-dim">
            {(['cliente', 'proyecto', 'rubro', 'negocio'] as Dim[]).map((d) => (
              <label key={d} className="c-dim">
                <span>{nombreDim[d]}</span>
                <select className="m-entrada" value={dims[d] ?? ''} onChange={(e) => ponerDim(d, e.target.value)}>
                  <option value="">Todos</option>
                  {opciones(d).map(([k, n]) => <option key={k} value={k}>{n}</option>)}
                </select>
              </label>
            ))}
            <label className="c-dim c-dim-ver">
              <span>Ver por</span>
              <select className="m-entrada" value={verPor} onChange={(e) => { setVerPor(e.target.value as VerPor); setCerrados([]) }}>
                <option value="nada">Sin agrupar</option>
                <option value="cliente">Cliente</option>
                <option value="proyecto">Proyecto</option>
                <option value="rubro">Rubro</option>
                <option value="negocio">Negocio</option>
              </select>
            </label>
          </div>
          {elegidos.length > 0 ? (
            <div className="c-barra-masa" role="region" aria-label="Marcadas">
              <span><b>{elegidos.length}</b> {elegidos.length === 1 ? 'marcado' : 'marcados'} · {quetzales(totalMarcado)}</span>
              <span>
                <button type="button" className="m-btn m-btn-fantasma m-btn-sm" onClick={() => setMarcadas(new Set())} title="Quitar todas las marcas">Quitar marcas</button>
                <button type="button" className="m-btn m-btn-primario m-btn-sm" onClick={() => { setMasaFecha(hoy); setMasa(true) }} title="Registrar el pago completo de todos los marcados con una fecha y una cuenta"><CheckCheck size={14} aria-hidden /> {soloSalario ? 'Marcar como recibidos' : 'Marcar como pagados'}</button>
              </span>
            </div>
          ) : (
          <div className="c-suma-filtro" aria-live="polite">
            <span className="c-chips">
              {(Object.entries(dims) as [Dim, string][]).filter(([, v]) => v).map(([d, v]) => (
                <button key={d} type="button" className="m-chip" aria-pressed="true" onClick={() => ponerDim(d, '')} title={`Quitar el filtro de ${nombreDim[d].toLowerCase()}`}>{nombreDim[d]}: {opciones(d).find((o) => o[0] === v)?.[1]} <X size={12} aria-hidden /></button>
              ))}
            </span>
            <span><b>{lista.length}</b> {lista.length === 1 ? 'cobro' : 'cobros'} · pendiente <b>{quetzales(deCentavos(aCentavos(st.porCobrar) + aCentavos(st.vencido)))}</b></span>
          </div>
          )}

          {verPor === 'nada' ? (
            <Tabla
              buscador={false}
              titulo={`${lista.length} ${lista.length === 1 ? 'cobro' : 'cobros'}`}
              nota={<Sub s={st} />}
              filas={lista}
              clave={(c) => c.clave}
              vacio={filtro === 'pendientes' ? 'No hay nada pendiente en este mes.' : 'No hay cobros con este filtro.'}
              onFila={abrirFila}
              columnas={columnas}
              acciones={acciones}
              marcar={marcar}
            />
          ) : grupos.length === 0 ? (
            <div className="m-vacio c-vacio-chico"><b>Sin cobros con estos filtros</b></div>
          ) : (
            <div className="c-grupos">
              {grupos.map(([k, g]) => {
                const abierto = !cerrados.includes(k)
                const link = verPor === 'cliente' && k !== 'salario' ? `/clientes/${encodeURIComponent(k ?? "")}` : verPor === 'proyecto' && k !== 'sin' && k !== 'salario' ? `/proyectos/${k}` : null
                return (
                  <section key={k} className="c-grupo-cobros" data-abierto={abierto}>
                    <div className="c-grupo-cab">
                      <button type="button" className="c-grupo-boton" aria-expanded={abierto} onClick={() => setCerrados((l) => (abierto ? [...l, k] : l.filter((x) => x !== k)))} title={abierto ? 'Cerrar el grupo' : 'Abrir el grupo'}>
                        <ChevronDown className="c-grupo-flecha" aria-hidden />
                        <b>{g.nombre}</b>
                        <span className="c-grupo-n">{g.filas.length}</span>
                      </button>
                      <Sub s={subtotales(g.filas)} />
                      {link && <Link to={link} className="m-icono-btn c-salida" aria-label={`Abrir ${g.nombre}`} title={`Abrir ${g.nombre}`}>{verPor === 'cliente' ? <User aria-hidden /> : <FolderKanban aria-hidden />}</Link>}
                    </div>
                    {abierto && <Tabla buscador={false} filas={g.filas} clave={(c) => c.clave} vacio="" onFila={abrirFila} columnas={columnas} acciones={acciones} marcar={marcar} />}
                  </section>
                )
              })}
            </div>
          )}
        </>
      ) : (
        <Tabla
          buscador={false}
          titulo={`${pagosMes.length} ${pagosMes.length === 1 ? 'pago' : 'pagos'}`}
          filas={pagosMes}
          clave={(p) => p.id}
          vacio="No hay pagos registrados en este mes."
          columnas={[
            { titulo: 'Fecha', valor: (p) => fechaCorta(p.fecha), orden: (p) => p.fecha },
            { titulo: 'Recibo', valor: (p) => (p.recibo_numero ? String(p.recibo_numero).padStart(5, '0') : <span className="m-vacia">—</span>), orden: (p) => p.recibo_numero ?? 0 },
            { titulo: 'Cliente', principal: true, valor: (p) => (p.cobro_clave.startsWith('s:') ? <Link to="/salario" className="c-enlace">Mi salario</Link> : <Link to={`/clientes/${encodeURIComponent(p.cliente_id ?? "")}`} className="c-enlace">{cliente(p.cliente_id)?.nombre}</Link>) },
            { titulo: 'Concepto', valor: (p) => conceptoDe(p.cobro_clave) },
            { titulo: 'Cuenta', valor: (p) => <>{p.cuenta}{p.referencia && <small>Ref. {p.referencia}</small>}</> },
            { titulo: 'Monto', num: true, valor: (p) => quetzales(p.monto), orden: (p) => p.monto },
          ]}
          acciones={(p) => (
            <>
              {!p.cobro_clave.startsWith('s:') && <button type="button" className="m-icono-btn c-salida" onClick={() => imprimirRecibo(p, cliente(p.cliente_id), conceptoDe(p.cobro_clave))} aria-label="Recibo" title="Abrir el recibo para guardarlo en PDF o imprimirlo"><Printer aria-hidden /></button>}
              <button type="button" className="m-icono-btn" onClick={() => setQuitarPago(p)} aria-label="Quitar pago" title="Quitar este pago si se registró por error"><Trash2 aria-hidden /></button>
            </>
          )}
          pie={<tr><td colSpan={5}>Total del mes</td><td className="m-num">{quetzales(cobrado)}</td><td /></tr>}
        />
      )}

      <VentanaPago cobro={pagar} onCerrar={() => setPagar(null)} />
      <Ventana abierta={masa} titulo={soloSalario ? 'Marcar como recibidos' : 'Marcar como pagados'} subtitulo={`${elegidos.length} ${elegidos.length === 1 ? 'cobro' : 'cobros'} · ${quetzales(totalMarcado)}. Cada uno se registra por lo que debe.`} onCerrar={() => setMasa(false)} pie={
        <>
          <button type="button" className="m-btn m-btn-fantasma" onClick={() => setMasa(false)} title="Cerrar sin registrar">Cancelar</button>
          <button type="button" className="m-btn m-btn-primario" disabled={ocupado || !masaFecha} onClick={() => void registrarVarios()} title="Registrar todos los marcados">{ocupado ? 'Registrando…' : `Registrar ${elegidos.length}`}</button>
        </>
      }>
        <div className="c-form">
          <div className="m-campo"><label htmlFor="ms-f">Fecha</label><input id="ms-f" type="date" className="m-entrada" value={masaFecha} onChange={(e) => setMasaFecha(e.target.value)} /></div>
          <div className="m-campo"><label htmlFor="ms-c">Dónde cayó</label><select id="ms-c" className="m-entrada" value={masaCuenta} onChange={(e) => setMasaCuenta(e.target.value)}>{CUENTAS.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
        </div>
        <ul className="c-lista-saldos c-lista-pagar">
          {elegidos.map((c) => <li key={c.clave}><span><b>{c.tipo === 'salario' ? 'Mi salario' : cliente(c.cliente_id)?.nombre}</b><small> · {c.concepto}</small></span><b className="m-cifra">{quetzales(c.saldo)}</b></li>)}
        </ul>
      </Ventana>
      <VentanaSaldar cobro={saldar} onCerrar={() => setSaldar(null)} />
      <VentanaExtra abierta={extra} onCerrar={() => setExtra(false)} />
      <VentanaRecordatorios abierta={avisos} cobros={todos} onCerrar={() => setAvisos(false)} />
      <Confirmar abierta={quitarPago != null} titulo="Quitar pago" peligro boton="Quitar el pago"
        texto={quitarPago ? `Se quita el pago de ${quetzales(quitarPago.monto)} del ${fechaCorta(quitarPago.fecha)} y el cobro vuelve a quedar pendiente. Úsalo solo si se registró por error.` : ''}
        onNo={() => setQuitarPago(null)}
        onSi={async () => { if (quitarPago) { try { await esc.quitarPago(quitarPago); avisar('Pago quitado.') } catch (e) { avisar(e instanceof Error ? e.message : 'No se pudo quitar.', 'error') } } setQuitarPago(null) }} />
    </>
  )
}
