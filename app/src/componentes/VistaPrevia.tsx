import { FileDown, MessageCircle } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { documentoHtml } from '../lib/imprimir'
import type { Area } from '../lib/marca'

const ANCHO = 864
const PAGINA = 1056

const ESTILO_PREVIA = `<style>
html { background: #d9dee5; }
body { padding: 24px 0; margin: 0; }
.hoja { width: 816px; max-width: none; min-height: ${PAGINA}px; box-sizing: border-box; padding: 60px 64px; margin: 0 auto; background: #fff repeating-linear-gradient(to bottom, transparent 0, transparent ${PAGINA - 2}px, #c7ced8 ${PAGINA - 2}px, #c7ced8 ${PAGINA}px); box-shadow: 0 6px 22px rgba(0, 0, 0, .16); }
mark.falta { background: #fde68a; color: #7c2d12; padding: 0 3px; border-radius: 3px; font-weight: 600; }
</style>`

export function marcarFaltas(html: string): string {
  return html.replace(/\[Falta: ([^\]<]+)\]/g, '<mark class="falta">[Falta: $1]</mark>')
}

export default function VistaPrevia({ titulo, cuerpo, area, faltan, onPdf, onWhatsapp }: { titulo: string; cuerpo: string; area: Area; faltan: string[]; onPdf: () => void; onWhatsapp?: () => void }) {
  const caja = useRef<HTMLDivElement>(null)
  const marco = useRef<HTMLIFrameElement>(null)
  const listo = useRef(false)
  const [modo, setModo] = useState<'ancho' | '100'>('ancho')
  const [disp, setDisp] = useState(ANCHO)
  const [alto, setAlto] = useState(PAGINA + 48)
  const [pagina, setPagina] = useState(1)
  const html = documentoHtml(titulo, marcarFaltas(cuerpo), '', area, '', false).replace('</head>', `${ESTILO_PREVIA}</head>`)
  const [inicial] = useState(html)
  const escala = modo === 'ancho' ? Math.min(1, disp / ANCHO) : 1
  const paginas = Math.max(1, Math.ceil((alto - 48) / PAGINA))

  useLayoutEffect(() => {
    const el = caja.current
    if (!el) return
    const ro = new ResizeObserver(() => setDisp(el.clientWidth - 2))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const medir = () => {
    const d = marco.current?.contentDocument
    if (d) setAlto(Math.max(PAGINA + 48, d.documentElement.scrollHeight))
  }

  useEffect(() => {
    const d = marco.current?.contentDocument
    if (!listo.current || !d) return
    const nuevo = new DOMParser().parseFromString(html, 'text/html')
    d.body.innerHTML = nuevo.body.innerHTML
    requestAnimationFrame(medir)
  }, [html])

  return (
    <div className="c-previa-doc">
      <div className="c-previa-barra">
        <div className="c-chips" role="group" aria-label="Tamaño de la vista">
          <button type="button" className="m-chip" aria-pressed={modo === 'ancho'} onClick={() => setModo('ancho')} title="Ajusta la hoja al ancho disponible">Ajustar al ancho</button>
          <button type="button" className="m-chip" aria-pressed={modo === '100'} onClick={() => setModo('100')} title="Muestra la hoja a tamaño real">100 %</button>
        </div>
        <span className="c-previa-pagina" aria-live="polite">Página {Math.min(pagina, paginas)} de {paginas}</span>
        <span className="c-fila-botones">
          <button type="button" className="m-btn m-btn-salida m-btn-sm" onClick={onPdf} title={faltan.length ? `Abre el PDF; todavía falta: ${faltan.join(', ')}` : 'Abre el PDF listo para guardar, imprimir y firmar'}><FileDown size={14} aria-hidden /> Bajar PDF</button>
          {onWhatsapp && <button type="button" className="m-btn m-btn-salida m-btn-sm" onClick={onWhatsapp} title={`Abre el PDF para guardarlo y WhatsApp con el mensaje listo para adjuntarlo${faltan.length ? `; todavía falta: ${faltan.join(', ')}` : ''}`}><MessageCircle size={14} aria-hidden /> Enviar por WhatsApp</button>}
        </span>
      </div>
      {faltan.length > 0 && <p className="c-previa-faltan" role="status">Falta: {faltan.join(' · ')}</p>}
      <div ref={caja} className="c-previa-caja" onScroll={(e) => setPagina(Math.floor((e.currentTarget.scrollTop + 40) / (PAGINA * escala)) + 1)}>
        <div style={{ width: ANCHO * escala, height: alto * escala }}>
          <iframe
            ref={marco}
            title={`Vista previa · ${titulo}`}
            srcDoc={inicial}
            onLoad={() => { listo.current = true; const d = marco.current?.contentDocument; if (d && html !== inicial) { d.body.innerHTML = new DOMParser().parseFromString(html, 'text/html').body.innerHTML } medir() }}
            style={{ width: ANCHO, height: alto, transform: `scale(${escala})`, transformOrigin: '0 0', border: 0, display: 'block' }}
            tabIndex={-1}
          />
        </div>
      </div>
    </div>
  )
}

export function useAncho(min: number): boolean {
  const q = `(min-width: ${min}px)`
  const [si, setSi] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches)
  useEffect(() => {
    const mq = window.matchMedia(q)
    const f = () => setSi(mq.matches)
    mq.addEventListener('change', f)
    return () => mq.removeEventListener('change', f)
  }, [q])
  return si
}
