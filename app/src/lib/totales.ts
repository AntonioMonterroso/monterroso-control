export function montoDeTexto(t: string): number | null {
  const s = t.trim()
  const m = s.match(/^(\(?)\s*(-?)\s*(?:US\$|Q)\s?(-?)([\d,]+(?:\.\d+)?)\s*\)?/)
  if (!m) return null
  const n = Number(m[4].replace(/,/g, ''))
  if (!Number.isFinite(n)) return null
  return (m[1] === '(' || m[2] === '-' || m[3] === '-') ? -n : n
}

export function sumaCentavos(l: number[]): number {
  return l.reduce((t, x) => t + Math.round(x * 100), 0) / 100
}

export function columnasDeMonto(filas: string[][]): boolean[] {
  if (!filas.length) return []
  return filas[0].map((_, j) => filas.some((f) => montoDeTexto(f[j] ?? '') != null) && filas.every((f) => { const t = (f[j] ?? '').trim(); return t === '' || t === '—' || montoDeTexto(t) != null }))
}

export function sumasPorColumna(filas: string[][]): (number | null)[] {
  const es = columnasDeMonto(filas)
  return es.map((si, j) => (si ? sumaCentavos(filas.map((f) => montoDeTexto(f[j] ?? '') ?? 0)) : null))
}

export function porcentaje(parte: number, total: number): string {
  if (!total) return '0.0 %'
  return `${((parte / total) * 100).toFixed(1)} %`
}
