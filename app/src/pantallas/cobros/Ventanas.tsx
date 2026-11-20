import { Check, Copy, FileDown, MessageCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import FormRegistro, { type Campo } from '../../componentes/FormRegistro'
import Ventana from '../../componentes/Ventana'
import { conceptoDePago, numeroWhatsApp, pendientes, textoEstadoCuenta, totalSaldo, type Cobro } from '../../lib/cobros'
import { useDatos } from '../../lib/datos'
import { useEscribir } from '../../lib/escribir'
import { quetzales } from '../../lib/dinero'
import { fechaCorta } from '../../lib/fechas'
import { useModelo } from '../../lib/modelo'
import { useHoy } from '../../lib/usos'
import { REGIMENES, type Cliente, type Pago } from '../../lib/tipos'
import { regimenVigente } from '../../lib/finanzas'
import { Link } from 'react-router-dom'
import { useAvisar } from '../../componentes/Avisos'
import SelectBuscable from '../../componentes/SelectBuscable'
import Comprobantes, { SIN_COMPROBANTES, subirComprobantes, type ValorComprobantes } from '../../componentes/Comprobantes'
import { leerMonto } from '../../lib/dinero'
import { FORMAS, opcionesDestino } from '../../lib/pagosDestino'
import { planAplicar, saldoAFavor } from '../../lib/anticipos'
import { htmlEstadoCuenta, imprimirEstadoCuenta, type SaldoFavor } from './documentos'
import BotonesWeb from '../web/BotonesWeb'
import TablaEntradas from '../pagos/TablaEntradas'
import { useEntradas } from '../../lib/usos'

export function useOpcionesDestino(actual?: string | null) {
  const m = useModelo()
  return opcionesDestino(m.cuentas, m.bancos.map((b) => ({ id: b.id, banco: b.banco, numero: b.numero, nombre: b.nombre, activo: b.activo })), actual, m.cuentasWorld)
}

export function leerUltimoDestino(): string {
  try { return localStorage.getItem('mc_ultimo_destino') ?? '' } catch { return '' }
}

export function guardarUltimoDestino(v: string) {
  try { localStorage.setItem('mc_ultimo_destino', v) } catch { void 0 }
}

export function VentanaPago({ cobro, varios, onCerrar, onHecho }: { cobro?: Cobro | null; varios?: Cobro[] | null; onCerrar: () => void; onHecho?: () => void }) {
  const esc = useEscribir()
  const m = useModelo()
  const { almacen } = useDatos()
  const avisar = useAvisar()
  const hoy = useHoy()
  const lista = varios && varios.length ? varios : cobro ? [cobro] : []
  const abierta = lista.length > 0
  const uno = lista.length === 1 ? lista[0] : null
  const salario = lista.every((c) => c.tipo === 'salario')
  const clienteId = lista[0]?.cliente_id ?? ''
  const destinos = useOpcionesDestino()
  const [fecha, setFecha] = useState(hoy)
  const [monto, setMonto] = useState('')
  const [forma, setForma] = useState('transferencia')
  const [destino, setDestino] = useState('')
  const [referencia, setReferencia] = useState('')
  const [nota, setNota] = useState('')
  const [usarSaldo, setUsarSaldo] = useState(true)
  const [comp, setComp] = useState<ValorComprobantes>(SIN_COMPROBANTES)
  const [ocupado, setOcupado] = useState(false)
  const clave = lista.map((c) => c.clave).join('|')
  useEffect(() => {
    if (!abierta) return
    setFecha(hoy); setMonto(uno ? uno.saldo.toFixed(2) : ''); setForma('transferencia'); setDestino(leerUltimoDestino()); setReferencia(''); setNota(''); setUsarSaldo(true); setComp(SIN_COMPROBANTES); setOcupado(false)
  }, [clave, abierta])
  const total = uno ? leerMonto(monto) ?? 0 : lista.reduce((t, c) => t + c.saldo, 0)
  const pendienteTotal = lista.reduce((t, c) => t + c.saldo, 0)
  const unCliente = lista.every((c) => c.cliente_id === clienteId)
  const aFavor = salario || !unCliente ? 0 : saldoAFavor(clienteId, m.anticipos, m.pagos)
  const plan = usarSaldo && aFavor > 0 ? planAplicar(m.anticipos.filter((a) => a.cliente_id === clienteId), m.pagos, lista.map((c) => ({ ...c, saldo: uno ? Math.min(c.saldo, total) : c.saldo })), total) : []
  const conSaldo = plan.reduce((t, x) => t + x.monto, 0)
  const enDinero = Math.max(0, Math.round((total - conSaldo) * 100) / 100)
  const problema = !lista.length ? 'No hay cobros elegidos.' : uno && (leerMonto(monto) == null || (leerMonto(monto) ?? 0) <= 0) ? 'Escribe el monto recibido.' : uno && total > uno.saldo + 0.001 ? `El monto pasa lo pendiente (${quetzales(uno.saldo)}).` : !fecha ? 'Pon la fecha del pago.' : enDinero > 0 && !destino ? 'Elige dónde cayó el dinero.' : null
  const nombre = salario ? 'Mi salario' : !unCliente ? 'Varios clientes' : m.clientes.find((c) => c.id === clienteId)?.nombre ?? ''

  const guardarPago = async () => {
    if (problema || ocupado) return
    setOcupado(true)
    const atras: (() => Promise<void>)[] = []
    try {
      const comprobantes = enDinero > 0 ? await subirComprobantes(almacen, 'pagos', comp) : []
      if (plan.length) atras.push(await esc.aplicarAnticipos(plan, fecha))
      let i = 0
      for (const c of lista) {
        const aplicado = plan.filter((x) => x.cobro_clave === c.clave).reduce((t, x) => t + x.monto, 0)
        const base = uno ? total : c.saldo
        const resto = Math.round((base - aplicado) * 100) / 100
        if (resto <= 0) continue
        atras.push(await esc.registrarPago(c, { fecha, monto: resto, forma, destino: destino || null, referencia: referencia.trim() || null, nota: nota.trim() || null, comprobantes }, c.tipo === 'salario' ? null : esc.siguienteRecibo(i)))
        i += 1
      }
      if (destino) guardarUltimoDestino(destino)
      onHecho?.()
      onCerrar()
      avisar(lista.length === 1 ? (salario ? 'Salario marcado como recibido.' : 'Pago registrado.') : `Se registraron ${lista.length} pagos por ${quetzales(total)}.`, 'bien', { texto: 'Deshacer', hacer: async () => { for (const f of atras.reverse()) await f(); avisar('Se deshizo.') } })
    } catch (e) {
      for (const f of atras.reverse()) await f().catch(() => undefined)
      avisar(e instanceof Error ? e.message : 'No se pudo registrar.', 'error')
      setOcupado(false)
    }
  }

  return (
    <Ventana abierta={abierta} titulo={salario ? 'Marcar salario recibido' : lista.length > 1 ? `Registrar pago de ${lista.length} cobros` : 'Registrar pago'}
      subtitulo={uno ? `${nombre} · ${uno.concepto} · pendiente ${quetzales(uno.saldo)}` : `${nombre} · pendiente ${quetzales(pendienteTotal)}`}
      onCerrar={onCerrar}
      pie={
        <>
          <button type="button" className="m-btn m-btn-secundario" onClick={onCerrar} title="Cierra sin registrar nada">Cancelar</button>
          <button type="button" className="m-btn m-btn-primario c-btn-principal" disabled={!!problema || ocupado} onClick={() => void guardarPago()} title={problema ? `Apagado: ${problema}` : 'Registra el pago, sube los comprobantes y da su recibo; se puede deshacer'}>{ocupado ? 'Registrando…' : salario ? 'Marcar recibido' : 'Registrar pago'}</button>
        </>
      }>
      <form className="c-form" onSubmit={(e) => { e.preventDefault(); if ((document.activeElement as HTMLElement | null)?.closest('.c-combo')) return; void guardarPago() }}>
        {lista.length > 1 && (
          <ul className="c-lista-saldos c-ancho">
            {lista.map((c) => <li key={c.clave}><span>{c.concepto}{c.vence && <small> · {fechaCorta(c.vence)}</small>}</span><b className="m-cifra">{quetzales(c.saldo)}</b></li>)}
            <li className="c-lista-total"><span>Total</span><b className="m-cifra">{quetzales(pendienteTotal)}</b></li>
          </ul>
        )}
        <div className="m-campo"><label htmlFor="vp-fecha">Fecha del pago</label><input id="vp-fecha" type="date" className="m-entrada" value={fecha} onChange={(e) => setFecha(e.target.value)} /></div>
        {uno && <div className="m-campo"><label htmlFor="vp-monto">Monto recibido</label><input id="vp-monto" className="m-entrada m-num" inputMode="decimal" value={monto} onChange={(e) => setMonto(e.target.value)} /></div>}
        {aFavor > 0 && (
          <label className="c-casilla c-ancho c-saldo-favor"><input type="checkbox" checked={usarSaldo} onChange={(e) => setUsarSaldo(e.target.checked)} />Usar saldo a favor ({quetzales(aFavor)}){usarSaldo && conSaldo > 0 && <span className="m-ayuda">Se aplican {quetzales(conSaldo)} del saldo a favor; en dinero entran {quetzales(enDinero)}.</span>}</label>
        )}
        {enDinero > 0 && (
          <>
            <div className="m-campo"><label htmlFor="vp-forma">Forma de pago</label><select id="vp-forma" className="m-entrada" value={forma} onChange={(e) => setForma(e.target.value)}>{FORMAS.map((f) => <option key={f.valor} value={f.valor}>{f.nombre}</option>)}</select></div>
            <div className="m-campo"><label htmlFor="vp-destino">Dónde cayó</label><SelectBuscable id="vp-destino" valor={destino} onCambio={setDestino} vacio="Elige…" opciones={destinos} />{destinos.length <= 2 && <span className="m-ayuda">Agrega tus cuentas y cajas en <Link to="/cuentas" className="c-enlace">Dónde está mi dinero</Link>.</span>}</div>
            <div className="m-campo"><label htmlFor="vp-ref">Referencia o número de boleta <span className="c-opcional">(opcional)</span></label><input id="vp-ref" className="m-entrada" maxLength={120} value={referencia} onChange={(e) => setReferencia(e.target.value)} /></div>
            <div className="m-campo c-ancho"><label htmlFor="vp-comp">Comprobante <span className="c-opcional">(opcional)</span></label><Comprobantes id="vp-comp" valor={comp} onCambio={setComp} /></div>
          </>
        )}
        <div className="m-campo c-ancho"><label htmlFor="vp-nota">Nota <span className="c-opcional">(opcional)</span></label><textarea id="vp-nota" className="m-entrada" maxLength={500} value={nota} onChange={(e) => setNota(e.target.value)} /></div>
      </form>
    </Ventana>
  )
}

export const CLASES_COBRO: { valor: string; nombre: string }[] = [
  { valor: 'unico', nombre: 'Cobro único o extra' },
  { valor: 'servicio', nombre: 'Servicio (dominio, hosting…)' },
  { valor: 'mensualidad', nombre: 'Mensualidad adicional' },
  { valor: 'otro', nombre: 'Otro' },
]

export function VentanaExtra({ abierta, clienteFijo, onCerrar }: { abierta: boolean; clienteFijo?: string; onCerrar: () => void }) {
  const { insertar, borrar } = useDatos()
  const m = useModelo()
  const avisar = useAvisar()
  const hoy = useHoy()
  const [v, setV] = useState({ cliente_id: '', proyecto_id: '', clase: 'unico', concepto: '', monto: '', vence: hoy, regimen: '', nota: '' })
  const [ocupado, setOcupado] = useState(false)
  const proyectos = m.proyectos.filter((p) => p.cliente_id === v.cliente_id)
  const negocio = m.clientes.find((c) => c.id === v.cliente_id)?.negocio_id ?? ''
  const regimenDe = (cli: string, venc: string) => regimenVigente(m.modos, (venc || hoy).slice(0, 7), m.clientes.find((c) => c.id === cli)?.negocio_id ?? '', cli)
  useEffect(() => {
    if (!abierta) return
    const cli = clienteFijo ?? ''
    const ps = m.proyectos.filter((p) => p.cliente_id === cli && p.estado !== 'cerrado')
    setV({ cliente_id: cli, proyecto_id: ps.length === 1 ? ps[0].id : '', clase: 'unico', concepto: '', monto: '', vence: hoy, regimen: cli ? regimenDe(cli, hoy) : '', nota: '' }); setOcupado(false)
  }, [abierta])
  const monto = leerMonto(v.monto)
  const problema = !v.cliente_id ? 'Elige el cliente.' : !v.concepto.trim() ? 'Escribe el concepto.' : monto == null || monto <= 0 ? 'Escribe el monto.' : null
  const guardarCobro = async () => {
    if (problema || ocupado) return
    setOcupado(true)
    try {
      const [h] = await insertar('ctl_cobros', [{ clave: `x:${crypto.randomUUID()}`, tipo: 'extra', saldado: false, cliente_id: v.cliente_id, proyecto_id: v.proyecto_id || null, clase: v.clase, concepto: v.concepto.trim(), monto, vence: v.vence || null, regimen: v.regimen || null, nota: v.nota.trim() || null }])
      onCerrar()
      avisar(`Cobro «${v.concepto.trim()}» de ${quetzales(monto ?? 0)} agregado.`, 'bien', { texto: 'Deshacer', hacer: async () => { await borrar('ctl_cobros', [h.id]); avisar('Se deshizo.') } })
    } catch (e) { avisar(e instanceof Error ? e.message : 'No se pudo guardar.', 'error'); setOcupado(false) }
  }
  return (
    <Ventana abierta={abierta} titulo="Agregar cobro" subtitulo={clienteFijo ? m.clientes.find((c) => c.id === clienteFijo)?.nombre : 'Un cobro que no es la inscripción ni la mensualidad del proyecto.'} onCerrar={onCerrar} pie={
      <>
        <button type="button" className="m-btn m-btn-secundario" onClick={onCerrar} title="Cierra sin agregar nada">Cancelar</button>
        <button type="button" className="m-btn m-btn-primario c-btn-principal" disabled={!!problema || ocupado} onClick={() => void guardarCobro()} title={problema ? `Apagado: ${problema}` : 'Agrega el cobro; se ve al momento en la ficha, Cobros e Inicio. Se puede deshacer'}>{ocupado ? 'Guardando…' : 'Agregar cobro'}</button>
      </>
    }>
      <form className="c-form" onSubmit={(e) => { e.preventDefault(); if ((document.activeElement as HTMLElement | null)?.closest('.c-combo')) return; void guardarCobro() }}>
        <div className="m-campo"><label htmlFor="ac-cli">Cliente</label><SelectBuscable id="ac-cli" valor={v.cliente_id} disabled={!!clienteFijo} vacio="Elige…" onCambio={(x) => { const ps = m.proyectos.filter((p) => p.cliente_id === x && p.estado !== 'cerrado'); setV((y) => ({ ...y, cliente_id: x, proyecto_id: ps.length === 1 ? ps[0].id : '', regimen: regimenDe(x, y.vence) })) }} opciones={m.clientes.filter((c) => (c.activo && !c.archivado) || c.id === v.cliente_id).map((c) => ({ valor: c.id, nombre: c.nombre }))} /></div>
        <div className="m-campo"><label htmlFor="ac-pro">Proyecto</label><SelectBuscable id="ac-pro" valor={v.proyecto_id} disabled={!v.cliente_id} vacio="Sin proyecto" onCambio={(x) => setV((y) => ({ ...y, proyecto_id: x }))} opciones={proyectos.map((p) => ({ valor: p.id, nombre: p.nombre }))} /></div>
        <div className="m-campo"><label htmlFor="ac-clase">Tipo</label><select id="ac-clase" className="m-entrada" value={v.clase} onChange={(e) => setV((x) => ({ ...x, clase: e.target.value }))}>{CLASES_COBRO.map((c) => <option key={c.valor} value={c.valor}>{c.nombre}</option>)}</select></div>
        <div className="m-campo"><label htmlFor="ac-vence">Vence</label><input id="ac-vence" type="date" className="m-entrada" value={v.vence} onChange={(e) => setV((x) => ({ ...x, vence: e.target.value, regimen: x.cliente_id ? regimenDe(x.cliente_id, e.target.value) : x.regimen }))} /></div>
        <div className="m-campo c-ancho"><label htmlFor="ac-con">Concepto</label><input id="ac-con" className="m-entrada" maxLength={200} value={v.concepto} placeholder={v.clase === 'servicio' ? 'Por ejemplo: Dominio 2027' : ''} onChange={(e) => setV((x) => ({ ...x, concepto: e.target.value }))} /></div>
        <div className="m-campo"><label htmlFor="ac-monto">Monto</label><input id="ac-monto" className="m-entrada m-num" inputMode="decimal" placeholder="Q 0.00" value={v.monto} onChange={(e) => setV((x) => ({ ...x, monto: e.target.value }))} /></div>
        <div className="m-campo"><label htmlFor="ac-reg">Régimen que le toca</label><select id="ac-reg" className="m-entrada" value={v.regimen} onChange={(e) => setV((x) => ({ ...x, regimen: e.target.value }))}>{REGIMENES.map((r) => <option key={r.valor} value={r.valor}>{r.nombre}</option>)}</select>{negocio && <span className="m-ayuda">Sale del régimen del cliente en ese mes; cámbialo solo si este cobro es distinto.</span>}</div>
        <div className="m-campo c-ancho"><label htmlFor="ac-nota">Nota <span className="c-opcional">(opcional)</span></label><textarea id="ac-nota" className="m-entrada" maxLength={500} value={v.nota} onChange={(e) => setV((x) => ({ ...x, nota: e.target.value }))} /></div>
      </form>
    </Ventana>
  )
}

export function VentanaSaldar({ cobro, onCerrar }: { cobro: Cobro | null; onCerrar: () => void }) {
  const { guardar } = useDatos()
  const campos: Campo[] = [{ k: 'nota', etiqueta: 'Por qué se da por saldado', tipo: 'area', requerido: true, max: 500 }]
  return (
    <FormRegistro
      abierta={cobro != null}
      titulo="Dar por saldado"
      subtitulo={cobro ? `${cobro.concepto}: deja de contar ${quetzales(cobro.saldo)} como pendiente. Se puede deshacer.` : ''}
      campos={campos}
      inicial={{ nota: cobro?.guardado?.nota ?? '' }}
      textoGuardar="Dar por saldado"
      onGuardar={async (d) => {
        if (!cobro) return
        await guardar('ctl_cobros', cobro.guardado?.id ?? null, cobro.guardado ? { saldado: true, nota: d.nota } : { clave: cobro.clave, cliente_id: cobro.cliente_id || null, proyecto_id: cobro.proyecto_id, tipo: cobro.tipo, saldado: true, nota: d.nota })
      }}
      onCerrar={onCerrar}
    />
  )
}

export function VentanaEstadoCuenta({ cliente, cobros, onCerrar }: { cliente: Cliente | null; cobros: Cobro[]; onCerrar: () => void }) {
  const hoy = useHoy()
  const m = useModelo()
  const { proyectos } = m
  const propios = useMemo(() => cobros.filter((c) => c.cliente_id === cliente?.id), [cobros, cliente])
  const entradas = useEntradas()
  const favor: SaldoFavor | undefined = cliente ? { saldo: saldoAFavor(cliente.id, m.anticipos, m.pagos), aplicado: m.pagos.filter((p) => p.cliente_id === cliente.id && p.forma === 'anticipo').map((p) => ({ fecha: p.fecha, concepto: conceptoDePago(p.cobro_clave, cobros), monto: p.monto })) } : undefined
  const lista = pendientes(propios)
  const [texto, setTexto] = useState('')
  const [copiado, setCopiado] = useState(false)
  useEffect(() => { if (cliente) { setTexto(textoEstadoCuenta(cliente.nombre, propios, hoy)); setCopiado(false) } }, [cliente, propios, hoy])
  const nombreProyecto = (id: string | null) => proyectos.find((p) => p.id === id)?.nombre ?? ''
  const url = `https://wa.me/${numeroWhatsApp(cliente?.whatsapp ?? null)}?text=${encodeURIComponent(texto)}`
  return (
    <Ventana abierta={cliente != null} titulo="Estado de cuenta" subtitulo={cliente?.nombre} onCerrar={onCerrar} pie={cliente && (
      <>
        <button type="button" className="m-btn m-btn-salida" onClick={() => imprimirEstadoCuenta(cliente, propios, hoy, nombreProyecto, favor)} title="Abrir el estado de cuenta listo para guardar en PDF o imprimir"><FileDown size={16} aria-hidden /> PDF</button>
        <button type="button" className="m-btn m-btn-salida" onClick={async () => { try { await navigator.clipboard.writeText(texto); setCopiado(true); setTimeout(() => setCopiado(false), 1800) } catch { setCopiado(false) } }} title="Copiar el mensaje">{copiado ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />} {copiado ? 'Copiado' : 'Copiar'}</button>
        <a className="m-btn m-btn-primario" href={url} target="_blank" rel="noreferrer" title="Abrir WhatsApp con el mensaje listo"><MessageCircle size={16} aria-hidden /> Enviar por WhatsApp</a>
      </>
    )}>
      <h3 className="m-seccion-titulo">Lo que debe</h3>
      {lista.length > 0 ? (
        <ul className="c-lista-saldos">
          {lista.map((c) => <li key={c.clave}><span>{c.concepto}{c.vence && <small> · {fechaCorta(c.vence)}</small>}{c.estado === 'vencido' && <span className="m-estado error">Vencido</span>}</span><b className="m-cifra">{quetzales(c.saldo)}</b></li>)}
          <li className="c-lista-total"><span>Total pendiente</span><b className="m-cifra">{quetzales(totalSaldo(lista))}</b></li>
        </ul>
      ) : <p>Está al día: no tiene nada pendiente.</p>}
      {favor && favor.saldo > 0 && <><h3 className="m-seccion-titulo">Saldo a favor</h3><p className="c-saldo-favor">Tiene <b>{quetzales(favor.saldo)}</b> de saldo a favor.</p></>}
      {cliente && (
        <div className="c-detalle-seccion">
          <h3 className="m-seccion-titulo">Pagos que hizo</h3>
          <TablaEntradas entradas={entradas.filter((e) => e.cliente_id === cliente.id).slice(0, 10)} conCliente={false} vacio="Todavía no ha pagado nada." />
        </div>
      )}
      {cliente && (
        <div className="c-detalle-seccion">
          <h3 className="m-seccion-titulo">Versión web</h3>
          <BotonesWeb origen={{ tipo: 'estado_cuenta', cliente_id: cliente.id }} telefono={cliente.whatsapp} armar={() => { const d = htmlEstadoCuenta(cliente, propios, hoy, nombreProyecto, favor); return { titulo: d.titulo, cuerpo: d.cuerpo, area: 'web' } }} />
        </div>
      )}
      <div className="m-campo">
        <label htmlFor="ec-texto">Mensaje (puedes cambiarlo antes de enviarlo)</label>
        <textarea id="ec-texto" className="m-entrada" rows={8} value={texto} maxLength={3000} onChange={(e) => setTexto(e.target.value)} />
        {!cliente?.whatsapp && <span className="m-ayuda">No tiene WhatsApp guardado: al abrirlo eliges el contacto.</span>}
      </div>
    </Ventana>
  )
}

export function VentanaRecordatorios({ abierta, cobros, onCerrar }: { abierta: boolean; cobros: Cobro[]; onCerrar: () => void }) {
  const { clientes } = useModelo()
  const hoy = useHoy()
  const [enviados, setEnviados] = useState<string[]>([])
  useEffect(() => { if (abierta) setEnviados([]) }, [abierta])
  const deudores = clientes.map((c) => ({ c, propios: cobros.filter((x) => x.cliente_id === c.id) })).filter((x) => pendientes(x.propios).length > 0)
  return (
    <Ventana abierta={abierta} titulo="Recordatorios por WhatsApp" subtitulo={`${deudores.length} ${deudores.length === 1 ? 'cliente debe' : 'clientes deben'}. Abre cada uno; se marca al enviarlo.`} onCerrar={onCerrar}>
      {deudores.length === 0 ? <p>Nadie debe nada. Todo está al día.</p> : (
        <ul className="c-lista-saldos">
          {deudores.map(({ c, propios }) => {
            const url = `https://wa.me/${numeroWhatsApp(c.whatsapp)}?text=${encodeURIComponent(textoEstadoCuenta(c.nombre, propios, hoy))}`
            const listo = enviados.includes(c.id)
            return (
              <li key={c.id}>
                <span><b>{c.nombre}</b><small> · {quetzales(totalSaldo(propios))}</small>{!c.whatsapp && <small> · sin WhatsApp</small>}</span>
                <a className={`m-btn m-btn-sm ${listo ? 'm-btn-secundario' : 'm-btn-primario'}`} href={url} target="_blank" rel="noreferrer" onClick={() => setEnviados((l) => [...l, c.id])} title={`Abrir WhatsApp con el estado de cuenta de ${c.nombre}`}>{listo ? <><Check size={14} aria-hidden /> Abierto</> : <><MessageCircle size={14} aria-hidden /> Enviar</>}</a>
              </li>
            )
          })}
        </ul>
      )}
    </Ventana>
  )
}

export function VentanaCompletarPagos({ pagos, onCerrar }: { pagos: Pago[]; onCerrar: () => void }) {
  const esc = useEscribir()
  const avisar = useAvisar()
  const destinos = useOpcionesDestino()
  const [forma, setForma] = useState('')
  const [destino, setDestino] = useState('')
  useEffect(() => { if (pagos.length) { setForma(''); setDestino('') } }, [pagos])
  const sinAnticipo = pagos.filter((p) => p.forma !== 'anticipo')
  const problema = !forma && !destino ? 'Elige la forma de pago, dónde cayó o las dos.' : null
  return (
    <Ventana abierta={pagos.length > 0} titulo={`Completar ${pagos.length} ${pagos.length === 1 ? 'pago' : 'pagos'}`} subtitulo="Lo que dejes en «Sin cambiar» se queda como está." onCerrar={onCerrar} pie={
      <>
        <button type="button" className="m-btn m-btn-secundario" onClick={onCerrar} title="Cierra sin cambiar nada">Cancelar</button>
        <button type="button" className="m-btn m-btn-primario c-btn-principal" disabled={!!problema} title={problema ? `Apagado: ${problema}` : `Pone la forma y la cuenta a los ${sinAnticipo.length} pagos marcados; se puede deshacer`} onClick={async () => {
          const deshacer = await esc.cambiarPagos(sinAnticipo, { ...(forma ? { forma } : {}), ...(destino ? { destino } : {}) })
          onCerrar()
          avisar(`Se completaron ${sinAnticipo.length} pagos.`, 'bien', { texto: 'Deshacer', hacer: async () => { await deshacer(); avisar('Se deshizo.') } })
        }}>Completar</button>
      </>
    }>
      <div className="c-form">
        <div className="m-campo"><label htmlFor="cp-forma">Forma de pago</label><select id="cp-forma" className="m-entrada" value={forma} onChange={(e) => setForma(e.target.value)}><option value="">Sin cambiar</option>{FORMAS.map((f) => <option key={f.valor} value={f.valor}>{f.nombre}</option>)}</select></div>
        <div className="m-campo"><label htmlFor="cp-destino">Dónde cayó</label><SelectBuscable id="cp-destino" valor={destino} onCambio={setDestino} vacio="Sin cambiar" opciones={destinos} /></div>
        {sinAnticipo.length < pagos.length && <p className="m-texto-suave c-ancho">{pagos.length - sinAnticipo.length} se pagaron con saldo a favor y no cambian.</p>}
      </div>
    </Ventana>
  )
}

export function VentanaEditarExtra({ cobro, onCerrar }: { cobro: Cobro | null; onCerrar: () => void }) {
  const { guardar } = useDatos()
  return (
    <FormRegistro
      abierta={cobro != null}
      titulo="Editar cobro extra"
      campos={[
        { k: 'concepto', etiqueta: 'Concepto', tipo: 'texto', requerido: true, max: 200, ancho: true },
        { k: 'monto', etiqueta: 'Monto', tipo: 'monto', requerido: true },
        { k: 'vence', etiqueta: 'Vence', tipo: 'fecha' },
      ]}
      inicial={cobro ? { concepto: cobro.concepto, monto: cobro.monto.toFixed(2), vence: cobro.vence } : {}}
      validar={(v) => (cobro && Number(String(v.monto).replace(/[^\d.]/g, '')) < cobro.pagado ? `No puede ser menos de lo ya pagado (${quetzales(cobro.pagado)}).` : null)}
      onGuardar={async (d) => { if (cobro?.guardado) await guardar('ctl_cobros', cobro.guardado.id, d) }}
      onCerrar={onCerrar}
    />
  )
}
