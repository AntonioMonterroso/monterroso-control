import { Pencil, Plus, RotateCcw } from 'lucide-react'
import { useAvisar } from '../componentes/Avisos'
import { useEscribir } from '../lib/escribir'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Tabla from '../componentes/Tabla'
import Buscador, { coincide } from '../componentes/Buscador'
import { useModelo } from '../lib/modelo'
import { quetzales } from '../lib/dinero'
import { cobraMensualidad } from '../lib/mensualidad'
import type { Cliente } from '../lib/tipos'
import FormCliente from './FormCliente'

type Filtro = 'activos' | 'todos' | 'inactivos' | 'archivados'

export default function Clientes() {
  const { clientes, proyectos, negocios } = useModelo()
  const ir = useNavigate()
  const esc = useEscribir()
  const avisar = useAvisar()
  const reactivar = async (c: Cliente) => { await esc.archivarCliente(c.id, false); avisar(`${c.nombre} vuelve a estar activo.`, 'bien', { texto: 'Deshacer', hacer: async () => { await esc.archivarCliente(c.id, true) } }) }
  const [q, setQ] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('activos')
  const [editar, setEditar] = useState<Cliente | null>(null)
  const [nuevo, setNuevo] = useState(false)

  const lista = clientes
    .filter((c) => (filtro === 'archivados' ? c.archivado : !c.archivado && (filtro === 'todos' ? true : filtro === 'activos' ? c.activo : !c.activo)))
    .filter((c) => coincide(q, c.nombre, c.nit, c.whatsapp, c.correo, c.rubro))
  const deCliente = (id: string) => proyectos.filter((p) => p.cliente_id === id)
  const mensual = (id: string) => deCliente(id).filter(cobraMensualidad).reduce((s, p) => s + Math.round(p.mensualidad * 100), 0) / 100
  const negocio = (id: string) => negocios.find((n) => n.id === id)?.nombre ?? ''

  return (
    <>
      <div className="c-cabeza">
        <div>
          <span className="m-etiqueta">Dev Studio</span>
          <h1 className="erp-titulo">Clientes</h1>
        </div>
        <button type="button" className="m-btn m-btn-primario" onClick={() => setNuevo(true)} title="Crear un cliente nuevo"><Plus size={16} aria-hidden /> Nuevo cliente</button>
      </div>

      <div className="c-herramientas">
        <Buscador valor={q} onCambio={setQ} ayuda="Nombre, NIT, teléfono o correo" />
        <div className="c-chips" role="group" aria-label="Filtrar clientes">
          {(['activos', 'todos', 'inactivos', 'archivados'] as Filtro[]).map((f) => (
            <button key={f} type="button" className="m-chip" aria-pressed={filtro === f} onClick={() => setFiltro(f)} title={`Ver ${f === 'todos' ? 'todos los clientes' : `los clientes ${f}`}`}>{f[0].toUpperCase() + f.slice(1)}</button>
          ))}
        </div>
      </div>

      {clientes.length === 0 ? (
        <div className="m-vacio m-tarjeta">
          <b>Todavía no hay clientes</b>
          <span>Crea el primero con «Nuevo cliente».</span>
        </div>
      ) : (
        <Tabla
          buscador={false}
          titulo={`${lista.length} ${lista.length === 1 ? 'cliente' : 'clientes'}`}
          nota="Toca un cliente para ver su ficha"
          filas={lista}
          clave={(c) => c.id}
          vacio="Ningún cliente coincide con la búsqueda."
          onFila={(c) => ir(`/clientes/${encodeURIComponent(c.id ?? "")}`)}
          columnas={[
            { titulo: 'Cliente', principal: true, valor: (c) => <><Link to={`/clientes/${encodeURIComponent(c.id ?? "")}`} className="c-enlace" onClick={(e) => e.stopPropagation()}>{c.nombre}</Link>{c.rubro && <small>{c.rubro}</small>}{!c.activo && <span className="m-estado bloqueado">Inactivo</span>}</>, orden: (c) => c.nombre.toLowerCase() },
            { titulo: 'Negocio', valor: (c) => negocio(c.negocio_id) },
            { titulo: 'WhatsApp', valor: (c) => c.whatsapp ?? <span className="m-vacia">Sin anotar</span> },
            { titulo: 'NIT', valor: (c) => c.nit ?? <span className="m-vacia">Sin anotar</span> },
            { titulo: 'Proyectos', num: true, valor: (c) => deCliente(c.id).length, orden: (c) => deCliente(c.id).length },
            { titulo: 'Mensualidad', num: true, valor: (c) => quetzales(mensual(c.id)), orden: (c) => mensual(c.id) },
          ]}
          acciones={(c) => (c.archivado
            ? <button type="button" className="m-btn m-btn-secundario m-btn-sm" onClick={() => void reactivar(c)} title="Volver a mostrarlo en las listas y selectores"><RotateCcw size={14} aria-hidden /> Reactivar</button>
            : <button type="button" className="m-icono-btn" onClick={() => setEditar(c)} aria-label={`Editar ${c.nombre}`} title="Editar los datos del cliente"><Pencil aria-hidden /></button>)}
        />
      )}

      <FormCliente abierta={nuevo} cliente={null} onCerrar={() => setNuevo(false)} onGuardado={(c) => ir(`/clientes/${encodeURIComponent(c.id ?? "")}`)} />
      <FormCliente abierta={editar != null} cliente={editar} onCerrar={() => setEditar(null)} />
    </>
  )
}
