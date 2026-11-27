import { porcentaje } from '../../lib/totales'
import Pasos from '../../componentes/Pasos'
import { CalendarCheck, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAvisar } from '../../componentes/Avisos'
import Buscador, { coincide } from '../../componentes/Buscador'
import { useQuitar } from '../../lib/quitar'
import FormRegistro from '../../componentes/FormRegistro'
import Ojito from '../../componentes/Ojito'
import Pestanas from '../../componentes/Pestanas'
import SelectorMes from '../../componentes/SelectorMes'
import Tabla from '../../componentes/Tabla'
import { useDatos } from '../../lib/datos'
import { aCentavos, deCentavos, quetzales } from '../../lib/dinero'
import { aISO, diasDelMes, fechaCorta, partes } from '../../lib/fechas'
import { fijosPendientes, periodoDe } from '../../lib/finanzas'
import { useModelo } from '../../lib/modelo'
import { useHoy, usePeriodo } from '../../lib/usos'
import type { Gasto, GastoFijo } from '../../lib/tipos'
import { camposFijo, camposGasto } from './campos'
import PorCliente from './PorCliente'

type Vista = 'gastos' | 'fijos' | 'clientes'

export default function Gastos({ negocioClave }: { negocioClave?: 'dev' | 'canela' | 'salario' } = {}) {
  const m = useModelo()
  const { guardar, insertar } = useDatos()
  const avisar = useAvisar()
  const hoy = useHoy()
  const [periodo, setPeriodo] = usePeriodo()
  const [vista, setVista] = useState<Vista>('gastos')
  const [q, setQ] = useState('')
  const fijo = negocioClave ? m.negocios.find((n) => n.clave === negocioClave) : undefined
  const [negocioSel, setNegocio] = useState('')
  const negocio = fijo?.id ?? negocioSel
  const [editar, setEditar] = useState<Gasto | 'nuevo' | null>(null)
  const [editarFijo, setEditarFijo] = useState<GastoFijo | 'nuevo' | null>(null)
  const q2 = useQuitar()
  const setQuitar = (x: Gasto) => q2.pedir('ctl_gastos', [x], `Se quita «${x.descripcion}» de ${quetzales(x.monto)}.`)

  const nom = (l: { id: string; nombre: string }[], id: string | null) => l.find((x) => x.id === id)?.nombre ?? ''
  const delMes = m.gastos.filter((g) => periodoDe(g.fecha) === periodo && (!negocio || g.negocio_id === negocio) && coincide(q, g.descripcion, g.proveedor, g.proveedor_nit, g.factura_numero, nom(m.clientes, g.cliente_id), nom(m.categorias, g.categoria_id)))
  const total = deCentavos(delMes.reduce((s, g) => s + aCentavos(g.monto), 0))
  const fijosNeg = m.gastosFijos.filter((x) => !fijo || x.negocio_id === fijo.id)
  const pendientesFijos = fijosPendientes(fijosNeg, m.gastos, periodo)
  const dev = fijo ?? m.negocios.find((n) => n.clave === 'dev')

  const registrarFijo = async (f: GastoFijo) => {
    const [a, mes] = partes(`${periodo}-01`)
    try {
      await insertar('ctl_gastos', [{ fecha: aISO(a, mes, Math.min(f.dia, diasDelMes(a, mes))), negocio_id: f.negocio_id, categoria_id: f.categoria_id, cliente_id: f.cliente_id, descripcion: f.nombre, monto: f.monto, gasto_fijo_id: f.id, periodo }])
      avisar(`${f.nombre} registrado en el mes.`)
    } catch (e) { avisar(e instanceof Error ? e.message : 'No se pudo registrar.', 'error') }
  }

  const g = editar && editar !== 'nuevo' ? editar : null
  const fj = editarFijo && editarFijo !== 'nuevo' ? editarFijo : null
  return (
    <>
      <div className="c-cabeza">
        <div><span className="m-etiqueta">{fijo ? fijo.nombre : 'Todos los negocios'}</span><h1 className="erp-titulo">{negocioClave === 'canela' ? 'Gastos de la tienda' : negocioClave === 'salario' ? 'Gastos del salario' : 'Gastos'}</h1><Pasos /></div>
        <div className="c-cabeza-acciones">
          {vista !== 'fijos' && <SelectorMes periodo={periodo} onCambio={setPeriodo} />}
          {vista === 'fijos'
            ? <button type="button" className="m-btn m-btn-primario" onClick={() => setEditarFijo('nuevo')} title="Agregar un gasto que se repite cada mes"><Plus size={16} aria-hidden /> Gasto fijo</button>
            : <button type="button" className="m-btn m-btn-primario" onClick={() => setEditar('nuevo')} title="Registrar un gasto de la empresa"><Plus size={16} aria-hidden /> Nuevo gasto</button>}
        </div>
      </div>

      <Pestanas etiqueta="Ver" valor={vista} onCambio={setVista} opciones={[
        { valor: 'gastos', nombre: 'Gastos del mes', cuenta: delMes.length },
        { valor: 'fijos', nombre: 'Gastos fijos', cuenta: fijosNeg.filter((x) => x.activo).length },
        ...(negocioClave && negocioClave !== 'dev' ? [] : [{ valor: 'clientes' as Vista, nombre: 'Costo y ganancia por cliente' }]),
      ]} />

      {vista === 'gastos' && (
        <>
          {pendientesFijos.length > 0 && (
            <section className="m-tarjeta c-pendientes">
              <h2 className="m-seccion-titulo">Gastos fijos por registrar este mes</h2>
              <ul className="c-lista-saldos">
                {pendientesFijos.map((f) => (
                  <li key={f.id}>
                    <span><b>{f.nombre}</b><small> · día {f.dia} · {nom(m.negocios, f.negocio_id)}</small></span>
                    <span className="c-fila-botones"><b className="m-cifra">{quetzales(f.monto)}</b><button type="button" className="m-btn m-btn-secundario m-btn-sm" onClick={() => void registrarFijo(f)} title="Registrar este gasto fijo en el mes"><CalendarCheck size={14} aria-hidden /> Registrar</button></span>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <div className="c-herramientas">
            <Buscador valor={q} onCambio={setQ} ayuda="Descripción, proveedor, NIT o factura" />
            {!fijo && <div className="c-chips" role="group" aria-label="Filtrar por negocio">
              <button type="button" className="m-chip" aria-pressed={!negocio} onClick={() => setNegocio('')} title="Ver los gastos de todos los negocios">Todos</button>
              {m.negocios.filter((n) => n.activo).map((n) => <button key={n.id} type="button" className="m-chip" aria-pressed={negocio === n.id} onClick={() => setNegocio(n.id)} title={`Ver solo ${n.nombre}`}>{n.nombre}</button>)}
            </div>}
          </div>
          <Tabla
            buscador={false}
            titulo={`${delMes.length} ${delMes.length === 1 ? 'gasto' : 'gastos'}`}
            filas={delMes}
            clave={(x) => x.id}
            vacio="No hay gastos en este mes."
            resumen={(l) => { const por = [...l.reduce((g, x) => g.set(x.categoria_id ?? '', (g.get(x.categoria_id ?? '') ?? 0) + Math.round(x.monto * 100)), new Map<string, number>()).entries()].sort((a, b) => b[1] - a[1]); const tot = por.reduce((t, x) => t + x[1], 0); return <>{por.slice(0, 3).map(([k, v]) => <span key={k}><b>{nom(m.categorias, k) || 'Sin categoría'}</b> {quetzales(v / 100)} · {porcentaje(v, tot)}</span>)}<span>Promedio {quetzales(tot / 100 / Math.max(1, l.length))}</span></> }}
            columnas={[
              { titulo: 'Fecha', valor: (x) => fechaCorta(x.fecha) },
              { titulo: 'Descripción', principal: true, valor: (x) => <>{x.descripcion}{x.proveedor && <small>{x.proveedor}{x.proveedor_nit ? ` · NIT ${x.proveedor_nit}` : ''}</small>}</> },
              { titulo: 'Categoría', valor: (x) => nom(m.categorias, x.categoria_id) },
              { titulo: 'Negocio', valor: (x) => nom(m.negocios, x.negocio_id) },
              { titulo: 'Cliente', valor: (x) => (x.cliente_id ? <Link to={`/clientes/${encodeURIComponent(x.cliente_id ?? "")}`} className="c-enlace">{nom(m.clientes, x.cliente_id)}</Link> : <span className="m-vacia">—</span>) },
              { titulo: 'Factura', baja: true, valor: (x) => (x.factura_numero ? `${x.factura_serie ? `${x.factura_serie}-` : ''}${x.factura_numero}` : <span className="m-vacia">Sin factura</span>) },
              { titulo: 'Monto', num: true, valor: (x) => quetzales(x.monto) },
            ]}
            quitarVarias={(l) => q2.pedir('ctl_gastos', l, `Se quitan ${l.length} gastos por ${quetzales(l.reduce((t, g) => t + g.monto, 0))}.`)}
            acciones={(x) => (
              <>
                <Ojito ruta={x.archivo} titulo={`Comprobante: ${x.descripcion}`} />
                <button type="button" className="m-icono-btn" onClick={() => setEditar(x)} aria-label="Editar" title="Editar el gasto"><Pencil aria-hidden /></button>
                <button type="button" className="m-icono-btn" onClick={() => setQuitar(x)} aria-label="Quitar" title="Quitar el gasto"><Trash2 aria-hidden /></button>
              </>
            )}
            pie={<tr><td colSpan={6}>Total</td><td className="m-num">{quetzales(total)}</td><td /></tr>}
          />
        </>
      )}

      {vista === 'fijos' && (
        <Tabla
          titulo={`${fijosNeg.length} gastos fijos`}
          nota="Cada mes aparecen en «Gastos del mes» para registrarlos con un toque"
          filas={fijosNeg}
          clave={(x) => x.id}
          vacio="Todavía no hay gastos fijos. Agrega tu internet, el hosting o tus suscripciones."
          columnas={[
            { titulo: 'Nombre', principal: true, valor: (x) => <>{x.nombre}{!x.activo && <span className="m-estado bloqueado">Apagado</span>}</> },
            { titulo: 'Día', num: true, valor: (x) => x.dia },
            { titulo: 'Categoría', valor: (x) => nom(m.categorias, x.categoria_id) },
            { titulo: 'Negocio', valor: (x) => nom(m.negocios, x.negocio_id) },
            { titulo: 'Vigencia', baja: true, valor: (x) => `${fechaCorta(x.inicio)}${x.fin ? ` a ${fechaCorta(x.fin)}` : ' en adelante'}` },
            { titulo: 'Monto', num: true, valor: (x) => quetzales(x.monto) },
          ]}
          quitarVarias={(l) => q2.pedir('ctl_gastos_fijos', l, `Se quitan ${l.length} gastos fijos. Lo ya registrado en los meses se conserva.`)}
          acciones={(x) => (
            <>
              <button type="button" className="m-icono-btn" onClick={() => setEditarFijo(x)} aria-label="Editar" title="Editar el gasto fijo"><Pencil aria-hidden /></button>
              <button type="button" className="m-icono-btn" onClick={() => q2.pedir('ctl_gastos_fijos', [x], `Se quita el gasto fijo «${x.nombre}». Lo ya registrado en los meses se conserva.`)} aria-label="Quitar" title="Quitar el gasto fijo (se puede deshacer)"><Trash2 aria-hidden /></button>
            </>
          )}
        />
      )}

      {vista === 'clientes' && <PorCliente />}

      <FormRegistro
        abierta={editar != null}
        titulo={g ? 'Editar gasto' : 'Nuevo gasto'}
        campos={camposGasto(m, g?.categoria_id)}
        inicial={g ? (g as unknown as Record<string, unknown>) : { fecha: hoy.slice(0, 7) === periodo ? hoy : `${periodo}-01`, negocio_id: dev?.id, cuenta: 'Banco' }}
        carpeta="gastos"
        onGuardar={async (d) => { await guardar('ctl_gastos', g?.id ?? null, g?.archivo && !d.archivo ? { ...d, archivo: g.archivo } : d) }}
        onCerrar={() => setEditar(null)}
      />
      <FormRegistro
        abierta={editarFijo != null}
        titulo={fj ? 'Editar gasto fijo' : 'Nuevo gasto fijo'}
        campos={camposFijo(m)}
        inicial={fj ? (fj as unknown as Record<string, unknown>) : { negocio_id: dev?.id, inicio: `${periodo}-01`, activo: true }}
        validar={(v) => (v.fin && v.inicio && v.fin < v.inicio ? 'La fecha final no puede ser antes del inicio.' : null)}
        onGuardar={async (d) => { await guardar('ctl_gastos_fijos', fj?.id ?? null, d) }}
        onCerrar={() => setEditarFijo(null)}
      />
      {q2.ventana}
    </>
  )
}
