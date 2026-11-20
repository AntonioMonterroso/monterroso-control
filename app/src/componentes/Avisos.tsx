import { CheckCircle2, CircleAlert } from 'lucide-react'
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

type Tipo = 'bien' | 'error'
interface Accion { texto: string; hacer: () => void | Promise<void> }
interface Aviso { id: number; texto: string; tipo: Tipo; accion?: Accion }

const Ctx = createContext<(texto: string, tipo?: Tipo, accion?: Accion) => void>(() => undefined)

export function ProveedorAvisos({ children }: { children: ReactNode }) {
  const [lista, setLista] = useState<Aviso[]>([])
  const ref = useRef<HTMLDivElement>(null)
  const avisar = useCallback((texto: string, tipo: Tipo = 'bien', accion?: Accion) => {
    const id = Date.now() + Math.random()
    setLista((l) => [...l, { id, texto, tipo, accion }])
    setTimeout(() => setLista((l) => l.filter((a) => a.id !== id)), accion ? 9000 : tipo === 'error' ? 6000 : 3200)
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el || !('showPopover' in el)) return
    try {
      if (lista.length) { if (el.matches(':popover-open')) el.hidePopover(); el.showPopover() }
      else if (el.matches(':popover-open')) el.hidePopover()
    } catch { return }
  }, [lista])

  useEffect(() => {
    const subir = () => {
      const el = ref.current
      if (!el || !('showPopover' in el)) return
      try { if (el.matches(':popover-open')) { el.hidePopover(); el.showPopover() } } catch { return }
    }
    window.addEventListener('c-ventana-abierta', subir)
    return () => window.removeEventListener('c-ventana-abierta', subir)
  }, [])

  return (
    <Ctx.Provider value={avisar}>
      {children}
      <div ref={ref} popover="manual" className="c-avisos" role="status" aria-live="polite">
        {lista.map((a) => (
          <div key={a.id} className={`c-aviso c-aviso-${a.tipo}`}>
            {a.tipo === 'bien' ? <CheckCircle2 size={18} aria-hidden /> : <CircleAlert size={18} aria-hidden />}
            <span>{a.texto}</span>
            {a.accion && <button type="button" className="c-aviso-accion" onClick={() => { setLista((l) => l.filter((x) => x.id !== a.id)); void a.accion!.hacer() }} title={a.accion.texto}>{a.accion.texto}</button>}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}

export function useAvisar() {
  return useContext(Ctx)
}
