import Pasos from '../../componentes/Pasos'
import { FileUp, Pencil, Plus, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { useAvisar } from '../../componentes/Avisos'
import Buscador, { coincide } from '../../componentes/Buscador'
import { useQuitar } from '../../lib/quitar'
import FormRegistro, { type Campo } from '../../componentes/FormRegistro'
import Pestanas from '../../componentes/Pestanas'
import SelectorMes from '../../componentes/SelectorMes'
import Tabla from '../../componentes/Tabla'
import Ventana from '../../componentes/Ventana'
import { useDatos } from '../../lib/datos'
import { aCentavos, deCentavos, quetzales } from '../../lib/dinero'
import { fechaCorta } from '../../lib/fechas'
import { periodoDe } from '../../lib/finanzas'
import { useModelo } from '../../lib/modelo'
import { importarShopify, margen, utilidadVenta, type Importacion } from '../../lib/shopify'
import { useHoy, usePeriodo } from '../../lib/usos'
import { cobrosDeVentas } from '../../lib/tiendaPagos'
import { EstadoVentaCobro } from './Pagos'
import type { Producto, VentaTienda } from '../../lib/tipos'

const ESTADO_VENTA: Record<VentaTienda['estado'], [string, string]> = { pendiente: ['Pendiente', 'pendiente'], entregado: ['Entregado', 'aprobado'], devuelto: ['Devuelto', 'error'] }

const camposVenta: Campo[] = [
  { k: 'pedido', etiqueta: 'Número de pedido', tipo: 'texto', requerido: true, max: 60 },
  { k: 'fecha', etiqueta: 'Fecha', tipo: 'fecha', requerido: true },
  { k: 'descripcion', etiqueta: 'Productos', tipo: 'texto', requerido: true, max: 1000, ancho: true },
  { k: 'cliente_nombre', etiqueta: 'Cliente', tipo: 'texto', max: 200 },
  { k: 'cantidad', etiqueta: 'Unidades', tipo: 'numero', requerido: true, min: 0, max: 9999 },
  { k: 'precio_venta', etiqueta: 'Precio de venta', tipo: 'monto', requerido: true },
  { k: 'costo_producto', etiqueta: 'Costo en Dropi', tipo: 'monto', requerido: true },
  { k: 'envio', etiqueta: 'Envío', tipo: 'monto', requerido: true },
  { k: 'comision', etiqueta: 'Comisión', tipo: 'monto', requerido: true },
  { k: 'otros', etiqueta: 'Otros costos', tipo: 'monto', requerido: true },
  { k: 'estado', etiqueta: 'Estado', tipo: 'select', requerido: true, opciones: [{ valor: 'pendiente', nombre: 'Pendiente' }, { valor: 'entregado', nombre: 'Entregado' }, { valor: 'devuelto', nombre: 'Devuelto' }] },
]

const camposProducto: Campo[] = [
  { k: 'nombre', etiqueta: 'Nombre', tipo: 'texto', requerido: true, max: 200, ancho: true },
  { k: 'sku', etiqueta: 'SKU', tipo: 'texto', max: 60, ayuda: 'Sirve para reconocerlo al importar de Shopify.' },
  { k: 'costo', etiqueta: 'Costo', tipo: 'monto', requerido: true },
  { k: 'precio', etiqueta: 'Precio de venta', tipo: 'monto', requerido: true },
  { k: 'envio_estimado', etiqueta: 'Envío estimado', tipo: 'monto', requerido: true },
  { k: 'activo', etiqueta: 'Activo', tipo: 'casilla' },
  { k: 'compartir', etiqueta: 'Compartir este precio con la página', tipo: 'casilla' },
]

export default function Tienda({ fija }: { fija?: 'pedidos' | 'productos' } = {}) {
  const m = useModelo()
  const { guardar, insertar } = useDatos()
  const avisar = useAvisar()
  const hoy = useHoy()
  const [periodo, setPeriodo] = usePeriodo()
  const [vistaSel, setVista] = useState<'pedidos' | 'productos'>('pedidos')
  const vista = fija ?? vistaSel
  const [q, setQ] = useState('')
  const [venta, setVenta] = useState<VentaTienda | 'nuevo' | null>(null)
  const [producto, setProducto] = useState<Producto | 'nuevo' | null>(null)
  const qt = useQuitar()
  const setQuitar = (x: VentaTienda) => qt.pedir('ctl_ventas_tienda', [x], `Se quita el pedido ${x.pedido}.`)
  const [imp, setImp] = useState<Importacion | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const archivo = useRef<HTMLInputElement>(null)

  const delMes = m.ventas.filter((v) => periodoDe(v.fecha) === periodo && coincide(q, v.pedido, v.descripcion, v.cliente_nombre))
  const suma = (k: 'precio_venta' | 'costo') => deCentavos(delMes.filter((v) => v.estado !== 'devuelto').reduce((s, v) => s + (k === 'costo' ? aCentavos(v.costo_producto) + aCentavos(v.envio) + aCentavos(v.comision) + aCentavos(v.otros) : aCentavos(v.precio_venta)), 0))
  const util = deCentavos(delMes.reduce((s, v) => s + aCentavos(utilidadVenta(v)), 0))
  const cobrosV = cobrosDeVentas(m.ventas, m.partesTienda)
  const cobro = (id: string) => cobrosV.find((c) => c.venta.id === id)?.estado ?? 'por_cobrar'
  const productos = m.productos.filter((p) => coincide(q, p.nombre, p.sku))

  const leerArchivo = async (f: File | undefined) => {
    if (!f) return
    const texto = await f.text()
    setImp(importarShopify(texto, m.ventas.map((v) => v.pedido), m.productos))
    if (archivo.current) archivo.current.value = ''
  }
  const confirmarImp = async () => {
    if (!imp) return
    setOcupado(true)
    try {
      await insertar('ctl_ventas_tienda', imp.nuevos)
      avisar(`${imp.nuevos.length} pedidos importados.`)
      setImp(null)
    } catch (e) { avisar(e instanceof Error ? e.message : 'No se pudo importar.', 'error') }
    setOcupado(false)
  }

  const v = venta && venta !== 'nuevo' ? venta : null
  const p = producto && producto !== 'nuevo' ? producto : null
  return (
    <>
      <div className="c-cabeza">
        <div><span className="m-etiqueta">Hogar Canela</span><h1 className="erp-titulo">{fija === 'productos' ? 'Productos' : fija === 'pedidos' ? 'Pedidos' : 'Tienda'}</h1><Pasos /></div>
        <div className="c-cabeza-acciones">
          {vista === 'pedidos' && <SelectorMes periodo={periodo} onCambio={setPeriodo} />}
          {vista === 'pedidos' && (
            <label className="m-btn m-btn-secundario c-btn-archivo" title="Importar la exportación de pedidos de Shopify (CSV) sin duplicar">
              <FileUp size={16} aria-hidden /> Importar de Shopify
              <input ref={archivo} type="file" accept=".csv,text/csv" onChange={(e) => void leerArchivo(e.target.files?.[0])} />
            </label>
          )}
          {vista === 'pedidos'
            ? <button type="button" className="m-btn m-btn-primario" onClick={() => setVenta('nuevo')} title="Registrar un pedido a mano"><Plus size={16} aria-hidden /> Nuevo pedido</button>
            : <button type="button" className="m-btn m-btn-primario" onClick={() => setProducto('nuevo')} title="Agregar un producto"><Plus size={16} aria-hidden /> Nuevo producto</button>}
        </div>
      </div>
      {!fija && <Pestanas etiqueta="Ver" valor={vista} onCambio={setVista} opciones={[{ valor: 'pedidos', nombre: 'Pedidos', cuenta: delMes.length }, { valor: 'productos', nombre: 'Productos', cuenta: m.productos.length }]} />}
      {vista === 'pedidos' && (
        <div className="erp-kpis">
          <div className="erp-kpi exito"><span className="m-etiqueta">Ventas</span><b>{quetzales(suma('precio_venta'))}</b><small>{delMes.filter((x) => x.estado !== 'devuelto').length} pedidos</small></div>
          <div className="erp-kpi peligro"><span className="m-etiqueta">Costos</span><b>{quetzales(suma('costo'))}</b><small>producto, envío, comisión y otros</small></div>
          <div className="erp-kpi"><span className="m-etiqueta">Utilidad</span><b className={`${util < 0 ? ' m-negativo' : ''}`}>{quetzales(util)}</b><small>sin contar los devueltos</small></div>
        </div>
      )}
      <div className="c-herramientas"><Buscador valor={q} onCambio={setQ} ayuda={vista === 'pedidos' ? 'Pedido, producto o cliente' : 'Nombre o SKU'} /></div>
      {vista === 'pedidos' ? (
        <Tabla
          buscador={false}
          titulo={`${delMes.length} pedidos`}
          quitarVarias={(l) => qt.pedir('ctl_ventas_tienda', l, `Se quitan ${l.length} pedidos.`)}
          filas={delMes}
          clave={(x) => x.id}
          vacio="No hay pedidos en este mes."
          columnas={[
            { titulo: 'Fecha', valor: (x) => fechaCorta(x.fecha) },
            { titulo: 'Pedido', principal: true, valor: (x) => <>{x.pedido}<small>{x.descripcion}</small></> },
            { titulo: 'Estado', valor: (x) => <span className={`m-estado ${ESTADO_VENTA[x.estado][1]}`}>{ESTADO_VENTA[x.estado][0]}</span>, orden: (x) => x.estado },
            { titulo: 'Cobro', valor: (x) => <EstadoVentaCobro estado={cobro(x.id)} />, orden: (x) => cobro(x.id) },
            { titulo: 'Venta', num: true, valor: (x) => quetzales(x.precio_venta) },
            { titulo: 'Costo', num: true, valor: (x) => quetzales(x.costo_producto + x.envio + x.comision + x.otros) },
            { titulo: 'Utilidad', num: true, valor: (x) => { const u = utilidadVenta(x); return <span className={u < 0 ? 'm-negativo' : undefined}>{quetzales(u)}</span> } },
          ]}
          acciones={(x) => (
            <>
              <button type="button" className="m-icono-btn" onClick={() => setVenta(x)} aria-label="Editar" title="Editar el pedido (por ejemplo, poner el costo real)"><Pencil aria-hidden /></button>
              <button type="button" className="m-icono-btn" onClick={() => setQuitar(x)} aria-label="Quitar" title="Quitar el pedido"><Trash2 aria-hidden /></button>
            </>
          )}
        />
      ) : (
        <Tabla
          buscador={false}
          titulo={`${productos.length} productos`}
          filas={productos}
          clave={(x) => x.id}
          vacio="Todavía no hay productos."
          columnas={[
            { titulo: 'Producto', principal: true, valor: (x) => <>{x.nombre}{x.sku && <small>SKU {x.sku}</small>}{!x.activo && <span className="m-estado bloqueado">Apagado</span>}</> },
            { titulo: 'Costo', num: true, valor: (x) => quetzales(x.costo) },
            { titulo: 'Precio', num: true, valor: (x) => quetzales(x.precio) },
            { titulo: 'Margen', num: true, valor: (x) => `${margen(x.precio, x.costo + x.envio_estimado).toFixed(1)} %` },
            { titulo: 'Página', valor: (x) => (x.compartir ? <span className="m-estado en-proceso">Compartido</span> : <span className="m-vacia">No</span>) },
          ]}
          quitarVarias={(l) => qt.pedir('ctl_productos', l, `Se quitan ${l.length} productos.`)}
          acciones={(x) => (
            <>
              <button type="button" className="m-icono-btn" onClick={() => setProducto(x)} aria-label="Editar" title="Editar el producto"><Pencil aria-hidden /></button>
              <button type="button" className="m-icono-btn" onClick={() => qt.pedir('ctl_productos', [x], `Se quita el producto «${x.nombre}». Los pedidos ya registrados no cambian.`)} aria-label="Quitar" title="Quitar el producto (se puede deshacer)"><Trash2 aria-hidden /></button>
            </>
          )}
        />
      )}
      <FormRegistro abierta={venta != null} titulo={v ? 'Editar pedido' : 'Nuevo pedido'} campos={camposVenta}
        inicial={v ? (v as unknown as Record<string, unknown>) : { fecha: hoy, cantidad: 1, envio: '0', comision: '0', otros: '0', costo_producto: '0', estado: 'entregado' }}
        validar={(x) => (m.ventas.some((y) => y.id !== v?.id && y.pedido.trim().toLowerCase() === (x.pedido ?? '').trim().toLowerCase()) ? 'Ese número de pedido ya está registrado.' : null)}
        onGuardar={async (d) => { await guardar('ctl_ventas_tienda', v?.id ?? null, v ? d : { ...d, origen: 'manual' }) }}
        onCerrar={() => setVenta(null)} />
      <FormRegistro abierta={producto != null} titulo={p ? 'Editar producto' : 'Nuevo producto'} campos={camposProducto}
        inicial={p ? (p as unknown as Record<string, unknown>) : { activo: true, envio_estimado: '0' }}
        onGuardar={async (d) => { await guardar('ctl_productos', p?.id ?? null, d) }}
        onCerrar={() => setProducto(null)} />
      <Ventana abierta={imp != null} titulo="Importar pedidos de Shopify" onCerrar={() => setImp(null)} pie={
        <>
          <button type="button" className="m-btn m-btn-fantasma" onClick={() => setImp(null)} title="No importar nada">Cancelar</button>
          <button type="button" className="m-btn m-btn-primario" disabled={!imp?.nuevos.length || ocupado} onClick={() => void confirmarImp()} title="Guardar los pedidos nuevos">{ocupado ? 'Importando…' : `Importar ${imp?.nuevos.length ?? 0} pedidos`}</button>
        </>
      }>
        {imp && (
          <div className="c-resumen-imp">
            <p><b>{imp.nuevos.length}</b> pedidos nuevos · <b>{imp.repetidos.length}</b> ya estaban y no se duplican{imp.errores.length ? <> · <b>{imp.errores.length}</b> con problemas</> : null}</p>
            {imp.errores.map((e) => <p key={e} className="c-error">{e}</p>)}
            {imp.nuevos.length > 0 && (
              <ul className="c-lista-saldos">
                {imp.nuevos.slice(0, 50).map((x) => <li key={x.pedido}><span><b>{x.pedido}</b><small> · {fechaCorta(x.fecha)} · {x.descripcion}</small></span><b className="m-cifra">{quetzales(x.precio_venta)}</b></li>)}
              </ul>
            )}
            {imp.nuevos.some((x) => x.costo_producto === 0) && <p className="c-nota">Algunos pedidos no encontraron su producto: entran con costo cero y puedes ponerlo con el lápiz.</p>}
          </div>
        )}
      </Ventana>
      {qt.ventana}
    </>
  )
}
