const formato = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function quetzales(n: number): string {
  const v = Math.round((Number.isFinite(n) ? n : 0) * 100) / 100
  return `${v < 0 ? '-' : ''}Q ${formato.format(Math.abs(v))}`
}

export function aCentavos(n: number): number {
  return Math.round(n * 100)
}

export function deCentavos(c: number): number {
  return c / 100
}

export function leerMonto(texto: string): number | null {
  const limpio = texto.replace(/[Qq\s,]/g, '')
  if (limpio === '') return 0
  if (!/^\d+(\.\d{0,2})?$/.test(limpio)) return null
  return Number(limpio)
}
