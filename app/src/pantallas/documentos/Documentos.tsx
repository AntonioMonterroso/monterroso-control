import Pasos from '../../componentes/Pasos'
import { Eye, FileDown, FileSignature, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import Buscador, { coincide } from '../../componentes/Buscador'
import Tabla from '../../componentes/Tabla'
import { numeroVisible, TIPOS_DOC, totalRenglones, type Documento, type TipoDocumento } from '../../lib/documentos'
import { quetzales } from '../../lib/dinero'
import { fechaCorta } from '../../lib/fechas'
import { AREAS } from '../../lib/marca'
import { useModelo } from '../../lib/modelo'
import { useQuitar } from '../../lib/quitar'
import Armador from '../contratos/Armador'
import EditorDocumento, { useHtmlDocumento, useImprimirDocumento } from './EditorDocumento'
import Ventana from '../../componentes/Ventana'
import { documentoHtml } from '../../lib/imprimir'

const ESTADOS: Record<Documento['estado'], [string, string]> = { borrador: ['Borrador', 'bloqueado'], enviado: ['Enviado', 'en-proceso'], aceptado: ['Aceptado', 'aprobado'], rechazado: ['Rechazado', 'error'] }

export function TablaDocumentos({ docs, conCliente = true }: { docs: Documento[]; conCliente?: boolean }) {
  const m = useModelo()
  const q = useQuitar()
  const imprimirDoc = useImprimirDocumento()
  const armar = useHtmlDocumento()
  const [ver, setVer] = useState<Documento | null>(null)
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
          { titulo: 'Estado', valor: (d) => <span className={`m-estado ${ESTADOS[d.estado][1]}`}>{ESTADOS[d.estado][0]}</span>, orden: (d) => d.estado },
        ]}
        acciones={(d) => (
          <>
            <button type="button" className="m-icono-btn c-ojito" onClick={() => setVer(d)} aria-label={`Ver ${d.titulo}`} title="Muestra el documento encima, sin salir de esta pantalla"><Eye aria-hidden /></button>
            <button type="button" className="m-icono-btn c-salida" onClick={() => imprimirDoc(d)} aria-label="PDF" title="Abre el PDF listo para enviar o guardar"><FileDown aria-hidden /></button>
            <button type="button" className="m-icono-btn" onClick={() => setEditar(d)} aria-label="Editar" title="Abre el documento para corregirlo, incluido su estado"><Pencil aria-hidden /></button>
            <button type="button" className="m-icono-btn" onClick={() => q.pedir('ctl_documentos', [d], `Se quita «${d.titulo}».`)} aria-label="Quitar" title="Quitar el documento (se puede deshacer)"><Trash2 aria-hidden /></button>
          </>
        )} />
      <EditorDocumento abierto={editar != null} documento={editar} onCerrar={() => setEditar(null)} />
      <Ventana abierta={ver != null} ancho="amplia" titulo={ver?.titulo ?? ''} subtitulo={ver ? `${TIPOS_DOC.find((t) => t.valor === ver.tipo)?.nombre ?? ''}${ver.numero ? ` · No. ${numeroVisible(ver)}` : ''}` : ''} onCerrar={() => setVer(null)}>
        {ver && <iframe className="c-visor" title={ver.titulo} srcDoc={(() => { const x = armar(ver); return documentoHtml(x.titulo, x.cuerpo, '', ver.area, '', false) })()} />}
      </Ventana>
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
        <div><span className="m-etiqueta">Dev Studio, Música y Diseño</span><h1 className="erp-titulo">Documentos</h1><Pasos /></div>
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
