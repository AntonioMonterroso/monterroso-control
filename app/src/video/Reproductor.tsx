import { Pause, Play, SkipBack, SkipForward } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { escenaHasta } from './revisar'
import type { Boton, Escena, GuiaVideo, Pieza } from './tipos'

const ANCHO = 960
const ALTO = 540

const g = (id?: string) => (id ? { 'data-g': id } : {})

function Botones({ l }: { l: Boton[] }) {
  return <>{l.map((b, i) => <span key={`${b.t}-${i}`} className={`v-btn${b.p ? ' v-p' : ''}`} {...g(b.g)}>{b.t}</span>)}</>
}

function PiezaVista({ p }: { p: Pieza }) {
  switch (p.k) {
    case 'cifras': return <div className="v-cifras" {...g(p.g)}>{p.l.map((c, i) => <div key={i} className="v-cifra" {...g(c.g)}><small>{c.et}</small><b>{c.v}</b>{c.sub && <small>{c.sub}</small>}</div>)}</div>
    case 'botones': return <div className="v-botones" {...g(p.g)}><Botones l={p.l} /></div>
    case 'menu': return <div className="v-menu" {...g(p.g)}><Botones l={p.l} /></div>
    case 'chips': return <div className="v-chips" {...g(p.g)}>{p.l.map((c, i) => <span key={i} className={`v-chip${c.on ? ' v-on' : ''}`} {...g(c.g)}>{c.t}</span>)}</div>
    case 'pestanas': return <div className="v-pest" {...g(p.g)}>{p.l.map((c, i) => <span key={i} className={i === p.on ? 'v-on' : undefined} {...g(c.g)}>{c.t}</span>)}</div>
    case 'busca': return <div className="v-busca" {...g(p.g)}>{p.t}</div>
    case 'campos': return <div className="v-campos" {...g(p.g)}>{p.l.map((c, i) => <div key={i} className="v-campo" {...g(c.g)}><small>{c.et}</small><span>{c.v}</span></div>)}</div>
    case 'subtitulo': return <b className="v-sub" {...g(p.g)}>{p.t}</b>
    case 'texto': return <p className="v-texto" {...g(p.g)}>{p.t}</p>
    case 'aviso': return <p className="v-aviso" {...g(p.g)}>{p.t}</p>
    case 'ok': return <p className="v-ok" {...g(p.g)}>{p.t}</p>
    case 'tabla': {
      const conAcc = p.filas.some((f) => f.acc?.length)
      const plantilla = { gridTemplateColumns: `repeat(${p.cab.length}, minmax(0, 1fr))${conAcc ? ' max-content' : ''}` }
      return (
      <div className="v-tabla" {...g(p.g)}>
        <div className="v-fila v-cab" style={plantilla}>{p.cab.map((c, i) => <span key={i}>{c}</span>)}{p.filas.some((f) => f.acc?.length) && <span />}</div>
        {p.filas.map((f, i) => <div key={i} className="v-fila" style={plantilla} {...g(f.g)}>{f.c.map((c, j) => <span key={j}>{c}</span>)}{p.filas.some((x) => x.acc?.length) && <span className="v-acc">{f.acc && <Botones l={f.acc} />}</span>}</div>)}
        {p.pie && <div className="v-fila v-pie" style={plantilla}>{p.pie.map((c, i) => <span key={i}>{c}</span>)}</div>}
      </div>
      )
    }
  }
}

function Pantalla({ e, menu }: { e: Escena; menu: string }) {
  return (
    <div className="v-app">
      <aside className="v-lateral"><i className="v-logo" />{Array.from({ length: 8 }, (_, i) => <i key={i} className={i === 2 ? 'v-on' : undefined} />)}<span className="v-menu-nombre">{menu}</span></aside>
      <div className="v-main">
        <div className="v-cabeza" {...g('titulo')}>
          <div>{e.etiqueta && <small>{e.etiqueta}</small>}<h3>{e.titulo}</h3></div>
          {e.acciones && <div className="v-botones"><Botones l={e.acciones} /></div>}
        </div>
        {e.piezas.map((p, i) => <PiezaVista key={i} p={p} />)}
      </div>
      {e.hoja && (
        <div className="v-velo"><div className="v-hoja" {...g('hoja')}>
          <b className="v-hoja-t">{e.hoja.titulo}</b>
          <div className="v-hoja-c">{e.hoja.piezas.map((p, i) => <PiezaVista key={i} p={p} />)}</div>
          {e.hoja.pie && <div className="v-hoja-p"><Botones l={e.hoja.pie} /></div>}
        </div></div>
      )}
    </div>
  )
}

const duracion = (t: { t: string; ms?: number }) => t.ms ?? Math.max(2800, t.t.length * 42)

export default function Reproductor({ guia }: { guia: GuiaVideo }) {
  const quieto = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const [cap, setCap] = useState(0)
  const [toma, setToma] = useState(0)
  const [pausado, setPausado] = useState(false)
  const [escena, setEscena] = useState<Escena>(() => escenaHasta(guia, 0, 0))
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null)
  const [anillo, setAnillo] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const [pulso, setPulso] = useState(0)
  const [escala, setEscala] = useState(1)
  const marco = useRef<HTMLDivElement>(null)
  const escenario = useRef<HTMLDivElement>(null)
  const timers = useRef<number[]>([])
  const caps = guia.caps
  const actual = caps[cap]?.tomas[toma]
  const fin = cap === caps.length - 1 && toma === (caps[cap]?.tomas.length ?? 1) - 1

  useLayoutEffect(() => {
    const el = marco.current
    if (!el) return
    const ajustar = () => setEscala(el.clientWidth / ANCHO || 1)
    ajustar()
    const ro = new ResizeObserver(ajustar)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const limpiar = () => { timers.current.forEach((t) => window.clearTimeout(t)); timers.current = [] }
  const luego = (ms: number, f: () => void) => { timers.current.push(window.setTimeout(f, ms)) }

  const ir = (c: number, i: number) => {
    limpiar()
    setCap(c); setToma(i); setAnillo(null)
  }
  const siguiente = () => {
    const t = caps[cap].tomas
    if (toma < t.length - 1) ir(cap, toma + 1)
    else if (cap < caps.length - 1) ir(cap + 1, 0)
    else setPausado(true)
  }
  const anterior = () => {
    if (toma > 0) ir(cap, toma - 1)
    else if (cap > 0) ir(cap - 1, caps[cap - 1].tomas.length - 1)
  }

  useEffect(() => {
    if (!actual) return
    limpiar()
    setEscena(escenaHasta(guia, cap, toma))
    setAnillo(null)
    const dondeEsta = () => {
      const raiz = escenario.current
      const el = actual.en ? raiz?.querySelector<HTMLElement>(`[data-g="${actual.en}"]`) : null
      if (!raiz || !el) return null
      const a = el.getBoundingClientRect(), b = raiz.getBoundingClientRect()
      return { x: (a.left - b.left) / escala, y: (a.top - b.top) / escala, w: a.width / escala, h: a.height / escala }
    }
    luego(120, () => {
      const p = dondeEsta()
      if (p) setCursor({ x: p.x + Math.min(p.w * 0.6, p.w - 6), y: p.y + p.h * 0.55 })
      luego(quieto ? 80 : 520, () => {
        if (p) setAnillo(p)
        if (actual.clic) luego(320, () => {
          if (!quieto) setPulso((n) => n + 1)
          luego(260, () => { if (actual.luego) { setEscena((e) => ({ ...e, ...actual.luego })); setAnillo(null) } })
        })
      })
    })
    if (!pausado) luego(duracion(actual), siguiente)
    return limpiar
  }, [cap, toma, pausado, escala])

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && t.closest('input, textarea, select, [contenteditable=true]')) return
      if (!marco.current?.closest('dialog[open]') || marco.current.closest('dialog') !== document.querySelectorAll('dialog[open]')[document.querySelectorAll('dialog[open]').length - 1]) return
      if (e.key === 'ArrowRight') { e.preventDefault(); siguiente() }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); anterior() }
      else if (e.key === ' ' && !(t && t.closest('button'))) { e.preventDefault(); setPausado((x) => !x) }
    }
    document.addEventListener('keydown', tecla)
    return () => document.removeEventListener('keydown', tecla)
  })

  const total = caps.reduce((t, c) => t + c.tomas.length, 0)
  const hechas = caps.slice(0, cap).reduce((t, c) => t + c.tomas.length, 0) + toma

  return (
    <div className="v-video">
      <div className="v-marco" ref={marco} style={{ height: ALTO * escala }}>
        <div className="v-escenario" ref={escenario} style={{ width: ANCHO, height: ALTO, transform: `scale(${escala})` }} aria-hidden>
          <Pantalla e={escena} menu={guia.menu} />
          {anillo && <span className="v-anillo" style={{ left: anillo.x - 5, top: anillo.y - 5, width: anillo.w + 10, height: anillo.h + 10 }} />}
          {cursor && (
            <span key={pulso} className={`v-cursor${quieto ? ' v-quieto' : ''}${pulso ? ' v-clic' : ''}`} style={{ transform: `translate(${cursor.x}px, ${cursor.y}px)` }}>
              <svg viewBox="0 0 24 24" width="26" height="26"><path d="M4 3l7 17 2.5-7.5L21 10z" fill="currentColor" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" /></svg>
            </span>
          )}
        </div>
      </div>
      <p className="v-explica" aria-live="polite">{actual?.t}</p>
      <div className="v-control">
        <button type="button" className="m-icono-btn" onClick={anterior} disabled={cap === 0 && toma === 0} aria-label="Anterior" title={cap === 0 && toma === 0 ? 'Apagado: ya está en la primera toma' : 'Vuelve a la toma anterior (←)'}><SkipBack aria-hidden /></button>
        <button type="button" className="m-icono-btn v-play" onClick={() => { if (fin && pausado) ir(0, 0); setPausado((x) => !x) }} aria-label={pausado ? 'Reproducir' : 'Pausar'} title={pausado ? 'Sigue el video desde aquí (espacio)' : 'Pausa el video (espacio)'}>{pausado ? <Play aria-hidden /> : <Pause aria-hidden />}</button>
        <button type="button" className="m-icono-btn" onClick={siguiente} disabled={fin} aria-label="Siguiente" title={fin ? 'Apagado: es la última toma' : 'Pasa a la siguiente toma (→)'}><SkipForward aria-hidden /></button>
        <div className="v-avance" role="group" aria-label="Capítulos">
          {caps.map((c, i) => {
            const relleno = i < cap ? 100 : i > cap ? 0 : ((toma + 1) / c.tomas.length) * 100
            return <button key={i} type="button" style={{ flex: c.tomas.length }} onClick={() => ir(i, 0)} aria-label={c.t} title={`Va a ${c.t}`}><i style={{ width: `${relleno}%` }} /></button>
          })}
        </div>
        <span className="v-cuenta">{hechas + 1} de {total}</span>
      </div>
      <nav className="v-caps" aria-label="Capítulos">
        {caps.map((c, i) => <button key={i} type="button" className="m-chip" aria-pressed={i === cap} onClick={() => ir(i, 0)} title={`Va a ${c.t}`}>{c.t}</button>)}
      </nav>
    </div>
  )
}
