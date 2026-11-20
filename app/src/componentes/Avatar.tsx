const COLORES = ['#1d4ed8', '#047857', '#b45309', '#7c3aed', '#be123c', '#0e7490', '#4d7c0f', '#9d174d', '#3730a3', '#0f766e']

export function iniciales(n: string): string {
  const w = n.split(/\s+/).filter((x) => x.length > 2 && !['del', 'las', 'los'].includes(x.toLowerCase()))
  return ((w[0]?.[0] ?? n[0] ?? '?') + (w.length > 1 ? w[w.length - 1][0] : '')).toUpperCase()
}

export function colorDe(n: string): string {
  let h = 0
  for (const ch of n.toLowerCase()) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return COLORES[h % COLORES.length]
}

export default function Avatar({ nombre }: { nombre: string }) {
  return <span className="c-avatar" style={{ background: colorDe(nombre) }} aria-hidden>{iniciales(nombre)}</span>
}
