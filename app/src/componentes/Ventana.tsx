import { X } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'

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
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (abierta && !d.open) {
      d.showModal()
      requestAnimationFrame(() => d.querySelector<HTMLElement>('.c-ventana-cuerpo input:not([type=hidden]):not(:disabled), .c-ventana-cuerpo select:not(:disabled), .c-ventana-cuerpo textarea')?.focus())
    }
    if (!abierta && d.open) d.close()
  }, [abierta])

  return (
    <dialog
      ref={ref}
      className={`c-ventana${ancho === 'amplia' ? ' c-ventana-amplia' : ''}`}
      onCancel={(e) => { e.preventDefault(); onCerrar() }}
      aria-labelledby="c-ventana-titulo"
    >
      {abierta && (
        <div className="c-ventana-caja">
          <header className="c-ventana-cabeza">
            <div>
              <h2 id="c-ventana-titulo">{titulo}</h2>
              {subtitulo && <p className="m-texto-suave">{subtitulo}</p>}
            </div>
            <button type="button" className="m-icono-btn" onClick={onCerrar} aria-label="Cerrar" title="Cerrar sin guardar (Esc)"><X aria-hidden /></button>
          </header>
          <div className="c-ventana-cuerpo">{children}</div>
          {pie && <footer className="c-ventana-pie">{pie}</footer>}
        </div>
      )}
    </dialog>
  )
}
