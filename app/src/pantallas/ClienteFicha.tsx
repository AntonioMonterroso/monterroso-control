import { ArrowLeft, FileSignature, MessageCircle, Pencil, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Tabla from '../componentes/Tabla'
import { conceptoDePago, pendientes, totalSaldo, type Cobro } from '../lib/cobros'
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
import FormProyecto from './FormProyecto'
import { costoYGanancia } from './gastos/PorCliente'
import { TablaProyectos } from './Proyectos'

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
  const ir = useNavigate()
  const c = m.clientes.find((x) => x.id === id) ?? m.clientes.find((x) => id && x.aka?.includes(id))
  useEffect(() => { if (c && c.id !== id) ir(`/clientes/${encodeURIComponent(c.id)}`, { replace: true }) }, [c, id, ir])
  if (!c) return <div className="m-vacio m-tarjeta"><b>No se encontró el cliente</b><Link to="/clientes" className="c-enlace">Volver a Clientes</Link></div>

  const propios = m.proyectos.filter((p) => p.cliente_id === c.id)
  const misCobros = cobros.filter((x) => x.cliente_id === c.id)
  const lista = pendientes(misCobros)
  const misPagos = m.pagos.filter((p) => p.cliente_id === c.id)
  const misGastos = m.gastos.filter((g) => g.cliente_id === c.id)
  const cg = costoYGanancia(m, c.id)
  const negocio = m.negocios.find((n) => n.id === c.negocio_id)
  const regimen = REGIMENES.find((r) => r.valor === regimenVigente(m.modos, hoy.slice(0, 7), c.negocio_id, c.id))?.nombre
  const concepto = (clave: string) => conceptoDePago(clave, cobros)
  const datos: [string, string | null][] = [['Negocio', negocio?.nombre ?? ''], ['Rubro', c.rubro], ['WhatsApp', c.whatsapp], ['Correo', c.correo], ['NIT', c.nit], ['Dirección', c.direccion], ['Régimen', regimen ?? '']]

  return (
    <>
      <Link to="/clientes" className="c-volver"><ArrowLeft size={16} aria-hidden /> Clientes</Link>
      <div className="c-cabeza">
        <div>
          <span className="m-etiqueta">{c.rubro || 'Cliente'}</span>
          <h1 className="erp-titulo">{c.nombre}{!c.activo && <span className="m-estado bloqueado">Inactivo</span>}</h1>
        </div>
        <div className="c-cabeza-acciones">
          <button type="button" className="m-btn m-btn-secundario" onClick={() => setEstado(true)} title="Ver lo pendiente y mandarlo por WhatsApp o PDF"><MessageCircle size={16} aria-hidden /> Estado de cuenta</button>
          <button type="button" className="m-btn m-btn-secundario" onClick={() => setArmar(true)} title="Armar un contrato con los datos de este cliente"><FileSignature size={16} aria-hidden /> Contrato</button>
          <button type="button" className="m-btn m-btn-primario" onClick={() => setProyecto('nuevo')} title="Asignarle un proyecto nuevo"><Plus size={16} aria-hidden /> Proyecto</button>
        </div>
      </div>

      <div className="erp-kpis">
        <div className="erp-kpi aviso"><span className="m-etiqueta">Pendiente</span><b>{quetzales(totalSaldo(lista))}</b><small>{(() => { const n = lista.filter((x) => x.estado === 'vencido').length; return `${n} ${n === 1 ? 'vencido' : 'vencidos'}` })()}</small></div>
        <div className="erp-kpi exito"><span className="m-etiqueta">Pagado</span><b>{quetzales(cg.ingresos)}</b><small>{misPagos.length} {misPagos.length === 1 ? 'pago' : 'pagos'}</small></div>
        <div className="erp-kpi peligro"><span className="m-etiqueta">Costo</span><b>{quetzales(cg.costo)}</b><small>{misGastos.length} {misGastos.length === 1 ? 'gasto del cliente' : 'gastos del cliente'}</small></div>
        <div className="erp-kpi"><span className="m-etiqueta">Ganancia</span><b className={`${cg.ganancia < 0 ? ' m-negativo' : ''}`}>{quetzales(cg.ganancia)}</b><small>pagado menos costo</small></div>
      </div>

      <section className="m-tarjeta c-ficha">
        <div className="c-ficha-cabeza">
          <h2 className="m-seccion-titulo">Datos</h2>
          <button type="button" className="m-icono-btn" onClick={() => setEditar(true)} aria-label="Editar datos" title="Editar los datos del cliente"><Pencil aria-hidden /></button>
        </div>
        <dl className="c-datos">
          {datos.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v || <span className="m-vacia">Sin anotar</span>}</dd></div>)}
        </dl>
        {c.notas && <p className="c-notas">{c.notas}</p>}
      </section>

      <section>
        <h2 className="m-seccion-titulo">Proyectos</h2>
        {propios.length === 0 ? <div className="m-vacio c-vacio-chico"><b>Aún no tiene proyectos</b><span>Asígnale uno con «Proyecto».</span></div> : <TablaProyectos proyectos={propios} conCliente={false} onEditar={setProyecto} />}
      </section>

      <section>
        <div className="c-ficha-cabeza">
          <h2 className="m-seccion-titulo">Lo que debe</h2>
          <button type="button" className="m-btn m-btn-secundario m-btn-sm" onClick={() => setExtra(true)} title="Agregar un cobro extra a este cliente"><Plus size={14} aria-hidden /> Cobro extra</button>
        </div>
        <Tabla filas={lista} clave={(x) => x.clave} vacio="Está al día."
          columnas={[
            { titulo: 'Vence', valor: (x) => (x.vence ? fechaCorta(x.vence) : <span className="m-vacia">Sin fecha</span>) },
            { titulo: 'Concepto', principal: true, valor: (x) => <>{x.concepto}<small>{m.proyectos.find((p) => p.id === x.proyecto_id)?.nombre}</small></> },
            { titulo: 'Estado', valor: (x) => <EstadoCobro c={x} /> },
            { titulo: 'Pendiente', num: true, valor: (x) => quetzales(x.saldo) },
          ]}
          acciones={(x) => <button type="button" className="m-btn m-btn-primario m-btn-sm" onClick={() => setPagar(x)} title="Registrar lo que pagó">Pago</button>} />
      </section>

      <section>
        <h2 className="m-seccion-titulo">Pagos recibidos</h2>
        <Tabla filas={misPagos} clave={(p) => p.id} vacio="Todavía no hay pagos."
          columnas={[
            { titulo: 'Fecha', valor: (p) => fechaCorta(p.fecha) },
            { titulo: 'Concepto', principal: true, valor: (p) => concepto(p.cobro_clave) },
            { titulo: 'Cuenta', valor: (p) => p.cuenta },
            { titulo: 'Monto', num: true, valor: (p) => quetzales(p.monto) },
          ]} />
      </section>

      <section>
        <h2 className="m-seccion-titulo">Gastos del cliente</h2>
        <Tabla filas={misGastos} clave={(g) => g.id} vacio="No hay gastos ligados a este cliente. Márcalos en Gastos."
          columnas={[
            { titulo: 'Fecha', valor: (g) => fechaCorta(g.fecha) },
            { titulo: 'Descripción', principal: true, valor: (g) => g.descripcion },
            { titulo: 'Categoría', valor: (g) => m.categorias.find((x) => x.id === g.categoria_id)?.nombre ?? '' },
            { titulo: 'Monto', num: true, valor: (g) => quetzales(g.monto) },
          ]} />
      </section>

      <section>
        <h2 className="m-seccion-titulo">Contratos</h2>
        <ListaContratos contratos={m.contratos.filter((x) => x.cliente_id === c.id)} />
      </section>

      <FormCliente abierta={editar} cliente={c} onCerrar={() => setEditar(false)} />
      <FormProyecto abierta={proyecto != null} proyecto={proyecto && proyecto !== 'nuevo' ? proyecto : null} clienteFijo={c.id} onCerrar={() => setProyecto(null)} />
      <VentanaEstadoCuenta cliente={estado ? c : null} cobros={misCobros} onCerrar={() => setEstado(false)} />
      <VentanaPago cobro={pagar} onCerrar={() => setPagar(null)} />
      <VentanaExtra abierta={extra} clienteFijo={c.id} onCerrar={() => setExtra(false)} />
      <Armador abierto={armar} clienteFijo={c.id} onCerrar={() => setArmar(false)} />
    </>
  )
}
