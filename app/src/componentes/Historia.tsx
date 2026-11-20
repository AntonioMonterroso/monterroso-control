import { quetzales } from '../lib/dinero'
import { nombreMes } from '../lib/fechas'
import type { Cambio } from '../lib/historial'

const mes = (m: string) => { const [a, n] = m.split('-').map(Number); return nombreMes(a, n) }
const CAMPOS: Record<string, string> = { mensualidad: 'Mensualidad', inscripcion: 'Inscripción', precio: 'Precio', costo: 'Costo', regimen: 'Régimen' }
const cuando = (c: string) => (c ? new Date(c).toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short' }) : '')

export default function Historia({ cambios, monto, titulo = 'Lo que cambió' }: { cambios: Cambio[]; monto?: boolean; titulo?: string }) {
  if (!cambios.length) return null
  const v = (x: string | null) => (x == null ? '—' : monto ? quetzales(Number(x)) : x)
  return (
    <div className="c-historia-caja">
      <h3 className="m-seccion-titulo">{titulo}</h3>
      <ul className="c-historia">
        {[...cambios].reverse().map((c) => (
          <li key={c.id}>
            <b>{CAMPOS[c.campo] ?? c.campo} desde {mes(c.desde).toLowerCase()}: {v(c.despues)}</b> <span>(antes {v(c.antes)})</span>
            <small>{[c.motivo, c.por, cuando(c.creado)].filter(Boolean).join(' · ')}</small>
          </li>
        ))}
      </ul>
    </div>
  )
}
