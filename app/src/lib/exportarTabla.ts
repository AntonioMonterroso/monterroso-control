import { montoDeTexto, sumasPorColumna } from './totales'
import { quetzales } from './dinero'
import { esc } from './imprimir'

export interface Seccion { titulo?: string; filas: string[][]; pie?: string[] }
export interface TablaExportable { titulo: string; cab: string[]; secciones: Seccion[] }

function filaTotal(etiqueta: string, sumas: (number | null)[], n: number): string[] {
  const f = Array.from({ length: n }, (_, j) => (sumas[j] != null ? quetzales(sumas[j]!) : ''))
  const i = f.findIndex((x) => x === '')
  if (i >= 0) f[i] = etiqueta
  else f.unshift(etiqueta)
  return f.slice(0, Math.max(n, 1))
}

export function armarExport(t: TablaExportable): { tipo: 'cab' | 'grupo' | 'fila' | 'subtotal' | 'total'; c: string[] }[] {
  const n = t.cab.length
  const out: { tipo: 'cab' | 'grupo' | 'fila' | 'subtotal' | 'total'; c: string[] }[] = [{ tipo: 'cab', c: t.cab }]
  const varias = t.secciones.length > 1
  const todas: string[][] = []
  for (const s of t.secciones) {
    if (varias && s.titulo) out.push({ tipo: 'grupo', c: [s.titulo] })
    for (const f of s.filas) out.push({ tipo: 'fila', c: f })
    todas.push(...s.filas)
    if (s.pie) out.push({ tipo: varias ? 'subtotal' : 'total', c: s.pie })
    else if (s.filas.length) {
      const sumas = sumasPorColumna(s.filas)
      if (sumas.some((x) => x != null)) out.push({ tipo: varias ? 'subtotal' : 'total', c: filaTotal(varias ? `Subtotal ${s.titulo ?? ''}`.trim() : `Total · ${s.filas.length}`, sumas, n) })
    }
  }
  if (varias && todas.length) {
    const sumas = sumasPorColumna(todas)
    if (sumas.some((x) => x != null)) out.push({ tipo: 'total', c: filaTotal(`Total · ${todas.length}`, sumas, n) })
  }
  return out
}

function celdaExcel(v: string): string | number {
  const m = montoDeTexto(v)
  return m != null && /^\(?\s*-?\s*(US\$|Q)/.test(v.trim()) ? Number(m.toFixed(2)) : v
}

export function exportCSV(t: TablaExportable): (string | number)[][] {
  return armarExport(t).map((r) => (r.tipo === 'cab' || r.tipo === 'grupo' ? r.c : r.c.map(celdaExcel)))
}

export function exportHtml(t: TablaExportable, sub = ''): string {
  const filas = armarExport(t)
  const n = t.cab.length
  const esNum = t.cab.map((_, j) => filas.some((r) => r.tipo === 'fila' && montoDeTexto(r.c[j] ?? '') != null && /^\(?\s*-?\s*(US\$|Q)/.test((r.c[j] ?? '').trim())))
  const td = (c: string[], fuerte = false) => c.map((v, j) => `<td${esNum[j] ? ' class="n"' : ''}${fuerte ? ' style="font-weight:700"' : ''}>${esc(v)}</td>`).join('')
  const cuerpo = filas.slice(1).map((r) => {
    if (r.tipo === 'grupo') return `<tr><td colspan="${n}" style="font-weight:700;color:#3b82c4;padding-top:14px">${esc(r.c[0])}</td></tr>`
    if (r.tipo === 'subtotal') return `<tr style="background:#f0f6fb">${td(r.c, true)}</tr>`
    if (r.tipo === 'total') return `<tr style="background:#e2eef8;border-top:2px solid #3b82c4">${td(r.c, true)}</tr>`
    return `<tr>${td(r.c)}</tr>`
  }).join('')
  return `<h1>${esc(t.titulo)}</h1>${sub ? `<p class="sub">${esc(sub)}</p>` : ''}<table><thead><tr>${t.cab.map((c, j) => `<th${esNum[j] ? ' class="n"' : ''}>${esc(c)}</th>`).join('')}</tr></thead><tbody>${cuerpo}</tbody></table>`
}
