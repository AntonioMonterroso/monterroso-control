export interface Cambio {
  id: string
  tabla: string
  registro_id: string
  campo: string
  desde: string
  antes: string | null
  despues: string | null
  motivo: string | null
  por: string | null
  creado: string
}

export function cambiosDe(l: Cambio[], tabla: string, id: string, campo?: string): Cambio[] {
  return l.filter((c) => c.tabla === tabla && c.registro_id === id && (!campo || c.campo === campo)).sort((a, b) => a.desde.localeCompare(b.desde) || a.creado.localeCompare(b.creado))
}

export function valorEn(cambios: Cambio[], mes: string, actual: number): number {
  if (!cambios.length) return actual
  const orden = [...cambios].sort((a, b) => a.desde.localeCompare(b.desde) || a.creado.localeCompare(b.creado))
  let v: string | null | undefined
  for (const c of orden) if (c.desde <= mes) v = c.despues
  if (v === undefined) v = orden[0].antes
  const n = Number(v)
  return v == null || !Number.isFinite(n) ? actual : n
}
