import { Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAvisar } from '../../componentes/Avisos'
import Comprobantes, { SIN_COMPROBANTES, subirComprobantes, type ValorComprobantes } from '../../componentes/Comprobantes'
import SelectBuscable from '../../componentes/SelectBuscable'
import Ventana from '../../componentes/Ventana'
import { conceptoDePago } from '../../lib/cobros'
import { sugerirClave } from '../../lib/entradas'
import { useDatos } from '../../lib/datos'
import { leerMonto, quetzales } from '../../lib/dinero'
import { useEscribir } from '../../lib/escribir'
import { fechaCorta } from '../../lib/fechas'
import { useModelo } from '../../lib/modelo'
import { FORMAS } from '../../lib/pagosDestino'
import type { Pago } from '../../lib/tipos'
import { useCobros } from '../../lib/usos'
import { useOpcionesDestino } from '../cobros/Ventanas'

interface Linea { clave: string; monto: string }

export function useAvisosEliminar() {
  const m = useModelo()
  const cobros = useCobros()
  return (pagos: Pago[]) => pagos.map((p) => {
    const traslado = m.traslados.find((t) => t.pagos.includes(p.id))
    const anticipo = p.anticipo_id ? m.anticipos.find((a) => a.id === p.anticipo_id) : null
    return {
      p,
      cobro: conceptoDePago(p.cobro_clave, cobros),
      anticipo: anticipo ? `Vuelven ${quetzales(p.monto)} al saldo a favor del anticipo del ${fechaCorta(anticipo.fecha)}.` : null,
      traslado: traslado ? `Estaba en el traslado a la S.A. del ${fechaCorta(traslado.fecha)}; ese traslado queda igual.` : null,
      world: p.origen === 'world',
    }
  })
}

export function VentanaEliminarPagos({ pagos, onCerrar, onHecho }: { pagos: Pago[]; onCerrar: () => void; onHecho?: () => void }) {
  const esc = useEscribir()
  const avisar = useAvisar()
  const m = useModelo()
  const plan = useAvisosEliminar()(pagos)
  const [ocupado, setOcupado] = useState(false)
  useEffect(() => { setOcupado(false) }, [pagos])
  const total = pagos.reduce((t, p) => t + Math.round(p.monto * 100), 0) / 100
  const world = plan.filter((x) => x.world).length
  return (
    <Ventana abierta={pagos.length > 0} titulo={pagos.length === 1 ? 'Eliminar pago' : `Eliminar ${pagos.length} pagos`} subtitulo={`${quetzales(total)} · lo que pagaron vuelve a quedar pendiente`} onCerrar={onCerrar} pie={
      <>
        <button type="button" className="m-btn m-btn-secundario" onClick={onCerrar} title="Cierra sin eliminar nada">Cancelar</button>
        <button type="button" className="m-btn m-btn-peligro" disabled={ocupado} onClick={async () => {
          setOcupado(true)
          try {
            const deshacer = await esc.eliminarPagos(pagos)
            onHecho?.()
            onCerrar()
            avisar(pagos.length === 1 ? 'Pago eliminado.' : `Se eliminaron ${pagos.length} pagos.`, 'bien', { texto: 'Deshacer', hacer: async () => { await deshacer(); avisar('Se deshizo: los pagos volvieron.') } })
          } catch (e) { avisar(e instanceof Error ? e.message : 'No se pudo eliminar.', 'error'); setOcupado(false) }
        }} title={world ? 'Elimina los pagos aquí y en Monterroso World; se puede deshacer' : 'Elimina los pagos; se puede deshacer'}>{pagos.length === 1 ? 'Eliminar pago' : `Eliminar ${pagos.length}`}</button>
      </>
    }>
      {world > 0 && <p className="c-aviso-fuerte" role="alert">{world === 1 && pagos.length === 1 ? 'Este pago también se borra en Monterroso World.' : `${world} de estos pagos también se borran en Monterroso World.`} Solo se borra el pago; el proyecto y lo demás de World no se toca.</p>}
      <ul className="c-previa-lista">
        {plan.map((x) => (
          <li key={x.p.id}>
            <b>{m.clientes.find((c) => c.id === x.p.cliente_id)?.nombre ?? 'Mi salario'} · {quetzales(x.p.monto)} · {fechaCorta(x.p.fecha)}</b>
            <small>«{x.cobro}» vuelve a quedar por cobrar.</small>
            {x.anticipo && <small>{x.anticipo}</small>}
            {x.traslado && <small>{x.traslado}</small>}
          </li>
        ))}
      </ul>
    </Ventana>
  )
}

export default function VentanaEditarPago({ pago, onCerrar }: { pago: Pago | null; onCerrar: () => void }) {
  const { guardar, almacen } = useDatos()
  const m = useModelo()
  const esc = useEscribir()
  const avisar = useAvisar()
  const cobros = useCobros()
  const destinos = useOpcionesDestino(pago?.destino)
  const [v, setV] = useState({ fecha: '', forma: '', destino: '', referencia: '', nota: '' })
  const [lineas, setLineas] = useState<Linea[]>([])
  const [comp, setComp] = useState<ValorComprobantes>(SIN_COMPROBANTES)
  const [ocupado, setOcupado] = useState(false)
  const [eliminar, setEliminar] = useState<Pago[]>([])
  useEffect(() => {
    if (!pago) return
    setV({ fecha: pago.fecha, forma: pago.forma ?? '', destino: pago.destino ?? '', referencia: pago.referencia ?? '', nota: pago.nota ?? '' })
    setLineas([{ clave: pago.cobro_clave, monto: pago.monto.toFixed(2) }])
    setComp({ existentes: pago.comprobantes, nuevos: [] }); setOcupado(false)
  }, [pago])
  const salario = pago?.cobro_clave.startsWith('s:')
  const delCliente = cobros.filter((c) => (salario ? c.tipo === 'salario' : c.cliente_id === pago?.cliente_id))
  const libre = (clave: string) => { const c = delCliente.find((x) => x.clave === clave); return (c?.saldo ?? 0) + (clave === pago?.cobro_clave ? pago.monto : 0) }
  const opciones = delCliente.filter((c) => c.saldo > 0 || c.clave === pago?.cobro_clave || lineas.some((l) => l.clave === c.clave)).map((c) => ({ valor: c.clave, nombre: `${c.concepto}${c.vence ? ` · ${fechaCorta(c.vence)}` : ''} · falta ${quetzales(libre(c.clave))}` }))
  const sugerida = pago?.origen === 'world' ? sugerirClave(pago.nota, delCliente.filter((c) => c.proyecto_id === pago.proyecto_id || !pago.proyecto_id)) : null
  const montos = lineas.map((l) => leerMonto(l.monto))
  const total = montos.reduce<number>((t, x) => t + (x ?? 0), 0)
  const deAnticipo = pago?.forma === 'anticipo'
  const mundo = (k: string) => /^(i|m|a):/.test(k)
  const problema = !v.fecha ? 'Pon la fecha.'
    : lineas.some((l) => !l.clave) ? 'Elige a qué cobro se aplica cada parte.'
    : montos.some((x) => x == null || x <= 0) ? 'Revisa los montos.'
    : new Set(lineas.map((l) => l.clave)).size !== lineas.length ? 'Un cobro está repetido.'
    : lineas.find((l, i) => (montos[i] ?? 0) > libre(l.clave) + 0.001) ? `Una parte pasa lo que falta de su cobro.`
    : pago?.origen === 'world' && !mundo(lineas[0]?.clave ?? '') ? 'Un pago de Monterroso World solo se aplica a inscripción, mensualidad o pago del trabajo.'
    : null
  const guardarCambios = async () => {
    if (!pago || problema || ocupado) return
    setOcupado(true)
    try {
      const comprobantes = await subirComprobantes(almacen, 'pagos', comp)
      const primera = montos[0] ?? 0
      await esc.anotarCambios(pago.origen === 'world' ? 'payments' : 'ctl_pagos', pago.id, [
        ['fecha', pago.fecha, v.fecha], ['monto', pago.monto.toFixed(2), primera.toFixed(2)], ['nota', pago.nota, v.nota || null],
        ['aplicado', conceptoDePago(pago.cobro_clave, cobros), lineas.map((l, i) => `${conceptoDePago(l.clave, cobros)} ${quetzales(montos[i] ?? 0)}`).join(' + ')],
      ])
      await esc.aplicarPagoA(pago, lineas[0].clave, primera, v.fecha)
      if (pago.origen === 'world') await guardar('payments', pago.id, { note: v.nota ? v.nota.slice(0, 300) : null })
      else await guardar('ctl_pagos', pago.id, { nota: v.nota || null })
      await esc.cambiarPagos([pago], { ...(deAnticipo ? {} : { forma: v.forma || null, destino: v.destino || null }), referencia: v.referencia || null, comprobantes })
      for (let i = 1; i < lineas.length; i++) {
        await esc.registrarPago({ clave: lineas[i].clave, cliente_id: pago.cliente_id ?? '' }, { fecha: v.fecha, monto: montos[i] ?? 0, forma: deAnticipo ? 'anticipo' : v.forma || 'otro', destino: deAnticipo ? null : v.destino || null, referencia: v.referencia || null, nota: v.nota || null, anticipo_id: pago.anticipo_id }, null)
      }
      avisar(lineas.length > 1 ? `Pago repartido en ${lineas.length} cobros.` : 'Pago corregido.')
      onCerrar()
    } catch (e) { avisar(e instanceof Error ? e.message : 'No se pudo guardar.', 'error'); setOcupado(false) }
  }
  return (
    <>
      <Ventana abierta={pago != null} ancho="amplia" titulo="Editar pago" subtitulo={pago?.origen === 'world' ? 'Se corrige también en Monterroso World.' : `${m.clientes.find((c) => c.id === pago?.cliente_id)?.nombre ?? 'Mi salario'}`} onCerrar={onCerrar} pie={
        <>
          <button type="button" className="m-btn m-btn-secundario c-btn-izq" onClick={() => pago && setEliminar([pago])} title={pago?.origen === 'world' ? 'Elimina este pago aquí y en Monterroso World; pregunta antes y se puede deshacer' : 'Elimina este pago; pregunta antes y se puede deshacer'}><Trash2 size={16} aria-hidden /> Eliminar pago</button>
          <button type="button" className="m-btn m-btn-secundario" onClick={onCerrar} title="Cierra sin guardar">Cancelar</button>
          <button type="button" className="m-btn m-btn-primario c-btn-principal" disabled={!!problema || ocupado} onClick={() => void guardarCambios()} title={problema ? `Apagado: ${problema}` : 'Guarda los cambios; quedan en la historia del pago'}>{ocupado ? 'Guardando…' : 'Guardar'}</button>
        </>
      }>
        <form className="c-form" onSubmit={(e) => e.preventDefault()}>
          <div className="m-campo"><label htmlFor="ep-fecha">Fecha del pago</label><input id="ep-fecha" type="date" className="m-entrada" value={v.fecha} onChange={(e) => setV((x) => ({ ...x, fecha: e.target.value }))} /></div>
          <div className="m-campo"><span className="c-etiqueta-campo">Total del pago</span><b className="m-cifra c-total-pago">{quetzales(total)}</b></div>
          {pago?.origen === 'world' && (
            <div className="c-ancho c-info-world">
              <b>Anotado en Monterroso World el {new Date(pago.creado || pago.fecha).toLocaleDateString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric' })}</b>
              {pago.nota && <span>Nota en World: «{pago.nota}»</span>}
              {sugerida && sugerida !== lineas[0]?.clave && <button type="button" className="m-btn m-btn-secundario m-btn-sm" onClick={() => setLineas((ls) => ls.map((y, j) => (j === 0 ? { ...y, clave: sugerida } : y)))} title="Por la nota de World, este pago parece ser de ese cobro">Aplicarlo a «{conceptoDePago(sugerida, cobros)}»</button>}
            </div>
          )}
          <fieldset className="c-bloque c-ancho">
            <legend>A qué se aplicó (tipo y período)</legend>
            {lineas.map((l, i) => (
              <div key={i} className="c-linea-aplica">
                <div className="m-campo"><label htmlFor={`ep-c-${i}`}>Cobro</label><SelectBuscable id={`ep-c-${i}`} valor={l.clave} vacio="Elige…" onCambio={(x) => setLineas((ls) => ls.map((y, j) => (j === i ? { ...y, clave: x } : y)))} opciones={opciones} /></div>
                <div className="m-campo"><label htmlFor={`ep-m-${i}`}>Monto</label><input id={`ep-m-${i}`} className="m-entrada m-num" inputMode="decimal" value={l.monto} onChange={(e) => setLineas((ls) => ls.map((y, j) => (j === i ? { ...y, monto: e.target.value } : y)))} /></div>
                {i > 0 && <button type="button" className="m-icono-btn" onClick={() => setLineas((ls) => ls.filter((_, j) => j !== i))} aria-label="Quitar esta parte" title="Quita esta parte del reparto"><Trash2 aria-hidden /></button>}
              </div>
            ))}
            <button type="button" className="m-btn m-btn-secundario m-btn-sm" onClick={() => setLineas((ls) => [...ls, { clave: '', monto: '' }])} title="Reparte este pago en otro cobro del mismo cliente"><Plus size={14} aria-hidden /> Repartir en otro cobro</button>
          </fieldset>
          {deAnticipo ? <p className="m-texto-suave c-ancho">Se pagó con el saldo a favor del cliente: no tiene forma de pago ni cuenta propia.</p> : (
            <>
              <div className="m-campo"><label htmlFor="ep-forma">Forma de pago</label><select id="ep-forma" className="m-entrada" value={v.forma} onChange={(e) => setV((x) => ({ ...x, forma: e.target.value }))}><option value="">Sin indicar</option>{FORMAS.map((f) => <option key={f.valor} value={f.valor}>{f.nombre}</option>)}</select></div>
              <div className="m-campo"><label htmlFor="ep-destino">Dónde cayó</label><SelectBuscable id="ep-destino" valor={v.destino} onCambio={(d) => setV((x) => ({ ...x, destino: d }))} vacio="Sin indicar" opciones={destinos} /></div>
            </>
          )}
          <div className="m-campo"><label htmlFor="ep-ref">Referencia o número de boleta <span className="c-opcional">(opcional)</span></label><input id="ep-ref" className="m-entrada" maxLength={120} value={v.referencia} onChange={(e) => setV((x) => ({ ...x, referencia: e.target.value }))} /></div>
          <div className="m-campo c-ancho"><label htmlFor="ep-comp">Comprobante <span className="c-opcional">(opcional)</span></label><Comprobantes id="ep-comp" valor={comp} onCambio={setComp} /></div>
          <div className="m-campo c-ancho"><label htmlFor="ep-nota">Nota <span className="c-opcional">(opcional)</span></label><textarea id="ep-nota" className="m-entrada" maxLength={300} value={v.nota} onChange={(e) => setV((x) => ({ ...x, nota: e.target.value }))} /></div>
        </form>
        <VentanaEliminarPagos pagos={eliminar} onCerrar={() => setEliminar([])} onHecho={onCerrar} />
      </Ventana>
    </>
  )
}
