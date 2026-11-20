import { HandCoins, Pencil, Undo2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAvisar } from '../../componentes/Avisos'
import Comprobantes, { SIN_COMPROBANTES, subirComprobantes, VerComprobantes, type ValorComprobantes } from '../../componentes/Comprobantes'
import SelectBuscable from '../../componentes/SelectBuscable'
import Tabla from '../../componentes/Tabla'
import Ventana from '../../componentes/Ventana'
import { planAplicar, saldoAnticipo, type Anticipo } from '../../lib/anticipos'
import { pendientes, type Cobro } from '../../lib/cobros'
import { useDatos } from '../../lib/datos'
import { leerMonto, quetzales } from '../../lib/dinero'
import { useEscribir } from '../../lib/escribir'
import { fechaCorta } from '../../lib/fechas'
import { useModelo } from '../../lib/modelo'
import { FORMAS, nombreForma } from '../../lib/pagosDestino'
import { useSesion } from '../../lib/sesion'
import { useCobros, useHoy } from '../../lib/usos'
import { guardarUltimoDestino, leerUltimoDestino, useOpcionesDestino } from '../cobros/Ventanas'
import { useNombres } from './TablaEntradas'

export function VentanaAnticipo({ abierta, anticipo, clienteFijo, onCerrar }: { abierta: boolean; anticipo: Anticipo | null; clienteFijo?: string; onCerrar: () => void }) {
  const m = useModelo()
  const { guardar, insertar, borrar, almacen } = useDatos()
  const { correo } = useSesion()
  const esc = useEscribir()
  const avisar = useAvisar()
  const hoy = useHoy()
  const destinos = useOpcionesDestino(anticipo?.destino)
  const [v, setV] = useState({ fecha: hoy, cliente_id: '', proyecto_id: '', monto: '', forma: 'transferencia', destino: '', referencia: '', nota: '', aplicar_solo: true })
  const [comp, setComp] = useState<ValorComprobantes>(SIN_COMPROBANTES)
  const [ocupado, setOcupado] = useState(false)
  useEffect(() => {
    if (!abierta) return
    const a = anticipo
    setV({ fecha: a?.fecha ?? hoy, cliente_id: a?.cliente_id ?? clienteFijo ?? '', proyecto_id: a?.proyecto_id ?? '', monto: a ? a.monto.toFixed(2) : '', forma: a?.forma ?? 'transferencia', destino: a?.destino ?? leerUltimoDestino(), referencia: a?.referencia ?? '', nota: a?.nota ?? '', aplicar_solo: a?.aplicar_solo ?? true })
    setComp({ existentes: a?.comprobantes ?? [], nuevos: [] }); setOcupado(false)
  }, [abierta])
  const proyectos = m.proyectos.filter((p) => p.cliente_id === v.cliente_id)
  useEffect(() => { if (abierta && !anticipo && proyectos.length === 1) setV((x) => ({ ...x, proyecto_id: proyectos[0].id })) }, [v.cliente_id])
  const monto = leerMonto(v.monto)
  const usado = anticipo ? m.pagos.filter((p) => p.anticipo_id === anticipo.id).reduce((t, p) => t + p.monto, 0) : 0
  const problema = !v.cliente_id ? 'Elige el cliente.' : monto == null || monto <= 0 ? 'Escribe el monto.' : monto < usado - 0.001 ? `No puede ser menos de lo ya aplicado (${quetzales(usado)}).` : !v.fecha ? 'Pon la fecha.' : !v.destino ? 'Elige dónde cayó el dinero.' : null
  const guardarAnticipo = async () => {
    if (problema || ocupado) return
    setOcupado(true)
    try {
      const comprobantes = await subirComprobantes(almacen, 'anticipos', comp)
      const datos = { fecha: v.fecha, cliente_id: v.cliente_id, proyecto_id: v.proyecto_id || null, monto, forma: v.forma, destino: v.destino || null, referencia: v.referencia.trim() || null, nota: v.nota.trim() || null, aplicar_solo: v.aplicar_solo, comprobantes }
      if (anticipo) {
        await esc.anotarCambios('ctl_anticipos', anticipo.id, [['fecha', anticipo.fecha, v.fecha], ['monto', anticipo.monto.toFixed(2), (monto ?? 0).toFixed(2)], ['forma', anticipo.forma, v.forma], ['destino', anticipo.destino, v.destino || null], ['referencia', anticipo.referencia, datos.referencia]])
        await guardar('ctl_anticipos', anticipo.id, datos)
        avisar('Anticipo guardado.')
      } else {
        const [h] = await insertar('ctl_anticipos', [{ ...datos, registrado_por: correo, estado: 'activo' }])
        avisar(`Anticipo de ${quetzales(monto ?? 0)} registrado: queda como saldo a favor.`, 'bien', { texto: 'Deshacer', hacer: async () => { await borrar('ctl_anticipos', [h.id]); avisar('Se deshizo.') } })
      }
      guardarUltimoDestino(v.destino)
      onCerrar()
    } catch (e) { avisar(e instanceof Error ? e.message : 'No se pudo guardar.', 'error'); setOcupado(false) }
  }
  return (
    <Ventana abierta={abierta} titulo={anticipo ? 'Editar anticipo' : 'Registrar anticipo'} subtitulo="Pago adelantado: queda como saldo a favor del cliente y se aplica a sus cobros." onCerrar={onCerrar} pie={
      <>
        <button type="button" className="m-btn m-btn-secundario" onClick={onCerrar} title="Cierra sin guardar">Cancelar</button>
        <button type="button" className="m-btn m-btn-primario c-btn-principal" disabled={!!problema || ocupado} onClick={() => void guardarAnticipo()} title={problema ? `Apagado: ${problema}` : 'Guarda el anticipo como saldo a favor del cliente'}>{ocupado ? 'Guardando…' : anticipo ? 'Guardar' : 'Registrar anticipo'}</button>
      </>
    }>
      <form className="c-form" onSubmit={(e) => { e.preventDefault(); if ((document.activeElement as HTMLElement | null)?.closest('.c-combo')) return; void guardarAnticipo() }}>
        <div className="m-campo"><label htmlFor="an-cli">Cliente</label><SelectBuscable id="an-cli" valor={v.cliente_id} disabled={!!clienteFijo || !!anticipo} onCambio={(x) => setV((y) => ({ ...y, cliente_id: x, proyecto_id: '' }))} vacio="Elige…" opciones={m.clientes.filter((c) => !c.archivado || c.id === v.cliente_id).map((c) => ({ valor: c.id, nombre: c.nombre }))} /></div>
        <div className="m-campo"><label htmlFor="an-pro">Proyecto <span className="c-opcional">(opcional)</span></label><SelectBuscable id="an-pro" valor={v.proyecto_id} disabled={!v.cliente_id} onCambio={(x) => setV((y) => ({ ...y, proyecto_id: x }))} vacio="Cualquier proyecto" opciones={proyectos.map((p) => ({ valor: p.id, nombre: p.nombre }))} /></div>
        <div className="m-campo"><label htmlFor="an-fecha">Fecha</label><input id="an-fecha" type="date" className="m-entrada" value={v.fecha} onChange={(e) => setV((x) => ({ ...x, fecha: e.target.value }))} /></div>
        <div className="m-campo"><label htmlFor="an-monto">Monto</label><input id="an-monto" className="m-entrada m-num" inputMode="decimal" placeholder="Q 0.00" value={v.monto} onChange={(e) => setV((x) => ({ ...x, monto: e.target.value }))} /></div>
        <div className="m-campo"><label htmlFor="an-forma">Forma de pago</label><select id="an-forma" className="m-entrada" value={v.forma} onChange={(e) => setV((x) => ({ ...x, forma: e.target.value }))}>{FORMAS.map((f) => <option key={f.valor} value={f.valor}>{f.nombre}</option>)}</select></div>
        <div className="m-campo"><label htmlFor="an-destino">Dónde cayó</label><SelectBuscable id="an-destino" valor={v.destino} onCambio={(x) => setV((y) => ({ ...y, destino: x }))} vacio="Elige…" opciones={destinos} /></div>
        <div className="m-campo"><label htmlFor="an-ref">Referencia <span className="c-opcional">(opcional)</span></label><input id="an-ref" className="m-entrada" maxLength={120} value={v.referencia} onChange={(e) => setV((x) => ({ ...x, referencia: e.target.value }))} /></div>
        <label className="c-casilla"><input type="checkbox" checked={v.aplicar_solo} onChange={(e) => setV((x) => ({ ...x, aplicar_solo: e.target.checked }))} />Aplicarlo solo a cada cobro que venza</label>
        <div className="m-campo c-ancho"><label htmlFor="an-comp">Comprobante <span className="c-opcional">(opcional)</span></label><Comprobantes id="an-comp" valor={comp} onCambio={setComp} /></div>
        <div className="m-campo c-ancho"><label htmlFor="an-nota">Nota <span className="c-opcional">(opcional)</span></label><textarea id="an-nota" className="m-entrada" maxLength={500} value={v.nota} onChange={(e) => setV((x) => ({ ...x, nota: e.target.value }))} /></div>
      </form>
    </Ventana>
  )
}

export function VentanaAplicar({ anticipo, onCerrar }: { anticipo: Anticipo | null; onCerrar: () => void }) {
  const m = useModelo()
  const cobros = useCobros()
  const esc = useEscribir()
  const avisar = useAvisar()
  const hoy = useHoy()
  const [marcados, setMarcados] = useState<Set<string>>(new Set())
  const [tope, setTope] = useState('')
  const lista: Cobro[] = anticipo ? pendientes(cobros).filter((c) => c.cliente_id === anticipo.cliente_id && (!anticipo.proyecto_id || c.proyecto_id === anticipo.proyecto_id)) : []
  const saldo = anticipo ? saldoAnticipo(anticipo, m.pagos) : 0
  useEffect(() => { if (anticipo) { setMarcados(new Set(lista.map((c) => c.clave))); setTope(saldo.toFixed(2)) } }, [anticipo])
  const elegidos = lista.filter((c) => marcados.has(c.clave))
  const t = leerMonto(tope)
  const plan = anticipo && t ? planAplicar([anticipo], m.pagos, elegidos, Math.min(t, saldo)) : []
  const suma = plan.reduce((x, p) => x + p.monto, 0)
  const problema = !elegidos.length ? 'Marca al menos un cobro.' : t == null || t <= 0 ? 'Escribe cuánto aplicar.' : t > saldo + 0.001 ? `Solo quedan ${quetzales(saldo)} a favor.` : null
  return (
    <Ventana abierta={anticipo != null} titulo="Aplicar anticipo" subtitulo={`Quedan ${quetzales(saldo)} a favor. Se aplica primero a lo más viejo.`} onCerrar={onCerrar} pie={
      <>
        <button type="button" className="m-btn m-btn-secundario" onClick={onCerrar} title="Cierra sin aplicar nada">Cancelar</button>
        <button type="button" className="m-btn m-btn-primario c-btn-principal" disabled={!!problema} onClick={async () => {
          const deshacer = await esc.aplicarAnticipos(plan, hoy)
          onCerrar()
          avisar(`Se aplicaron ${quetzales(suma)} del saldo a favor.`, 'bien', { texto: 'Deshacer', hacer: async () => { await deshacer(); avisar('Se deshizo.') } })
        }} title={problema ? `Apagado: ${problema}` : `Aplica ${quetzales(suma)} a los cobros marcados; se puede deshacer`}>Aplicar {quetzales(suma)}</button>
      </>
    }>
      {lista.length === 0 ? <p>Este cliente no tiene cobros pendientes. El saldo queda a favor hasta que llegue uno.</p> : (
        <>
          <ul className="c-lista-saldos">
            {lista.map((c) => (
              <li key={c.clave}>
                <label className="c-casilla"><input type="checkbox" checked={marcados.has(c.clave)} onChange={(e) => setMarcados((x) => { const n = new Set(x); if (e.target.checked) n.add(c.clave); else n.delete(c.clave); return n })} /> {c.concepto}{c.vence && <small> · {fechaCorta(c.vence)}</small>}</label>
                <b className="m-cifra">{quetzales(plan.find((p) => p.cobro_clave === c.clave)?.monto ?? 0)} <small>de {quetzales(c.saldo)}</small></b>
              </li>
            ))}
          </ul>
          <div className="m-campo"><label htmlFor="ap-tope">Cuánto aplicar (parcial o total)</label><input id="ap-tope" className="m-entrada m-num" inputMode="decimal" value={tope} onChange={(e) => setTope(e.target.value)} /></div>
        </>
      )}
    </Ventana>
  )
}

export function VentanaDevolver({ anticipo, onCerrar }: { anticipo: Anticipo | null; onCerrar: () => void }) {
  const m = useModelo()
  const { guardar } = useDatos()
  const avisar = useAvisar()
  const hoy = useHoy()
  const saldo = anticipo ? saldoAnticipo(anticipo, m.pagos) : 0
  const [modo, setModo] = useState<'devolver' | 'a_favor'>('devolver')
  const [fecha, setFecha] = useState(hoy)
  return (
    <Ventana abierta={anticipo != null} titulo="Lo que sobró del anticipo" subtitulo={`Quedan ${quetzales(saldo)} a favor del cliente.`} onCerrar={onCerrar} pie={
      <>
        <button type="button" className="m-btn m-btn-secundario" onClick={onCerrar} title="Cierra sin cambiar nada">Cancelar</button>
        <button type="button" className="m-btn m-btn-primario c-btn-principal" onClick={async () => {
          if (!anticipo) return
          const antes = { estado: anticipo.estado, devuelto_el: anticipo.devuelto_el, devuelto_monto: anticipo.devuelto_monto, aplicar_solo: anticipo.aplicar_solo }
          await guardar('ctl_anticipos', anticipo.id, modo === 'devolver' ? { devuelto_el: fecha, devuelto_monto: Math.round(((anticipo.devuelto_monto ?? 0) + saldo) * 100) / 100 } : { estado: 'a_favor', aplicar_solo: false })
          onCerrar()
          avisar(modo === 'devolver' ? `Se anotó la devolución de ${quetzales(saldo)}.` : 'Queda a favor del cliente para un trabajo futuro.', 'bien', { texto: 'Deshacer', hacer: async () => { await guardar('ctl_anticipos', anticipo.id, antes); avisar('Se deshizo.') } })
        }} title={modo === 'devolver' ? 'Anota que se le devolvió lo que sobró; se puede deshacer' : 'Lo deja a favor del cliente sin aplicarse solo; se puede deshacer'}>Guardar</button>
      </>
    }>
      <div className="c-form">
        <label className="c-casilla c-ancho"><input type="radio" name="dev" checked={modo === 'devolver'} onChange={() => setModo('devolver')} /> Devolverlo al cliente ({quetzales(saldo)})</label>
        <label className="c-casilla c-ancho"><input type="radio" name="dev" checked={modo === 'a_favor'} onChange={() => setModo('a_favor')} /> Dejarlo a favor para un trabajo futuro</label>
        {modo === 'devolver' && <div className="m-campo"><label htmlFor="dv-fecha">Fecha de la devolución</label><input id="dv-fecha" type="date" className="m-entrada" value={fecha} onChange={(e) => setFecha(e.target.value)} /></div>}
      </div>
    </Ventana>
  )
}

export function TablaAnticipos({ anticipos, conCliente = true }: { anticipos: Anticipo[]; conCliente?: boolean }) {
  const m = useModelo()
  const n = useNombres()
  const [editar, setEditar] = useState<Anticipo | null>(null)
  const [aplicar, setAplicar] = useState<Anticipo | null>(null)
  const [devolver, setDevolver] = useState<Anticipo | null>(null)
  return (
    <>
      <Tabla filas={anticipos} clave={(a) => a.id} vacio="No hay anticipos."
        columnas={[
          { titulo: 'Fecha', valor: (a) => fechaCorta(a.fecha), orden: (a) => a.fecha },
          { titulo: 'Cliente', principal: true, oculto: !conCliente, valor: (a) => n.cliente(a.cliente_id) },
          { titulo: 'Proyecto', valor: (a) => (a.proyecto_id ? n.proyecto(a.proyecto_id) : <span className="m-vacia">Cualquiera</span>) },
          { titulo: 'Forma', valor: (a) => nombreForma(a.forma) },
          { titulo: 'Dónde cayó', valor: (a) => n.destino(a.destino) },
          { titulo: 'Monto', num: true, valor: (a) => quetzales(a.monto), orden: (a) => a.monto },
          { titulo: 'A favor', num: true, valor: (a) => <>{quetzales(saldoAnticipo(a, m.pagos))}{a.estado === 'a_favor' && <small>Para un trabajo futuro</small>}{(a.devuelto_monto ?? 0) > 0 && <small>Devuelto {quetzales(a.devuelto_monto ?? 0)}</small>}</>, orden: (a) => saldoAnticipo(a, m.pagos) },
        ]}
        acciones={(a) => (
          <>
            {saldoAnticipo(a, m.pagos) > 0 && <button type="button" className="m-btn m-btn-primario m-btn-sm" onClick={() => setAplicar(a)} title="Aplica el saldo a favor a sus cobros pendientes, en parte o completo"><HandCoins size={14} aria-hidden /> Aplicar anticipo</button>}
            {saldoAnticipo(a, m.pagos) > 0 && <button type="button" className="m-btn m-btn-secundario m-btn-sm" onClick={() => setDevolver(a)} title="Si sobra al cerrar el proyecto: devolverlo o dejarlo a favor"><Undo2 size={14} aria-hidden /> Sobrante</button>}
            <VerComprobantes rutas={a.comprobantes} titulo={`Comprobante del anticipo · ${n.cliente(a.cliente_id)}`} />
            <button type="button" className="m-icono-btn" onClick={() => setEditar(a)} aria-label="Editar anticipo" title="Abre el anticipo para corregirlo"><Pencil aria-hidden /></button>
          </>
        )}
        pie={<tr><td colSpan={conCliente ? 5 : 4}>Total a favor</td><td className="m-num">{quetzales(anticipos.reduce((t, a) => t + a.monto, 0))}</td><td className="m-num">{quetzales(anticipos.reduce((t, a) => t + saldoAnticipo(a, m.pagos), 0))}</td><td /></tr>}
      />
      <VentanaAnticipo abierta={editar != null} anticipo={editar} onCerrar={() => setEditar(null)} />
      <VentanaAplicar anticipo={aplicar} onCerrar={() => setAplicar(null)} />
      <VentanaDevolver anticipo={devolver} onCerrar={() => setDevolver(null)} />
    </>
  )
}
