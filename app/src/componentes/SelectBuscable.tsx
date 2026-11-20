import { ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { coincide } from './Buscador'

export interface OpcionSelect { valor: string; nombre: string; grupo?: string }

interface Props {
  id: string
  valor: string
  opciones: OpcionSelect[]
  onCambio: (v: string) => void
  vacio?: string
  disabled?: boolean
  autoFocus?: boolean
}

export default function SelectBuscable(p: Props) {
  if (p.opciones.length <= 12) {
    return (
      <select id={p.id} className="m-entrada" value={p.valor} disabled={p.disabled} autoFocus={p.autoFocus} onChange={(e) => p.onCambio(e.target.value)}>
        {p.vacio != null && <option value="">{p.vacio}</option>}
        {p.opciones.some((o) => o.grupo)
          ? [...new Set(p.opciones.map((o) => o.grupo ?? ''))].map((gr) => <optgroup key={gr} label={gr}>{p.opciones.filter((o) => (o.grupo ?? '') === gr).map((o) => <option key={o.valor} value={o.valor}>{o.nombre}</option>)}</optgroup>)
          : p.opciones.map((o) => <option key={o.valor} value={o.valor}>{o.nombre}</option>)}
      </select>
    )
  }
  return <Combo {...p} />
}

function Combo({ id, valor, opciones, onCambio, vacio, disabled, autoFocus }: Props) {
  const todas = vacio != null ? [{ valor: '', nombre: vacio }, ...opciones] : opciones
  const elegida = todas.find((o) => o.valor === valor)
  const [abierto, setAbierto] = useState(false)
  const [q, setQ] = useState('')
  const [activa, setActiva] = useState(0)
  const lista = q.trim() ? todas.filter((o) => coincide(q, o.nombre, o.valor, o.grupo)) : todas
  const ul = useRef<HTMLUListElement>(null)
  const bloquear = useRef(false)

  useEffect(() => {
    if (abierto) ul.current?.querySelector<HTMLElement>(`[data-i="${activa}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [activa, abierto])

  const abrir = () => {
    if (disabled) return
    setQ('')
    setActiva(Math.max(0, todas.findIndex((o) => o.valor === valor)))
    setAbierto(true)
  }
  const elegir = (o: OpcionSelect | undefined) => {
    if (o) onCambio(o.valor)
    setAbierto(false)
    setQ('')
  }

  return (
    <div className={`c-combo${abierto ? ' c-combo-abierto' : ''}`}>
      <input
        id={id}
        type="text"
        role="combobox"
        className="m-entrada c-combo-entrada"
        aria-expanded={abierto}
        aria-controls={`${id}-lista`}
        aria-autocomplete="list"
        aria-activedescendant={abierto && lista[activa] ? `${id}-op-${activa}` : undefined}
        autoComplete="off"
        disabled={disabled}
        autoFocus={autoFocus}
        title={`Escribe para buscar entre ${opciones.length}; flechas para moverte, Enter para elegir y Esc para cerrar sin cambiar`}
        placeholder={abierto ? `Buscar entre ${opciones.length}…` : (vacio ?? 'Elige…')}
        value={abierto ? q : (elegida && elegida.valor !== '' ? elegida.nombre : '')}
        onClick={() => { if (!abierto) abrir() }}
        onBlur={() => { setAbierto(false); setQ('') }}
        onChange={(e) => { setQ(e.target.value); setActiva(0); if (!abierto) setAbierto(true) }}
        onKeyPress={(e) => { if (e.key === 'Enter' && bloquear.current) e.preventDefault() }}
        onKeyUp={(e) => { if (e.key === 'Enter' && bloquear.current) e.preventDefault() }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); if (!abierto) abrir(); else setActiva((i) => Math.min(lista.length - 1, i + 1)) }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setActiva((i) => Math.max(0, i - 1)) }
          else if (e.key === 'Enter') { if (abierto) { e.preventDefault(); bloquear.current = true; window.setTimeout(() => { bloquear.current = false }, 300); elegir(lista[activa]) } }
          else if (e.key === 'Escape') { if (abierto) { e.preventDefault(); e.stopPropagation(); setAbierto(false); setQ('') } }
        }}
      />
      <ChevronDown className="c-combo-flecha" aria-hidden />
      {abierto && (
        <ul ref={ul} id={`${id}-lista`} role="listbox" className="c-combo-lista">
          {lista.map((o, i) => [
            o.grupo && o.grupo !== lista[i - 1]?.grupo ? <li key={`g-${o.grupo}`} className="c-combo-grupo" role="presentation">{o.grupo}</li> : null,
            <li
              key={o.valor || '_vacio'}
              id={`${id}-op-${i}`}
              data-i={i}
              role="option"
              aria-selected={o.valor === valor}
              className={i === activa ? 'c-combo-activa' : undefined}
              onMouseDown={(e) => { e.preventDefault(); elegir(o) }}
              onMouseMove={() => setActiva(i)}
            >
              {o.nombre}
            </li>,
          ])}
          {lista.length === 0 && <li className="c-combo-nada" role="presentation">Nada coincide.</li>}
          <li className="c-combo-cuenta" role="presentation">{lista.length} de {todas.length}</li>
        </ul>
      )}
    </div>
  )
}
