import { ChevronDown } from 'lucide-react'
import { useCallback, useState } from 'react'
import MenuFila, { type ItemMenu } from './MenuFila'

export default function MenuMas({ items, texto = 'Más' }: { items: ItemMenu[]; texto?: string }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const cerrar = useCallback(() => setPos(null), [])
  return (
    <>
      <button type="button" className="m-btn m-btn-secundario" aria-haspopup="menu" aria-expanded={pos != null} onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); setPos(pos ? null : { x: r.left, y: r.bottom + 6 }) }} title={`Abre más acciones: ${items.map((i) => i.texto).join(', ')}`}>
        {texto} <ChevronDown size={16} aria-hidden />
      </button>
      <MenuFila pos={pos} items={items} onCerrar={cerrar} />
    </>
  )
}
