import Comprobantes, { VerComprobantes, SIN_COMPROBANTES, subirComprobantes, type ValorComprobantes } from '../../componentes/Comprobantes'
import SelectBuscable from '../../componentes/SelectBuscable'
import { guardarUltimoDestino, leerUltimoDestino, useOpcionesDestino } from '../cobros/Ventanas'
import Pasos from '../../componentes/Pasos'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import FormRegistro from '../../componentes/FormRegistro'
import { useEffect, useMemo, useState } from 'react'
import { useAvisar } from '../../componentes/Avisos'
import Confirmar from '../../componentes/Confirmar'
import SelectorMes from '../../componentes/SelectorMes'
import Tabla from '../../componentes/Tabla'
import Ventana from '../../componentes/Ventana'
import { useDatos } from '../../lib/datos'
import { aCentavos, deCentavos, leerMonto, quetzales } from '../../lib/dinero'
import { fechaCorta } from '../../lib/fechas'
import { periodoDe } from '../../lib/finanzas'
import { useModelo } from '../../lib/modelo'
import { cobrosDeVentas, MEDIOS, repartirPago, type MedioPago, type PagoTienda } from '../../lib/tiendaPagos'
import { useHoy, usePeriodo } from '../../lib/usos'

export function EstadoVentaCobro({ estado }: { estado: string }) {
  const m: Record<string, [string, string]> = { pagado: ['Pagado', 'aprobado'], parcial: ['Pago parcial', 'en-proceso'], por_cobrar: ['Por cobrar', 'pendiente'], devuelto: ['Devuelto', 'bloqueado'] }
  const [n, k] = m[estado] ?? ['', '']
  return <span className={`m-estado ${k}`}>{n}</span>
}

function NuevoPago({ abierta, onCerrar }: { abierta: boolean; onCerrar: () => void }) {
  const m = useModelo()
  const { insertar, borrar, almacen } = useDatos()
  const avisar = useAvisar()
  const hoy = useHoy()
  const destinos = useOpcionesDestino()
  const [destino, setDestino] = useState('')
  const [comp, setComp] = useState<ValorComprobantes>(SIN_COMPROBANTES)
  const pendientes = useMemo(() => cobrosDeVentas(m.ventas, m.partesTienda).filter((c) => c.saldo > 0).sort((a, b) => a.venta.fecha.localeCompare(b.venta.fecha)), [m.ventas, m.partesTienda])
  const [fecha, setFecha] = useState(hoy)
  const [medio, setMedio] = useState<MedioPago>('shopify')
  const [ref, setRef] = useState('')
  const [nota, setNota] = useState('')
  const [montos, setMontos] = useState<Record<string, string>>({})
  const [total, setTotal] = useState('')
  const [ocupado, setOcupado] = useState(false)
  useEffect(() => { if (abierta) { setFecha(hoy); setMedio('shopify'); setRef(''); setNota(''); setMontos({}); setTotal(''); setOcupado(false); setDestino(leerUltimoDestino()); setComp(SIN_COMPROBANTES) } }, [abierta, hoy])
  const elegidos = Object.entries(montos).filter(([, v]) => (leerMonto(v) ?? 0) > 0)
  const suma = deCentavos(elegidos.reduce((s, [, v]) => s + aCentavos(leerMonto(v) ?? 0), 0))
  const malo = elegidos.find(([id, v]) => (leerMonto(v) ?? 0) > (pendientes.find((p) => p.venta.id === id)?.saldo ?? 0) + 0.001)
  const repartir = () => {
    const t = leerMonto(total)
    if (!t) return
    const r = repartirPago(t, pendientes.map((p) => ({ id: p.venta.id, saldo: p.saldo })))
    setMontos(Object.fromEntries(r.map((x) => [x.venta_id, x.monto.toFixed(2)])))
  }
  const problema = !elegidos.length ? 'Marca al menos un pedido.' : malo ? 'Un monto pasa lo que debe ese pedido.' : null
  const guardar = async () => {
    if (problema || ocupado) return
    setOcupado(true)
    try {
      const comprobantes = await subirComprobantes(almacen, 'tienda', comp)
      const [p] = await insertar('ctl_tienda_pagos', [{ fecha, medio, monto: suma, referencia: ref.trim() || null, nota: nota.trim() || null, destino: destino || null, comprobantes }])
      const partes = await insertar('ctl_tienda_pago_partes', elegidos.map(([venta_id, v]) => ({ pago_id: p.id, venta_id, monto: leerMonto(v) })))
      if (destino) guardarUltimoDestino(destino)
      avisar(`Pago de ${quetzales(suma)} registrado en ${elegidos.length} ${elegidos.length === 1 ? 'pedido' : 'pedidos'}.`, 'bien', { texto: 'Deshacer', hacer: async () => { await borrar('ctl_tienda_pago_partes', partes.map((x) => x.id)); await borrar('ctl_tienda_pagos', [p.id]); avisar('Se deshizo.') } })
      onCerrar()
    } catch (e) { avisar(e instanceof Error ? e.message : 'No se pudo guardar.', 'error'); setOcupado(false) }
  }
  return (
    <Ventana abierta={abierta} ancho="amplia" titulo="Registrar pago de la tienda" subtitulo="Un pago de Shopify, contra entrega o una liquidación de Dropi, ligado a sus pedidos." onCerrar={onCerrar} pie={
      <>
        <button type="button" className="m-btn m-btn-fantasma" onClick={onCerrar} title="Cerrar sin guardar">Cancelar</button>
        <button type="button" className="m-btn m-btn-primario c-btn-principal" disabled={!!problema || ocupado} onClick={() => void guardar()} title={problema ? `Apagado: ${problema}` : 'Registra el pago y lo liga a los pedidos marcados; se puede deshacer'}>{ocupado ? 'Guardando…' : `Registrar ${quetzales(suma)}`}</button>
      </>
    }>
      <div className="c-form">
        <div className="m-campo"><label htmlFor="tp-f">Fecha</label><input id="tp-f" type="date" className="m-entrada" value={fecha} onChange={(e) => setFecha(e.target.value)} /></div>
        <div className="m-campo"><label htmlFor="tp-m">Medio</label><select id="tp-m" className="m-entrada" value={medio} onChange={(e) => setMedio(e.target.value as MedioPago)}>{MEDIOS.map((x) => <option key={x.valor} value={x.valor}>{x.nombre}</option>)}</select></div>
        <div className="m-campo"><label htmlFor="tp-r">Referencia <span className="c-opcional">(opcional)</span></label><input id="tp-r" className="m-entrada" value={ref} maxLength={120} onChange={(e) => setRef(e.target.value)} /></div>
        <div className="m-campo"><label htmlFor="tp-t">Repartir un total <span className="c-opcional">(opcional)</span></label><div className="c-fila-botones"><input id="tp-t" className="m-entrada m-num" inputMode="decimal" placeholder="Q 0.00" value={total} onChange={(e) => setTotal(e.target.value)} /><button type="button" className="m-btn m-btn-secundario" onClick={repartir} title="Repartir el total en los pedidos más viejos primero">Repartir</button></div></div>
        <div className="m-campo"><label htmlFor="tp-d">Dónde cayó</label><SelectBuscable id="tp-d" valor={destino} onCambio={setDestino} vacio="Sin indicar" opciones={destinos} /></div>
        <div className="m-campo c-ancho"><label htmlFor="tp-comp">Comprobante <span className="c-opcional">(opcional)</span></label><Comprobantes id="tp-comp" valor={comp} onCambio={setComp} /></div>
        <div className="m-campo c-ancho"><label htmlFor="tp-n">Nota <span className="c-opcional">(opcional)</span></label><input id="tp-n" className="m-entrada" value={nota} maxLength={500} onChange={(e) => setNota(e.target.value)} /></div>
      </div>
      {pendientes.length === 0 ? <p className="m-texto-suave">No hay pedidos por cobrar.</p> : (
        <ul className="c-lista-saldos c-lista-pagar">
          {pendientes.map((p) => {
            const v = montos[p.venta.id] ?? ''
            return (
              <li key={p.venta.id}>
                <label className="c-casilla"><input type="checkbox" checked={!!v} onChange={(e) => setMontos((x) => ({ ...x, [p.venta.id]: e.target.checked ? p.saldo.toFixed(2) : '' }))} /><span><b>{p.venta.pedido}</b><small> · {fechaCorta(p.venta.fecha)} · debe {quetzales(p.saldo)}</small></span></label>
                <input className="m-entrada m-num c-monto-corto" inputMode="decimal" aria-label={`Monto para ${p.venta.pedido}`} placeholder="Q 0.00" value={v} onChange={(e) => setMontos((x) => ({ ...x, [p.venta.id]: e.target.value }))} />
              </li>
            )
          })}
        </ul>
      )}
    </Ventana>
  )
}

export default function PagosTienda() {
  const m = useModelo()
  const { borrar, insertar, guardar, tablas } = useDatos()
  const avisar = useAvisar()
  const [periodo, setPeriodo] = usePeriodo()
  const [nuevo, setNuevo] = useState(false)
  const [quitar, setQuitar] = useState<PagoTienda[]>([])
  const [editar, setEditar] = useState<PagoTienda | null>(null)
  const delMes = m.pagosTienda.filter((p) => periodoDe(p.fecha) === periodo)
  const total = deCentavos(delMes.reduce((s, p) => s + aCentavos(p.monto), 0))
  const pedidosDe = (id: string) => m.partesTienda.filter((x) => x.pago_id === id).map((x) => m.ventas.find((v) => v.id === x.venta_id)?.pedido).filter(Boolean).join(', ')
  const medio = (k: string) => MEDIOS.find((x) => x.valor === k)?.nombre ?? k
  return (
    <>
      <div className="c-cabeza">
        <div><span className="m-etiqueta">Hogar Canela</span><h1 className="erp-titulo">Pagos de la tienda</h1><Pasos /></div>
        <div className="c-cabeza-acciones">
          <SelectorMes periodo={periodo} onCambio={setPeriodo} />
          <button type="button" className="m-btn m-btn-primario" onClick={() => setNuevo(true)} title="Registrar lo que entró y ligarlo a sus pedidos"><Plus size={16} aria-hidden /> Registrar pago</button>
        </div>
      </div>
      <Tabla
        quitarVarias={(l) => setQuitar(l)}
        titulo={`${delMes.length} ${delMes.length === 1 ? 'pago' : 'pagos'}`}
        filas={delMes}
        clave={(p) => p.id}
        vacio="No hay pagos en este mes."
        columnas={[
          { titulo: 'Fecha', valor: (p) => fechaCorta(p.fecha), orden: (p) => p.fecha },
          { titulo: 'Medio', principal: true, valor: (p) => <>{medio(p.medio)}{p.referencia && <small>Ref. {p.referencia}</small>}</> },
          { titulo: 'Pedidos', valor: (p) => pedidosDe(p.id) || <span className="m-vacia">—</span> },
          { titulo: 'Monto', num: true, valor: (p) => quetzales(p.monto), orden: (p) => p.monto },
        ]}
        acciones={(p) => (
          <>
            <VerComprobantes rutas={Array.isArray(p.comprobantes) ? p.comprobantes : []} titulo={`Comprobante del pago del ${fechaCorta(p.fecha)}`} />
            <button type="button" className="m-icono-btn" onClick={() => setEditar(p)} aria-label="Editar" title="Corregir la fecha, el medio o la referencia"><Pencil aria-hidden /></button>
            <button type="button" className="m-icono-btn" onClick={() => setQuitar([p])} aria-label="Quitar" title="Quitar el pago (los pedidos vuelven a quedar por cobrar)"><Trash2 aria-hidden /></button>
          </>
        )}
        pie={<tr><td colSpan={3}>Total del mes</td><td className="m-num">{quetzales(total)}</td><td /></tr>}
      />
      <NuevoPago abierta={nuevo} onCerrar={() => setNuevo(false)} />
      <Confirmar abierta={quitar.length > 0} titulo={quitar.length > 1 ? `Quitar ${quitar.length} pagos` : 'Quitar pago'} peligro boton={quitar.length > 1 ? 'Quitar los pagos' : 'Quitar el pago'} texto={quitar.length === 1 ? `Se quita el pago de ${quetzales(quitar[0].monto)} del ${fechaCorta(quitar[0].fecha)} y sus pedidos vuelven a quedar por cobrar.` : `Se quitan ${quitar.length} pagos por ${quetzales(quitar.reduce((t, x) => t + x.monto, 0))} y sus pedidos vuelven a quedar por cobrar.`}
        onNo={() => setQuitar([])}
        onSi={async () => {
          const ids = new Set(quitar.map((x) => x.id))
          const pagos = tablas.ctl_tienda_pagos.filter((x) => ids.has(x.id))
          const partesP = tablas.ctl_tienda_pago_partes.filter((x) => ids.has(String(x.pago_id)))
          setQuitar([])
          if (partesP.length) await borrar('ctl_tienda_pago_partes', partesP.map((x) => x.id))
          await borrar('ctl_tienda_pagos', [...ids])
          avisar(ids.size === 1 ? 'Pago quitado.' : `Se quitaron ${ids.size} pagos.`, 'bien', { texto: 'Deshacer', hacer: async () => { if (pagos.length) await insertar('ctl_tienda_pagos', pagos.map((x) => ({ ...x }))); if (partesP.length) await insertar('ctl_tienda_pago_partes', partesP.map((x) => ({ ...x }))); avisar('Se deshizo.') } })
        }} />
      <FormRegistro abierta={editar != null} titulo="Editar pago de la tienda" subtitulo={editar ? `${quetzales(editar.monto)} · el monto sale de sus pedidos` : ''}
        campos={[
          { k: 'fecha', etiqueta: 'Fecha', tipo: 'fecha', requerido: true },
          { k: 'medio', etiqueta: 'Medio', tipo: 'select', requerido: true, opciones: MEDIOS },
          { k: 'referencia', etiqueta: 'Referencia', tipo: 'texto', max: 120 },
          { k: 'nota', etiqueta: 'Nota', tipo: 'texto', max: 500, ancho: true },
        ]}
        inicial={editar ? (editar as unknown as Record<string, unknown>) : {}}
        onGuardar={async (d) => { if (editar) await guardar('ctl_tienda_pagos', editar.id, d) }}
        onCerrar={() => setEditar(null)} />
    </>
  )
}
