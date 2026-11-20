import { FileDown, Pencil, Printer, Trash2 } from 'lucide-react'
import { useQuitar } from '../../lib/quitar'
import { useDatos } from '../../lib/datos'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { VerComprobantes } from '../../componentes/Comprobantes'
import Tabla, { type Columna } from '../../componentes/Tabla'
import { quetzales } from '../../lib/dinero'
import { posiblesRepetidos, type EntradaDinero } from '../../lib/entradas'
import { fechaCorta, nombreMes, partes } from '../../lib/fechas'
import { esc as escHtml, imprimir } from '../../lib/imprimir'
import { useModelo } from '../../lib/modelo'
import { grupoDestino, nombreDestino, nombreForma } from '../../lib/pagosDestino'
import { useSA } from '../../lib/saModelo'
import { enCuentaPersonalSA } from '../../lib/traslados'
import type { Pago } from '../../lib/tipos'
import { htmlRecibo, imprimirRecibo } from '../cobros/documentos'
import { VentanaCompletarPagos } from '../cobros/Ventanas'
import VentanaEditarPago, { VentanaEliminarPagos } from './EditarPago'
import DetalleEntrada from './DetalleEntrada'
import { VentanaAnticipo } from './Anticipos'
import { VentanaTiendaDestino } from './TiendaDestino'

export function useNombres() {
  const m = useModelo()
  const sa = m.bancos.map((b) => ({ id: b.id, banco: b.banco, numero: b.numero, nombre: b.nombre, activo: b.activo }))
  return {
    cliente: (id: string | null) => m.clientes.find((c) => c.id === id)?.nombre ?? '',
    proyecto: (id: string | null) => m.proyectos.find((p) => p.id === id)?.nombre ?? '',
    destino: (d: string | null) => nombreDestino(d, m.cuentas, sa, m.cuentasWorld),
  }
}

export function bajarRecibos(l: EntradaDinero[], cliente: (id: string | null) => string, clientes: ReturnType<typeof useModelo>['clientes']) {
  const conRecibo = l.filter((e) => e.pago && e.recibo)
  if (!conRecibo.length) return false
  const cuerpo = conRecibo.map((e) => `<section style="page-break-after:always">${htmlRecibo(e.pago!, clientes.find((c) => c.id === e.cliente_id), e.concepto).cuerpo}</section>`).join('')
  imprimir(`Recibos (${conRecibo.length})`, cuerpo, escHtml(`${conRecibo.length} recibos · ${cliente(conRecibo[0].cliente_id)}`))
  return true
}

export function origenDe(e: EntradaDinero): string {
  const f = new Date(e.creado || e.fecha).toLocaleDateString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric' })
  return e.pago?.origen === 'world' ? `Anotado en Monterroso World el ${f}` : `Anotado en Control el ${f}`
}

export function useRepetidos() {
  const m = useModelo()
  return useMemo(() => posiblesRepetidos(m.pagos), [m.pagos])
}

export default function TablaEntradas({ entradas, titulo, conCliente = true, agrupar, vacio = 'No hay pagos con estos filtros.' }: { entradas: EntradaDinero[]; titulo?: string; conCliente?: boolean; agrupar?: 'mes' | null; vacio?: string }) {
  const m = useModelo()
  const { ids, inicio } = useSA()
  const n = useNombres()
  const repetidos = useRepetidos()
  const [detalle, setDetalle] = useState<EntradaDinero | null>(null)
  const [editarPago, setEditarPago] = useState<Pago | null>(null)
  const [editarAnticipo, setEditarAnticipo] = useState<EntradaDinero | null>(null)
  const [editarTienda, setEditarTienda] = useState<EntradaDinero | null>(null)
  const [completar, setCompletar] = useState<Pago[]>([])
  const q = useQuitar()
  const { tablas } = useDatos()
  const [eliminar, setEliminar] = useState<Pago[]>([])
  const quitable = (e: EntradaDinero) => (e.pago ? true : e.anticipo ? !m.pagos.some((p) => p.anticipo_id === e.anticipo!.id) : false)
  const quitar = (l: EntradaDinero[]) => {
    const pagos = l.filter((e) => e.pago).map((e) => e.pago!)
    const ants = l.filter((e) => e.anticipo && quitable(e)).map((e) => tablas.ctl_anticipos.find((f) => f.id === e.anticipo!.id)).filter((f): f is NonNullable<typeof f> => !!f)
    if (pagos.length) setEliminar(pagos)
    else if (ants.length) q.pedir('ctl_anticipos', ants, ants.length === 1 ? 'Se elimina este anticipo (no se ha aplicado a ningún cobro).' : `Se eliminan ${ants.length} anticipos sin aplicar.`)
  }

  const columnas: Columna<EntradaDinero>[] = [
    { titulo: 'Fecha', valor: (e) => fechaCorta(e.fecha), orden: (e) => e.fecha },
    { titulo: 'Cliente', principal: true, oculto: !conCliente, valor: (e) => <>{e.tipo === 'tienda' ? 'Hogar Canela' : e.pago?.cobro_clave.startsWith('s:') ? 'Mi salario' : e.cliente_id ? <Link to={`/clientes/${encodeURIComponent(e.cliente_id)}`} className="c-enlace" onClick={(x) => x.stopPropagation()}>{n.cliente(e.cliente_id)}</Link> : <span className="m-vacia">—</span>}{e.proyecto_id && <small>{n.proyecto(e.proyecto_id)}</small>}</>, orden: (e) => n.cliente(e.cliente_id).toLowerCase() },
    { titulo: 'Concepto', principal: !conCliente, valor: (e) => <>{e.concepto}{e.tipo === 'anticipo' && <span className="m-estado en-proceso">Anticipo</span>}{repetidos.has(e.id) && <button type="button" className="m-estado error c-chip-boton" onClick={(x) => { x.stopPropagation(); setDetalle(e) }} title="Hay otro pago igual (mismo proyecto, monto y fecha, o la misma inscripción); ábrelo para revisar">¿Repetido?</button>}{e.pago?.origen === 'world' && e.pago.nota && <small>«{e.pago.nota}»</small>}<small className="c-origen">{origenDe(e)}</small>{(e.referencia || e.recibo || (!conCliente && e.proyecto_id)) && <small>{[!conCliente && e.proyecto_id ? n.proyecto(e.proyecto_id) : '', e.referencia ? `Ref. ${e.referencia}` : '', e.recibo ? `Recibo ${String(e.recibo).padStart(5, '0')}` : ''].filter(Boolean).join(' · ')}</small>}</> },
    { titulo: 'Forma', valor: (e) => (e.forma ? nombreForma(e.forma) : <button type="button" className="m-estado pendiente c-chip-boton" onClick={(x) => { x.stopPropagation(); editar(e) }} title="Abre el pago para decir cómo te pagaron">Falta la forma</button>) },
    { titulo: 'Dónde cayó', valor: (e) => (e.forma === 'anticipo' ? <span className="m-vacia">Del saldo a favor</span> : <>{e.destino ? n.destino(e.destino) : <button type="button" className="m-estado pendiente c-chip-boton" onClick={(x) => { x.stopPropagation(); editar(e) }} title="Abre el pago para decir en qué cuenta cayó el dinero">Falta decir dónde cayó</button>}{enCuentaPersonalSA({ ...e, texto: e.concepto }, ids, inicio) && !m.traslados.some((t) => t.pagos.includes(e.id)) && <small className="c-alerta-txt">Pendiente de pasar a la S.A.</small>}</>), orden: (e) => grupoDestino(e.destino) },
    { titulo: 'Monto', num: true, valor: (e) => quetzales(e.monto), orden: (e) => e.monto },
  ]

  const total = entradas.reduce((t, e) => t + Math.round(e.monto * 100), 0) / 100
  const editar = (e: EntradaDinero) => (e.pago ? setEditarPago(e.pago) : e.anticipo ? setEditarAnticipo(e) : setEditarTienda(e))
  const tabla = (l: EntradaDinero[], tit?: string, nota?: string) => (
    <Tabla
      titulo={tit}
      nota={nota}
      filas={l}
      clave={(e) => e.id}
      vacio={vacio}
      onFila={setDetalle}
      columnas={columnas}
      marcable={(e) => e.tipo === 'pago' || quitable(e)}
      masa={[
        { texto: 'Completar forma y cuenta', titulo: (k) => `Pone la forma de pago y dónde cayó a los ${k} pagos marcados; se puede deshacer`, hacer: (x) => setCompletar(x.map((e) => e.pago!).filter(Boolean)) },
        { texto: 'Eliminar los marcados', titulo: (k) => `Muestra qué cobros vuelven a quedar pendientes al eliminar los ${k} pagos marcados; pregunta antes y se puede deshacer`, hacer: (x) => quitar(x), peligro: true },
        { texto: 'Bajar recibos', titulo: (k) => `Abre los recibos de los ${k} pagos marcados, listos para guardar en PDF`, hacer: (x) => { bajarRecibos(x, n.cliente, m.clientes) } },
      ]}
      menu={(e) => [
        { texto: 'Ver detalle', titulo: 'Abre qué pagó, sus comprobantes y su historia', hacer: () => setDetalle(e) },
        { texto: 'Editar', titulo: 'Abre el pago para corregirlo', hacer: () => editar(e) },
        ...(quitable(e) ? [{ texto: 'Eliminar pago', titulo: 'Pregunta antes de eliminarlo; se puede deshacer', hacer: () => quitar([e]), peligro: true }] : []),
        ...(e.pago && e.recibo ? [{ texto: 'Recibo', titulo: 'Abre el recibo listo para guardar en PDF', hacer: () => imprimirRecibo(e.pago!, m.clientes.find((c) => c.id === e.cliente_id), e.concepto) }] : []),
      ]}
      acciones={(e) => (
        <>
          <VerComprobantes rutas={e.comprobantes} titulo={`Comprobante · ${e.concepto}`} />
          <button type="button" className="m-icono-btn" onClick={() => editar(e)} aria-label="Editar" title="Abre el pago para corregir la forma, la cuenta, la referencia o el comprobante"><Pencil aria-hidden /></button>
          {quitable(e) && <button type="button" className="m-icono-btn" onClick={() => quitar([e])} aria-label="Eliminar pago" title={e.pago?.origen === 'world' ? 'Elimina este pago aquí y en Monterroso World; pregunta antes y se puede deshacer' : 'Elimina este pago; pregunta antes y se puede deshacer'}><Trash2 aria-hidden /></button>}
        </>
      )}
      pie={<tr><td colSpan={columnas.filter((c) => !c.oculto).length - 1}>Total · {l.length} {l.length === 1 ? 'pago' : 'pagos'}</td><td className="m-num">{quetzales(l.reduce((t, e) => t + Math.round(e.monto * 100), 0) / 100)}</td><td /></tr>}
    />
  )

  const porMes = agrupar === 'mes' ? [...entradas.reduce((g, e) => g.set(e.fecha.slice(0, 7), [...(g.get(e.fecha.slice(0, 7)) ?? []), e]), new Map<string, EntradaDinero[]>()).entries()] : []

  return (
    <>
      {agrupar === 'mes' && porMes.length > 1 ? (
        <div className="c-grupos">
          {porMes.map(([mes, l]) => { const [a, mm] = partes(`${mes}-01`); return <section key={mes}>{tabla(l, nombreMes(a, mm), `Subtotal ${quetzales(l.reduce((t, e) => t + Math.round(e.monto * 100), 0) / 100)}`)}</section> })}
          <p className="c-total-final"><span>Total</span><b className="m-cifra">{quetzales(total)}</b></p>
        </div>
      ) : tabla(entradas, titulo)}
      <DetalleEntrada entrada={detalle} onCerrar={() => setDetalle(null)} onEditar={(e) => { setDetalle(null); editar(e) }} />
      <VentanaEditarPago pago={editarPago} onCerrar={() => setEditarPago(null)} />
      <VentanaAnticipo abierta={editarAnticipo != null} anticipo={editarAnticipo?.anticipo ?? null} onCerrar={() => setEditarAnticipo(null)} />
      <VentanaTiendaDestino entrada={editarTienda} onCerrar={() => setEditarTienda(null)} />
      <VentanaCompletarPagos pagos={completar} onCerrar={() => setCompletar([])} />
      {q.ventana}
      <VentanaEliminarPagos pagos={eliminar} onCerrar={() => setEliminar([])} />
    </>
  )
}

export function BotonesSalidaPagos({ entradas, nombre }: { entradas: EntradaDinero[]; nombre: string }) {
  const n = useNombres()
  const filas = entradas.map((e) => [e.fecha, n.cliente(e.cliente_id) || (e.tipo === 'tienda' ? 'Hogar Canela' : ''), n.proyecto(e.proyecto_id), e.concepto, nombreForma(e.forma), e.forma === 'anticipo' ? 'Del saldo a favor' : n.destino(e.destino), e.referencia ?? '', e.recibo ? String(e.recibo).padStart(5, '0') : '', e.monto.toFixed(2)])
  const total = entradas.reduce((t, e) => t + Math.round(e.monto * 100), 0) / 100
  const excel = async () => {
    const { aCSV, descargar } = await import('../../lib/csv')
    descargar(`${nombre}.csv`, aCSV([['Fecha', 'Cliente', 'Proyecto', 'Concepto', 'Forma de pago', 'Dónde cayó', 'Referencia', 'Recibo', 'Monto'], ...filas, ['', '', '', '', '', '', '', 'Total', total.toFixed(2)]]))
  }
  const pdf = () => imprimir('Pagos que recibí', `<h1>Pagos que recibí</h1><p class="sub">${escHtml(nombre)} · ${entradas.length} pagos</p><table><thead><tr><th>Fecha</th><th>Cliente</th><th>Concepto</th><th>Forma</th><th>Dónde cayó</th><th class="n">Monto</th></tr></thead><tbody>${filas.map((f) => `<tr><td>${escHtml(fechaCorta(f[0]))}</td><td>${escHtml(f[1])}</td><td>${escHtml(f[3])}</td><td>${escHtml(f[4])}</td><td>${escHtml(f[5])}</td><td class="n">${escHtml(quetzales(Number(f[8])))}</td></tr>`).join('')}</tbody><tfoot><tr><td colspan="5">Total</td><td class="n">${escHtml(quetzales(total))}</td></tr></tfoot></table>`)
  return (
    <>
      <button type="button" className="m-btn m-btn-salida" disabled={!entradas.length} onClick={() => void excel()} title={entradas.length ? 'Baja a Descargas el historial filtrado para abrirlo en Excel' : 'Apagado: no hay pagos con estos filtros'}><FileDown size={16} aria-hidden /> Excel</button>
      <button type="button" className="m-btn m-btn-salida" disabled={!entradas.length} onClick={pdf} title={entradas.length ? 'Abre el historial filtrado listo para guardar en PDF o imprimir' : 'Apagado: no hay pagos con estos filtros'}><Printer size={16} aria-hidden /> PDF</button>
    </>
  )
}
