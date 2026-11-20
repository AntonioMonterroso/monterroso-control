const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

export function hoyISO(d = new Date()): string {
  return aISO(d.getFullYear(), d.getMonth() + 1, d.getDate())
}

export function aISO(a: number, m: number, d: number): string {
  return `${a}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export function partes(iso: string): [number, number, number] {
  const [a, m, d] = iso.slice(0, 10).split('-').map(Number)
  return [a, m, d]
}

export function diasDelMes(a: number, m: number): number {
  return new Date(a, m, 0).getDate()
}

export function fechaLarga(iso: string | null): string {
  if (!iso) return ''
  const [a, m, d] = partes(iso)
  return `${d} de ${MESES[m - 1]} de ${a}`
}

export function fechaCorta(iso: string | null): string {
  if (!iso) return ''
  const [a, m, d] = partes(iso)
  return `${String(d).padStart(2, '0')} ${MESES_CORTOS[m - 1]} ${a}`
}

export function nombreMes(a: number, m: number): string {
  return `${MESES[m - 1][0].toUpperCase()}${MESES[m - 1].slice(1)} ${a}`
}

export function diasEntre(desde: string, hasta: string): number {
  const [a1, m1, d1] = partes(desde)
  const [a2, m2, d2] = partes(hasta)
  return Math.round((Date.UTC(a2, m2 - 1, d2) - Date.UTC(a1, m1 - 1, d1)) / 86400000)
}
