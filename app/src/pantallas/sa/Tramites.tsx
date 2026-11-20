import { ListPlus, Pencil, Plus, Receipt, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useAvisar } from '../../componentes/Avisos'
import FormRegistro from '../../componentes/FormRegistro'
import Ojito from '../../componentes/Ojito'
import Tabla from '../../componentes/Tabla'
import { useDatos } from '../../lib/datos'
import { aCentavos, deCentavos, quetzales } from '../../lib/dinero'
import { fechaCorta } from '../../lib/fechas'
import { useQuitar } from '../../lib/quitar'
import { TRAMITES_BASE, type Tramite } from '../../lib/sa'
import { useSA } from '../../lib/saModelo'
import { useHoy } from '../../lib/usos'

const ESTADOS: Record<Tramite['estado'], [string, string]> = { pendiente: ['Pendiente', 'pendiente'], en_proceso: ['En proceso', 'en-proceso'], hecho: ['Hecho', 'aprobado'], no_aplica: ['No aplica', 'bloqueado'] }

export default function TramitesSA() {
  const { m } = useSA()
  const { guardar, insertar } = useDatos()
  const avisar = useAvisar()
  const hoy = useHoy()
  const q = useQuitar()
  const [editar, setEditar] = useState<Tramite | 'nuevo' | null>(null)
  const t = editar && editar !== 'nuevo' ? editar : null
  const total = deCentavos(m.tramites.reduce((s, x) => s + aCentavos(x.costo), 0))
  const hechos = m.tramites.filter((x) => x.estado === 'hecho' || x.estado === 'no_aplica').length
  const neg = m.negocios.find((n) => n.clave === 'sa')
  const cat = m.categorias.find((c) => c.clave === 'constitucion')
  const registrarGasto = async (x: Tramite) => {
    if (!neg || !cat) { avisar('Falta el negocio de la sociedad o la categoría «Gastos de constitución». Revisa que la migración nueva esté corrida.', 'error'); return }
    const [g] = await insertar('ctl_gastos', [{ fecha: x.fecha ?? hoy, negocio_id: neg.id, categoria_id: cat.id, descripcion: `Constitución: ${x.nombre}`.slice(0, 300), monto: x.costo }])
    await guardar('ctl_sa_tramites', x.id, { gasto_id: g.id })
    avisar(`Gasto de constitución registrado por ${quetzales(x.costo)}.`)
  }
  return (
    <>
      <div className="c-cabeza">
        <div><span className="m-etiqueta">Sociedad anónima</span><h1 className="erp-titulo">Trámites de constitución</h1></div>
        <div className="c-cabeza-acciones">
          {m.tramites.length === 0 && <button type="button" className="m-btn m-btn-secundario" onClick={() => void insertar('ctl_sa_tramites', TRAMITES_BASE.map((x) => ({ ...x, estado: 'pendiente', costo: 0 })))} title="Agregar la lista de pasos para constituir una sociedad anónima en Guatemala"><ListPlus size={16} aria-hidden /> Agregar los pasos de Guatemala</button>}
          <button type="button" className="m-btn m-btn-primario" onClick={() => setEditar('nuevo')} title="Agregar un paso propio"><Plus size={16} aria-hidden /> Paso</button>
        </div>
      </div>
      <div className="erp-kpis">
        <div className="erp-kpi"><span className="m-etiqueta">Avance</span><b>{hechos} de {m.tramites.length}</b><small>pasos hechos o que no aplican</small></div>
        <div className="erp-kpi"><span className="m-etiqueta">Costo de constitución</span><b>{quetzales(total)}</b><small>{m.tramites.filter((x) => x.gasto_id).length} ya registrados en Gastos</small></div>
      </div>
      <Tabla filas={m.tramites} clave={(x) => x.id} vacio="Sin pasos. Agrega los pasos de Guatemala o uno propio."
        quitarVarias={(l) => q.pedir('ctl_sa_tramites', l, `Se quitan ${l.length} pasos.`)}
        columnas={[
          { titulo: 'Paso', principal: true, valor: (x) => <>{x.nombre}{x.detalle && <small>{x.detalle}</small>}</>, orden: (x) => x.orden },
          { titulo: 'Estado', valor: (x) => <span className={`m-estado ${ESTADOS[x.estado][1]}`}>{ESTADOS[x.estado][0]}</span>, orden: (x) => ['pendiente', 'en_proceso', 'hecho', 'no_aplica'].indexOf(x.estado) },
          { titulo: 'Fecha', valor: (x) => (x.fecha ? fechaCorta(x.fecha) : <span className="m-vacia">—</span>), orden: (x) => x.fecha ?? '' },
          { titulo: 'Responsable', valor: (x) => x.responsable ?? <span className="m-vacia">—</span> },
          { titulo: 'Costo', num: true, valor: (x) => quetzales(x.costo), orden: (x) => x.costo },
        ]}
        acciones={(x) => (
          <>
            <Ojito ruta={x.archivo} titulo={x.nombre} />
            {x.costo > 0 && !x.gasto_id && <button type="button" className="m-btn m-btn-secundario m-btn-sm" onClick={() => void registrarGasto(x)} title="Registrarlo en Gastos como gasto de constitución de la sociedad"><Receipt size={14} aria-hidden /> Gasto</button>}
            <button type="button" className="m-icono-btn" onClick={() => setEditar(x)} aria-label="Editar" title="Editar el paso"><Pencil aria-hidden /></button>
            <button type="button" className="m-icono-btn" onClick={() => q.pedir('ctl_sa_tramites', [x], `Se quita «${x.nombre}».`)} aria-label="Quitar" title="Quitar el paso (se puede deshacer)"><Trash2 aria-hidden /></button>
          </>
        )}
        pie={<tr><td colSpan={4}>Total</td><td className="m-num">{quetzales(total)}</td><td /></tr>} />
      <FormRegistro abierta={editar != null} titulo={t ? 'Editar paso' : 'Nuevo paso'} carpeta="sociedad"
        campos={[
          { k: 'nombre', etiqueta: 'Paso', tipo: 'texto', requerido: true, max: 200, ancho: true },
          { k: 'estado', etiqueta: 'Estado', tipo: 'select', requerido: true, opciones: Object.entries(ESTADOS).map(([valor, [nombre]]) => ({ valor, nombre })) },
          { k: 'fecha', etiqueta: 'Fecha', tipo: 'fecha' },
          { k: 'costo', etiqueta: 'Costo', tipo: 'monto', requerido: true },
          { k: 'responsable', etiqueta: 'Responsable', tipo: 'texto', max: 120 },
          { k: 'orden', etiqueta: 'Orden', tipo: 'numero', min: 0, max: 999 },
          { k: 'detalle', etiqueta: 'Detalle', tipo: 'area', max: 1000 },
          { k: 'archivo', etiqueta: 'Documento (PDF o foto)', tipo: 'archivo', ancho: true },
        ]}
        inicial={t ? { ...t, costo: t.costo.toFixed(2) } : { estado: 'pendiente', costo: '0', orden: (m.tramites.at(-1)?.orden ?? 0) + 1 }}
        onGuardar={async (x) => { await guardar('ctl_sa_tramites', t?.id ?? null, { ...x, orden: x.orden ?? 50 }) }}
        onCerrar={() => setEditar(null)} />
      {q.ventana}
    </>
  )
}
