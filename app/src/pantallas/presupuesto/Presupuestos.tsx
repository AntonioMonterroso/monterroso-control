import Pasos from '../../componentes/Pasos'
import { Copy, Pencil } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useAvisar } from '../../componentes/Avisos'
import FormRegistro from '../../componentes/FormRegistro'
import SelectorMes from '../../componentes/SelectorMes'
import Tabla from '../../componentes/Tabla'
import { useDatos } from '../../lib/datos'
import { aCentavos, deCentavos, quetzales } from '../../lib/dinero'
import { movimientos, rangoMes, sumarMeses } from '../../lib/finanzas'
import { useModelo } from '../../lib/modelo'
import { copiarMes, lineasPresupuesto, type LineaPresupuesto } from '../../lib/presupuesto'
import { useHoy, usePeriodo } from '../../lib/usos'
import Barra from './Barra'

export default function Presupuestos({ negocioClave }: { negocioClave?: 'canela' | 'salario' } = {}) {
  const m = useModelo()
  const { guardar, insertar, borrar } = useDatos()
  const avisar = useAvisar()
  const hoy = useHoy()
  const [periodo, setPeriodo] = usePeriodo()
  const fijo = negocioClave ? m.negocios.find((n) => n.clave === negocioClave) : undefined
  const [negocioSel, setNegocio] = useState(() => m.negocios.find((n) => n.clave === 'dev')?.id ?? '')
  const negocio = fijo?.id ?? negocioSel
  const [editar, setEditar] = useState<LineaPresupuesto | null>(null)
  const [desde, hasta] = rangoMes(periodo)
  const movs = useMemo(() => movimientos(m, desde, hasta, hoy), [m, desde, hasta, hoy])
  const clavesTienda = negocioClave === 'canela' ? ['tienda'] : negocioClave === 'salario' ? ['salario'] : null
  const cats = m.categorias.filter((c) => c.activo && (!clavesTienda || c.tipo === 'gasto' || clavesTienda.includes(c.clave ?? '')))
  const lineas = lineasPresupuesto(cats, m.presupuestos, movs, periodo, negocio || null)
  const ingresos = lineas.filter((l) => l.categoria.tipo === 'ingreso')
  const gastos = lineas.filter((l) => l.categoria.tipo === 'gasto')
  const total = (l: LineaPresupuesto[], k: 'plan' | 'real') => deCentavos(l.reduce((s, x) => s + aCentavos(x[k]), 0))
  const anterior = sumarMeses(periodo, -1)
  const porCopiar = copiarMes(m.presupuestos, anterior, periodo)

  const copiar = async () => {
    try {
      await insertar('ctl_presupuestos', porCopiar)
      avisar(`Se copiaron ${porCopiar.length} montos del mes anterior.`)
    } catch (e) { avisar(e instanceof Error ? e.message : 'No se pudo copiar.', 'error') }
  }

  const tabla = (titulo: string, l: LineaPresupuesto[]) => (
    <Tabla
      titulo={titulo}
      filas={l}
      clave={(x) => x.categoria.id}
      vacio="No hay categorías activas."
      columnas={[
        { titulo: 'Categoría', principal: true, valor: (x) => x.categoria.nombre },
        { titulo: 'Presupuesto', num: true, valor: (x) => (x.plan ? quetzales(x.plan) : <span className="m-vacia">Sin monto</span>) },
        { titulo: 'Real', num: true, valor: (x) => quetzales(x.real) },
        { titulo: 'Diferencia', num: true, valor: (x) => <span className={x.diferencia < 0 ? 'm-negativo' : undefined}>{quetzales(x.diferencia)}</span> },
        { titulo: 'Avance', valor: (x) => <Barra avance={x.avance} tipo={x.categoria.tipo} /> },
      ]}
      acciones={negocio ? (x) => <button type="button" className="m-icono-btn" onClick={() => setEditar(x)} aria-label={`Editar ${x.categoria.nombre}`} title="Poner el monto presupuestado"><Pencil aria-hidden /></button> : undefined}
      pie={<tr><td>Total</td><td className="m-num">{quetzales(total(l, 'plan'))}</td><td className="m-num">{quetzales(total(l, 'real'))}</td><td className="m-num">{quetzales(l[0]?.categoria.tipo === 'gasto' ? total(l, 'plan') - total(l, 'real') : total(l, 'real') - total(l, 'plan'))}</td><td />{negocio && <td />}</tr>}
    />
  )

  const fila = editar ? m.presupuestos.find((p) => p.periodo === periodo && p.negocio_id === negocio && p.categoria_id === editar.categoria.id) : undefined
  return (
    <>
      <div className="c-cabeza">
        <div><span className="m-etiqueta">{fijo ? fijo.nombre : 'Planeado contra real'}</span><h1 className="erp-titulo">{fijo ? 'Presupuesto' : 'Presupuestos'}</h1><Pasos /></div>
        <div className="c-cabeza-acciones">
          <SelectorMes periodo={periodo} onCambio={setPeriodo} />
          <button type="button" className="m-btn m-btn-secundario" disabled={porCopiar.length === 0} onClick={() => void copiar()} title={porCopiar.length ? `Copiar ${porCopiar.length} montos del mes anterior sin tocar los que ya pusiste` : 'No hay nada que copiar del mes anterior'}><Copy size={16} aria-hidden /> Copiar mes anterior</button>
        </div>
      </div>
      {!fijo && <div className="c-chips" role="group" aria-label="Negocio">
        {m.negocios.filter((n) => n.activo).map((n) => <button key={n.id} type="button" className="m-chip" aria-pressed={negocio === n.id} onClick={() => setNegocio(n.id)} title={`Presupuesto de ${n.nombre}`}>{n.nombre}</button>)}
        <button type="button" className="m-chip" aria-pressed={!negocio} onClick={() => setNegocio('')} title="Ver la suma de todos los negocios (solo lectura)">Todos juntos</button>
      </div>}
      <div className="erp-kpis">
        <div className="erp-kpi exito"><span className="m-etiqueta">Ingresos</span><b>{quetzales(total(ingresos, 'real'))}</b><small>de {quetzales(total(ingresos, 'plan'))} planeados</small></div>
        <div className="erp-kpi peligro"><span className="m-etiqueta">Gastos</span><b>{quetzales(total(gastos, 'real'))}</b><small>de {quetzales(total(gastos, 'plan'))} planeados</small></div>
        <div className="erp-kpi"><span className="m-etiqueta">Utilidad real</span><b>{quetzales(total(ingresos, 'real') - total(gastos, 'real'))}</b><small>planeada {quetzales(total(ingresos, 'plan') - total(gastos, 'plan'))}</small></div>
      </div>
      {tabla('Ingresos', ingresos)}
      {tabla('Gastos', gastos)}
      <FormRegistro
        abierta={editar != null}
        titulo="Monto presupuestado"
        subtitulo={editar ? `${editar.categoria.nombre} · ${m.negocios.find((n) => n.id === negocio)?.nombre}` : ''}
        campos={[{ k: 'monto', etiqueta: 'Monto del mes', tipo: 'monto', requerido: true, ayuda: 'Pon 0 para quitarlo.' }]}
        inicial={{ monto: fila?.monto.toFixed(2) ?? '' }}
        onGuardar={async (d) => {
          if (!editar) return
          const monto = Number(d.monto)
          if (fila && monto === 0) await borrar('ctl_presupuestos', [fila.id])
          else if (fila) await guardar('ctl_presupuestos', fila.id, { monto })
          else if (monto > 0) await insertar('ctl_presupuestos', [{ periodo, negocio_id: negocio, categoria_id: editar.categoria.id, monto }])
        }}
        onCerrar={() => setEditar(null)}
      />
    </>
  )
}
