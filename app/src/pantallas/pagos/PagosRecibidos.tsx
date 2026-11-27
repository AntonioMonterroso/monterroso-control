import type { ClaveEstudio } from '../../lib/estudio'
import { X } from 'lucide-react'
import MenuMas from '../../componentes/MenuMas'
import RegistrarPago from './RegistrarPago'
import { useMemo, useState } from 'react'
import Buscador, { coincide } from '../../componentes/Buscador'
import Pasos from '../../componentes/Pasos'
import SelectBuscable from '../../componentes/SelectBuscable'
import { quetzales } from '../../lib/dinero'
import type { EntradaDinero } from '../../lib/entradas'
import { hoyISO } from '../../lib/fechas'
import { useModelo } from '../../lib/modelo'
import { FORMAS, grupoDestino, nombreForma } from '../../lib/pagosDestino'
import { useSA } from '../../lib/saModelo'
import { enCuentaPersonalSA } from '../../lib/traslados'
import { useEntradas } from '../../lib/usos'
import { useOpcionesDestino } from '../cobros/Ventanas'
import { VentanaAnticipo } from './Anticipos'
import TablaEntradas, { BotonesSalidaPagos, useNombres } from './TablaEntradas'

type Periodo = 'mes' | 'anterior' | 'anio' | 'rango' | 'todo'
type Vista = 'lista' | 'mes' | 'cliente'

function rangoDe(p: Periodo, desde: string, hasta: string): [string, string] {
  const hoy = hoyISO()
  const [a, m] = [Number(hoy.slice(0, 4)), Number(hoy.slice(5, 7))]
  if (p === 'mes') return [`${hoy.slice(0, 7)}-01`, `${hoy.slice(0, 7)}-31`]
  if (p === 'anterior') { const pa = m === 1 ? a - 1 : a, pm = m === 1 ? 12 : m - 1; const k = `${pa}-${String(pm).padStart(2, '0')}`; return [`${k}-01`, `${k}-31`] }
  if (p === 'anio') return [`${a}-01-01`, `${a}-12-31`]
  if (p === 'rango') return [desde || '0000-01-01', hasta || '9999-12-31']
  return ['0000-01-01', '9999-12-31']
}

export default function PagosRecibidos({ negocioClave }: { negocioClave?: ClaveEstudio | 'canela' | 'salario' }) {
  const m = useModelo()
  const todas = useEntradas()
  const n = useNombres()
  const { ids, inicio } = useSA()
  const destinos = useOpcionesDestino()
  const fijo = negocioClave ? m.negocios.find((x) => x.clave === negocioClave) : undefined
  const simple = negocioClave === 'canela' || negocioClave === 'salario'
  const [periodo, setPeriodo] = useState<Periodo>('mes')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [f, setF] = useState({ cliente: '', proyecto: '', negocio: '', forma: '', destino: '', comprobante: '', sa: false })
  const [vista, setVista] = useState<Vista>('lista')
  const [q, setQ] = useState('')
  const [anticipo, setAnticipo] = useState(false)
  const [d0, d1] = rangoDe(periodo, desde, hasta)
  const trasladados = useMemo(() => new Set(m.traslados.flatMap((t) => t.pagos)), [m.traslados])
  const lista = todas.filter((e) =>
    (!fijo || e.negocio_id === fijo.id) &&
    e.fecha >= d0 && e.fecha <= d1 &&
    (!f.cliente || e.cliente_id === f.cliente) && (!f.proyecto || e.proyecto_id === f.proyecto) && (!f.negocio || e.negocio_id === f.negocio) &&
    (!f.forma || (f.forma === 'sin' ? !e.forma : e.forma === f.forma)) &&
    (!f.destino || (f.destino === 'sin' ? !e.destino && e.forma !== 'anticipo' : f.destino.length < 4 ? grupoDestino(e.destino) === f.destino : e.destino === f.destino)) &&
    (!f.comprobante || (f.comprobante === 'si' ? e.comprobantes.length > 0 : e.comprobantes.length === 0)) &&
    (!f.sa || (enCuentaPersonalSA({ ...e, texto: e.concepto }, ids, inicio) && !trasladados.has(e.id))) &&
    coincide(q, n.cliente(e.cliente_id), n.proyecto(e.proyecto_id), e.concepto, e.referencia, nombreForma(e.forma), n.destino(e.destino), e.monto.toFixed(2), e.recibo ? String(e.recibo) : ''),
  )
  const suma = lista.reduce((t, e) => t + Math.round(e.monto * 100), 0) / 100
  const poner = (k: keyof typeof f, v: string | boolean) => setF((x) => ({ ...x, [k]: v }))
  const activos = Object.entries(f).filter(([, v]) => v).length + (q ? 1 : 0)
  const porCliente = vista === 'cliente' ? [...lista.reduce((g, e) => g.set(e.cliente_id ?? (e.tipo === 'tienda' ? 'tienda' : 'salario'), [...(g.get(e.cliente_id ?? (e.tipo === 'tienda' ? 'tienda' : 'salario')) ?? []), e]), new Map<string, EntradaDinero[]>()).entries()].sort((a, b) => n.cliente(a[0]).localeCompare(n.cliente(b[0]), 'es')) : []
  const nombreGrupo = (k: string) => (k === 'tienda' ? 'Hogar Canela' : k === 'salario' ? 'Mi salario' : n.cliente(k))

  return (
    <>
      <div className="c-cabeza">
        <div><span className="m-etiqueta">{fijo ? fijo.nombre : 'Todos los negocios'}</span><h1 className="erp-titulo">Pagos que recibí</h1><Pasos /><p className="c-subtitulo">Todo el dinero que entró, el más nuevo arriba: de quién, por qué, cómo te pagaron y dónde cayó.</p></div>
        <div className="c-cabeza-acciones">
          <BotonesSalidaPagos entradas={lista} nombre={`pagos-recibidos-${d0.slice(0, 7)}`} porMes={vista === 'mes'} />
          {!simple && <MenuMas items={[{ texto: 'Registrar anticipo', titulo: 'Registra un pago adelantado que queda como saldo a favor del cliente', hacer: () => setAnticipo(true) }]} />}
          {negocioClave !== 'canela' && negocioClave !== 'salario' && <RegistrarPago />}
        </div>
      </div>

      <div className="erp-kpis">
        <div className="erp-kpi exito"><span className="m-etiqueta">Entró en este período</span><b>{quetzales(suma)}</b><small>{lista.length} {lista.length === 1 ? 'pago' : 'pagos'}</small></div>
        <div className="erp-kpi"><span className="m-etiqueta">Falta decir dónde cayó</span><b>{lista.filter((e) => !e.destino && e.forma !== 'anticipo').length}</b><small>se completan con el lápiz o marcando varios</small></div>
        <div className="erp-kpi aviso"><span className="m-etiqueta">Sin comprobante</span><b>{lista.filter((e) => !e.comprobantes.length && e.forma !== 'anticipo').length}</b><small>de {lista.length}</small></div>
      </div>

      <div className="c-chips" role="group" aria-label="Período">
        {([['mes', 'Este mes'], ['anterior', 'Mes anterior'], ['anio', 'Este año'], ['rango', 'Rango'], ['todo', 'Desde el inicio']] as [Periodo, string][]).map(([k, t]) => (
          <button key={k} type="button" className="m-chip" aria-pressed={periodo === k} onClick={() => setPeriodo(k)} title={`Muestra los pagos de ${t.toLowerCase()}`}>{t}</button>
        ))}
      </div>
      {periodo === 'rango' && (
        <div className="c-form c-form-fila">
          <div className="m-campo"><label htmlFor="pr-desde">Desde</label><input id="pr-desde" type="date" className="m-entrada" value={desde} onChange={(e) => setDesde(e.target.value)} /></div>
          <div className="m-campo"><label htmlFor="pr-hasta">Hasta</label><input id="pr-hasta" type="date" className="m-entrada" value={hasta} onChange={(e) => setHasta(e.target.value)} /></div>
        </div>
      )}

      <div className="c-herramientas">
        <Buscador valor={q} onCambio={setQ} ayuda="Cliente, concepto, referencia, recibo o monto" />
        <div className="c-chips" role="group" aria-label="Ver como">
          {([['lista', 'Lista'], ['mes', 'Por mes'], ['cliente', 'Por cliente']] as [Vista, string][]).map(([k, t]) => (
            <button key={k} type="button" className="m-chip" aria-pressed={vista === k} onClick={() => setVista(k)} title={`Muestra los pagos ${k === 'lista' ? 'en una sola lista' : k === 'mes' ? 'agrupados por mes con su subtotal' : 'agrupados por cliente con su subtotal'}`}>{t}</button>
          ))}
        </div>
      </div>

      <div className="c-filtros-dim">
        {!simple && <label className="c-dim"><span>Cliente</span><SelectBuscable id="pr-f-cli" valor={f.cliente} onCambio={(v) => poner('cliente', v)} vacio="Todos" opciones={m.clientes.map((c) => ({ valor: c.id, nombre: c.nombre }))} /></label>}
        {!simple && <label className="c-dim"><span>Proyecto</span><SelectBuscable id="pr-f-pro" valor={f.proyecto} onCambio={(v) => poner('proyecto', v)} vacio="Todos" opciones={m.proyectos.filter((p) => !f.cliente || p.cliente_id === f.cliente).map((p) => ({ valor: p.id, nombre: p.nombre }))} /></label>}
        {!negocioClave && <label className="c-dim"><span>Negocio</span><SelectBuscable id="pr-f-neg" valor={f.negocio} onCambio={(v) => poner('negocio', v)} vacio="Todos" opciones={m.negocios.map((x) => ({ valor: x.id, nombre: x.nombre }))} /></label>}
        <label className="c-dim"><span>Forma de pago</span><SelectBuscable id="pr-f-forma" valor={f.forma} onCambio={(v) => poner('forma', v)} vacio="Todas" opciones={[...FORMAS, { valor: 'anticipo', nombre: 'Saldo a favor' }, { valor: 'sin', nombre: 'Sin indicar' }]} /></label>
        <label className="c-dim"><span>Dónde cayó</span><SelectBuscable id="pr-f-dest" valor={f.destino} onCambio={(v) => poner('destino', v)} vacio="Todas" opciones={[{ valor: 'personal', nombre: 'Cuentas personales (todas)' }, { valor: 'sa', nombre: 'Cuentas de la S.A. (todas)' }, ...destinos, { valor: 'sin', nombre: 'Sin indicar' }]} /></label>
        <label className="c-dim"><span>Comprobante</span><SelectBuscable id="pr-f-comp" valor={f.comprobante} onCambio={(v) => poner('comprobante', v)} vacio="Con o sin" opciones={[{ valor: 'si', nombre: 'Con comprobante' }, { valor: 'no', nombre: 'Sin comprobante' }]} /></label>
        <label className="c-casilla c-dim-casilla"><input type="checkbox" checked={f.sa} onChange={(e) => poner('sa', e.target.checked)} /> Pendiente de pasar a la S.A.</label>
      </div>
      {activos > 0 && (
        <p className="c-suma-filtro">
          <span>{lista.length} {lista.length === 1 ? 'pago' : 'pagos'} · <b>{quetzales(suma)}</b></span>
          <button type="button" className="m-btn m-btn-secundario m-btn-sm" onClick={() => { setF({ cliente: '', proyecto: '', negocio: '', forma: '', destino: '', comprobante: '', sa: false }); setQ('') }} title="Quita todos los filtros y la búsqueda"><X size={14} aria-hidden /> Quitar filtros</button>
        </p>
      )}

      {vista === 'cliente' ? (
        <div className="c-grupos">
          {porCliente.map(([k, l]) => <section key={k}><TablaEntradas entradas={l} titulo={`${nombreGrupo(k)} · ${quetzales(l.reduce((t, e) => t + Math.round(e.monto * 100), 0) / 100)}`} conCliente={false} /></section>)}
          {!porCliente.length && <div className="m-vacio c-vacio-chico"><b>No hay pagos con estos filtros</b></div>}
        </div>
      ) : <TablaEntradas entradas={lista} titulo={`${lista.length} ${lista.length === 1 ? 'pago' : 'pagos'}`} agrupar={vista === 'mes' ? 'mes' : null} />}

      <VentanaAnticipo abierta={anticipo} anticipo={null} onCerrar={() => setAnticipo(false)} />
    </>
  )
}
