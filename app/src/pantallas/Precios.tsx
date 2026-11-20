import Pasos from '../componentes/Pasos'
import { Check, Copy, Pencil, Plus, Trash2 } from 'lucide-react'
import { useQuitar } from '../lib/quitar'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import FormRegistro from '../componentes/FormRegistro'
import Tabla from '../componentes/Tabla'
import { useDatos } from '../lib/datos'
import { quetzales } from '../lib/dinero'
import { useModelo } from '../lib/modelo'
import type { Tarifa } from '../lib/tipos'
import Historia from '../componentes/Historia'
import { cambiosDe } from '../lib/historial'
import { hoyISO } from '../lib/fechas'
import { useSesion } from '../lib/sesion'

export function preciosCompartibles(m: ReturnType<typeof useModelo>) {
  return {
    actualizado: new Date().toISOString().slice(0, 10),
    moneda: 'GTQ',
    paquetes: m.tarifas.filter((t) => t.activo && t.compartir && t.tipo === 'paquete').map((t) => ({ nombre: t.nombre, inscripcion: t.inscripcion, mensualidad: t.mensualidad, descripcion: t.descripcion, incluye: (t.incluye ?? '').split('\n').map((x) => x.trim()).filter(Boolean) })),
    extras: m.tarifas.filter((t) => t.activo && t.compartir && t.tipo === 'extra').map((t) => ({ nombre: t.nombre, precio: t.precio, descripcion: t.descripcion })),
    productos: m.productos.filter((p) => p.activo && p.compartir).map((p) => ({ nombre: p.nombre, sku: p.sku, precio: p.precio })),
  }
}

export default function Precios() {
  const m = useModelo()
  const { guardar, insertar } = useDatos()
  const { correo } = useSesion()
  const [editar, setEditar] = useState<Tarifa | 'paquete' | 'extra' | null>(null)
  const [copiado, setCopiado] = useState(false)
  const q = useQuitar()
  const t = editar && typeof editar !== 'string' ? editar : null
  const tipo = t?.tipo ?? (typeof editar === 'string' ? editar : 'paquete')
  const compartibles = preciosCompartibles(m)
  const cuantos = compartibles.paquetes.length + compartibles.extras.length + compartibles.productos.length
  const copiar = async () => {
    try { await navigator.clipboard.writeText(JSON.stringify(compartibles, null, 2)); setCopiado(true); setTimeout(() => setCopiado(false), 1800) } catch { setCopiado(false) }
  }
  const tabla = (k: 'paquete' | 'extra', titulo: string) => (
    <Tabla
      titulo={titulo}
      filas={m.tarifas.filter((x) => x.tipo === k)}
      quitarVarias={(l) => q.pedir('ctl_tarifas', l, `Se quitan ${l.length} tarifas. Los proyectos que ya las usaron no cambian.`)}
      clave={(x) => x.id}
      vacio={k === 'paquete' ? 'Todavía no hay paquetes. Agrega tus planes con su inscripción y mensualidad.' : 'Sin extras todavía (dominio, soporte por hora…).'}
      columnas={[
        { titulo: 'Nombre', principal: true, valor: (x) => <>{x.nombre}{x.descripcion && <small>{x.descripcion}</small>}{!x.activo && <span className="m-estado bloqueado">Apagado</span>}</> },
        ...(k === 'paquete'
          ? [{ titulo: 'Inscripción', num: true, valor: (x: Tarifa) => quetzales(x.inscripcion) }, { titulo: 'Mensualidad', num: true, valor: (x: Tarifa) => quetzales(x.mensualidad) }]
          : [{ titulo: 'Precio', num: true, valor: (x: Tarifa) => quetzales(x.precio) }]),
        { titulo: 'Página', valor: (x) => (x.compartir ? <span className="m-estado en-proceso">Compartido</span> : <span className="m-vacia">No</span>) },
      ]}
      acciones={(x) => (
        <>
          <button type="button" className="m-icono-btn" onClick={() => setEditar(x)} aria-label="Editar" title="Editar la tarifa"><Pencil aria-hidden /></button>
          <button type="button" className="m-icono-btn" onClick={() => q.pedir('ctl_tarifas', [x], `Se quita la tarifa «${x.nombre}». Los proyectos que ya la usaron no cambian.`)} aria-label="Quitar" title="Quitar la tarifa (se puede deshacer)"><Trash2 aria-hidden /></button>
        </>
      )}
    />
  )
  return (
    <>
      <div className="c-cabeza">
        <div><span className="m-etiqueta">Dev Studio y Hogar Canela</span><h1 className="erp-titulo">Precios y tarifas</h1><Pasos /></div>
        <div className="c-cabeza-acciones">
          <button type="button" className="m-btn m-btn-salida" disabled={cuantos === 0} onClick={() => void copiar()} title={cuantos ? 'Copiar los precios marcados para compartir, listos para la página' : 'Marca algún precio para compartir'}>{copiado ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />} {copiado ? 'Copiado' : `Copiar compartidos (${cuantos})`}</button>
          <button type="button" className="m-btn m-btn-secundario" onClick={() => setEditar('extra')} title="Agregar un extra con precio único"><Plus size={16} aria-hidden /> Extra</button>
          <button type="button" className="m-btn m-btn-primario" onClick={() => setEditar('paquete')} title="Agregar un paquete con inscripción y mensualidad"><Plus size={16} aria-hidden /> Paquete</button>
        </div>
      </div>
      <p className="m-texto-suave c-intro">Lo que marques como «compartir» queda listo para la página studiomonterroso.com cuando se haga la conexión de los tres lados. Los productos de Hogar Canela se marcan en <Link to="/tienda" className="c-enlace">Tienda</Link>. Al crear un proyecto puedes tomar los precios de un paquete.</p>
      {tabla('paquete', 'Paquetes')}
      {tabla('extra', 'Extras')}
      <FormRegistro abierta={editar != null} titulo={t ? 'Editar tarifa' : tipo === 'paquete' ? 'Nuevo paquete' : 'Nuevo extra'}
        campos={[
          { k: 'nombre', etiqueta: 'Nombre', tipo: 'texto', requerido: true, max: 120, ancho: true },
          ...(tipo === 'paquete'
            ? [{ k: 'inscripcion', etiqueta: 'Inscripción', tipo: 'monto' as const, requerido: true }, { k: 'mensualidad', etiqueta: 'Mensualidad', tipo: 'monto' as const, requerido: true }]
            : [{ k: 'precio', etiqueta: 'Precio', tipo: 'monto' as const, requerido: true }]),
          { k: 'descripcion', etiqueta: 'Descripción corta', tipo: 'texto', max: 1000, ancho: true },
          ...(tipo === 'paquete' ? [{ k: 'incluye', etiqueta: 'Qué incluye (una línea por cosa)', tipo: 'area' as const, max: 2000 }] : []),
          { k: 'orden', etiqueta: 'Orden', tipo: 'numero', min: 0, max: 999 },
          { k: 'activo', etiqueta: 'Activo', tipo: 'casilla' },
          { k: 'compartir', etiqueta: 'Compartir con la página', tipo: 'casilla' },
        ]}
        inicial={t ? (t as unknown as Record<string, unknown>) : { activo: true, orden: 50, inscripcion: '0', mensualidad: '0', precio: '0' }}
        debajo={t ? <Historia cambios={cambiosDe(m.historial, 'ctl_tarifas', t.id)} monto titulo="Precios anteriores" /> : null}
        onGuardar={async (d) => {
          await guardar('ctl_tarifas', t?.id ?? null, { inscripcion: 0, mensualidad: 0, precio: 0, ...d, orden: d.orden ?? 50, ...(t ? {} : { tipo }) })
          if (!t) return
          const cambios = (['inscripcion', 'mensualidad', 'precio'] as const).filter((k) => d[k] != null && Math.round(Number(d[k]) * 100) !== Math.round(Number(t[k] ?? 0) * 100))
          if (cambios.length) await insertar('ctl_historial', cambios.map((k) => ({ tabla: 'ctl_tarifas', registro_id: t.id, campo: k, desde: hoyISO().slice(0, 7), antes: Number(t[k] ?? 0).toFixed(2), despues: Number(d[k]).toFixed(2), motivo: null, por: correo })))
        }}
        onCerrar={() => setEditar(null)} />
      {q.ventana}
    </>
  )
}
