import { Search, X } from 'lucide-react'

export default function Buscador({ valor, onCambio, ayuda }: { valor: string; onCambio: (v: string) => void; ayuda: string }) {
  return (
    <label className="c-buscador">
      <Search size={16} aria-hidden />
      <span className="sr-only">Buscar</span>
      <input className="m-entrada" type="search" value={valor} placeholder={ayuda} onChange={(e) => onCambio(e.target.value)} />
      {valor && <button type="button" className="c-buscador-limpiar" onClick={() => onCambio('')} aria-label="Limpiar búsqueda" title="Borrar lo escrito y ver todo"><X size={14} aria-hidden /></button>}
    </label>
  )
}

export function normalizar(t: string): string {
  return t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

export function coincide(q: string, ...campos: (string | null | undefined)[]): boolean {
  const n = normalizar(q.trim())
  if (!n) return true
  const digitos = n.replace(/\D/g, '')
  return campos.some((c) => {
    if (!c) return false
    const v = normalizar(c)
    if (v.includes(n)) return true
    return digitos.length >= 3 && v.replace(/\D/g, '').includes(digitos)
  })
}
