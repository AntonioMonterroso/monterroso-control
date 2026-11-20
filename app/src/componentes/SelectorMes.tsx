import { ChevronLeft, ChevronRight } from 'lucide-react'
import { sumarMeses } from '../lib/finanzas'
import { nombreMes, partes } from '../lib/fechas'

export default function SelectorMes({ periodo, onCambio }: { periodo: string; onCambio: (p: string) => void }) {
  const [a, m] = partes(`${periodo}-01`)
  return (
    <div className="c-selector-mes" role="group" aria-label="Mes">
      <button type="button" className="m-icono-btn" onClick={() => onCambio(sumarMeses(periodo, -1))} aria-label="Mes anterior" title="Ver el mes anterior"><ChevronLeft aria-hidden /></button>
      <label>
        <span className="sr-only">Elegir mes</span>
        <input type="month" className="m-entrada" value={periodo} onChange={(e) => e.target.value && onCambio(e.target.value)} />
        <b aria-hidden>{nombreMes(a, m)}</b>
      </label>
      <button type="button" className="m-icono-btn" onClick={() => onCambio(sumarMeses(periodo, 1))} aria-label="Mes siguiente" title="Ver el mes siguiente"><ChevronRight aria-hidden /></button>
    </div>
  )
}
