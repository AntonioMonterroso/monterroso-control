import { FileInput, Pencil, Plus } from 'lucide-react'
import { useState } from 'react'
import { useAvisar } from '../componentes/Avisos'
import Buscador, { coincide } from '../componentes/Buscador'
import FormRegistro, { type Campo } from '../componentes/FormRegistro'
import Ojito from '../componentes/Ojito'
import Pestanas from '../componentes/Pestanas'
import SelectorMes from '../componentes/SelectorMes'
import Tabla from '../componentes/Tabla'
import { useDatos } from '../lib/datos'
import { quetzales } from '../lib/dinero'
import { fechaCorta, nombreMes, partes } from '../lib/fechas'
import { periodoDe, regimenVigente, resumenImpuesto } from '../lib/finanzas'
import { useModelo } from '../lib/modelo'
import { usePeriodo } from '../lib/usos'
import { REGIMENES, type Factura, type ModoImpuesto } from '../lib/tipos'
import { opcClientes, opcNegocios } from './gastos/campos'

type Vista = 'resumen' | 'facturas' | 'regimen'
const nombreRegimen = (r: string) => REGIMENES.find((x) => x.valor === r)?.nombre ?? r

export default function Impuestos() {
  const m = useModelo()
  const { guardar, insertar } = useDatos()
  const avisar = useAvisar()
  const [periodo, setPeriodo] = usePeriodo()
  const [vista, setVista] = useState<Vista>('resumen')
  const [tipo, setTipo] = useState<'' | 'emitida' | 'recibida'>('')
  const [q, setQ] = useState('')
  const [factura, setFactura] = useState<Factura | 'emitida' | 'recibida' | null>(null)
  const [modo, setModo] = useState<ModoImpuesto | 'nuevo' | null>(null)
  const nom = (l: { id: string; nombre: string }[], id: string | null) => l.find((x) => x.id === id)?.nombre ?? ''
  const negocios = m.negocios.filter((n) => n.activo)
  const delMes = m.facturas.filter((f) => periodoDe(f.fecha) === periodo && (!tipo || f.tipo === tipo) && coincide(q, f.nombre, f.nit, f.numero, f.serie))
  const gastosSinFactura = m.gastos.filter((g) => periodoDe(g.fecha) === periodo && g.factura_numero && !m.facturas.some((f) => f.gasto_id === g.id))

  const traerGastos = async () => {
    try {
      await insertar('ctl_facturas', gastosSinFactura.map((g) => ({ tipo: 'recibida', fecha: g.fecha, serie: g.factura_serie, numero: g.factura_numero, nit: g.proveedor_nit, nombre: g.proveedor || g.descripcion, total: g.monto, negocio_id: g.negocio_id, gasto_id: g.id, archivo: g.archivo, anulada: false })))
      avisar(`${gastosSinFactura.length} facturas recibidas agregadas desde Gastos.`)
    } catch (e) { avisar(e instanceof Error ? e.message : 'No se pudo.', 'error') }
  }

  const f = factura && typeof factura !== 'string' ? factura : null
  const tipoF = f?.tipo ?? (typeof factura === 'string' ? factura : 'emitida')
  const camposFactura: Campo[] = [
    { k: 'fecha', etiqueta: 'Fecha', tipo: 'fecha', requerido: true },
    { k: 'negocio_id', etiqueta: 'Negocio', tipo: 'select', requerido: true, opciones: opcNegocios(m) },
    { k: 'serie', etiqueta: 'Serie', tipo: 'texto', max: 40 },
    { k: 'numero', etiqueta: 'Número', tipo: 'texto', requerido: true, max: 40 },
    { k: 'nombre', etiqueta: tipoF === 'emitida' ? 'Nombre del cliente' : 'Nombre del proveedor', tipo: 'texto', requerido: true, max: 200, ancho: true },
    { k: 'nit', etiqueta: 'NIT', tipo: 'texto', max: 30 },
    { k: 'total', etiqueta: 'Total de la factura', tipo: 'monto', requerido: true },
    ...(tipoF === 'emitida' ? [
      { k: 'cliente_id', etiqueta: 'Cliente', tipo: 'select', opciones: opcClientes(m) } as Campo,
      { k: 'pago_id', etiqueta: 'Pago al que corresponde', tipo: 'select', opciones: m.pagos.slice(0, 200).map((p) => ({ valor: p.id, nombre: `${fechaCorta(p.fecha)} · ${nom(m.clientes, p.cliente_id)} · ${quetzales(p.monto)}` })) } as Campo,
    ] : [
      { k: 'gasto_id', etiqueta: 'Gasto al que corresponde', tipo: 'select', opciones: m.gastos.slice(0, 200).map((g) => ({ valor: g.id, nombre: `${fechaCorta(g.fecha)} · ${g.descripcion} · ${quetzales(g.monto)}` })) } as Campo,
    ]),
    { k: 'archivo', etiqueta: 'PDF o foto de la factura', tipo: 'archivo', ancho: true },
    { k: 'anulada', etiqueta: 'Anulada', tipo: 'casilla' },
  ]

  const md = modo && modo !== 'nuevo' ? modo : null
  return (
    <>
      <div className="c-cabeza">
        <div><span className="m-etiqueta">Para tu control, no se presenta nada</span><h1 className="erp-titulo">Impuestos y facturas</h1></div>
        <div className="c-cabeza-acciones">
          {vista !== 'regimen' && <SelectorMes periodo={periodo} onCambio={setPeriodo} />}
          {vista === 'facturas' && <button type="button" className="m-btn m-btn-secundario" onClick={() => setFactura('recibida')} title="Agregar una factura que te dio un proveedor"><Plus size={16} aria-hidden /> Recibida</button>}
          {vista === 'facturas' && <button type="button" className="m-btn m-btn-primario" onClick={() => setFactura('emitida')} title="Agregar una factura que le diste a un cliente"><Plus size={16} aria-hidden /> Emitida</button>}
          {vista === 'regimen' && <button type="button" className="m-btn m-btn-primario" onClick={() => setModo('nuevo')} title="Cambiar el régimen desde un mes"><Plus size={16} aria-hidden /> Cambiar régimen</button>}
        </div>
      </div>
      <Pestanas etiqueta="Ver" valor={vista} onCambio={setVista} opciones={[{ valor: 'resumen', nombre: 'Resumen del mes' }, { valor: 'facturas', nombre: 'Facturas', cuenta: delMes.length }, { valor: 'regimen', nombre: 'Régimen' }]} />

      {vista === 'resumen' && (
        <Tabla
          buscador={false}
          titulo={(() => { const [a, mm] = partes(`${periodo}-01`); return `Resumen de ${nombreMes(a, mm).toLowerCase()}` })()}
          nota="Pequeño contribuyente: 5 % de lo facturado. General: débito menos crédito."
          filas={negocios}
          clave={(n) => n.id}
          vacio="Sin negocios."
          columnas={[
            { titulo: 'Negocio', principal: true, valor: (n) => <>{n.nombre}<small>{nombreRegimen(resumenImpuesto(m.facturas, m.modos, n.id, periodo).regimen)}</small></> },
            { titulo: 'Facturado', num: true, valor: (n) => quetzales(resumenImpuesto(m.facturas, m.modos, n.id, periodo).emitido) },
            { titulo: 'Compras', num: true, valor: (n) => quetzales(resumenImpuesto(m.facturas, m.modos, n.id, periodo).recibido) },
            { titulo: 'Débito', num: true, valor: (n) => { const r = resumenImpuesto(m.facturas, m.modos, n.id, periodo); return r.regimen === 'general' ? quetzales(r.debito) : <span className="m-vacia">—</span> } },
            { titulo: 'Crédito', num: true, valor: (n) => { const r = resumenImpuesto(m.facturas, m.modos, n.id, periodo); return r.regimen === 'general' ? quetzales(r.credito) : <span className="m-vacia">—</span> } },
            { titulo: 'A pagar', num: true, valor: (n) => <b>{quetzales(resumenImpuesto(m.facturas, m.modos, n.id, periodo).aPagar)}</b> },
          ]}
        />
      )}

      {vista === 'facturas' && (
        <>
          {gastosSinFactura.length > 0 && (
            <div className="m-franja"><span>{gastosSinFactura.length} gastos del mes tienen número de factura y no están aquí.</span><button type="button" className="m-btn m-btn-secundario m-btn-sm" onClick={() => void traerGastos()} title="Crear las facturas recibidas con los datos de esos gastos"><FileInput size={14} aria-hidden /> Traerlas</button></div>
          )}
          <div className="c-herramientas">
            <Buscador valor={q} onCambio={setQ} ayuda="Nombre, NIT o número" />
            <div className="c-chips" role="group" aria-label="Tipo">
              {([['', 'Todas'], ['emitida', 'Emitidas'], ['recibida', 'Recibidas']] as ['' | 'emitida' | 'recibida', string][]).map(([v, n]) => <button key={v} type="button" className="m-chip" aria-pressed={tipo === v} onClick={() => setTipo(v)} title={`Ver ${n.toLowerCase()}`}>{n}</button>)}
            </div>
          </div>
          <Tabla
            buscador={false}
            titulo={`${delMes.length} facturas`}
            filas={delMes}
            clave={(x) => x.id}
            vacio="No hay facturas en este mes."
            columnas={[
              { titulo: 'Fecha', valor: (x) => fechaCorta(x.fecha) },
              { titulo: 'Tipo', valor: (x) => (x.tipo === 'emitida' ? <span className="m-estado en-proceso">Emitida</span> : <span className="m-estado pendiente">Recibida</span>) },
              { titulo: 'Número', valor: (x) => `${x.serie ? `${x.serie}-` : ''}${x.numero}` },
              { titulo: 'Nombre', principal: true, valor: (x) => <>{x.nombre}{x.nit && <small>NIT {x.nit}</small>}{x.anulada && <span className="m-estado error">Anulada</span>}</> },
              { titulo: 'Negocio', valor: (x) => nom(m.negocios, x.negocio_id) },
              { titulo: 'Ligada a', valor: (x) => (x.pago_id ? 'Pago' : x.gasto_id ? 'Gasto' : <span className="m-vacia">—</span>) },
              { titulo: 'Total', num: true, valor: (x) => quetzales(x.total) },
            ]}
            acciones={(x) => (
              <>
                <Ojito ruta={x.archivo} titulo={`Factura ${x.numero}`} />
                <button type="button" className="m-icono-btn" onClick={() => setFactura(x)} aria-label="Editar" title="Editar la factura"><Pencil aria-hidden /></button>
              </>
            )}
          />
        </>
      )}

      {vista === 'regimen' && (
        <>
          <p className="m-texto-suave c-intro">El régimen se elige por negocio y, si hace falta, por cliente. Cada cambio vale desde el mes que pongas; los meses anteriores se quedan como estaban. Sin nada registrado, se toma «Sin IVA».</p>
          <Tabla
            buscador={false}
            titulo="Régimen vigente"
            filas={negocios}
            clave={(n) => n.id}
            vacio=""
            columnas={[
              { titulo: 'Negocio', principal: true, valor: (n) => n.nombre },
              { titulo: 'Este mes', valor: (n) => nombreRegimen(regimenVigente(m.modos, periodo, n.id)) },
            ]}
          />
          <Tabla
            buscador={false}
            titulo="Historial de cambios"
            filas={[...m.modos].reverse()}
            clave={(x) => x.id}
            vacio="Todavía no hay cambios de régimen."
            columnas={[
              { titulo: 'Desde', valor: (x) => { const [a, mm] = partes(x.desde); return nombreMes(a, mm) } },
              { titulo: 'Para', principal: true, valor: (x) => (x.ambito === 'negocio' ? nom(m.negocios, x.negocio_id) : <>{nom(m.clientes, x.cliente_id)}<small>Cliente</small></>) },
              { titulo: 'Régimen', valor: (x) => nombreRegimen(x.regimen) },
            ]}
            acciones={(x) => <button type="button" className="m-icono-btn" onClick={() => setModo(x)} aria-label="Editar" title="Corregir este cambio"><Pencil aria-hidden /></button>}
          />
        </>
      )}

      <FormRegistro abierta={factura != null} titulo={f ? 'Editar factura' : tipoF === 'emitida' ? 'Factura emitida' : 'Factura recibida'} campos={camposFactura} carpeta="facturas"
        inicial={f ? (f as unknown as Record<string, unknown>) : { fecha: `${periodo}-01`, negocio_id: m.negocios.find((n) => n.clave === 'dev')?.id }}
        validar={(v) => (m.facturas.some((x) => x.id !== f?.id && x.tipo === tipoF && (x.nit ?? '') === (v.nit ?? '').trim() && (x.serie ?? '') === (v.serie ?? '').trim() && x.numero === (v.numero ?? '').trim()) ? 'Esa factura ya está registrada.' : null)}
        onGuardar={async (d) => { await guardar('ctl_facturas', f?.id ?? null, f ? d : { ...d, tipo: tipoF }) }}
        onCerrar={() => setFactura(null)} />
      <FormRegistro abierta={modo != null} titulo={md ? 'Corregir régimen' : 'Cambiar régimen'}
        campos={[
          { k: 'ambito', etiqueta: 'Para', tipo: 'select', requerido: true, opciones: [{ valor: 'negocio', nombre: 'Un negocio' }, { valor: 'cliente', nombre: 'Un cliente' }] },
          { k: 'negocio_id', etiqueta: 'Negocio', tipo: 'select', requerido: true, opciones: opcNegocios(m), visible: (v) => v.ambito === 'negocio' },
          { k: 'cliente_id', etiqueta: 'Cliente', tipo: 'select', requerido: true, opciones: opcClientes(m), visible: (v) => v.ambito === 'cliente' },
          { k: 'regimen', etiqueta: 'Régimen', tipo: 'select', requerido: true, opciones: REGIMENES.map((r) => ({ valor: r.valor, nombre: r.nombre })) },
          { k: 'desde', etiqueta: 'Desde el mes de', tipo: 'fecha', requerido: true },
        ]}
        inicial={md ? (md as unknown as Record<string, unknown>) : { ambito: 'negocio', negocio_id: m.negocios.find((n) => n.clave === 'dev')?.id, desde: `${periodo}-01` }}
        onGuardar={async (d) => { await guardar('ctl_impuesto_modo', md?.id ?? null, { ...d, desde: `${String(d.desde).slice(0, 7)}-01`, negocio_id: d.ambito === 'negocio' ? d.negocio_id : null, cliente_id: d.ambito === 'cliente' ? d.cliente_id : null }) }}
        onCerrar={() => setModo(null)} />
    </>
  )
}
