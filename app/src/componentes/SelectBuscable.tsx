import { useState } from 'react'
import { coincide } from './Buscador'

export default function SelectBuscable({ id, valor, opciones, onCambio, vacio, disabled, autoFocus }: {
  id: string
  valor: string
  opciones: { valor: string; nombre: string }[]
  onCambio: (v: string) => void
  vacio?: string
  disabled?: boolean
  autoFocus?: boolean
}) {
  const [q, setQ] = useState('')
  const muchas = opciones.length > 12
  const lista = muchas && q.trim() ? opciones.filter((o) => o.valor === valor || coincide(q, o.nombre)) : opciones
  return (
    <div className="c-select-buscable">
      {muchas && !disabled && <input type="search" className="m-entrada c-filtro-select" aria-label="Escribe para buscar en la lista" placeholder={`Buscar entre ${opciones.length}…`} value={q} onChange={(e) => setQ(e.target.value)} />}
      <select id={id} className="m-entrada" value={valor} disabled={disabled} autoFocus={autoFocus} onChange={(e) => onCambio(e.target.value)}>
        {vacio != null && <option value="">{vacio}</option>}
        {lista.map((o) => <option key={o.valor} value={o.valor}>{o.nombre}</option>)}
      </select>
      {muchas && q.trim() && <span className="m-ayuda">{lista.length} de {opciones.length}</span>}
    </div>
  )
}
