import { FileDown, FileSignature, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import Buscador, { coincide } from '../../componentes/Buscador'
import Tabla from '../../componentes/Tabla'
import { useDatos } from '../../lib/datos'
import { numeroVisible, TIPOS_DOC, totalRenglones, type Documento, type TipoDocumento } from '../../lib/documentos'
import { quetzales } from '../../lib/dinero'
import { fechaCorta } from '../../lib/fechas'
import { AREAS } from '../../lib/marca'
import { useModelo } from '../../lib/modelo'
import { useQuitar } from '../../lib/quitar'
import Armador from '../contratos/Armador'
import EditorDocumento, { useImprimirDocumento } from './EditorDocumento'

const ESTADOS: Record<Documento['estado'], [string, string]> = { borrador: ['Borrador', 'bloqueado'], enviado: ['Enviado', 'en-proceso'], aceptado: ['Aceptado', 'aprobado'], rechazado: ['Rechazado', 'error'] }

export function TablaDocumentos({ docs, conCliente = true }: { docs: Documento[]; conCliente?: boolean }) {
  const m = useModelo()
  const { guardar } = useDatos()
  const q = useQuitar()
  const imprimirDoc = useImprimirDocumento()
  const [editar, setEditar] = useState<Documento | null>(null)
  const nombre = (k: string | null) => m.clientes.find((c) => c.id === k)?.nombre ?? ''
  return (
    <>
      <Tabla filas={docs} clave={(d) => d.id} vacio="Sin documentos." buscador={conCliente ? false : true}
        quitarVarias={(l) => q.pedir('ctl_documentos', l, `Se quitan ${l.length} documentos.`)}
        columnas={[
          { titulo: 'Fecha', valor: (d) => fechaCorta(d.fecha), orden: (d) => d.fecha },
          { titulo: 'Documento', principal: true, valor: (d) => <>{d.titulo}<small>{TIPOS_DOC.find((t) => t.valor === d.tipo)?.nombre}{d.numero ? ` · No. ${numeroVisible(d)}` : ''} · {AREAS.find((a) => a.valor === d.area)?.nombre}</small></> },
          { titulo: 'Cliente', oculto: !conCliente, valor: (d) => (d.cliente_id ? <Link to={`/clientes/${encodeURIComponent(d.cliente_id)}`} className="c-enlace" onClick={(e) => e.stopPropagation()}>{nombre(d.cliente_id)}</Link> : <span className="m-vacia">—</span>) },
          { titulo: 'Total', num: true, valor: (d) => (d.tipo === 'cotizacion' ? quetzales(totalRenglones(d.datos.renglones ?? [])) : d.tipo === 'propuesta' && (d.datos.inscripcion || d.datos.mensualidad) ? quetzales(d.datos.inscripcion ?? 0) : <span className="m-vacia">—</span>) },
          { titulo: 'Estado', valor: (d) => <select className="m-entrada c-select-chico" value={d.estado} onClick={(e) => e.stopPropagation()} onChange={(e) => void guardar('ctl_documentos', d.id, { estado: e.target.value })} aria-label="Estado del documento" title="Cambiar el estado">{Object.entries(ESTADOS).map(([k, [n]]) => <option key={k} value={k}>{n}</option>)}</select>, orden: (d) => d.estado },
        ]}
        acciones={(d) => (
          <>
            <button type="button" className="m-icono-btn c-salida" onClick={() => imprimirDoc(d)} aria-label="PDF" title="Abrir el PDF listo para enviar"><FileDown aria-hidden /></button>
            <button type="button" className="m-icono-btn" onClick={() => setEditar(d)} aria-label="Editar" title="Editar el documento"><Pencil aria-hidden /></button>
            <button type="button" className="m-icono-btn" onClick={() => q.pedir('ctl_documentos', [d], `Se quita «${d.titulo}».`)} aria-label="Quitar" title="Quitar el documento (se puede deshacer)"><Trash2 aria-hidden /></button>
          </>
        )} />
      <EditorDocumento abierto={editar != null} documento={editar} onCerrar={() => setEditar(null)} />
      {q.ventana}
    </>
  )
}

export default function Documentos() {
  const m = useModelo()
  const [q, setQ] = useState('')
  const [tipo, setTipo] = useState<TipoDocumento | ''>('')
  const [nuevo, setNuevo] = useState<TipoDocumento | null>(null)
  const [armar, setArmar] = useState(false)
  const lista = m.documentos.filter((d) => (!tipo || d.tipo === tipo) && coincide(q, d.titulo, m.clientes.find((c) => c.id === d.cliente_id)?.nombre, numeroVisible(d)))
  return (
    <>
      <div className="c-cabeza">
        <div><span className="m-etiqueta">Dev Studio, Música y Diseño</span><h1 className="erp-titulo">Documentos</h1></div>
        <div className="c-cabeza-acciones">
          <button type="button" className="m-btn m-btn-secundario" onClick={() => setArmar(true)} title="Armar el acuerdo de servicios (contrato) con la plantilla"><FileSignature size={16} aria-hidden /> Acuerdo de servicios</button>
          <button type="button" className="m-btn m-btn-secundario" onClick={() => setNuevo('propuesta')} title="Armar una propuesta comercial"><Plus size={16} aria-hidden /> Propuesta</button>
          <button type="button" className="m-btn m-btn-secundario" onClick={() => setNuevo('membretada')} title="Escribir una carta en hoja membretada"><Plus size={16} aria-hidden /> Hoja membretada</button>
          <button type="button" className="m-btn m-btn-primario" onClick={() => setNuevo('cotizacion')} title="Armar una cotización con número correlativo del año"><Plus size={16} aria-hidden /> Cotización</button>
        </div>
      </div>
      <div className="c-herramientas">
        <Buscador valor={q} onCambio={setQ} ayuda="Título, cliente o número" />
        <div className="c-chips" role="group" aria-label="Tipo">
          <button type="button" className="m-chip" aria-pressed={!tipo} onClick={() => setTipo('')} title="Ver todos">Todos</button>
          {TIPOS_DOC.filter((t) => t.valor !== 'acuerdo').map((t) => <button key={t.valor} type="button" className="m-chip" aria-pressed={tipo === t.valor} onClick={() => setTipo(t.valor)} title={`Ver ${t.nombre.toLowerCase()}`}>{t.nombre}</button>)}
        </div>
      </div>
      <TablaDocumentos docs={lista} />
      <p className="m-texto-suave">Los acuerdos de servicios se guardan en <Link to="/contratos" className="c-enlace">Contratos</Link> y en la ficha de cada cliente.</p>
      <EditorDocumento abierto={nuevo != null} documento={null} tipoInicial={nuevo ?? undefined} onCerrar={() => setNuevo(null)} />
      <Armador abierto={armar} onCerrar={() => setArmar(false)} />
    </>
  )
}
