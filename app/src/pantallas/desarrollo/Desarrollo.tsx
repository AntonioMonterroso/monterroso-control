import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Buscador from '../../componentes/Buscador'
import Pestanas from '../../componentes/Pestanas'
import { useModelo } from '../../lib/modelo'
import { useAvisosDev } from '../../lib/usos'
import ParaNoOlvidar from './ParaNoOlvidar'
import { SeccionEnlaces, SeccionServicios, SeccionSupabase, SeccionTokens, type Filtro } from './Secciones'

type Vista = 'todo' | 'supabase' | 'token' | 'servicio' | 'enlace'

export default function Desarrollo() {
  const m = useModelo()
  const avisos = useAvisosDev()
  const [params] = useSearchParams()
  const [vista, setVista] = useState<Vista>(() => (['supabase', 'token', 'servicio', 'enlace'].includes(params.get('ver') ?? '') ? (params.get('ver') as Vista) : 'todo'))
  const [q, setQ] = useState('')
  const [proyecto, setProyecto] = useState('')
  const [soloAvisos, setSoloAvisos] = useState(false)
  const f: Filtro = { q, proyectoId: proyecto || undefined, soloAvisos }
  const cuenta = (t: Vista) => avisos.filter((a) => a.tipo === t).length || undefined
  return (
    <>
      <div className="c-cabeza">
        <div><span className="m-etiqueta">Dev Studio</span><h1 className="erp-titulo">Desarrollo</h1></div>
      </div>
      <ParaNoOlvidar limite={vista === 'todo' ? 8 : 3} />
      <Pestanas etiqueta="Ver" valor={vista} onCambio={setVista} opciones={[
        { valor: 'todo', nombre: 'Todo' },
        { valor: 'supabase', nombre: 'Supabase', cuenta: cuenta('supabase') },
        { valor: 'token', nombre: 'Tokens', cuenta: cuenta('token') },
        { valor: 'servicio', nombre: 'Servicios', cuenta: cuenta('servicio') },
        { valor: 'enlace', nombre: 'Enlaces', cuenta: cuenta('enlace') },
      ]} />
      <div className="c-herramientas">
        <Buscador valor={q} onCambio={setQ} ayuda="Nombre, proveedor, dirección o últimos 4" />
        <div className="m-campo">
          <label htmlFor="dv-pro">Proyecto</label>
          <select id="dv-pro" className="m-entrada" value={proyecto} onChange={(e) => setProyecto(e.target.value)}>
            <option value="">Todos</option>
            {m.proyectos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </div>
        <div className="c-chips" role="group" aria-label="Filtrar">
          <button type="button" className="m-chip" aria-pressed={!soloAvisos} onClick={() => setSoloAvisos(false)} title="Ver todo">Todos</button>
          <button type="button" className="m-chip" aria-pressed={soloAvisos} onClick={() => setSoloAvisos(true)} title="Ver solo lo que tiene aviso">Con aviso · {avisos.length}</button>
        </div>
      </div>
      {(vista === 'todo' || vista === 'supabase') && <SeccionSupabase f={f} />}
      {(vista === 'todo' || vista === 'token') && <SeccionTokens f={f} />}
      {(vista === 'todo' || vista === 'servicio') && <SeccionServicios f={f} />}
      {(vista === 'todo' || vista === 'enlace') && <SeccionEnlaces f={f} />}
    </>
  )
}
