import { Copy, GraduationCap, Printer } from 'lucide-react'
import Pestanas from './Pestanas'
import Reproductor from '../video/Reproductor'
import { guiaDe } from '../video/indice'
import { useState } from 'react'
import { matchPath, useLocation } from 'react-router-dom'
import { esc, imprimir } from '../lib/imprimir'
import { PASOS } from '../lib/pasos'
import { useAvisar } from './Avisos'
import Ventana from './Ventana'

const IGUAL_QUE: Record<string, string> = { '/dev': '/', '/dev/cobros': '/cobros', '/dev/pagos': '/pagos', '/dev/gastos': '/gastos', '/dev/presupuesto': '/presupuestos' }

export function pasosDe(ruta: string) {
  const r = IGUAL_QUE[ruta] ?? ruta
  return PASOS.find((g) => matchPath({ path: g.ruta, end: true }, r))
}

export function irAParte(selector: string): boolean {
  const el = document.querySelector<HTMLElement>(selector)
  if (!el) return false
  el.scrollIntoView({ block: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  el.classList.remove('c-resalta')
  void el.offsetWidth
  el.classList.add('c-resalta')
  window.setTimeout(() => el.classList.remove('c-resalta'), 1800)
  if (el.matches('button, a, input, select, textarea')) el.focus({ preventScroll: true })
  return true
}

export default function Pasos() {
  const lugar = useLocation()
  const avisar = useAvisar()
  const [abierta, setAbierta] = useState(false)
  const [pest, setPest] = useState<'video' | 'pasos'>('video')
  const guia = pasosDe(lugar.pathname)
  const video = guiaDe(lugar.pathname)
  if (!guia) return null
  const titulo = document.querySelector('.c-cabeza .erp-titulo')?.childNodes[0]?.textContent?.trim() || 'Esta pantalla'
  const texto = () => guia.pasos.map((p, i) => `${i + 1}. ${p.texto}`).join('\n')
  const ir = (sel: string) => {
    setAbierta(false)
    window.setTimeout(() => { if (!irAParte(sel)) avisar('Esa parte no está a la vista ahora.', 'error') }, 60)
  }
  return (
    <>
      <button type="button" className="m-btn m-btn-secundario m-btn-sm c-btn-pasos" onClick={() => { setPest(video ? 'video' : 'pasos'); setAbierta(true) }} title="Abre el video y los pasos de esta pantalla: qué tocar y qué pasa">
        <GraduationCap size={16} aria-hidden /> Video y pasos
      </button>
      <Ventana abierta={abierta} ancho="amplia" titulo={`Cómo se trabaja ${video?.menu && video.ruta.includes(':') ? `${titulo} (${video.menu})` : titulo}`} subtitulo={pest === 'video' ? 'El cursor hace cada clic y abajo se explica. Pausa cuando quieras.' : 'Qué tocar y qué pasa. «Ir a…» te lleva a esa parte.'} onCerrar={() => setAbierta(false)} pie={pest === 'video' ? <button type="button" className="m-btn m-btn-secundario" onClick={() => setAbierta(false)} title="Cierra el video (Esc)">Cerrar</button> : 
        <>
          <button type="button" className="m-btn m-btn-salida" onClick={() => { void navigator.clipboard.writeText(texto()).then(() => avisar('Pasos copiados.'), () => avisar('No se pudo copiar.', 'error')) }} title="Copia los pasos como texto para pegarlos donde quieras"><Copy size={16} aria-hidden /> Copiar</button>
          <button type="button" className="m-btn m-btn-salida" onClick={() => { if (!imprimir(`Pasos · ${titulo}`, `<h1>Pasos · ${esc(titulo)}</h1><ol>${guia.pasos.map((p) => `<li>${esc(p.texto)}</li>`).join('')}</ol>`)) avisar('El navegador bloqueó la ventana para imprimir.', 'error') }} title="Abre los pasos listos para imprimir o guardar en PDF"><Printer size={16} aria-hidden /> Imprimir</button>
          <button type="button" className="m-btn m-btn-secundario" onClick={() => setAbierta(false)} title="Cierra los pasos (Esc)">Cerrar</button>
        </>
      }>
        {video && <div className="c-pasos-pest"><Pestanas etiqueta="Ver como" valor={pest} onCambio={setPest} opciones={[{ valor: 'video', nombre: 'Video' }, { valor: 'pasos', nombre: 'Pasos' }]} /></div>}
        {pest === 'video' && video ? <Reproductor key={video.ruta} guia={video} /> : (
        <ol className="c-guia-pasos">
          {guia.pasos.map((p, i) => (
            <li key={i}>
              <span>{p.texto}</span>
              {p.ir && <button type="button" className="m-btn m-btn-secundario m-btn-sm" onClick={() => ir(p.ir!)} title="Cierra los pasos y te lleva a esa parte de la pantalla">Ir a…</button>}
            </li>
          ))}
        </ol>
        )}
      </Ventana>
    </>
  )
}
