import RegistrarPago from './pagos/RegistrarPago'
import HistorialPagos from './pagos/HistorialPagos'
import Pasos from '../componentes/Pasos'
import { ArrowLeft, Pencil } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import Estado from '../componentes/Estado'
import Pestanas from '../componentes/Pestanas'
import Tabla from '../componentes/Tabla'
import { aCentavos, deCentavos, quetzales } from '../lib/dinero'
import { fechaCorta } from '../lib/fechas'
import { textoMomento } from '../lib/inscripcion'
import { proximoCobro } from '../lib/mensualidad'
import { useModelo } from '../lib/modelo'
import { useAvisosDev, useCobros, useHoy } from '../lib/usos'
import { EstadoCobro } from './cobros/Cobros'
import ParaNoOlvidar from './desarrollo/ParaNoOlvidar'
import { SeccionBitacora, SeccionEnlaces, SeccionServicios, SeccionSupabase, SeccionTokens } from './desarrollo/Secciones'
import FormProyecto from './FormProyecto'

export default function ProyectoFicha() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const m = useModelo()
  const hoy = useHoy()
  const cobros = useCobros()
  const avisos = useAvisosDev()
  const [vista, setVista] = useState<'resumen' | 'desarrollo'>(params.get('ver') === 'desarrollo' ? 'desarrollo' : 'resumen')
  const [editar, setEditar] = useState(false)
  const p = m.proyectos.find((x) => x.id === id)
  if (!p) return <div className="m-vacio m-tarjeta"><b>No se encontró el proyecto</b><Link to="/proyectos" className="c-enlace">Volver a Proyectos</Link></div>
  const c = m.clientes.find((x) => x.id === p.cliente_id)
  const propios = cobros.filter((x) => x.proyecto_id === p.id)
  const pagado = deCentavos(m.pagos.filter((x) => propios.some((y) => y.clave === x.cobro_clave)).reduce((s, x) => s + aCentavos(x.monto), 0))
  const pendiente = deCentavos(propios.filter((x) => x.estado === 'por_cobrar' || x.estado === 'vencido').reduce((s, x) => s + aCentavos(x.saldo), 0))
  const costo = deCentavos(m.gastos.filter((g) => g.proyecto_id === p.id).reduce((s, g) => s + aCentavos(g.monto), 0))
  const prox = proximoCobro(p, hoy)
  const fp = { proyectoId: p.id }
  const nAv = avisos.filter((a) => a.proyecto_id === p.id).length
  return (
    <>
      <Link to={c ? `/clientes/${encodeURIComponent(c.id ?? "")}` : '/proyectos'} className="c-volver"><ArrowLeft size={16} aria-hidden /> {c?.nombre ?? 'Proyectos'}</Link>
      <div className="c-cabeza">
        <div><span className="m-etiqueta">Proyecto</span><h1 className="erp-titulo">{p.nombre}<Estado valor={p.estado} /></h1><Pasos /></div>
        <div className="c-cabeza-acciones">
          <button type="button" className="m-btn m-btn-secundario" onClick={() => setEditar(true)} title="Abre el proyecto para corregir su inscripción, su mensualidad y sus fechas"><Pencil size={16} aria-hidden /> Editar</button>
          <RegistrarPago proyectoFijo={p.id} />
        </div>
      </div>
      <Pestanas etiqueta="Ver" valor={vista} onCambio={setVista} opciones={[{ valor: 'resumen', nombre: 'Resumen' }, { valor: 'desarrollo', nombre: 'Desarrollo', cuenta: nAv || undefined }]} />
      {vista === 'resumen' ? (
        <>
          <div className="erp-kpis">
            <div className="erp-kpi"><span className="m-etiqueta">Inscripción</span><b>{quetzales(p.inscripcion_total)}</b><small>{p.partes.map((x) => textoMomento(x).toLowerCase()).join(' · ') || 'sin inscripción'}</small></div>
            <div className="erp-kpi"><span className="m-etiqueta">Mensualidad</span><b>{quetzales(p.mensualidad)}</b><small>{prox ? `próximo cobro ${fechaCorta(prox)}` : 'sin cobro próximo'}</small></div>
            <div className="erp-kpi"><span className="m-etiqueta">Ha pagado</span><b>{quetzales(pagado)}</b><small>falta {quetzales(pendiente)}</small></div>
            <div className="erp-kpi"><span className="m-etiqueta">Costo</span><b>{quetzales(costo)}</b><small>gastos del proyecto</small></div>
          </div>
          {p.descripcion && <p className="c-notas">{p.descripcion}</p>}
          <section>
            <h2 className="m-seccion-titulo">Lo que debe de este proyecto</h2>
            <Tabla filas={propios} clave={(x) => x.clave} vacio={p.estado === 'propuesta' ? 'Mientras sea propuesta no genera cobros.' : 'Sin cobros.'}
              columnas={[
                { titulo: 'Vence', valor: (x) => (x.vence ? fechaCorta(x.vence) : 'Sin fecha'), orden: (x) => x.vence ?? '9999' },
                { titulo: 'Concepto', principal: true, valor: (x) => x.concepto },
                { titulo: 'Estado', valor: (x) => <EstadoCobro c={x} /> },
                { titulo: 'Monto', num: true, valor: (x) => quetzales(x.monto), orden: (x) => x.monto },
                { titulo: 'Falta', num: true, valor: (x) => quetzales(x.saldo), orden: (x) => x.saldo },
              ]} />
          </section>
          <HistorialPagos proyectoId={p.id} />
        </>
      ) : (
        <>
          <ParaNoOlvidar proyectoId={p.id} />
          <SeccionSupabase f={fp} />
          <SeccionEnlaces f={fp} />
          <SeccionServicios f={fp} />
          <SeccionTokens f={fp} />
          <SeccionBitacora proyectoId={p.id} />
        </>
      )}
      <FormProyecto abierta={editar} proyecto={p} onCerrar={() => setEditar(false)} />
    </>
  )
}
