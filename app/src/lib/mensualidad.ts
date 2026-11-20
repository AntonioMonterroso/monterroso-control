import { aISO, diasDelMes, partes } from './fechas'
import type { Proyecto } from './tipos'

export type DatosMensualidad = Pick<Proyecto, 'mensualidad' | 'dia_cobro' | 'mensualidad_inicio' | 'mensualidad_fin' | 'estado'>

export function cobraMensualidad(p: DatosMensualidad): boolean {
  return p.mensualidad > 0 && p.dia_cobro != null && p.mensualidad_inicio != null && p.estado !== 'cerrado' && p.estado !== 'propuesta'
}

export function fechaCobroDelMes(a: number, m: number, dia: number): string {
  return aISO(a, m, Math.min(dia, diasDelMes(a, m)))
}

export function fechasDeCobro(p: DatosMensualidad, desde: string, hasta: string): string[] {
  if (p.mensualidad <= 0 || p.dia_cobro == null || !p.mensualidad_inicio) return []
  const limite = p.mensualidad_fin && p.mensualidad_fin < hasta ? p.mensualidad_fin : hasta
  const [ai, mi] = partes(p.mensualidad_inicio)
  const lista: string[] = []
  let a = ai
  let m = mi
  for (let i = 0; i < 1200; i++) {
    const f = fechaCobroDelMes(a, m, p.dia_cobro)
    if (f > limite) break
    if (f >= p.mensualidad_inicio && f >= desde) lista.push(f)
    m += 1
    if (m > 12) { m = 1; a += 1 }
  }
  return lista
}

export function proximoCobro(p: DatosMensualidad, hoy: string): string | null {
  if (!cobraMensualidad(p)) return null
  const [a] = partes(hoy)
  const lista = fechasDeCobro(p, hoy, aISO(a + 2, 12, 31))
  return lista[0] ?? null
}

export function mensualidadDelMes(proyectos: DatosMensualidad[], a: number, m: number): number {
  const desde = aISO(a, m, 1)
  const hasta = aISO(a, m, diasDelMes(a, m))
  return proyectos.reduce((s, p) => (cobraMensualidad(p) && fechasDeCobro(p, desde, hasta).length > 0 ? s + Math.round(p.mensualidad * 100) : s), 0) / 100
}

export function problemasMensualidad(p: DatosMensualidad): string[] {
  if (p.mensualidad < 0) return ['La mensualidad no puede ser negativa.']
  if (p.mensualidad === 0) return []
  const lista: string[] = []
  if (p.dia_cobro == null || p.dia_cobro < 1 || p.dia_cobro > 31) lista.push('Elige el día de cobro (1 a 31).')
  if (!p.mensualidad_inicio) lista.push('Pon la fecha en que empieza la mensualidad.')
  if (p.mensualidad_inicio && p.mensualidad_fin && p.mensualidad_fin < p.mensualidad_inicio) lista.push('La fecha de fin no puede ser antes del inicio.')
  return lista
}
