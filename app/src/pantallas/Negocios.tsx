import Pasos from '../componentes/Pasos'
import { Pencil } from 'lucide-react'
import { useState } from 'react'
import FormRegistro from '../componentes/FormRegistro'
import Tabla from '../componentes/Tabla'
import { useDatos } from '../lib/datos'
import { useModelo } from '../lib/modelo'
import type { Negocio } from '../lib/tipos'

export default function Negocios() {
  const { negocios, clientes } = useModelo()
  const { guardar } = useDatos()
  const [editar, setEditar] = useState<Negocio | null>(null)
  return (
    <>
      <div className="c-cabeza"><div><span className="m-etiqueta">Ajustes</span><h1 className="erp-titulo">Negocios</h1><Pasos /></div></div>
      <p className="m-texto-suave c-intro">Los tres negocios vienen listos. Puedes cambiarles el nombre o apagar uno que no uses; lo registrado se conserva.</p>
      <Tabla
        filas={negocios}
        clave={(n) => n.id}
        vacio="Cargando negocios…"
        columnas={[
          { titulo: 'Negocio', principal: true, valor: (n) => <>{n.nombre}{n.descripcion && <small>{n.descripcion}</small>}</> },
          { titulo: 'Clientes', num: true, valor: (n) => clientes.filter((c) => c.negocio_id === n.id).length },
          { titulo: 'Estado', valor: (n) => (n.activo ? <span className="m-estado aprobado">Activo</span> : <span className="m-estado bloqueado">Apagado</span>) },
        ]}
        acciones={(n) => <button type="button" className="m-icono-btn" onClick={() => setEditar(n)} aria-label={`Editar ${n.nombre}`} title="Editar el negocio"><Pencil aria-hidden /></button>}
      />
      <FormRegistro abierta={editar != null} titulo="Editar negocio"
        campos={[
          { k: 'nombre', etiqueta: 'Nombre', tipo: 'texto', requerido: true, max: 80, ancho: true },
          { k: 'descripcion', etiqueta: 'Descripción', tipo: 'texto', max: 300, ancho: true },
          { k: 'activo', etiqueta: 'Activo', tipo: 'casilla' },
        ]}
        inicial={(editar ?? {}) as unknown as Record<string, unknown>}
        onGuardar={async (d) => { if (editar) await guardar('ctl_negocios', editar.id, d) }}
        onCerrar={() => setEditar(null)} />
    </>
  )
}
