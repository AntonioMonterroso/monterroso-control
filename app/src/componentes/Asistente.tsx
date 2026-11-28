import { ArrowRight, Check, Mic, MicOff, Pencil, ScanSearch, SendHorizontal, Sparkles, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent as TeclaReact } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAvisar } from './Avisos'
import FormRegistro, { convertir, type Valores } from './FormRegistro'
import { subirAvisos } from './Ventana'
import { useDatos } from '../lib/datos'
import { quetzales } from '../lib/dinero'
import { useEscribir } from '../lib/escribir'
import { fechaCorta } from '../lib/fechas'
import { useModelo } from '../lib/modelo'
import { nombreForma } from '../lib/pagosDestino'
import { useSesion } from '../lib/sesion'
import { configurado, supabase } from '../lib/supabase'
import { useCobros, useEntradas, useHoy, usePeriodo } from '../lib/usos'
import { pendientes, type Cobro } from '../lib/cobros'
import type { Cliente } from '../lib/tipos'
import {
  NOMBRE_NEGOCIO, NOMBRE_PANTALLA, TOPE_USD, contextoAnotar, contextoPreguntas, cuentaDeForma, estadoTope, leerPropuesta, leerRespuesta, leerUso, negocioDeRuta, negocioId,
  nombrePeriodo, resumenDelMes, rutaDe, tareaDe, textoRevision, usd, type Hallazgo, type Lectura, type NegocioAsistente, type PropuestaCruda, type ResumenRevision, type Tarea,
} from '../lib/asistente'
import { camposGasto } from '../pantallas/gastos/campos'
import { VentanaPago, guardarUltimoDestino, leerUltimoDestino, useOpcionesDestino } from '../pantallas/cobros/Ventanas'

type Burbuja =
  | { id: number; rol: 'usuario'; texto: string }
  | { id: number; rol: 'asistente'; texto: string }
  | { id: number; rol: 'error'; texto: string }
  | { id: number; rol: 'propuesta'; cruda: PropuestaCruda; nota: string; clienteId: string | null; estado: 'pendiente' | 'guardado' | 'cancelado'; neg: NegocioAsistente }
  | { id: number; rol: 'revision'; resumen: string; hallazgos: Hallazgo[]; cifras: ResumenRevision; neg: NegocioAsistente }

interface ResultadoVoz { readonly isFinal: boolean; readonly [i: number]: { transcript: string } }
interface EventoVoz { resultIndex: number; results: ArrayLike<ResultadoVoz> }
interface Reconocedor { lang: string; continuous: boolean; interimResults: boolean; onresult: ((e: EventoVoz) => void) | null; onend: (() => void) | null; onerror: ((e: { error: string }) => void) | null; start(): void; stop(): void }
type CtorVoz = new () => Reconocedor

function ctorVoz(): CtorVoz | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as { SpeechRecognition?: CtorVoz; webkitSpeechRecognition?: CtorVoz }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

let siguienteId = 1
const nuevoId = () => siguienteId++

async function llamar(cuerpo: { tarea: Tarea | 'uso'; mensajes?: { rol: 'usuario' | 'asistente'; texto: string }[]; contexto?: string }): Promise<unknown> {
  const { data, error } = await supabase.functions.invoke('asistente', { body: { mensajes: [], contexto: '', ...cuerpo } })
  if (!error) return data
  const ctx = (error as { context?: unknown }).context
  if (ctx instanceof Response) {
    let j: unknown = null
    try { j = await ctx.json() } catch { j = null }
    const o = (j ?? {}) as { mensaje?: unknown; gastado?: unknown }
    const e = new Error(typeof o.mensaje === 'string' ? o.mensaje : 'El asistente no respondió. Intenta otra vez.')
    ;(e as Error & { uso?: unknown }).uso = j
    throw e
  }
  throw new Error(navigator.onLine === false ? 'No hay internet. Revisa tu conexión.' : 'No se pudo hablar con el asistente. ¿Ya se subió la función «asistente»?')
}

function historial(l: Burbuja[]): { rol: 'usuario' | 'asistente'; texto: string }[] {
  return l.flatMap((b): { rol: 'usuario' | 'asistente'; texto: string }[] => {
    if (b.rol === 'usuario') return [{ rol: 'usuario', texto: b.texto }]
    if (b.rol === 'asistente') return [{ rol: 'asistente', texto: b.texto }]
    if (b.rol === 'propuesta') return [{ rol: 'asistente', texto: `Preparé un ${b.cruda.tipo} de ${quetzales(b.cruda.monto)}${b.cruda.cliente_dicho ? ` de ${b.cruda.cliente_dicho}` : ''}: ${b.estado === 'guardado' ? 'ya se guardó' : b.estado === 'cancelado' ? 'se canceló' : 'falta confirmarlo'}.` }]
    return []
  }).slice(-10)
}

export default function Asistente() {
  const lugar = useLocation()
  const ref = useRef<HTMLDialogElement>(null)
  const [abierto, setAbierto] = useState(false)
  const [burbujas, setBurbujas] = useState<Burbuja[]>([])
  const [gastado, setGastado] = useState<number | null>(null)
  const neg = negocioDeRuta(lugar.pathname)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (abierto && !d.open) { d.showModal(); subirAvisos() }
    if (!abierto && d.open) d.close()
  }, [abierto])

  if (lugar.pathname.startsWith('/d/')) return null

  return (
    <>
      {!abierto && (
        <button type="button" className="c-asis-boton" onClick={() => setAbierto(true)} aria-label="Abrir el asistente" title="Abre el asistente: anota pagos y gastos, revisa el mes y responde preguntas">
          <Sparkles aria-hidden /><span>Asistente</span>
        </button>
      )}
      <dialog
        ref={ref}
        className="c-asis"
        aria-label="Asistente"
        onCancel={(e) => { e.preventDefault(); if (e.target === e.currentTarget) setAbierto(false) }}
        onClose={(e) => { if (e.target === e.currentTarget) setAbierto(false) }}
      >
        {abierto && <Panel neg={neg} burbujas={burbujas} setBurbujas={setBurbujas} gastado={gastado} setGastado={setGastado} onCerrar={() => setAbierto(false)} />}
      </dialog>
    </>
  )
}

function Panel({ neg, burbujas, setBurbujas, gastado, setGastado, onCerrar }: {
  neg: NegocioAsistente
  burbujas: Burbuja[]
  setBurbujas: (f: (l: Burbuja[]) => Burbuja[]) => void
  gastado: number | null
  setGastado: (n: number | null) => void
  onCerrar: () => void
}) {
  const { prueba } = useSesion()
  const m = useModelo()
  const hoy = useHoy()
  const [periodo] = usePeriodo()
  const cobros = useCobros(periodo)
  const entradas = useEntradas()
  const destinos = useOpcionesDestino()
  const [texto, setTexto] = useState('')
  const [ocupado, setOcupado] = useState<Tarea | null>(null)
  const [voz, setVoz] = useState(false)
  const vozRef = useRef<Reconocedor | null>(null)
  const areaRef = useRef<HTMLTextAreaElement>(null)
  const listaRef = useRef<HTMLDivElement>(null)
  const [cambiarPago, setCambiarPago] = useState<{ cobro: Cobro; inicial: { fecha: string; monto: number; forma: string; destino: string; nota: string }; id: number } | null>(null)
  const [cambiarGasto, setCambiarGasto] = useState<{ inicial: Record<string, unknown>; id: number } | null>(null)
  const { guardar } = useDatos()
  const avisar = useAvisar()
  const puedeVoz = useMemo(() => ctorVoz() != null, [])
  const sinSesion = prueba || !configurado
  const tope = estadoTope(gastado)
  const apagado = sinSesion || tope === 'tope'

  useEffect(() => {
    requestAnimationFrame(() => areaRef.current?.focus({ preventScroll: true }))
    if (sinSesion) return
    let vivo = true
    llamar({ tarea: 'uso' }).then((d) => { const u = leerUso(d); if (vivo && u) setGastado(u.gastado) }).catch(() => undefined)
    return () => { vivo = false; vozRef.current?.stop() }
  }, [])

  useEffect(() => {
    const l = listaRef.current
    if (l) l.scrollTo({ top: l.scrollHeight, behavior: 'smooth' })
  }, [burbujas.length, ocupado])

  const agregar = (b: Burbuja) => setBurbujas((l) => [...l, b])
  const cambiar = (id: number, f: (b: Burbuja) => Burbuja) => setBurbujas((l) => l.map((b) => (b.id === id ? f(b) : b)))

  const usoDeError = (e: unknown) => {
    const u = leerUso((e as { uso?: unknown })?.uso)
    if (u) setGastado(u.gastado)
  }

  const enviar = async (crudo?: string) => {
    const t = (crudo ?? texto).trim()
    if (!t || ocupado || apagado) return
    vozRef.current?.stop()
    const tarea = tareaDe(t)
    const previos = historial(burbujas)
    agregar({ id: nuevoId(), rol: 'usuario', texto: t })
    setTexto('')
    setOcupado(tarea)
    try {
      const contexto = tarea === 'anotar' ? contextoAnotar(m, cobros, neg, hoy, destinos) : contextoPreguntas(m, cobros, periodo, neg, hoy)
      const r = leerRespuesta(await llamar({ tarea, mensajes: [...previos, { rol: 'usuario', texto: t }], contexto }))
      if (!r) throw new Error('La respuesta no se entendió.')
      setGastado(r.gastado)
      if (r.tipo === 'propuesta') agregar({ id: nuevoId(), rol: 'propuesta', cruda: r.propuesta, nota: r.texto, clienteId: null, estado: 'pendiente', neg })
      else if (r.tipo === 'texto') agregar({ id: nuevoId(), rol: 'asistente', texto: r.texto })
    } catch (e) {
      usoDeError(e)
      agregar({ id: nuevoId(), rol: 'error', texto: e instanceof Error ? e.message : 'Algo falló.' })
    } finally {
      setOcupado(null)
    }
  }

  const revisar = async () => {
    if (ocupado || apagado) return
    const cifras = resumenDelMes(m, cobros, entradas, periodo, neg)
    agregar({ id: nuevoId(), rol: 'usuario', texto: `Revisar ${nombrePeriodo(periodo).toLowerCase()} · ${NOMBRE_NEGOCIO[neg]}` })
    setOcupado('revisar')
    try {
      const r = leerRespuesta(await llamar({ tarea: 'revisar', contexto: textoRevision(cifras, hoy) }))
      if (!r) throw new Error('La revisión no se entendió.')
      setGastado(r.gastado)
      if (r.tipo === 'revision') agregar({ id: nuevoId(), rol: 'revision', resumen: r.resumen, hallazgos: r.hallazgos, cifras, neg })
      else if (r.tipo === 'texto') agregar({ id: nuevoId(), rol: 'revision', resumen: r.texto, hallazgos: [], cifras, neg })
    } catch (e) {
      usoDeError(e)
      agregar({ id: nuevoId(), rol: 'error', texto: e instanceof Error ? e.message : 'Algo falló.' })
    } finally {
      setOcupado(null)
    }
  }

  const dictar = () => {
    if (voz) { vozRef.current?.stop(); return }
    const C = ctorVoz()
    if (!C) return
    const r = new C()
    const base = texto.trim()
    let reintentar = false
    r.lang = 'es-GT'
    r.continuous = false
    r.interimResults = true
    r.onresult = (e) => {
      let dicho = ''
      for (let i = 0; i < e.results.length; i++) dicho += e.results[i][0].transcript
      setTexto(`${base ? `${base} ` : ''}${dicho.trim()}`)
    }
    r.onerror = (e) => {
      if (e.error === 'language-not-supported' && r.lang === 'es-GT') { reintentar = true; return }
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') avisar('El navegador no dejó usar el micrófono. Revisa el permiso.', 'error')
    }
    r.onend = () => {
      if (reintentar) { reintentar = false; r.lang = 'es-419'; try { r.start(); return } catch { setVoz(false); return } }
      setVoz(false)
      areaRef.current?.focus({ preventScroll: true })
    }
    vozRef.current = r
    try { r.start(); setVoz(true) } catch { setVoz(false) }
  }

  const tecla = (e: TeclaReact<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); void enviar() }
  }

  const ejemplos = ['Me pagó Daniel Q850 de la mensualidad', 'Pagué Q120 de internet', '¿Quién me debe más?', '¿Cuánto gané este mes?']

  return (
    <div className="c-asis-caja">
      <header className="c-asis-cabeza">
        <span className="c-asis-icono" aria-hidden><Sparkles /></span>
        <div className="c-asis-titulos">
          <h2>Asistente</h2>
          <p><i aria-hidden className="c-asis-punto" />{NOMBRE_NEGOCIO[neg]} · {nombrePeriodo(periodo)}</p>
        </div>
        <button type="button" className="m-icono-btn" onClick={onCerrar} aria-label="Cerrar el asistente" title="Cierra el asistente; la conversación se queda (Esc)"><X aria-hidden /></button>
      </header>

      <div className="c-asis-cuerpo" ref={listaRef} aria-live="polite">
        {sinSesion && <p className="c-asis-nota" role="status">{prueba ? 'El asistente necesita tu sesión real: en modo de prueba no se conecta. Sal del modo de prueba y entra con tu cuenta para usarlo.' : 'Falta configurar Supabase en esta copia de la app.'}</p>}
        {!sinSesion && tope === 'tope' && <p className="c-asis-nota c-asis-nota-peligro" role="status">Llegaste al tope de {usd(TOPE_USD)} de este mes. El asistente vuelve el mes que viene.</p>}
        {!sinSesion && tope === 'aviso' && <p className="c-asis-nota c-asis-nota-aviso" role="status">Ya vas en {usd(gastado ?? 0)} de {usd(TOPE_USD)} este mes. Al llegar a {usd(TOPE_USD)} se apaga hasta el mes que viene.</p>}
        {burbujas.length === 0 && (
          <div className="c-asis-bienvenida">
            <p>Dime un pago o un gasto y lo dejo listo para que lo confirmes, o pregúntame por tu dinero. Nada se guarda sin que toques «Guardar».</p>
            <div className="c-asis-ejemplos" role="group" aria-label="Ejemplos">
              {ejemplos.map((x) => <button key={x} type="button" className="m-chip" disabled={apagado} onClick={() => { setTexto(x); areaRef.current?.focus() }} title={`Escribe «${x}» en el cuadro para que lo cambies o lo envíes`}>{x}</button>)}
            </div>
          </div>
        )}
        {burbujas.map((b) => {
          if (b.rol === 'usuario') return <p key={b.id} className="c-asis-msg" data-rol="usuario">{b.texto}</p>
          if (b.rol === 'asistente') return <p key={b.id} className="c-asis-msg" data-rol="asistente">{b.texto}</p>
          if (b.rol === 'error') return <p key={b.id} className="c-asis-msg" data-rol="error" role="alert">{b.texto}</p>
          if (b.rol === 'revision') return <TarjetaRevision key={b.id} b={b} onIr={onCerrar} />
          return (
            <TarjetaPropuesta key={b.id} b={b} cobros={cobros} hoy={hoy} destinos={destinos}
              onCambiarCliente={(id) => cambiar(b.id, (x) => (x.rol === 'propuesta' ? { ...x, clienteId: id } : x))}
              onEstado={(estado) => cambiar(b.id, (x) => (x.rol === 'propuesta' ? { ...x, estado } : x))}
              onCambiarPago={(cobro, inicial) => setCambiarPago({ cobro, inicial, id: b.id })}
              onCambiarGasto={(inicial) => setCambiarGasto({ inicial, id: b.id })}
            />
          )
        })}
        {ocupado && <p className="c-asis-msg c-asis-pensando" data-rol="asistente" role="status"><span aria-hidden /><span aria-hidden /><span aria-hidden />{ocupado === 'revisar' ? 'Revisando el mes…' : ocupado === 'anotar' ? 'Preparando el registro…' : 'Buscando la respuesta…'}</p>}
      </div>

      <div className="c-asis-acciones">
        <button type="button" className="m-btn m-btn-secundario m-btn-sm" disabled={apagado || !!ocupado} onClick={() => void revisar()} title={apagado ? 'Apagado: el asistente no está disponible' : `Revisa ${nombrePeriodo(periodo).toLowerCase()} de ${NOMBRE_NEGOCIO[neg]}: lo que de verdad ganaste y qué arreglar`}><ScanSearch size={14} aria-hidden /> Revisar el mes</button>
      </div>

      <form className="c-asis-escribir" onSubmit={(e) => { e.preventDefault(); void enviar() }}>
        <label htmlFor="asis-texto" className="sr-only">Escribe al asistente</label>
        <textarea id="asis-texto" ref={areaRef} className="m-entrada" rows={2} maxLength={1500} value={texto} disabled={apagado} placeholder={voz ? 'Te escucho…' : 'Pago, gasto o pregunta'} onChange={(e) => setTexto(e.target.value)} onKeyDown={tecla} />
        {puedeVoz && <button type="button" className="m-icono-btn c-asis-mic" data-activo={voz ? 'si' : 'no'} disabled={apagado} onClick={dictar} aria-pressed={voz} aria-label={voz ? 'Dejar de dictar' : 'Dictar con la voz'} title={voz ? 'Deja de escuchar' : 'Dicta con la voz; lo que digas se escribe en el cuadro'}>{voz ? <MicOff aria-hidden /> : <Mic aria-hidden />}</button>}
        <button type="submit" className="m-icono-btn c-asis-enviar" disabled={apagado || !!ocupado || !texto.trim()} aria-label="Enviar" title={!texto.trim() ? 'Apagado: escribe algo primero' : 'Envía el mensaje al asistente (Enter)'}><SendHorizontal aria-hidden /></button>
      </form>

      <footer className="c-asis-pie" data-estado={tope}>
        <span>Gastado este mes: {gastado == null ? 'USD —' : usd(gastado)} de {TOPE_USD}</span>
      </footer>

      {cambiarPago && (
        <VentanaPago cobro={cambiarPago.cobro} inicial={cambiarPago.inicial} onCerrar={() => setCambiarPago(null)} onHecho={() => { const id = cambiarPago.id; cambiar(id, (x) => (x.rol === 'propuesta' ? { ...x, estado: 'guardado' } : x)) }} />
      )}
      <FormRegistro
        abierta={cambiarGasto != null}
        titulo="Nuevo gasto"
        subtitulo="Lo preparó el asistente; revísalo antes de guardar."
        campos={camposGasto(m)}
        inicial={cambiarGasto?.inicial ?? {}}
        carpeta="gastos"
        onGuardar={async (d) => {
          await guardar('ctl_gastos', null, d)
          const id = cambiarGasto?.id
          if (id != null) cambiar(id, (x) => (x.rol === 'propuesta' ? { ...x, estado: 'guardado' } : x))
        }}
        onCerrar={() => setCambiarGasto(null)}
      />
    </div>
  )
}

function TarjetaPropuesta({ b, cobros, hoy, destinos, onCambiarCliente, onEstado, onCambiarPago, onCambiarGasto }: {
  b: Extract<Burbuja, { rol: 'propuesta' }>
  cobros: Cobro[]
  hoy: string
  destinos: { valor: string; nombre: string }[]
  onCambiarCliente: (id: string) => void
  onEstado: (e: 'guardado' | 'cancelado') => void
  onCambiarPago: (cobro: Cobro, inicial: { fecha: string; monto: number; forma: string; destino: string; nota: string }) => void
  onCambiarGasto: (inicial: Record<string, unknown>) => void
}) {
  const m = useModelo()
  const esc = useEscribir()
  const { guardar, borrar } = useDatos()
  const avisar = useAvisar()
  const [ocupado, setOcupado] = useState(false)
  const valido = (d: string) => destinos.some((x) => x.valor === d)
  const ultimo = leerUltimoDestino()
  const caja = b.cruda.destino === 'efectivo' ? destinos.find((x) => x.valor.startsWith('e:'))?.valor : undefined
  const destino = valido(b.cruda.destino) ? b.cruda.destino : caja ?? (b.cruda.tipo === 'pago' && valido(ultimo) ? ultimo : '')
  const forzado = b.clienteId ? m.clientes.find((c) => c.id === b.clienteId) : undefined
  const l: Lectura = leerPropuesta({ ...b.cruda, destino }, m, cobros, b.neg, hoy, forzado)
  const nombreDestino = (d: string) => destinos.find((x) => x.valor === d)?.nombre ?? 'Sin indicar'

  if (b.estado !== 'pendiente') {
    return <p className="c-asis-msg c-asis-hecho" data-rol="asistente">{b.estado === 'guardado' ? <><Check size={14} aria-hidden /> Guardado: {b.cruda.tipo === 'pago' ? 'pago' : 'gasto'} de {quetzales(b.cruda.monto)}.</> : 'Cancelado: no se guardó nada.'}</p>
  }
  if (l.tipo === 'error') return <p className="c-asis-msg" data-rol="error">{l.texto}</p>
  if (l.tipo === 'elegir') {
    const nid = negocioId(m, b.neg)
    const respaldo: Cliente[] = l.opciones.length ? l.opciones : m.clientes.filter((c) => !c.archivado && (!nid || c.negocio_id === nid) && pendientes(cobros).some((x) => x.cliente_id === c.id)).slice(0, 8)
    return (
      <div className="c-asis-tarjeta" role="group" aria-label="Elegir el cliente">
        <p><b>{l.opciones.length ? `¿Cuál «${l.dicho}»?` : `No encontré a «${l.dicho || 'ese cliente'}» entre tus clientes.`}</b> {l.opciones.length ? 'Hay más de uno con ese nombre.' : respaldo.length ? 'Elige a quién va el pago:' : 'Revisa el nombre y escríbelo otra vez.'}</p>
        <div className="c-asis-opciones">
          {respaldo.map((c) => <button key={c.id} type="button" className="m-btn m-btn-secundario m-btn-sm" onClick={() => onCambiarCliente(c.id)} title={`Usa a ${c.nombre} para este ${b.cruda.tipo}`}>{c.nombre}<small>{m.negocios.find((n) => n.id === c.negocio_id)?.nombre}</small></button>)}
        </div>
        <div className="c-asis-botones"><button type="button" className="m-btn m-btn-secundario m-btn-sm" onClick={() => onEstado('cancelado')} title="Descarta este registro sin guardar nada">Cancelar</button></div>
      </div>
    )
  }

  const guardarPago = async () => {
    if (l.tipo !== 'pago' || !l.cobro || l.problema || ocupado) return
    setOcupado(true)
    try {
      const deshacer = await esc.registrarPago(l.cobro, { fecha: l.fecha, monto: l.monto, forma: l.forma, destino: l.destino || null, referencia: null, nota: l.nota || null, comprobantes: [] }, esc.siguienteRecibo())
      if (l.destino) guardarUltimoDestino(l.destino)
      onEstado('guardado')
      avisar('Pago registrado.', 'bien', { texto: 'Deshacer', hacer: async () => { await deshacer(); avisar('Se deshizo.') } })
    } catch (e) {
      avisar(e instanceof Error ? e.message : 'No se pudo registrar.', 'error')
      setOcupado(false)
    }
  }

  const valoresGasto = (): Valores => l.tipo !== 'gasto' ? {} : ({
    fecha: l.fecha, monto: l.monto.toFixed(2), descripcion: l.descripcion, negocio_id: l.negocio_id, categoria_id: l.categoria_id, cliente_id: l.cliente?.id ?? '',
    cuenta: cuentaDeForma(l.forma), destino: l.destino, proveedor: '', proveedor_nit: '', factura_serie: '', factura_numero: '',
  })

  const guardarGasto = async () => {
    if (l.tipo !== 'gasto' || l.problema || ocupado) return
    setOcupado(true)
    try {
      const f = await guardar('ctl_gastos', null, convertir(camposGasto(m), valoresGasto()))
      onEstado('guardado')
      avisar(`Gasto «${l.descripcion}» guardado.`, 'bien', { texto: 'Deshacer', hacer: async () => { await borrar('ctl_gastos', [f.id]); avisar('Se deshizo.') } })
    } catch (e) {
      avisar(e instanceof Error ? e.message : 'No se pudo guardar.', 'error')
      setOcupado(false)
    }
  }

  const negocio = (id: string) => m.negocios.find((n) => n.id === id)?.nombre ?? ''
  const categoria = (id: string) => m.categorias.find((c) => c.id === id)?.nombre ?? ''
  const filas: [string, string][] = l.tipo === 'pago'
    ? [['Cliente', l.cliente.nombre], ['Cobro', l.cobro ? `${l.cobro.concepto} · pendiente ${quetzales(l.cobro.saldo)}` : 'No debe nada'], ['Fecha', fechaCorta(l.fecha)], ['Forma', nombreForma(l.forma)], ['Dónde cayó', l.destino ? nombreDestino(l.destino) : 'Sin indicar'], ...(l.nota ? [['Nota', l.nota] as [string, string]] : [])]
    : [['Descripción', l.descripcion || 'Sin descripción'], ['Fecha', fechaCorta(l.fecha)], ['Negocio', negocio(l.negocio_id) || 'Sin negocio'], ['Categoría', categoria(l.categoria_id) || 'Sin categoría'], ...(l.cliente ? [['Cliente', l.cliente.nombre] as [string, string]] : []), ['Forma', nombreForma(l.forma)], ['Salió de', l.destino ? nombreDestino(l.destino) : 'Sin indicar']]
  const titulo = l.tipo === 'pago' ? 'Pago de cliente' : 'Gasto'
  const cambiarTitulo = l.tipo === 'pago' ? (l.cobro ? 'Abre «Registrar pago» con estos datos para cambiarlos, aplicar saldo a favor o subir el comprobante' : 'Apagado: este cliente no tiene cobros pendientes') : 'Abre «Nuevo gasto» con estos datos para cambiarlos o subir la factura'

  return (
    <div className="c-asis-tarjeta" role="group" aria-label={`Propuesta: ${titulo}`}>
      <div className="c-asis-tarjeta-cabeza"><span className="m-etiqueta">{titulo} · sin guardar</span><b className="m-cifra">{quetzales(l.monto)}</b></div>
      {b.nota && <p className="m-texto-suave">{b.nota}</p>}
      <dl className="c-asis-datos">{filas.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
      {l.problema && <p className="c-asis-problema" role="status">{l.problema}{l.tipo === 'pago' && l.cobro ? ' Usa «Cambiar» para completarlo.' : l.tipo === 'gasto' ? ' Usa «Cambiar» para completarlo.' : ''}</p>}
      <div className="c-asis-botones">
        <button type="button" className="m-btn m-btn-secundario m-btn-sm" onClick={() => onEstado('cancelado')} title="Descarta este registro sin guardar nada">Cancelar</button>
        <button type="button" className="m-btn m-btn-secundario m-btn-sm" disabled={l.tipo === 'pago' && !l.cobro} onClick={() => { if (l.tipo === 'pago' && l.cobro) onCambiarPago(l.cobro, { fecha: l.fecha, monto: Math.min(l.monto, l.cobro.saldo), forma: l.forma, destino: l.destino, nota: l.nota }); else if (l.tipo === 'gasto') onCambiarGasto(valoresGasto()) }} title={cambiarTitulo}><Pencil size={14} aria-hidden /> Cambiar</button>
        <button type="button" className="m-btn m-btn-primario m-btn-sm" disabled={!!l.problema || ocupado} onClick={() => void (l.tipo === 'pago' ? guardarPago() : guardarGasto())} title={l.problema ? `Apagado: ${l.problema}` : l.tipo === 'pago' ? `Registra el pago de ${quetzales(l.monto)} con su recibo; se puede deshacer` : `Guarda el gasto de ${quetzales(l.monto)}; se puede deshacer`}>{ocupado ? 'Guardando…' : <><Check size={14} aria-hidden /> Guardar</>}</button>
      </div>
    </div>
  )
}

function TarjetaRevision({ b, onIr }: { b: Extract<Burbuja, { rol: 'revision' }>; onIr: () => void }) {
  const ir = useNavigate()
  const r = b.cifras.resultado
  return (
    <div className="c-asis-tarjeta c-asis-revision" role="group" aria-label="Revisión del mes">
      <div className="c-asis-tarjeta-cabeza"><span className="m-etiqueta">Revisión · {nombrePeriodo(b.cifras.periodo)} · {NOMBRE_NEGOCIO[b.neg]}</span></div>
      <div className="c-asis-cifras">
        <div><span>Entró</span><b className="m-cifra">{quetzales(r.ingresos)}</b></div>
        <div><span>Gastos</span><b className="m-cifra">{quetzales(r.gastos)}</b></div>
        <div data-signo={r.utilidad < 0 ? 'neg' : 'pos'}><span>De verdad ganaste</span><b className="m-cifra">{quetzales(r.utilidad)}</b></div>
      </div>
      {b.resumen && <p>{b.resumen}</p>}
      {b.hallazgos.length > 0 && (
        <ul className="c-asis-hallazgos">
          {b.hallazgos.map((h, i) => {
            const ruta = rutaDe(b.neg, h.pantalla, h.cliente_id || null)
            return (
              <li key={i} data-gravedad={h.gravedad}>
                <div><b>{h.titulo}</b>{h.detalle && <span>{h.detalle}</span>}</div>
                {ruta && <button type="button" className="m-btn m-btn-secundario m-btn-sm" onClick={() => { ir(ruta); onIr() }} title={`Abre ${NOMBRE_PANTALLA[h.pantalla].toLowerCase()} para arreglarlo`}>{NOMBRE_PANTALLA[h.pantalla]} <ArrowRight size={14} aria-hidden /></button>}
              </li>
            )
          })}
        </ul>
      )}
      <p className="m-texto-suave c-asis-letra">Las cifras las calcula el sistema; el asistente solo las explica.</p>
    </div>
  )
}
