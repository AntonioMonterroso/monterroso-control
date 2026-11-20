import { VerComprobantes } from '../../componentes/Comprobantes'
import { saldoAFavor } from '../../lib/anticipos'
import { quetzales } from '../../lib/dinero'
import type { EntradaDinero } from '../../lib/entradas'
import { fechaCorta } from '../../lib/fechas'
import { useModelo } from '../../lib/modelo'
import { nombreForma } from '../../lib/pagosDestino'
import { useEntradas, useHoy } from '../../lib/usos'
import TablaEntradas from './TablaEntradas'

export default function HistorialPagos({ clienteId, proyectoId }: { clienteId?: string; proyectoId?: string }) {
  const m = useModelo()
  const hoy = useHoy()
  const todas = useEntradas()
  const lista = todas.filter((e) => e.tipo !== 'tienda' && (!clienteId || e.cliente_id === clienteId) && (!proyectoId || e.proyecto_id === proyectoId))
  const reales = lista.filter((e) => e.tipo === 'pago')
  const suma = (l: EntradaDinero[]) => l.reduce((t, e) => t + Math.round(e.monto * 100), 0) / 100
  const delAnio = reales.filter((e) => e.fecha.slice(0, 4) === hoy.slice(0, 4))
  const cliente = clienteId ?? m.proyectos.find((p) => p.id === proyectoId)?.cliente_id ?? ''
  const favor = cliente ? saldoAFavor(cliente, m.anticipos, m.pagos, proyectoId) : 0
  return (
    <section>
      <h2 className="m-seccion-titulo">Pagos que hizo</h2>
      <div className="erp-kpis c-kpis-chicos">
        <div className="erp-kpi exito"><span className="m-etiqueta">Pagó este año</span><b>{quetzales(suma(delAnio))}</b><small>{delAnio.length} {delAnio.length === 1 ? 'pago' : 'pagos'}</small></div>
        <div className="erp-kpi"><span className="m-etiqueta">Pagó desde siempre</span><b>{quetzales(suma(reales))}</b><small>{reales.length} {reales.length === 1 ? 'pago' : 'pagos'}</small></div>
        <div className="erp-kpi"><span className="m-etiqueta">Saldo a favor</span><b>{quetzales(favor)}</b><small>de anticipos sin aplicar</small></div>
      </div>
      {lista.length > 0 && (
        <ol className="c-linea-tiempo" aria-label="Línea de tiempo de pagos">
          {lista.slice(0, 8).map((e) => (
            <li key={e.id}>
              <span className="c-lt-fecha">{fechaCorta(e.fecha)}</span>
              <span><b>{e.tipo === 'anticipo' ? 'Anticipo' : e.concepto}</b><small>{e.forma === 'anticipo' ? 'Del saldo a favor' : nombreForma(e.forma)}{e.recibo ? ` · recibo ${String(e.recibo).padStart(5, '0')}` : ''}</small></span>
              <span className="c-lt-monto"><b className="m-cifra">{quetzales(e.monto)}</b> <VerComprobantes rutas={e.comprobantes} titulo={`Comprobante · ${e.concepto}`} /></span>
            </li>
          ))}
        </ol>
      )}
      <TablaEntradas entradas={lista} titulo={`${lista.length} ${lista.length === 1 ? 'movimiento' : 'movimientos'}`} conCliente={!clienteId} vacio="Todavía no hay pagos." />
    </section>
  )
}
