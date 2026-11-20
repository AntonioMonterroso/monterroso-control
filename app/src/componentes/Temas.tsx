import { useEffect, useState } from 'react'
import { temaApi, type Modo } from '../lib/tema'
import Ventana from './Ventana'

export default function Temas({ abierta, onCambio, onCerrar }: { abierta: boolean; onCambio: () => void; onCerrar: () => void }) {
  const t = temaApi()
  const [, setN] = useState(0)
  useEffect(() => {
    const f = () => setN((n) => n + 1)
    document.addEventListener('monterroso:tema', f)
    return () => document.removeEventListener('monterroso:tema', f)
  }, [])
  if (!t) return null
  const grupos = t.GRUPOS ?? [['', t.COLORES]]
  const elegir = (k: string) => { t.aplicar(k); onCambio() }
  const modo = (m: Modo) => { t.aplicar(t.actual(), m); onCambio() }
  const sw = (v: { bg: string; primary: string; accent: string }) => <span style={{ background: v.bg }}><i style={{ background: v.primary }} /><i style={{ background: v.accent }} /></span>
  return (
    <Ventana abierta={abierta} ancho="amplia" titulo="Color y modo" subtitulo="Se guarda en tu usuario." onCerrar={onCerrar}>
      <div className="erp-modo-sel" role="group" aria-label="Modo">
        {([['claro', 'Claro'], ['oscuro', 'Oscuro'], ['auto', 'Automático']] as [Modo, string][]).map(([m, n]) => (
          <button key={m} type="button" className="m-chip" aria-pressed={t.modo() === m} onClick={() => modo(m)} title={m === 'auto' ? 'Sigue al modo del equipo' : `Usar el modo ${n.toLowerCase()}`}>{n}</button>
        ))}
      </div>
      {grupos.map(([g, ks]) => (
        <section key={g || 'todos'}>
          {g && <h4 className="erp-tema-grupo">{g}</h4>}
          <div className="erp-temas">
            {ks.filter((k) => t.COLORES.includes(k)).map((k) => {
              const c = t.version(k, 'claro'), o = t.version(k, 'oscuro')
              const activo = t.actual() === k
              return (
                <button key={k} type="button" className={`erp-tema${activo ? ' activo' : ''}`} aria-pressed={activo} onClick={() => elegir(k)} title={`Usar ${c.par}`}>
                  <span className="erp-tema-par" title="Claro · Oscuro">{sw(c)}{sw(o)}</span>{c.par}
                </button>
              )
            })}
          </div>
        </section>
      ))}
    </Ventana>
  )
}
