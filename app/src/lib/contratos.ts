import { quetzales } from './dinero'
import { fechaLarga } from './fechas'
import { textoMomento } from './inscripcion'
import type { Clausula, Cliente, Proyecto } from './tipos'

export interface DatosContrato {
  ciudad: string
  prestador: string
  fecha: string
  cliente: Cliente
  proyecto: Proyecto | null
}

export function valores(d: DatosContrato): Record<string, string> {
  const p = d.proyecto
  return {
    ciudad: d.ciudad || '__________',
    fecha: fechaLarga(d.fecha),
    prestador: d.prestador || '__________',
    cliente: d.cliente.nombre,
    nit: d.cliente.nit ?? 'CF',
    direccion: d.cliente.direccion ?? '__________',
    proyecto: p?.nombre ?? '__________',
    descripcion: p?.descripcion ?? '',
    inscripcion: p ? quetzales(p.inscripcion_total) : '__________',
    partes: p && p.partes.length ? p.partes.map((x) => `${quetzales(x.monto)} ${x.momento === 'fecha' ? `el ${fechaLarga(x.fecha)}` : textoMomento(x).toLowerCase()}`).join('; ') : 'en un solo pago al firmar',
    mensualidad: p ? quetzales(p.mensualidad) : '__________',
    dia_cobro: p?.dia_cobro ? String(p.dia_cobro) : '__',
    inicio: p?.mensualidad_inicio ? fechaLarga(p.mensualidad_inicio) : '__________',
    fin: p?.mensualidad_fin ? `, hasta el ${fechaLarga(p.mensualidad_fin)}` : '',
    entrega: p?.fecha_entrega ? fechaLarga(p.fecha_entrega) : '__________',
  }
}

export function rellenar(texto: string, v: Record<string, string>): string {
  return texto.replace(/\{(\w+)\}/g, (m, k: string) => (k in v ? v[k] : m)).replace(/\s+\./g, '.').replace(/ {2,}/g, ' ').trim()
}

export function clausulasQueAplican(clausulas: Clausula[], elegidas: boolean[], p: Proyecto | null): Clausula[] {
  return clausulas.filter((c, i) => {
    if (!elegidas[i]) return false
    if (c.titulo === 'Inscripción' && p && p.inscripcion_total <= 0) return false
    if (c.titulo === 'Mensualidad' && p && p.mensualidad <= 0) return false
    return true
  })
}

const ORDINALES = ['Primera', 'Segunda', 'Tercera', 'Cuarta', 'Quinta', 'Sexta', 'Séptima', 'Octava', 'Novena', 'Décima', 'Undécima', 'Duodécima']

export function armarContrato(encabezado: string, clausulas: Clausula[], cierre: string, d: DatosContrato): string {
  const v = valores(d)
  const cuerpo = clausulas.map((c, i) => `${(ORDINALES[i] ?? `${i + 1}.ª`).toUpperCase()}. ${c.titulo.toUpperCase()}. ${rellenar(c.texto, v)}`)
  return [rellenar(encabezado, v), ...cuerpo, rellenar(cierre, v)].join('\n\n')
}
