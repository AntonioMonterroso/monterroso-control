import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { Children, cloneElement, Fragment, isValidElement, useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import Buscador, { coincide } from './Buscador'
import MenuFila, { type ItemMenu } from './MenuFila'
import { useLocation } from 'react-router-dom'
import { useSesion } from '../lib/sesion'
import { sumasPorColumna } from '../lib/totales'
import { quetzales } from '../lib/dinero'

export interface Columna<T> {
  titulo: string
  valor: (f: T) => ReactNode
  num?: boolean
  principal?: boolean
  oculto?: boolean
  orden?: (f: T) => string | number
  sinOrden?: boolean
  destacado?: boolean
  etiqueta?: string
  cabecera?: boolean
  baja?: boolean
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

export default function Tabla<T>({ titulo, nota, columnas, filas, clave, vacio, onFila, acciones, pie, buscador = true, marcar: marcarExterno, quitarVarias, masa, menu, marcable, claseFila, llave, totalMarcadas, resumen, sinTotal }: {
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
  claseFila?: (f: T) => string | undefined
  llave?: string
  totalMarcadas?: (filas: T[]) => string
  resumen?: (vistas: T[]) => ReactNode
  sinTotal?: boolean
}) {
  const acciones_masa: AccionMasa<T>[] = [...(masa ?? []), ...(quitarVarias ? [{ texto: 'Quitar las marcadas', titulo: (n: number) => `Quita las ${n} filas marcadas; pregunta antes y se puede deshacer`, hacer: quitarVarias, peligro: true }] : [])]
  const [propias, setPropias] = useState<Set<string>>(new Set())
  const marcar: Marcar<T> | undefined = marcarExterno ?? (acciones_masa.length && filas.length > 1 ? { puede: marcable ?? (() => true), marcadas: propias, cambiar: (ids, si) => setPropias((x) => { const n = new Set(x); ids.forEach((k) => (si ? n.add(k) : n.delete(k))); return n }) } : undefined)
  const elegidasPropias = !marcarExterno && acciones_masa.length ? filas.filter((f) => propias.has(clave(f)) && (marcable ? marcable(f) : true)) : []
  const [menuPos, setMenuPos] = useState<{ x: number; y: number; f: T } | null>(null)
  const presion = useRef<{ t: number; usado: boolean }>({ t: 0, usado: false })
  const cerrarMenu = useCallback(() => setMenuPos(null), [])
  const cols = columnas.filter((c) => !c.oculto)
  const iDestacado = (() => { const d = cols.findIndex((c) => c.destacado); if (d >= 0) return d; const e = cols.findIndex((c) => c.titulo === 'Estado'); if (e >= 0) return e; for (let i = cols.length - 1; i >= 0; i--) if (cols[i].num && !cols[i].principal) return i; return -1 })()
  const vacio_ = (n: ReactNode) => { if (isValidElement(n) && typeof n.type !== 'string' && n.type !== Fragment) return false; const t = textoDe(n).trim(); return t === '' || t === '—' || t === 'Sin anotar' }
  const lugar = useLocation()
  const { correo } = useSesion()
  const llaveOrden = `mc_orden:${correo ?? ''}:${lugar.pathname}:${llave ?? (typeof titulo === 'string' ? titulo.replace(/\d+/g, '') : cols.map((c) => c.titulo).join('|'))}`
  const llaveDensidad = `mc_densidad:${correo ?? ''}`
  const [orden, setOrdenEstado] = useState<{ i: number; dir: 1 | -1 } | null>(() => { try { const v = JSON.parse(localStorage.getItem(llaveOrden) ?? 'null') as { t: string; dir: 1 | -1 } | null; const i = v ? cols.findIndex((c) => c.titulo === v.t) : -1; return i >= 0 && v ? { i, dir: v.dir } : null } catch { return null } })
  const setOrden = (fn: (o: { i: number; dir: 1 | -1 } | null) => { i: number; dir: 1 | -1 } | null) => setOrdenEstado((o) => { const n = fn(o); try { if (n) localStorage.setItem(llaveOrden, JSON.stringify({ t: cols[n.i]?.titulo, dir: n.dir })); else localStorage.removeItem(llaveOrden) } catch { void 0 } return n })
  const [densidad, setDensidadEstado] = useState<'comoda' | 'compacta'>(() => { try { return localStorage.getItem(llaveDensidad) === 'compacta' ? 'compacta' : 'comoda' } catch { return 'comoda' } })
  const setDensidad = (d: 'comoda' | 'compacta') => { setDensidadEstado(d); try { localStorage.setItem(llaveDensidad, d) } catch { void 0 } }
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
  const constantes = useMemo(() => {
    const r = new Map<string, string>()
    if (pie || vistas.length < 3) return r
    for (const c of cols) {
      if (c.principal || c.num || c.destacado || c.cabecera) continue
      const vals = new Set(vistas.map((f) => textoDe(c.valor(f)).trim()))
      if (vals.size === 1) { const v = [...vals][0]; if (v && v !== 'Sin anotar' && v !== '—') r.set(c.titulo, v) }
    }
    return r
  }, [cols, vistas, pie])
  const visibles = cols.filter((c) => !constantes.has(c.titulo))
  const textos = (l: T[]) => l.map((f) => visibles.map((c) => textoDe(c.valor(f))))
  const sumas = useMemo(() => (pie || sinTotal ? [] : sumasPorColumna(textos(vistas))), [vistas, visibles, pie, sinTotal])
  const conTotal = !pie && !sinTotal && filas.length > 1 && sumas.some((x) => x != null)
  const iPrincipalMonto = visibles.findIndex((c) => c.destacado) >= 0 && sumas[visibles.findIndex((c) => c.destacado)] != null ? visibles.findIndex((c) => c.destacado) : sumas.findIndex((x) => x != null)
  const totalMarcado = (l: T[]) => { if (totalMarcadas) return totalMarcadas(l); if (iPrincipalMonto < 0) return ''; const v = sumasPorColumna(textos(l))[iPrincipalMonto]; return v == null ? '' : quetzales(v) }
  const marcables = marcar ? vistas.filter(marcar.puede).map(clave) : []
  const todasMarcadas = marcables.length > 0 && marcables.every((k) => marcar!.marcadas.has(k))
  const filtrando = conBuscador && q.trim() !== ''
  const tocar = (i: number) => setOrden((o) => (o && o.i === i ? (o.dir === 1 ? { i, dir: -1 } : null) : { i, dir: 1 }))

  return (
    <div className="m-tabla-envoltura c-tabla-adapta c-tabla-erp" data-densidad={densidad}>
      {(titulo || nota || conBuscador || (marcar && !marcarExterno)) && (
        <div className="m-tabla-titulo">
          {titulo && <b>{titulo}</b>}
          {nota && <span className="c-tabla-nota">{nota}</span>}
          {[...constantes].map(([t, v]) => <span key={t} className="m-estado bloqueado c-chip-constante" title={`Todas las filas que se ven tienen el mismo ${t.toLowerCase()}; por eso no se repite en cada fila`}>{t}: {v}</span>)}
          {marcar && !marcarExterno && marcables.length > 1 && (
            <span className="c-tabla-masa">
              <button type="button" className="m-btn m-btn-secundario m-btn-sm" onClick={() => marcar.cambiar(marcables, !todasMarcadas)} title={todasMarcadas ? 'Quita la marca de todas las filas que se ven' : filtrando ? 'Marca solo las filas que quedan con la búsqueda' : 'Marca todas las filas de la tabla'}>
                {todasMarcadas ? 'Desmarcar todas' : filtrando ? `Marcar todas las que se ven · ${marcables.length}` : `Marcar todas · ${marcables.length}`}
              </button>
            </span>
          )}
          {vistas.length > 1 && (
            <span className="c-tabla-tarjeta-ctrl">
              <label className="c-ordenar"><span>Ordenar por</span>
                <select className="m-entrada" value={orden ? `${orden.i}:${orden.dir}` : ''} onChange={(e) => { const [i, d] = e.target.value.split(':').map(Number); setOrden(() => (e.target.value ? { i, dir: d as 1 | -1 } : null)) }} title="Cambia el orden de las tarjetas; se recuerda en esta pantalla">
                  <option value="">Como viene</option>
                  {cols.map((c, i) => (c.sinOrden ? null : [<option key={`${i}a`} value={`${i}:1`}>{c.titulo}{c.num ? ' (menor a mayor)' : ' (A–Z)'}</option>, <option key={`${i}d`} value={`${i}:-1`}>{c.titulo}{c.num ? ' (mayor a menor)' : ' (Z–A)'}</option>]))}
                </select>
              </label>
              <span className="c-chips c-densidad" role="group" aria-label="Densidad">
                <button type="button" className="m-chip" aria-pressed={densidad === 'comoda'} onClick={() => setDensidad('comoda')} title="Tarjetas con más aire; se recuerda en tu usuario">Cómoda</button>
                <button type="button" className="m-chip" aria-pressed={densidad === 'compacta'} onClick={() => setDensidad('compacta')} title="Tarjetas más juntas, con tres datos por fila; se recuerda en tu usuario">Compacta</button>
              </span>
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
              if (constantes.has(c.titulo)) return null
              const activa = orden?.i === i
              return (
                <th key={c.titulo} className={[c.num ? 'm-num' : '', c.baja ? 'c-baja' : ''].join(' ').trim() || undefined} aria-sort={activa ? (orden!.dir === 1 ? 'ascending' : 'descending') : undefined}>
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
              className={[onFila ? 'c-fila-ir' : '', claseFila?.(f) ?? ''].join(' ').trim() || undefined}
              onClick={onFila ? () => { if (presion.current.usado) { presion.current.usado = false; return } onFila(f) } : undefined}
              onContextMenu={menu ? (e) => { e.preventDefault(); setMenuPos({ x: e.clientX, y: e.clientY, f }) } : undefined}
              onTouchStart={menu ? (e) => { const t = e.touches[0]; const x = t.clientX, y = t.clientY; presion.current.usado = false; window.clearTimeout(presion.current.t); presion.current.t = window.setTimeout(() => { presion.current.usado = true; setMenuPos({ x, y, f }) }, 550) } : undefined}
              onTouchMove={menu ? () => window.clearTimeout(presion.current.t) : undefined}
              onTouchEnd={menu ? () => window.clearTimeout(presion.current.t) : undefined} tabIndex={onFila ? 0 : undefined} onKeyDown={onFila ? (e) => { if (e.key === 'Enter' && e.target === e.currentTarget) onFila(f) } : undefined}>
              {marcar && <td className="c-marca" data-campo="Marcar" onClick={(e) => e.stopPropagation()}>{marcar.puede(f) && <input type="checkbox" aria-label="Marcar" title="Marcar para hacerlo junto con otros" checked={marcar.marcadas.has(clave(f))} onChange={(e) => marcar.cambiar([clave(f)], e.target.checked)} />}</td>}
              {cols.map((c, i) => { if (constantes.has(c.titulo)) return null; const v = c.valor(f); return <td key={c.titulo} data-campo={c.etiqueta ?? c.titulo} title={c.principal ? textoDe(v) : undefined} className={[c.num ? 'm-num' : '', c.principal ? 'c-principal' : c.cabecera ? 'c-cabecera' : i === iDestacado ? 'c-destacado' : 'c-campo', vacio_(v) ? 'c-celda-vacia' : '', c.baja ? 'c-baja' : ''].join(' ').trim()}>{v}</td> })}
              {acciones && <td className="c-acciones" onClick={(e) => e.stopPropagation()}><div className="c-acc">{acciones(f)}</div></td>}
            </tr>
          ))}
          {vistas.length === 0 && <tr className="c-fila-vacia"><td colSpan={cols.length - constantes.size + (acciones ? 1 : 0) + (marcar ? 1 : 0)} className="c-sin-resultados">{filas.length && q ? 'Nada coincide con la búsqueda.' : vacio}</td></tr>}
        </tbody>
        {conTotal && (
          <tfoot className="c-total-auto">
            <tr>
              {marcar && <td className="c-marca" />}
              {visibles.map((c, j) => <td key={c.titulo} data-campo={c.etiqueta ?? c.titulo} className={(sumas[j] != null ? 'm-num' : j === 0 ? 'c-total-et' : 'c-total-vacio') + (c.baja ? ' c-baja' : '')}>{j === 0 && sumas[0] == null ? `Total · ${vistas.length} de ${filas.length}` : sumas[j] != null ? quetzales(sumas[j]!) : ''}</td>)}
              {acciones && <td className="c-total-vacio" />}
            </tr>
          </tfoot>
        )}
        {pie && filas.length > 0 && <tfoot>{marcar && isValidElement(pie) && pie.type === 'tr' ? cloneElement(pie as React.ReactElement<{ children?: ReactNode }>, {}, [<td key="marca" className="c-marca" />, ...Children.toArray((pie.props as { children?: ReactNode }).children)]) : pie}</tfoot>}
      </table>
      {resumen && vistas.length > 0 && <div className="c-tabla-resumen">{resumen(vistas)}</div>}
      {elegidasPropias.length > 0 && (
        <div className="c-barra-fija" role="region" aria-label="Marcadas">
          <span><b>{elegidasPropias.length}</b> {elegidasPropias.length === 1 ? 'marcada' : 'marcadas'}{totalMarcado(elegidasPropias) ? ` · ${totalMarcado(elegidasPropias)}` : ''}</span>
          <span className="c-fila-botones">
            <button type="button" className="m-btn m-btn-secundario m-btn-sm" onClick={() => setPropias(new Set())} title="Quita todas las marcas">Desmarcar</button>
            {acciones_masa.map((a) => (
              <button key={a.texto} type="button" className={`m-btn m-btn-sm ${a.peligro ? 'm-btn-peligro' : 'm-btn-primario'}`} onClick={() => { a.hacer(elegidasPropias); setPropias(new Set()) }} title={a.titulo(elegidasPropias.length)}>{a.texto} · {elegidasPropias.length}</button>
            ))}
          </span>
        </div>
      )}
      {menu && <MenuFila pos={menuPos} items={menuPos ? menu(menuPos.f) : []} onCerrar={cerrarMenu} />}
    </div>
  )
}
