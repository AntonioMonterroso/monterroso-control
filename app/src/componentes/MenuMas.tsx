import { ChevronDown, MoreHorizontal } from 'lucide-react'
import { useCallback, useState } from 'react'
import MenuFila, { type ItemMenu } from './MenuFila'

export default function MenuMas({ items, texto = 'Más', icono }: { items: ItemMenu[]; texto?: string; icono?: boolean }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const cerrar = useCallback(() => setPos(null), [])
  return (
    <>
      {icono ? <button type="button" className="m-icono-btn" aria-haspopup="menu" aria-expanded={pos != null} aria-label="Más acciones" onClick={(e) => { e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); setPos(pos ? null : { x: r.right - 200, y: r.bottom + 6 }) }} title={`Más acciones: ${items.map((i) => i.texto).join(', ')}`}><MoreHorizontal aria-hidden /></button> : <button type="button" className="m-btn m-btn-secundario" aria-haspopup="menu" aria-expanded={pos != null} onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); setPos(pos ? null : { x: r.left, y: r.bottom + 6 }) }} title={`Abre más acciones: ${items.map((i) => i.texto).join(', ')}`}>
        {texto} <ChevronDown size={16} aria-hidden />
      </button>}
      <MenuFila pos={pos} items={items} onCerrar={cerrar} />
    </>
  )
}
