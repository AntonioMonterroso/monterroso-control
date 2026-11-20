import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { Children, cloneElement, isValidElement, useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import Buscador, { coincide } from './Buscador'
import MenuFila, { type ItemMenu } from './MenuFila'

export interface Columna<T> {
  titulo: string
  valor: (f: T) => ReactNode
  num?: boolean
  principal?: boolean
  oculto?: boolean
  orden?: (f: T) => string | number
  sinOrden?: boolean
}

export function textoDe(n: ReactNode): string {
  if (n == null || typeof n === 'boolean') return ''
  if (typeof n === 'string' || typeof n === 'number') return String(n)
  if (Array.isArray(n)) return n.map(textoDe).join(' ')
  if (isValidElement(n)) {
    const p = n.props as { children?: ReactNode; nombre?: unknown; c?: { estado?: string }; valor?: unknown }
    if (p.children != null) return textoDe(p.children)
    if (typeof p.nombre === 'string') return p.nombre
    if (typeof p.valor === 'string') return p.valor
    if (p.c?.estado) return p.c.estado
  }
  return ''
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

export function claveOrden(t: string): string | number {
  const s = t.trim()
  const fecha = s.match(/^(\d{2}) ([a-z]{3}) (\d{4})/)
  if (fecha && MESES.includes(fecha[2])) return `${fecha[3]}-${String(MESES.indexOf(fecha[2]) + 1).padStart(2, '0')}-${fecha[1]}`
  const q = s.match(/^(-?)Q\s?([\d,]+(?:\.\d+)?)/)
  if (q) return Number(q[2].replace(/,/g, '')) * (q[1] ? -1 : 1)
  const n = s.match(/^-?\d+(?:\.\d+)?(?=\s|%|$)/)
  if (n) return Number(n[0])
  return s.toLocaleLowerCase('es')
}

export function comparar(a: string | number, b: string | number): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b
  if (typeof a === 'number') return -1
  if (typeof b === 'number') return 1
  return a.localeCompare(b, 'es', { numeric: true })
}

export interface Marcar<T> { puede: (f: T) => boolean; marcadas: Set<string>; cambiar: (ids: string[], si: boolean) => void }

export interface AccionMasa<T> { texto: string; titulo: (n: number) => string; hacer: (filas: T[]) => void; peligro?: boolean }

export default function Tabla<T>({ titulo, nota, columnas, filas, clave, vacio, onFila, acciones, pie, buscador = true, marcar: marcarExterno, quitarVarias, masa, menu, marcable }: {
  titulo?: ReactNode
  nota?: ReactNode
  columnas: Columna<T>[]
  filas: T[]
  clave: (f: T) => string
  vacio: string
  onFila?: (f: T) => void
  acciones?: (f: T) => ReactNode
  pie?: ReactNode
  buscador?: boolean
  marcar?: Marcar<T>
  quitarVarias?: (filas: T[]) => void
  masa?: AccionMasa<T>[]
  menu?: (f: T) => ItemMenu[]
  marcable?: (f: T) => boolean
}) {
  const acciones_masa: AccionMasa<T>[] = [...(masa ?? []), ...(quitarVarias ? [{ texto: 'Quitar las marcadas', titulo: (n: number) => `Quita las ${n} filas marcadas; pregunta antes y se puede deshacer`, hacer: quitarVarias, peligro: true }] : [])]
  const [propias, setPropias] = useState<Set<string>>(new Set())
  const marcar: Marcar<T> | undefined = marcarExterno ?? (acciones_masa.length && filas.length > 1 ? { puede: marcable ?? (() => true), marcadas: propias, cambiar: (ids, si) => setPropias((x) => { const n = new Set(x); ids.forEach((k) => (si ? n.add(k) : n.delete(k))); return n }) } : undefined)
  const elegidasPropias = !marcarExterno && acciones_masa.length ? filas.filter((f) => propias.has(clave(f)) && (marcable ? marcable(f) : true)) : []
  const [menuPos, setMenuPos] = useState<{ x: number; y: number; f: T } | null>(null)
  const presion = useRef<{ t: number; usado: boolean }>({ t: 0, usado: false })
  const cerrarMenu = useCallback(() => setMenuPos(null), [])
  const cols = columnas.filter((c) => !c.oculto)
  const [orden, setOrden] = useState<{ i: number; dir: 1 | -1 } | null>(null)
  const [q, setQ] = useState('')
  const conBuscador = buscador && filas.length > 10
  const vistas = useMemo(() => {
    let l = conBuscador && q.trim() ? filas.filter((f) => coincide(q, ...cols.map((c) => textoDe(c.valor(f))))) : filas
    if (orden) {
      const c = cols[orden.i]
      if (c) {
        const k = (f: T) => (c.orden ? c.orden(f) : claveOrden(textoDe(c.valor(f))))
        l = [...l].map((f) => [k(f), f] as const).sort((a, b) => comparar(a[0], b[0]) * orden.dir).map((x) => x[1])
      }
    }
    return l
  }, [filas, orden, q, conBuscador, cols])
  const marcables = marcar ? vistas.filter(marcar.puede).map(clave) : []
  const todasMarcadas = marcables.length > 0 && marcables.every((k) => marcar!.marcadas.has(k))
  const filtrando = conBuscador && q.trim() !== ''
  const tocar = (i: number) => setOrden((o) => (o && o.i === i ? (o.dir === 1 ? { i, dir: -1 } : null) : { i, dir: 1 }))

  return (
    <div className="m-tabla-envoltura c-tabla-adapta c-tabla-erp">
      {(titulo || nota || conBuscador || (marcar && !marcarExterno)) && (
        <div className="m-tabla-titulo">
          {titulo && <b>{titulo}</b>}
          {nota && <span>{nota}</span>}
          {marcar && !marcarExterno && marcables.length > 1 && (
            <span className="c-tabla-masa">
              <button type="button" className="m-btn m-btn-secundario m-btn-sm" onClick={() => marcar.cambiar(marcables, !todasMarcadas)} title={todasMarcadas ? 'Quita la marca de todas las filas que se ven' : filtrando ? 'Marca solo las filas que quedan con la búsqueda' : 'Marca todas las filas de la tabla'}>
                {todasMarcadas ? 'Desmarcar todas' : filtrando ? `Marcar todas las que se ven · ${marcables.length}` : `Marcar todas · ${marcables.length}`}
              </button>
              {elegidasPropias.length > 0 && acciones_masa.map((a) => (
                <button key={a.texto} type="button" className={`m-btn m-btn-sm ${a.peligro ? 'm-btn-peligro' : 'm-btn-secundario'}`} onClick={() => { a.hacer(elegidasPropias); setPropias(new Set()) }} title={a.titulo(elegidasPropias.length)}>{a.texto} · {elegidasPropias.length}</button>
              ))}
            </span>
          )}
          {conBuscador && (
            <div className="c-tabla-buscar">
              <Buscador valor={q} onCambio={setQ} ayuda="Buscar en esta tabla…" />
              <span className="c-tabla-cuenta" aria-live="polite">{vistas.length} de {filas.length}</span>
            </div>
          )}
        </div>
      )}
      <table className="m-tabla">
        <thead>
          <tr>
            {marcar && <th className="c-marca"><input type="checkbox" aria-label="Marcar todas las que se ven" title="Marcar o quitar todas las que se ven" checked={todasMarcadas} disabled={!marcables.length} onChange={(e) => marcar.cambiar(marcables, e.target.checked)} /></th>}
            {cols.map((c, i) => {
              const activa = orden?.i === i
              return (
                <th key={c.titulo} className={c.num ? 'm-num' : undefined} aria-sort={activa ? (orden!.dir === 1 ? 'ascending' : 'descending') : undefined}>
                  {c.sinOrden ? c.titulo : (
                    <button type="button" className="c-th-orden" onClick={() => tocar(i)} title={`Ordenar por ${c.titulo.toLowerCase()}${activa ? (orden!.dir === 1 ? ' (al revés)' : ' (quitar el orden)') : ''}`}>
                      <span>{c.titulo}</span>
                      {activa ? (orden!.dir === 1 ? <ArrowUp aria-hidden /> : <ArrowDown aria-hidden />) : <ArrowUpDown className="c-th-tenue" aria-hidden />}
                    </button>
                  )}
                </th>
              )
            })}
            {acciones && <th><span className="sr-only">Acciones</span></th>}
          </tr>
        </thead>
        <tbody>
          {vistas.map((f) => (
            <tr
              key={clave(f)}
              className={onFila ? 'c-fila-ir' : undefined}
              onClick={onFila ? () => { if (presion.current.usado) { presion.current.usado = false; return } onFila(f) } : undefined}
              onContextMenu={menu ? (e) => { e.preventDefault(); setMenuPos({ x: e.clientX, y: e.clientY, f }) } : undefined}
              onTouchStart={menu ? (e) => { const t = e.touches[0]; const x = t.clientX, y = t.clientY; presion.current.usado = false; window.clearTimeout(presion.current.t); presion.current.t = window.setTimeout(() => { presion.current.usado = true; setMenuPos({ x, y, f }) }, 550) } : undefined}
              onTouchMove={menu ? () => window.clearTimeout(presion.current.t) : undefined}
              onTouchEnd={menu ? () => window.clearTimeout(presion.current.t) : undefined} tabIndex={onFila ? 0 : undefined} onKeyDown={onFila ? (e) => { if (e.key === 'Enter' && e.target === e.currentTarget) onFila(f) } : undefined}>
              {marcar && <td className="c-marca" data-campo="Marcar" onClick={(e) => e.stopPropagation()}>{marcar.puede(f) && <input type="checkbox" aria-label="Marcar" title="Marcar para hacerlo junto con otros" checked={marcar.marcadas.has(clave(f))} onChange={(e) => marcar.cambiar([clave(f)], e.target.checked)} />}</td>}
              {cols.map((c) => <td key={c.titulo} data-campo={c.titulo} className={[c.num ? 'm-num' : '', c.principal ? 'c-principal' : ''].join(' ').trim() || undefined}>{c.valor(f)}</td>)}
              {acciones && <td className="c-acciones" onClick={(e) => e.stopPropagation()}><div className="c-acc">{acciones(f)}</div></td>}
            </tr>
          ))}
          {vistas.length === 0 && <tr className="c-fila-vacia"><td colSpan={cols.length + (acciones ? 1 : 0) + (marcar ? 1 : 0)} className="c-sin-resultados">{filas.length && q ? 'Nada coincide con la búsqueda.' : vacio}</td></tr>}
        </tbody>
        {pie && filas.length > 0 && <tfoot>{marcar && isValidElement(pie) && pie.type === 'tr' ? cloneElement(pie as React.ReactElement<{ children?: ReactNode }>, {}, [<td key="marca" className="c-marca" />, ...Children.toArray((pie.props as { children?: ReactNode }).children)]) : pie}</tfoot>}
      </table>
      {menu && <MenuFila pos={menuPos} items={menuPos ? menu(menuPos.f) : []} onCerrar={cerrarMenu} />}
    </div>
  )
}
