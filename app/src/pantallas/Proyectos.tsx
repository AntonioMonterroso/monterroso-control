import type { ClaveEstudio } from '../lib/estudio'
import Pasos from '../componentes/Pasos'
import { Pencil, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Buscador, { coincide } from '../componentes/Buscador'
import Estado from '../componentes/Estado'
import Tabla from '../componentes/Tabla'
import { quetzales } from '../lib/dinero'
import { fechaCorta } from '../lib/fechas'
import { proximoCobro } from '../lib/mensualidad'
import { useModelo } from '../lib/modelo'
import { useHoy } from '../lib/usos'
import { ESTADOS, type EstadoProyecto, type Proyecto } from '../lib/tipos'
import FormProyecto from './FormProyecto'

export function TablaProyectos({ proyectos, conCliente, onEditar, buscador = true }: { proyectos: Proyecto[]; conCliente: boolean; onEditar: (p: Proyecto) => void; buscador?: boolean }) {
  const { clientes } = useModelo()
  const hoy = useHoy()
  const ir = useNavigate()
  const nombre = (id: string) => clientes.find((c) => c.id === id)?.nombre ?? ''
  return (
    <Tabla
      buscador={buscador}
      titulo={`${proyectos.length} ${proyectos.length === 1 ? 'proyecto' : 'proyectos'}`}
      filas={proyectos}
      clave={(p) => p.id}
      vacio="No hay proyectos con este filtro."
      onFila={(p) => ir(`/proyectos/${p.id}`)}
      columnas={[
        { titulo: 'Proyecto', principal: true, valor: (p) => <><Link to={`/proyectos/${p.id}`} className="c-enlace" onClick={(e) => e.stopPropagation()}>{p.nombre}</Link>{conCliente && <small><Link to={`/clientes/${encodeURIComponent(p.cliente_id ?? "")}`} className="c-enlace" onClick={(e) => e.stopPropagation()}>{nombre(p.cliente_id)}</Link></small>}</> },
        { titulo: 'Estado', valor: (p) => <Estado valor={p.estado} /> },
        { titulo: 'Inscripción', num: true, valor: (p) => (p.inscripcion_total ? <>{quetzales(p.inscripcion_total)}<small>{p.partes.length > 1 ? `${p.partes.length} partes` : p.partes.length === 1 ? '1 pago' : ''}</small></> : <span className="m-vacia">Sin inscripción</span>) },
        { titulo: 'Mensualidad', num: true, valor: (p) => (p.mensualidad ? <>{quetzales(p.mensualidad)}<small>día {p.dia_cobro}</small></> : <span className="m-vacia">Sin mensualidad</span>) },
        { titulo: 'Próximo cobro', valor: (p) => { const f = proximoCobro(p, hoy); return f ? fechaCorta(f) : <span className="m-vacia">—</span> } },
      ]}
      acciones={(p) => <button type="button" className="m-icono-btn" onClick={() => onEditar(p)} aria-label={`Editar ${p.nombre}`} title="Editar el proyecto"><Pencil aria-hidden /></button>}
    />
  )
}

export default function Proyectos({ negocioClave }: { negocioClave?: ClaveEstudio } = {}) {
  const { proyectos: todosProyectos, clientes: todosClientes, negocios } = useModelo()
  const fijo = negocioClave ? negocios.find((n) => n.clave === negocioClave) : undefined
  const clientes = fijo ? todosClientes.filter((c) => c.negocio_id === fijo.id) : todosClientes
  const proyectos = fijo ? todosProyectos.filter((p) => clientes.some((c) => c.id === p.cliente_id)) : todosProyectos
  const [q, setQ] = useState('')
  const [estado, setEstado] = useState<EstadoProyecto | 'abiertos' | 'todos'>('abiertos')
  const [editar, setEditar] = useState<Proyecto | 'nuevo' | null>(null)
  const nombre = (id: string) => clientes.find((c) => c.id === id)?.nombre ?? ''
  const lista = proyectos.filter((p) => (estado === 'todos' ? true : estado === 'abiertos' ? p.estado !== 'cerrado' : p.estado === estado)).filter((p) => coincide(q, p.nombre, nombre(p.cliente_id)))
  return (
    <>
      <div className="c-cabeza">
        <div><span className="m-etiqueta">{fijo?.nombre ?? 'Todos los negocios'}</span><h1 className="erp-titulo">Proyectos</h1><Pasos /></div>
        <button type="button" className="m-btn m-btn-primario" disabled={clientes.length === 0} onClick={() => setEditar('nuevo')} title={clientes.length ? 'Crear un proyecto para un cliente' : 'Primero crea un cliente'}><Plus size={16} aria-hidden /> Nuevo proyecto</button>
      </div>
      <div className="c-herramientas">
        <Buscador valor={q} onCambio={setQ} ayuda="Proyecto o cliente" />
        <div className="c-chips" role="group" aria-label="Filtrar por estado">
          <button type="button" className="m-chip" aria-pressed={estado === 'abiertos'} onClick={() => setEstado('abiertos')} title="Ver todos menos los cerrados">Abiertos</button>
          {ESTADOS.map((s) => <button key={s.valor} type="button" className="m-chip" aria-pressed={estado === s.valor} onClick={() => setEstado(s.valor)} title={`Ver ${s.nombre.toLowerCase()}`}>{s.nombre}</button>)}
          <button type="button" className="m-chip" aria-pressed={estado === 'todos'} onClick={() => setEstado('todos')} title="Ver todos">Todos</button>
        </div>
      </div>
      <TablaProyectos proyectos={lista} conCliente onEditar={setEditar} buscador={false} />
      <FormProyecto abierta={editar != null} proyecto={editar && editar !== 'nuevo' ? editar : null} onCerrar={() => setEditar(null)} />
    </>
  )
}
