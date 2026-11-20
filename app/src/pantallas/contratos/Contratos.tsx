import { Eye, FileDown, Pencil, PenLine, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import Buscador, { coincide } from '../../componentes/Buscador'
import FormRegistro from '../../componentes/FormRegistro'
import Pestanas from '../../componentes/Pestanas'
import Tabla from '../../componentes/Tabla'
import Ventana from '../../componentes/Ventana'
import { useDatos } from '../../lib/datos'
import { fechaCorta } from '../../lib/fechas'
import { useModelo } from '../../lib/modelo'
import { useHoy } from '../../lib/usos'
import type { Contrato, PlantillaContrato } from '../../lib/tipos'
import Armador from './Armador'
import { imprimirContrato } from './imprimir'
import EditorPlantilla from './Plantillas'

export function ListaContratos({ contratos }: { contratos: Contrato[] }) {
  const m = useModelo()
  const { guardar } = useDatos()
  const hoy = useHoy()
  const [ver, setVer] = useState<Contrato | null>(null)
  const [firmar, setFirmar] = useState<Contrato | null>(null)
  const cliente = (id: string) => m.clientes.find((c) => c.id === id)?.nombre ?? ''
  return (
    <>
      <Tabla
        buscador={false}
        titulo={`${contratos.length} contratos`}
        filas={contratos}
        clave={(x) => x.id}
        vacio="Todavía no hay contratos."
        columnas={[
          { titulo: 'Fecha', valor: (x) => fechaCorta(x.fecha) },
          { titulo: 'Contrato', principal: true, valor: (x) => <>{x.titulo}<small><Link to={`/clientes/${encodeURIComponent(x.cliente_id ?? "")}`} className="c-enlace">{cliente(x.cliente_id)}</Link></small></> },
          { titulo: 'Estado', valor: (x) => (x.fecha_firma ? <span className="m-estado aprobado">Firmado {fechaCorta(x.fecha_firma)}</span> : <span className="m-estado pendiente">Sin firmar</span>) },
        ]}
        acciones={(x) => (
          <>
            <button type="button" className="m-icono-btn c-ojito" onClick={() => setVer(x)} aria-label="Ver" title="Ver el contrato"><Eye aria-hidden /></button>
            <button type="button" className="m-icono-btn c-salida" onClick={() => imprimirContrato(x.titulo, x.contenido, 'El prestador', cliente(x.cliente_id))} aria-label="PDF" title="Abrir el contrato para guardarlo en PDF o imprimirlo"><FileDown aria-hidden /></button>
            <button type="button" className="m-icono-btn" onClick={() => setFirmar(x)} aria-label="Fecha de firma" title="Poner la fecha en que se firmó"><PenLine aria-hidden /></button>
          </>
        )}
      />
      <Ventana abierta={ver != null} ancho="amplia" titulo={ver?.titulo ?? ''} subtitulo={ver ? `Hecho el ${fechaCorta(ver.fecha)}` : ''} onCerrar={() => setVer(null)}>
        <div className="c-contrato-texto">{ver?.contenido.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}</div>
      </Ventana>
      <FormRegistro abierta={firmar != null} titulo="Fecha de firma" subtitulo={firmar?.titulo}
        campos={[{ k: 'fecha_firma', etiqueta: 'Se firmó el', tipo: 'fecha' }]}
        inicial={{ fecha_firma: firmar?.fecha_firma ?? hoy }}
        onGuardar={async (d) => { if (firmar) await guardar('ctl_contratos', firmar.id, d) }}
        onCerrar={() => setFirmar(null)} />
    </>
  )
}

export default function Contratos() {
  const m = useModelo()
  const [vista, setVista] = useState<'contratos' | 'plantillas'>('contratos')
  const [q, setQ] = useState('')
  const [armar, setArmar] = useState(false)
  const [plantilla, setPlantilla] = useState<PlantillaContrato | 'nueva' | null>(null)
  const lista = m.contratos.filter((c) => coincide(q, c.titulo, m.clientes.find((x) => x.id === c.cliente_id)?.nombre))
  return (
    <>
      <div className="c-cabeza">
        <div><span className="m-etiqueta">Dev Studio</span><h1 className="erp-titulo">Contratos</h1></div>
        <div className="c-cabeza-acciones">
          {vista === 'plantillas'
            ? <button type="button" className="m-btn m-btn-primario" onClick={() => setPlantilla('nueva')} title="Crear una plantilla de contrato"><Plus size={16} aria-hidden /> Nueva plantilla</button>
            : <button type="button" className="m-btn m-btn-primario" onClick={() => setArmar(true)} title="Armar un contrato con los datos de un cliente"><Plus size={16} aria-hidden /> Armar contrato</button>}
        </div>
      </div>
      <Pestanas etiqueta="Ver" valor={vista} onCambio={setVista} opciones={[{ valor: 'contratos', nombre: 'Contratos', cuenta: m.contratos.length }, { valor: 'plantillas', nombre: 'Plantillas', cuenta: m.plantillas.length }]} />
      {vista === 'contratos' ? (
        <>
          <div className="c-herramientas"><Buscador valor={q} onCambio={setQ} ayuda="Cliente o título" /></div>
          <ListaContratos contratos={lista} />
        </>
      ) : (
        <Tabla
          buscador={false}
          titulo="Plantillas"
          nota="La plantilla base es un punto de partida: revísala con tu abogado antes de usarla."
          filas={m.plantillas}
          clave={(x) => x.id}
          vacio="Sin plantillas."
          columnas={[
            { titulo: 'Nombre', principal: true, valor: (x) => x.nombre },
            { titulo: 'Cláusulas', num: true, valor: (x) => x.clausulas.length },
          ]}
          acciones={(x) => <button type="button" className="m-icono-btn" onClick={() => setPlantilla(x)} aria-label="Editar" title="Editar la plantilla"><Pencil aria-hidden /></button>}
        />
      )}
      <Armador abierto={armar} onCerrar={() => setArmar(false)} />
      <EditorPlantilla plantilla={plantilla} onCerrar={() => setPlantilla(null)} />
    </>
  )
}
