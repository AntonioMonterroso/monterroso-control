import Ojito from '../componentes/Ojito'
import Pasos from '../componentes/Pasos'
import { ArrowLeft, MessageCircle, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Tabla from '../componentes/Tabla'
import { useAvisar } from '../componentes/Avisos'
import { useEscribir } from '../lib/escribir'
import { pendientes, totalSaldo, type Cobro } from '../lib/cobros'
import { quetzales } from '../lib/dinero'
import { fechaCorta } from '../lib/fechas'
import { regimenVigente } from '../lib/finanzas'
import { useModelo } from '../lib/modelo'
import { useCobros, useHoy } from '../lib/usos'
import { REGIMENES, type Proyecto } from '../lib/tipos'
import { EstadoCobro } from './cobros/Cobros'
import { VentanaEstadoCuenta, VentanaExtra, VentanaPago } from './cobros/Ventanas'
import Armador from './contratos/Armador'
import { ListaContratos } from './contratos/Contratos'
import FormCliente from './FormCliente'
import EditorDocumento from './documentos/EditorDocumento'
import { TablaDocumentos } from './documentos/Documentos'
import FormProyecto from './FormProyecto'
import { costoYGanancia } from './gastos/PorCliente'
import { TablaProyectos } from './Proyectos'
import { useBorrarOArchivar } from './clientes/BorrarOArchivar'
import MenuMas from '../componentes/MenuMas'
import RegistrarPago from './pagos/RegistrarPago'
import { irAParte } from '../componentes/Pasos'
import HistorialPagos from './pagos/HistorialPagos'
import { TablaAnticipos, VentanaAnticipo } from './pagos/Anticipos'
import { saldoAFavor } from '../lib/anticipos'

export default function ClienteFicha() {
  const { id } = useParams()
  const m = useModelo()
  const hoy = useHoy()
  const cobros = useCobros()
  const [editar, setEditar] = useState(false)
  const [proyecto, setProyecto] = useState<Proyecto | 'nuevo' | null>(null)
  const [estado, setEstado] = useState(false)
  const [pagar, setPagar] = useState<Cobro | null>(null)
  const [extra, setExtra] = useState(false)
  const [armar, setArmar] = useState(false)
  const [nuevoDoc, setNuevoDoc] = useState(false)
  const [anticipo, setAnticipo] = useState(false)
  const [pagarVarios, setPagarVarios] = useState<Cobro[]>([])
  const esc = useEscribir()
  const avisar = useAvisar()
  const ir = useNavigate()
  const c = m.clientes.find((x) => x.id === id) ?? m.clientes.find((x) => id && x.aka?.includes(id))
  useEffect(() => { if (c && c.id !== id) ir(`/clientes/${encodeURIComponent(c.id)}`, { replace: true }) }, [c, id, ir])
  const bo = useBorrarOArchivar((borrados) => { if (c && borrados.includes(c.id)) ir('/clientes') })
  if (!c) return <div className="m-vacio m-tarjeta"><b>No se encontró el cliente</b><Link to="/clientes" className="c-enlace">Volver a Clientes</Link></div>

  const reactivar = async () => { await esc.archivarCliente(c.id, false); avisar(`${c.nombre} vuelve a estar activo.`, 'bien', { texto: 'Deshacer', hacer: async () => { await esc.archivarCliente(c.id, true) } }) }
  const propios = m.proyectos.filter((p) => p.cliente_id === c.id)
  const misCobros = cobros.filter((x) => x.cliente_id === c.id)
  const lista = pendientes(misCobros)
  const misPagos = m.pagos.filter((p) => p.cliente_id === c.id)
  const misAnticipos = m.anticipos.filter((a) => a.cliente_id === c.id)
  const aFavor = saldoAFavor(c.id, m.anticipos, m.pagos)
  const misGastos = m.gastos.filter((g) => g.cliente_id === c.id)
  const cg = costoYGanancia(m, c.id)
  const negocio = m.negocios.find((n) => n.id === c.negocio_id)
  const regimen = REGIMENES.find((r) => r.valor === regimenVigente(m.modos, hoy.slice(0, 7), c.negocio_id, c.id))?.nombre
  const datos: [string, string | null][] = [['Negocio', negocio?.nombre ?? ''], ['Rubro', c.rubro], ['WhatsApp', c.whatsapp], ['Correo', c.correo], ['NIT', c.nit], ['Dirección', c.direccion], ['Régimen', regimen ?? '']]

  return (
    <>
      <Link to="/clientes" className="c-volver"><ArrowLeft size={16} aria-hidden /> Clientes</Link>
      <div className="c-cabeza">
        <div>
          <span className="m-etiqueta">Cliente{c.rubro ? ` · ${c.rubro}` : ''}</span>
          <h1 className="erp-titulo">{c.nombre}{!c.activo && <span className="m-estado bloqueado">Inactivo</span>}{c.archivado && <span className="m-estado bloqueado">Archivado</span>}</h1><Pasos />
          <p className="c-subtitulo">Todo de este cliente: lo que te debe, lo que te ha pagado y sus proyectos.</p>
        </div>
        <div className="c-cabeza-acciones">
          <button type="button" className="m-btn m-btn-salida" onClick={() => setEstado(true)} title="Abre su estado de cuenta para mandarlo por WhatsApp, en PDF o como página web"><MessageCircle size={16} aria-hidden /> Estado de cuenta</button>
          {c.archivado
            ? <button type="button" className="m-btn m-btn-secundario" onClick={() => void reactivar()} title="Vuelve a mostrarlo en listas y selectores"><RotateCcw size={16} aria-hidden /> Reactivar</button>
            : <button type="button" className="m-btn m-btn-secundario c-btn-aparte" onClick={() => bo.pedir([c])} title={`${bo.titulo(c)}; pregunta antes y se puede deshacer`}><Trash2 size={16} aria-hidden /> Borrar o archivar</button>}
          <MenuMas items={[
            { texto: 'Agregar cobro', titulo: 'Le agrega un cobro: único, servicio, mensualidad adicional u otro', hacer: () => setExtra(true) },
            { texto: 'Registrar anticipo', titulo: 'Registra un pago adelantado que queda como su saldo a favor', hacer: () => setAnticipo(true) },
            { texto: 'Proyecto nuevo', titulo: 'Le asigna un proyecto nuevo', hacer: () => setProyecto('nuevo') },
            { texto: 'Contrato', titulo: 'Arma un contrato con sus datos', hacer: () => setArmar(true) },
            { texto: 'Documento', titulo: 'Arma una cotización, propuesta u hoja membretada', hacer: () => setNuevoDoc(true) },
          ]} />
          <RegistrarPago clienteFijo={c.id} />
        </div>
      </div>

      <div className="erp-kpis">
        <div className={`erp-kpi${lista.some((x) => x.estado === 'vencido') ? ' peligro' : ' aviso'}`}><span className="m-etiqueta">Me debe</span><b>{quetzales(totalSaldo(lista))}</b><small>{(() => { const n = lista.filter((x) => x.estado === 'vencido').length; return n ? `${n} ${n === 1 ? 'vencido' : 'vencidos'}` : 'nada vencido' })()}</small></div>
        <div className="erp-kpi exito"><span className="m-etiqueta">Me ha pagado</span><b>{quetzales(cg.ingresos)}</b><small>{misPagos.length} {misPagos.length === 1 ? 'pago' : 'pagos'}</small></div>
        <div className="erp-kpi"><span className="m-etiqueta">Saldo a favor</span><b>{quetzales(aFavor)}</b><small>de anticipos sin usar</small></div>
        <div className="erp-kpi"><span className="m-etiqueta">Ganancia</span><b className={`${cg.ganancia < 0 ? ' m-negativo' : ''}`}>{quetzales(cg.ganancia)}</b><small>pagado menos costo ({quetzales(cg.costo)})</small></div>
      </div>

      <nav className="c-indice" aria-label="Ir a una parte de la ficha">
        {([['f-datos', 'Datos'], ['f-debe', 'Lo que debe'], ['f-pagos', 'Pagos que hizo'], ['f-favor', 'Saldo a favor'], ['f-proyectos', 'Proyectos'], ['f-documentos', 'Documentos'], ['f-desarrollo', 'Desarrollo']] as [string, string][]).map(([id, t]) => (
          <button key={id} type="button" className="m-chip" onClick={() => irAParte(`#${id}`)} title={`Baja a «${t}»`}>{t}</button>
        ))}
      </nav>

      <section id="f-datos" className="m-tarjeta c-ficha">
        <div className="c-ficha-cabeza">
          <h2 className="m-seccion-titulo">Datos</h2>
          <button type="button" className="m-icono-btn" onClick={() => setEditar(true)} aria-label="Editar datos" title="Abre sus datos para corregirlos"><Pencil aria-hidden /></button>
        </div>
        <dl className="c-datos">
          {datos.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v || <span className="m-vacia">Sin anotar</span>}</dd></div>)}
        </dl>
        {c.notas && <p className="c-notas">{c.notas}</p>}
      </section>

      <section id="f-debe">
        <div className="c-ficha-cabeza">
          <h2 className="m-seccion-titulo">Lo que debe</h2>
          <button type="button" className="m-btn m-btn-secundario m-btn-sm" onClick={() => setExtra(true)} title="Le agrega un cobro: único, servicio, mensualidad adicional u otro"><Plus size={14} aria-hidden /> Agregar cobro</button>
        </div>
        <Tabla filas={lista} clave={(x) => x.clave} vacio="Está al día: no debe nada."
          masa={[{ texto: 'Registrar pago de las marcadas', titulo: (k) => `Abre una sola ventana para pagar juntos los ${k} cobros marcados, con forma, cuenta, comprobante y saldo a favor`, hacer: (l) => setPagarVarios(l) }]}
          columnas={[
            { titulo: 'Vence', valor: (x) => (x.vence ? fechaCorta(x.vence) : <span className="m-vacia">Sin fecha</span>) },
            { titulo: 'Cobro', principal: true, valor: (x) => <>{x.concepto}<small>{m.proyectos.find((p) => p.id === x.proyecto_id)?.nombre}</small></> },
            { titulo: 'Estado', valor: (x) => <EstadoCobro c={x} /> },
            { titulo: 'Falta', num: true, valor: (x) => quetzales(x.saldo) },
          ]}
          acciones={(x) => <button type="button" className="m-btn m-btn-secundario m-btn-sm" onClick={() => setPagar(x)} title="Registra lo que pagó de este cobro">Pago</button>}
          pie={lista.length > 0 ? <tr><td colSpan={3}>Total que debe</td><td className="m-num">{quetzales(totalSaldo(lista))}</td><td /></tr> : undefined} />
      </section>

      <div id="f-pagos"><HistorialPagos clienteId={c.id} /></div>

      <section id="f-favor">
        <div className="c-ficha-cabeza">
          <h2 className="m-seccion-titulo">Saldo a favor</h2>
          <button type="button" className="m-btn m-btn-secundario m-btn-sm" onClick={() => setAnticipo(true)} title="Registra un pago adelantado que queda como su saldo a favor"><Plus size={14} aria-hidden /> Registrar anticipo</button>
        </div>
        {misAnticipos.length ? <TablaAnticipos anticipos={misAnticipos} conCliente={false} /> : <div className="m-vacio c-vacio-chico"><b>Sin saldo a favor</b><span>Si te paga por adelantado, regístralo como anticipo.</span></div>}
      </section>

      <section id="f-proyectos">
        <div className="c-ficha-cabeza">
          <h2 className="m-seccion-titulo">Proyectos</h2>
          <button type="button" className="m-btn m-btn-secundario m-btn-sm" onClick={() => setProyecto('nuevo')} title="Le asigna un proyecto nuevo"><Plus size={14} aria-hidden /> Proyecto nuevo</button>
        </div>
        {propios.length === 0 ? <div className="m-vacio c-vacio-chico"><b>Aún no tiene proyectos</b><span>Asígnale uno con «Proyecto nuevo».</span></div> : <TablaProyectos proyectos={propios} conCliente={false} onEditar={setProyecto} />}
      </section>

      <section>
        <h2 className="m-seccion-titulo">Gastos hechos por este cliente</h2>
        <Tabla filas={misGastos} clave={(g) => g.id} vacio="No hay gastos ligados a este cliente. Márcalos en Gastos."
          columnas={[
            { titulo: 'Fecha', valor: (g) => fechaCorta(g.fecha) },
            { titulo: 'Descripción', principal: true, valor: (g) => g.descripcion },
            { titulo: 'Categoría', valor: (g) => m.categorias.find((x) => x.id === g.categoria_id)?.nombre ?? '' },
            { titulo: 'Monto', num: true, valor: (g) => quetzales(g.monto) },
          ]}
          acciones={(g) => (g.archivo ? <Ojito ruta={g.archivo} titulo={`Comprobante: ${g.descripcion}`} /> : null)} />
      </section>

      <section id="f-documentos">
        <div className="c-ficha-cabeza">
          <h2 className="m-seccion-titulo">Documentos</h2>
          <button type="button" className="m-btn m-btn-secundario m-btn-sm" onClick={() => setNuevoDoc(true)} title="Arma una cotización, propuesta u hoja membretada para este cliente"><Plus size={14} aria-hidden /> Documento</button>
        </div>
        <TablaDocumentos docs={m.documentos.filter((d) => d.cliente_id === c.id)} conCliente={false} />
        <h3 className="m-seccion-titulo">Contratos</h3>
        <ListaContratos contratos={m.contratos.filter((x) => x.cliente_id === c.id)} />
      </section>

      <section id="f-desarrollo">
        <h2 className="m-seccion-titulo">Desarrollo</h2>
        {propios.length === 0 ? <div className="m-vacio c-vacio-chico"><b>Sin proyectos</b></div> : (
          <ul className="c-lista-saldos">
            {propios.map((p) => <li key={p.id}><span>{p.nombre}<small> · bases, dominios, enlaces y cambios</small></span><Link to={`/proyectos/${p.id}?ver=desarrollo`} className="m-btn m-btn-secundario m-btn-sm" title="Abre la parte de desarrollo de este proyecto">Ver desarrollo</Link></li>)}
          </ul>
        )}
      </section>

      <FormCliente abierta={editar} cliente={c} onCerrar={() => setEditar(false)} />
      <EditorDocumento abierto={nuevoDoc} documento={null} clienteFijo={c.id} onCerrar={() => setNuevoDoc(false)} />
      {bo.ventana}
      <FormProyecto abierta={proyecto != null} proyecto={proyecto && proyecto !== 'nuevo' ? proyecto : null} clienteFijo={c.id} onCerrar={() => setProyecto(null)} />
      <VentanaEstadoCuenta cliente={estado ? c : null} cobros={misCobros} onCerrar={() => setEstado(false)} />
      <VentanaPago cobro={pagar} onCerrar={() => setPagar(null)} />
      <VentanaPago varios={pagarVarios} onCerrar={() => setPagarVarios([])} />
      <VentanaAnticipo abierta={anticipo} anticipo={null} clienteFijo={c.id} onCerrar={() => setAnticipo(false)} />
      <VentanaExtra abierta={extra} clienteFijo={c.id} onCerrar={() => setExtra(false)} />
      <Armador abierto={armar} clienteFijo={c.id} onCerrar={() => setArmar(false)} />
    </>
  )
}
