import Pasos from '../../componentes/Pasos'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useQuitar } from '../../lib/quitar'
import { useState } from 'react'
import FormRegistro from '../../componentes/FormRegistro'
import Tabla from '../../componentes/Tabla'
import { useDatos } from '../../lib/datos'
import { useModelo } from '../../lib/modelo'
import type { Categoria } from '../../lib/tipos'

export default function Categorias() {
  const m = useModelo()
  const { categorias } = m
  const q = useQuitar()
  const enUso = (id: string) => m.gastos.some((g) => g.categoria_id === id) || m.gastosFijos.some((g) => g.categoria_id === id) || m.presupuestos.some((p) => p.categoria_id === id) || m.deudas.some((d) => d.categoria_id === id) || m.devServicios.some((d) => d.categoria_id === id)
  const { guardar } = useDatos()
  const [editar, setEditar] = useState<Categoria | 'nuevo' | null>(null)
  const c = editar && editar !== 'nuevo' ? editar : null
  const repetida = (nombre: string, tipo: string) => categorias.some((x) => x.id !== c?.id && x.tipo === tipo && x.nombre.trim().toLowerCase() === nombre.trim().toLowerCase())
  const tabla = (tipo: 'gasto' | 'ingreso', titulo: string, nota: string) => (
    <Tabla
      marcable={(x) => !x.clave && !enUso(x.id)}
      quitarVarias={(l) => q.pedir('ctl_categorias', l, `Se quitan ${l.length} categorías sin nada registrado.`)}
      titulo={titulo}
      nota={nota}
      filas={categorias.filter((x) => x.tipo === tipo)}
      clave={(x) => x.id}
      vacio="Sin categorías."
      columnas={[
        { titulo: 'Nombre', principal: true, valor: (x) => <>{x.nombre}{x.clave && <small>Se llena sola</small>}</> },
        { titulo: 'Estado', valor: (x) => (x.activo ? <span className="m-estado aprobado">Activa</span> : <span className="m-estado bloqueado">Apagada</span>) },
      ]}
      acciones={(x) => (
        <>
          <button type="button" className="m-icono-btn" onClick={() => setEditar(x)} aria-label={`Editar ${x.nombre}`} title="Renombrar o apagar la categoría"><Pencil aria-hidden /></button>
          {!x.clave && !enUso(x.id) && <button type="button" className="m-icono-btn" onClick={() => q.pedir('ctl_categorias', [x], `Se quita la categoría «${x.nombre}». No tiene nada registrado.`)} aria-label="Quitar" title="Quitar la categoría (no tiene nada registrado; se puede deshacer)"><Trash2 aria-hidden /></button>}
        </>
      )}
    />
  )
  return (
    <>
      <div className="c-cabeza">
        <div><span className="m-etiqueta">Ajustes</span><h1 className="erp-titulo">Categorías</h1><Pasos /></div>
        <button type="button" className="m-btn m-btn-primario" onClick={() => setEditar('nuevo')} title="Agregar una categoría de gasto"><Plus size={16} aria-hidden /> Nueva categoría</button>
      </div>
      <p className="m-texto-suave c-intro">Este catálogo es solo de tus negocios y no depende de Monterroso World. Una categoría apagada deja de salir en los formularios, pero lo ya registrado se conserva.</p>
      {tabla('gasto', 'Gastos', 'Puedes agregar, renombrar y apagar')}
      {tabla('ingreso', 'Ingresos', 'Se llenan solas con cobros, ventas y salario')}
      <FormRegistro
        abierta={editar != null}
        titulo={c ? 'Editar categoría' : 'Nueva categoría de gasto'}
        campos={[
          { k: 'nombre', etiqueta: 'Nombre', tipo: 'texto', requerido: true, max: 80, ancho: true },
          { k: 'orden', etiqueta: 'Orden en las listas', tipo: 'numero', min: 0, max: 999 },
          { k: 'activo', etiqueta: 'Activa', tipo: 'casilla' },
        ]}
        inicial={c ? (c as unknown as Record<string, unknown>) : { activo: true, orden: 50 }}
        validar={(v) => (repetida(v.nombre ?? '', c?.tipo ?? 'gasto') ? 'Ya hay una categoría con ese nombre.' : null)}
        onGuardar={async (d) => { await guardar('ctl_categorias', c?.id ?? null, c ? { ...d, orden: d.orden ?? c.orden } : { ...d, tipo: 'gasto', orden: d.orden ?? 50 }) }}
        onCerrar={() => setEditar(null)}
      />
      {q.ventana}
    </>
  )
}
