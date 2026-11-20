import { X } from 'lucide-react'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'

let avisoAfueraVisto = false

export function subirAvisos() {
  window.dispatchEvent(new Event('c-ventana-abierta'))
}

function esBusqueda(t: EventTarget | null): boolean {
  return t instanceof HTMLInputElement && (t.type === 'search' || t.closest('.c-buscador, .c-combo') != null)
}

export default function Ventana({ abierta, titulo, subtitulo, ancho = 'normal', onCerrar, children, pie }: {
  abierta: boolean
  titulo: string
  subtitulo?: string
  ancho?: 'normal' | 'amplia'
  onCerrar: () => void
  children: ReactNode
  pie?: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const sucio = useRef(false)
  const [preguntar, setPreguntar] = useState(false)
  const [avisoAfuera, setAvisoAfuera] = useState(false)
  const idTitulo = useId()

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (abierta && !d.open) {
      sucio.current = false
      setPreguntar(false)
      setAvisoAfuera(false)
      d.showModal()
      subirAvisos()
      requestAnimationFrame(() => d.querySelector<HTMLElement>('.c-ventana-cuerpo input:not([type=hidden]):not([type=search]):not(:disabled), .c-ventana-cuerpo select:not(:disabled), .c-ventana-cuerpo textarea')?.focus({ preventScroll: true }))
    }
    if (!abierta && d.open) d.close()
  }, [abierta])

  const intentarCerrar = () => {
    if (sucio.current) setPreguntar(true)
    else onCerrar()
  }

  const marcarSucio = (t: EventTarget | null) => {
    if (esBusqueda(t)) return
    if (t instanceof HTMLElement && t.closest('dialog') === ref.current) sucio.current = true
  }

  return (
    <dialog
      ref={ref}
      className={`c-ventana${ancho === 'amplia' ? ' c-ventana-amplia' : ''}`}
      onCancel={(e) => { e.preventDefault(); if (e.target === e.currentTarget) intentarCerrar() }}
      onClick={(e) => { if (e.target === e.currentTarget && !avisoAfueraVisto) { avisoAfueraVisto = true; setAvisoAfuera(true) } }}
      onDoubleClick={(e) => { if (e.target === e.currentTarget) intentarCerrar() }}
      onInput={(e) => marcarSucio(e.target)}
      onChange={(e) => marcarSucio(e.target)}
      aria-labelledby={idTitulo}
    >
      {abierta && (
        <div className="c-ventana-caja">
          <header className="c-ventana-cabeza">
            <div>
              <h2 id={idTitulo}>{titulo}</h2>
              {subtitulo && <p className="m-texto-suave">{subtitulo}</p>}
            </div>
            <button type="button" className="m-icono-btn" onClick={onCerrar} aria-label="Cerrar" title="Cierra esta ventana sin guardar (Esc)"><X aria-hidden /></button>
          </header>
          {avisoAfuera && <p className="c-aviso-afuera" role="status">Para cerrar esta ventana: doble clic afuera, la X o Esc.</p>}
          <div className="c-ventana-cuerpo">{children}</div>
          {pie && <footer className="c-ventana-pie">{pie}</footer>}
        </div>
      )}
      {preguntar && <SalirSinGuardar onSi={() => { setPreguntar(false); onCerrar() }} onNo={() => setPreguntar(false)} />}
    </dialog>
  )
}

function SalirSinGuardar({ onSi, onNo }: { onSi: () => void; onNo: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const idTitulo = useId()
  useEffect(() => {
    const d = ref.current
    if (d && !d.open) { d.showModal(); subirAvisos(); d.querySelector<HTMLElement>('.m-btn-secundario')?.focus({ preventScroll: true }) }
  }, [])
  return (
    <dialog
      ref={ref}
      className="c-ventana c-ventana-chica"
      onCancel={(e) => { e.preventDefault(); e.stopPropagation(); onNo() }}
      onDoubleClick={(e) => { e.stopPropagation(); if (e.target === e.currentTarget) onNo() }}
      onClick={(e) => e.stopPropagation()}
      aria-labelledby={idTitulo}
    >
      <div className="c-ventana-caja">
        <header className="c-ventana-cabeza"><div><h2 id={idTitulo}>¿Salir sin guardar?</h2></div></header>
        <div className="c-ventana-cuerpo"><p>Lo que escribiste en esta ventana se pierde.</p></div>
        <footer className="c-ventana-pie">
          <button type="button" className="m-btn m-btn-secundario" onClick={onNo} title="Vuelve a la ventana con lo escrito (Esc)">Seguir aquí</button>
          <button type="button" className="m-btn m-btn-peligro" onClick={onSi} title="Cierra la ventana y descarta lo escrito">Salir sin guardar</button>
        </footer>
      </div>
    </dialog>
  )
}
