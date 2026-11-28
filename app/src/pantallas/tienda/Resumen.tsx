import ResumenNegocio from '../../componentes/ResumenNegocio'
import { Link } from 'react-router-dom'
import Tabla from '../../componentes/Tabla'
import { aCentavos, deCentavos, quetzales } from '../../lib/dinero'
import { fechaCorta } from '../../lib/fechas'
import { periodoDe } from '../../lib/finanzas'
import { useModelo } from '../../lib/modelo'
import { utilidadVenta } from '../../lib/shopify'
import { cobrosDeVentas } from '../../lib/tiendaPagos'
import { usePeriodo } from '../../lib/usos'
import { EstadoVentaCobro } from './Pagos'

export default function ResumenTienda() {
  const m = useModelo()
  const [per, setPer] = usePeriodo()
  const delMes = m.ventas.filter((v) => periodoDe(v.fecha) === per && v.estado !== 'devuelto')
  const suma = (f: (v: (typeof delMes)[number]) => number) => deCentavos(delMes.reduce((s, v) => s + aCentavos(f(v)), 0))
  const ventas = suma((v) => v.precio_venta)
  const costo = suma((v) => v.costo_producto + v.envio + v.comision + v.otros)
  const util = deCentavos(delMes.reduce((s, v) => s + aCentavos(utilidadVenta(v)), 0))
  const cobros = cobrosDeVentas(m.ventas, m.partesTienda)
  const porCobrar = cobros.filter((c) => c.saldo > 0).sort((x, y) => x.venta.fecha.localeCompare(y.venta.fecha))
  const canela = m.negocios.find((n) => n.clave === 'canela')
  const gastosMes = deCentavos(m.gastos.filter((g) => g.negocio_id === canela?.id && periodoDe(g.fecha) === per).reduce((s, g) => s + aCentavos(g.monto), 0))
  return (
    <ResumenNegocio clave="canela" titulo="Los pedidos" periodo={per} onPeriodo={setPer}>
      <div className="erp-kpis">
        <div className="erp-kpi"><span className="m-etiqueta">Ventas del mes</span><b>{quetzales(ventas)}</b><small>{delMes.length} {delMes.length === 1 ? 'pedido' : 'pedidos'}</small></div>
        <div className="erp-kpi"><span className="m-etiqueta">Costo de los pedidos</span><b>{quetzales(costo)}</b><small>producto, envío y comisiones</small></div>
        <div className="erp-kpi"><span className="m-etiqueta">Utilidad de los pedidos</span><b className={util < 0 ? 'm-negativo' : undefined}>{quetzales(util)}</b><small>menos gastos de la tienda: {quetzales(deCentavos(aCentavos(util) - aCentavos(gastosMes)))}</small></div>
      </div>
      <section>
        <div className="c-ficha-cabeza">
          <h2 className="m-seccion-titulo">Pedidos por cobrar</h2>
          <Link className="m-btn m-btn-secundario m-btn-sm" to="/tienda/pagos" title="Registrar un pago">Registrar pago</Link>
        </div>
        <Tabla filas={porCobrar} clave={(c) => c.venta.id} vacio="Todos los pedidos están pagados."
          columnas={[
            { titulo: 'Fecha', valor: (c) => fechaCorta(c.venta.fecha), orden: (c) => c.venta.fecha },
            { titulo: 'Pedido', principal: true, valor: (c) => <>{c.venta.pedido}<small>{c.venta.descripcion}</small></> },
            { titulo: 'Estado', valor: (c) => <EstadoVentaCobro estado={c.estado} />, orden: (c) => c.estado },
            { titulo: 'Venta', num: true, valor: (c) => quetzales(c.venta.precio_venta), orden: (c) => c.venta.precio_venta },
            { titulo: 'Debe', num: true, valor: (c) => quetzales(c.saldo), orden: (c) => c.saldo },
          ]} />
      </section>
    </ResumenNegocio>
  )
}
