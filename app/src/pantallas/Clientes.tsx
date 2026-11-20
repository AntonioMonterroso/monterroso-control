import { ExternalLink, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react'
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
import Pasos from '../componentes/Pasos'
import { useBorrarOArchivar } from './clientes/BorrarOArchivar'

type Filtro = 'activos' | 'todos' | 'inactivos' | 'archivados'

export default function Clientes() {
  const { clientes, proyectos, negocios } = useModelo()
  const ir = useNavigate()
  const esc = useEscribir()
  const avisar = useAvisar()
  const reactivar = async (l: Cliente[]) => {
    for (const c of l) await esc.archivarCliente(c.id, false)
    avisar(l.length === 1 ? `${l[0].nombre} vuelve a estar activo.` : `${l.length} clientes vuelven a estar activos.`, 'bien', { texto: 'Deshacer', hacer: async () => { for (const c of l) await esc.archivarCliente(c.id, true) } })
  }
  const bo = useBorrarOArchivar()
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
          <h1 className="erp-titulo">Clientes</h1><Pasos />
        </div>
        <button type="button" className="m-btn m-btn-primario" onClick={() => setNuevo(true)} title="Abre la ventana para crear un cliente nuevo"><Plus size={16} aria-hidden /> Nuevo cliente</button>
      </div>

      <div className="c-herramientas">
        <Buscador valor={q} onCambio={setQ} ayuda="Nombre, NIT, teléfono o correo" />
        <div className="c-chips" role="group" aria-label="Filtrar clientes">
          {(['activos', 'todos', 'inactivos', 'archivados'] as Filtro[]).map((f) => (
            <button key={f} type="button" className="m-chip" aria-pressed={filtro === f} onClick={() => setFiltro(f)} title={`Muestra ${f === 'todos' ? 'todos los clientes menos los archivados' : `solo los clientes ${f}`}`}>{f[0].toUpperCase() + f.slice(1)}</button>
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
          nota="Toca un cliente para ver su ficha; clic derecho o mantener presionado para más"
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
          masa={filtro === 'archivados'
            ? [{ texto: 'Reactivar las marcadas', titulo: (n) => `Vuelve a mostrar los ${n} clientes marcados en listas y selectores`, hacer: (l) => void reactivar(l) }]
            : [{ texto: 'Borrar o archivar las marcadas', titulo: (n) => `Muestra cuáles de los ${n} se borran y cuáles se archivan antes de hacerlo`, hacer: (l) => bo.pedir(l), peligro: true }]}
          menu={(c) => [
            { texto: 'Abrir', titulo: 'Abre la ficha del cliente', icono: <ExternalLink size={16} aria-hidden />, hacer: () => ir(`/clientes/${encodeURIComponent(c.id)}`) },
            { texto: 'Editar', titulo: 'Abre sus datos para corregirlos', icono: <Pencil size={16} aria-hidden />, hacer: () => setEditar(c) },
            c.archivado
              ? { texto: 'Reactivar', titulo: 'Vuelve a mostrarlo en listas y selectores', icono: <RotateCcw size={16} aria-hidden />, hacer: () => void reactivar([c]) }
              : { texto: 'Borrar o archivar', titulo: bo.titulo(c), icono: <Trash2 size={16} aria-hidden />, hacer: () => bo.pedir([c]), peligro: true },
          ]}
          acciones={(c) => (
            <>
              <button type="button" className="m-icono-btn" onClick={() => setEditar(c)} aria-label={`Editar ${c.nombre}`} title="Abre sus datos para corregirlos"><Pencil aria-hidden /></button>
              {c.archivado
                ? <button type="button" className="m-btn m-btn-secundario m-btn-sm" onClick={() => void reactivar([c])} title="Vuelve a mostrarlo en listas y selectores"><RotateCcw size={14} aria-hidden /> Reactivar</button>
                : <button type="button" className="m-icono-btn c-icono-peligro" onClick={() => bo.pedir([c])} aria-label={`Borrar o archivar ${c.nombre}`} title={bo.titulo(c)}><Trash2 aria-hidden /></button>}
            </>
          )}
        />
      )}

      <FormCliente abierta={nuevo} cliente={null} onCerrar={() => setNuevo(false)} onGuardado={(c) => ir(`/clientes/${encodeURIComponent(c.id ?? "")}`)} />
      <FormCliente abierta={editar != null} cliente={editar} onCerrar={() => setEditar(null)} />
      {bo.ventana}
    </>
  )
}
