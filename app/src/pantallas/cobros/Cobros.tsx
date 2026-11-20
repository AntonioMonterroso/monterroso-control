import { porcentaje } from '../../lib/totales'
import Pasos from '../../componentes/Pasos'
import SelectBuscable from '../../componentes/SelectBuscable'
import { CheckCheck, ChevronDown, FolderKanban, HandCoins, MessageCircle, User, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAvisar } from '../../componentes/Avisos'
import Buscador, { coincide } from '../../componentes/Buscador'
import SelectorMes from '../../componentes/SelectorMes'
import Tabla, { type Columna } from '../../componentes/Tabla'
import { numeroWhatsApp, pendientes, totalSaldo, type Cobro } from '../../lib/cobros'
import { useDatos } from '../../lib/datos'
import { aCentavos, deCentavos, quetzales } from '../../lib/dinero'
import { fechaCorta } from '../../lib/fechas'
import { periodoDe } from '../../lib/finanzas'
import { useModelo } from '../../lib/modelo'
import { useCobros, useHoy, usePeriodo } from '../../lib/usos'
import { imprimirRecibo } from './documentos'
import { VentanaAnticipo } from '../pagos/Anticipos'
import MenuMas from '../../componentes/MenuMas'
import RegistrarPago from '../pagos/RegistrarPago'
import { VentanaEditarExtra, VentanaExtra, VentanaPago, VentanaRecordatorios, VentanaSaldar } from './Ventanas'
import { useQuitar } from '../../lib/quitar'

type Filtro = 'pendientes' | 'vencidos' | 'pagados' | 'saldados' | 'todos'
type VerPor = 'nada' | 'cliente' | 'proyecto' | 'rubro' | 'negocio'
type Dim = 'cliente' | 'proyecto' | 'rubro' | 'negocio'

const NOMBRE_ESTADO: Record<Cobro['estado'], [string, string]> = { pagado: ['Pagado', 'aprobado'], por_cobrar: ['Por cobrar', 'pendiente'], vencido: ['Vencido', 'error'], saldado: ['Saldado', 'bloqueado'] }

export function EstadoCobro({ c }: { c: Cobro }) {
  const [n, k] = NOMBRE_ESTADO[c.estado]
  const parcial = c.pagado > 0 && c.saldo > 0 && (c.estado === 'por_cobrar' || c.estado === 'vencido')
  if (parcial) return <span className={`m-estado ${c.estado === 'vencido' ? 'error' : 'en-proceso'}`} title={`Pagó ${quetzales(c.pagado)}; falta ${quetzales(c.saldo)}${c.estado === 'vencido' ? '. Ya venció' : ''}`}>{c.estado === 'vencido' ? 'Pago parcial · vencido' : 'Pago parcial'}</span>
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
  const avisar = useAvisar()
  const ir = useNavigate()
  const hoy = useHoy()
  const [periodo, setPeriodo] = usePeriodo()
  const todos = useCobros(periodo)
  const [anticipo, setAnticipo] = useState(false)
  const [filtro, setFiltro] = useState<Filtro>('pendientes')
  const [verPor, setVerPor] = useState<VerPor>('nada')
  const [dims, setDims] = useState<Partial<Record<Dim, string>>>({})
  const [cerrados, setCerrados] = useState<string[]>([])
  const [q, setQ] = useState('')
  const [pagar, setPagar] = useState<Cobro | null>(null)
  const [saldar, setSaldar] = useState<Cobro | null>(null)
  const [extra, setExtra] = useState(false)
  const [avisos, setAvisos] = useState(false)
  const [editarExtra, setEditarExtra] = useState<Cobro | null>(null)
  const quitarExtra = useQuitar()
  const [marcadas, setMarcadas] = useState<Set<string>>(new Set())
  const [masa, setMasa] = useState(false)

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
    { titulo: 'Proyecto', baja: true, oculto: verPor === 'proyecto', valor: (c) => (c.proyecto_id ? <Link to={`/proyectos/${c.proyecto_id}`} className="c-enlace-suave" onClick={(e) => e.stopPropagation()}>{proyecto(c.proyecto_id)}</Link> : <span className="m-vacia">{c.tipo === 'salario' ? 'Salario' : '—'}</span>), orden: (c) => proyecto(c.proyecto_id).toLowerCase() },
    { titulo: 'Concepto', baja: true, principal: verPor === 'cliente', valor: (c) => <>{c.concepto}{c.guardado?.saldado && c.guardado.nota && <small>{c.guardado.nota}</small>}</> },
    { titulo: 'Estado', cabecera: true, valor: (c) => <EstadoCobro c={c} />, orden: (c) => ORDEN_ESTADO[c.estado] },
    { titulo: 'Monto', baja: true, num: true, valor: (c) => quetzales(c.monto), orden: (c) => c.monto },
    { titulo: 'Falta', etiqueta: 'Debe', destacado: true, num: true, valor: (c) => quetzales(c.saldo), orden: (c) => c.saldo },
  ]
  const recordar = (c: Cobro) => { const cl = cliente(c.cliente_id); return `https://wa.me/${numeroWhatsApp(cl?.whatsapp ?? null)}?text=${encodeURIComponent(`Hola${cl ? `, ${cl.nombre}` : ''}. Te recuerdo ${c.concepto.toLowerCase()} por ${quetzales(c.saldo)}${c.vence ? `, ${c.vence < hoy ? 'venció' : 'vence'} el ${fechaCorta(c.vence)}` : ''}. ¡Gracias!`)}` }
  const acciones = (c: Cobro) => {
    const pendiente = c.estado === 'por_cobrar' || c.estado === 'vencido'
    const extraEditable = c.tipo === 'extra' && c.guardado && !c.clave.startsWith('a:')
    const mas = [
      ...(pendiente ? [{ texto: 'Saldar', titulo: 'Deja de contarlo como pendiente (por ejemplo un descuento)', hacer: () => setSaldar(c) }] : []),
      ...(c.estado === 'saldado' ? [{ texto: 'Volver a cobrar', titulo: 'Vuelve a contarlo como pendiente', hacer: () => void quitarSaldado(c) }] : []),
      ...(extraEditable ? [{ texto: 'Editar cobro', titulo: 'Abre el cobro para corregirlo', hacer: () => setEditarExtra(c) }] : []),
      ...(extraEditable && c.pagado === 0 ? [{ texto: 'Quitar cobro', titulo: 'Quita este cobro; se puede deshacer', hacer: () => quitarExtra.pedir('ctl_cobros', [c.guardado!], `Se quita el cobro «${c.concepto}» de ${quetzales(c.monto)}.`), peligro: true }] : []),
      ...(c.tipo !== 'salario' && pagosDe(c.clave).length > 0 ? [{ texto: 'Recibo', titulo: 'Abre el recibo de este pago', hacer: () => reciboDe(c) }] : []),
    ]
    return (
      <>
        {pendiente && <button type="button" className="m-btn m-btn-primario m-btn-sm" onClick={() => setPagar(c)} title={c.tipo === 'salario' ? 'Marca que ya recibiste el salario' : 'Registra lo que pagó el cliente'}><HandCoins size={14} aria-hidden /> {c.tipo === 'salario' ? 'Recibido' : 'Registrar pago'}</button>}
        {pendiente && c.tipo !== 'salario' && <a className="m-icono-btn c-salida" href={recordar(c)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} aria-label="Recordar por WhatsApp" title="Abre WhatsApp del cliente con el recordatorio de este cobro"><MessageCircle aria-hidden /></a>}
        {mas.length > 0 && <MenuMas icono items={mas} />}
      </>
    )
  }
  const puedeMarcar = (c: Cobro) => c.estado === 'por_cobrar' || c.estado === 'vencido'
  const marcar = { puede: puedeMarcar, marcadas, cambiar: (ids: string[], si: boolean) => setMarcadas((x) => { const n = new Set(x); ids.forEach((k) => (si ? n.add(k) : n.delete(k))); return n }) }
  const elegidos = todos.filter((c) => marcadas.has(c.clave) && puedeMarcar(c))
  const totalMarcado = deCentavos(elegidos.reduce((t, c) => t + aCentavos(c.saldo), 0))
  const soloSalario = elegidos.length > 0 && elegidos.every((c) => c.tipo === 'salario')
  const abrirFila = (c: Cobro) => ir(c.tipo === 'salario' ? '/salario' : c.proyecto_id ? `/proyectos/${c.proyecto_id}` : `/clientes/${encodeURIComponent(c.cliente_id ?? "")}`)

  return (
    <>
      <div className="c-cabeza">
        <div><span className="m-etiqueta">Dinero</span><h1 className="erp-titulo">Lo que me deben</h1><Pasos /><p className="c-subtitulo">Lo que cada cliente tiene que pagarte: lo vencido, lo de este mes y lo que viene.</p></div>
        <div className="c-cabeza-acciones">
          <SelectorMes periodo={periodo} onCambio={setPeriodo} />
          <MenuMas items={[
            { texto: 'Agregar cobro', titulo: 'Agrega un cobro: único, servicio, mensualidad adicional u otro', hacer: () => setExtra(true) },
            { texto: 'Registrar anticipo', titulo: 'Registra un pago adelantado que queda como saldo a favor del cliente', hacer: () => setAnticipo(true) },
            { texto: 'Recordatorios por WhatsApp', titulo: 'Manda el estado de cuenta por WhatsApp a cada cliente que debe', hacer: () => setAvisos(true) },
          ]} />
          <RegistrarPago />
        </div>
      </div>

      <div className="erp-kpis">
        <div className="erp-kpi"><span className="m-etiqueta">Me deben en total</span><b>{quetzales(totalSaldo(todos))}</b><small>{pendientes(todos).length} {pendientes(todos).length === 1 ? 'cobro' : 'cobros'}</small></div>
        <div className={`erp-kpi${vencido > 0 ? ' peligro' : ''}`}><span className="m-etiqueta">Vencido</span><b className={vencido > 0 ? 'm-negativo' : undefined}>{quetzales(vencido)}</b><small>{todos.filter((c) => c.estado === 'vencido').length} vencidos</small></div>
        <div className="erp-kpi"><span className="m-etiqueta">Falta de este mes</span><b>{quetzales(porCobrarMes)}</b><small>{pendientes(delMes).length} {pendientes(delMes).length === 1 ? 'cobro' : 'cobros'}</small></div>
        <div className="erp-kpi exito"><span className="m-etiqueta">Entró este mes</span><b>{quetzales(cobrado)}</b><small><Link to="/pagos" className="c-enlace">{pagosMes.length} {pagosMes.length === 1 ? 'pago' : 'pagos'} · ver</Link></small></div>
      </div>

      {vencido > 0 && filtro !== 'vencidos' && (
        <div className="c-urgente" role="region" aria-label="Vencido">
          <span><b>{todos.filter((c) => c.estado === 'vencido').length} cobros vencidos</b> por {quetzales(vencido)}. Es lo primero por cobrar.</span>
          <button type="button" className="m-btn m-btn-secundario m-btn-sm" onClick={() => setFiltro('vencidos')} title="Muestra solo los cobros vencidos">Ver solo vencidos</button>
        </div>
      )}

      <div className="c-herramientas">
        <Buscador valor={q} onCambio={setQ} ayuda="Cliente, concepto o referencia" />
        <div className="c-chips" role="group" aria-label="Filtrar cobros por estado">
          {([['pendientes', 'Por cobrar'], ['vencidos', 'Vencidos'], ['pagados', 'Pagados del mes'], ['saldados', 'Saldados'], ['todos', 'Todos del mes']] as [Filtro, string][]).map(([f, n]) => (
            <button key={f} type="button" className="m-chip" aria-pressed={filtro === f} onClick={() => setFiltro(f)} title={`Muestra ${n.toLowerCase()}`}>{n}</button>
          ))}
        </div>
      </div>

      {(
        <>
          <div className="c-filtros-dim">
            {(['cliente', 'proyecto', 'rubro', 'negocio'] as Dim[]).map((d) => (
              <label key={d} className="c-dim">
                <span>{nombreDim[d]}</span>
                <SelectBuscable id={`dim-${d}`} valor={dims[d] ?? ''} onCambio={(v) => ponerDim(d, v)} vacio="Todos" opciones={opciones(d).map(([k, n]) => ({ valor: k, nombre: n }))} />
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
                <button type="button" className="m-btn m-btn-primario m-btn-sm" onClick={() => setMasa(true)} title="Registrar el pago completo de todos los marcados con una fecha y una cuenta"><CheckCheck size={14} aria-hidden /> {soloSalario ? 'Marcar como recibidos' : 'Marcar como pagados'}</button>
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
              llave="cobros"
              resumen={(l) => { const v = l.filter((c) => c.estado === 'vencido'); const pv = l.filter((c) => c.estado === 'por_cobrar'); const tv = totalSaldo(v), tp = totalSaldo(pv); return <><span className="c-txt-peligro">Vencido <b>{quetzales(tv)}</b> · {v.length}</span><span>Por vencer <b>{quetzales(tp)}</b> · {pv.length}</span><span>{porcentaje(tv, tv + tp)} vencido</span></> }}
              claseFila={(c) => (c.estado === 'vencido' ? 'c-fila-vencida' : undefined)}
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
      )}

      <VentanaPago cobro={pagar} onCerrar={() => setPagar(null)} />
      <VentanaEditarExtra cobro={editarExtra} onCerrar={() => setEditarExtra(null)} />
      {quitarExtra.ventana}
      <VentanaPago varios={masa ? elegidos : null} onCerrar={() => setMasa(false)} onHecho={() => setMarcadas(new Set())} />
      <VentanaSaldar cobro={saldar} onCerrar={() => setSaldar(null)} />
      <VentanaAnticipo abierta={anticipo} anticipo={null} onCerrar={() => setAnticipo(false)} />
      <VentanaExtra abierta={extra} onCerrar={() => setExtra(false)} />
      <VentanaRecordatorios abierta={avisos} cobros={todos} onCerrar={() => setAvisos(false)} />
    </>
  )
}
