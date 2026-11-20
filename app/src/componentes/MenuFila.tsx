import { useEffect, useRef, type ReactNode } from 'react'

export interface ItemMenu { texto: string; titulo: string; icono?: ReactNode; hacer: () => void; peligro?: boolean; apagado?: string }

export default function MenuFila({ pos, items, onCerrar }: { pos: { x: number; y: number } | null; items: ItemMenu[]; onCerrar: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || !pos) return
    try { el.showPopover() } catch { void 0 }
    const r = el.getBoundingClientRect()
    el.style.left = `${Math.max(8, Math.min(pos.x, window.innerWidth - r.width - 8))}px`
    el.style.top = `${Math.max(8, Math.min(pos.y, window.innerHeight - r.height - 8))}px`
    el.querySelector<HTMLElement>('button:not(:disabled)')?.focus({ preventScroll: true })
    const fuera = (e: PointerEvent) => { if (!el.contains(e.target as Node)) onCerrar() }
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onCerrar() } }
    const t = window.setTimeout(() => document.addEventListener('pointerdown', fuera, true), 0)
    document.addEventListener('keydown', tecla, true)
    window.addEventListener('scroll', onCerrar, { passive: true })
    window.addEventListener('resize', onCerrar)
    return () => {
      window.clearTimeout(t)
      document.removeEventListener('pointerdown', fuera, true)
      document.removeEventListener('keydown', tecla, true)
      window.removeEventListener('scroll', onCerrar)
      window.removeEventListener('resize', onCerrar)
      try { el.hidePopover() } catch { void 0 }
    }
  }, [pos, onCerrar])
  if (!pos) return null
  return (
    <div
      ref={ref}
      popover="manual"
      className="c-menu-fila"
      role="menu"
      onKeyDown={(e) => {
        if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
        e.preventDefault()
        const bs = [...(ref.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [])]
        const i = bs.indexOf(document.activeElement as HTMLButtonElement)
        bs[(i + (e.key === 'ArrowDown' ? 1 : bs.length - 1)) % bs.length]?.focus({ preventScroll: true })
      }}
    >
      {items.map((it) => (
        <button
          key={it.texto}
          type="button"
          role="menuitem"
          className={it.peligro ? 'c-menu-peligro' : undefined}
          disabled={!!it.apagado}
          title={it.apagado ?? it.titulo}
          onClick={() => { onCerrar(); it.hacer() }}
        >
          {it.icono}<span>{it.texto}</span>
        </button>
      ))}
    </div>
  )
}
