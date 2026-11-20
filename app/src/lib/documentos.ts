import { aCentavos, deCentavos, quetzales } from './dinero'
import { fechaLarga } from './fechas'
import { esc } from './imprimir'
import type { Area } from './marca'
import type { Regimen } from './tipos'

export type TipoDocumento = 'cotizacion' | 'propuesta' | 'acuerdo' | 'membretada'

export const TIPOS_DOC: { valor: TipoDocumento; nombre: string }[] = [
  { valor: 'cotizacion', nombre: 'Cotización' },
  { valor: 'propuesta', nombre: 'Propuesta comercial' },
  { valor: 'acuerdo', nombre: 'Acuerdo de servicios' },
  { valor: 'membretada', nombre: 'Hoja membretada' },
]

export interface Renglon { concepto: string; cantidad: number; precio: number }

export interface DatosDocumento {
  renglones?: Renglon[]
  alcance?: string
  entregables?: string
  inscripcion?: number
  mensualidad?: number
  plazo?: string
  condiciones?: string
  destinatario?: string
}

export interface Documento {
  id: string
  tipo: TipoDocumento
  area: Area
  anio: number
  numero: number | null
  cliente_id: string | null
  proyecto_id: string | null
  fecha: string
  vigencia_dias: number | null
  titulo: string
  datos: DatosDocumento
  contenido: string | null
  estado: 'borrador' | 'enviado' | 'aceptado' | 'rechazado'
  creado?: string
}

export function siguienteNumero(docs: Pick<Documento, 'tipo' | 'anio' | 'numero'>[], tipo: TipoDocumento, anio: number): number {
  return docs.filter((d) => d.tipo === tipo && d.anio === anio).reduce((m, d) => Math.max(m, d.numero ?? 0), 0) + 1
}

export function numeroVisible(d: Pick<Documento, 'anio' | 'numero'>): string {
  return d.numero ? `${d.anio}-${String(d.numero).padStart(3, '0')}` : ''
}

export function totalRenglones(r: Renglon[]): number {
  return deCentavos(r.reduce((s, x) => s + Math.round(aCentavos(x.precio) * x.cantidad), 0))
}

export function notaImpuestos(r: Regimen | null): string {
  if (r === 'pequeno') return 'Precios en quetzales con impuestos incluidos, según el régimen de pequeño contribuyente.'
  if (r === 'general') return 'Precios en quetzales con impuestos incluidos.'
  return 'Precios en quetzales.'
}

export const NOTA_LEGAL = 'Documento de referencia: revíselo con su abogado antes de firmarlo.'

const parrafos = (t: string | undefined) => (t ?? '').split(/\n{2,}|\n/).map((p) => p.trim()).filter(Boolean).map((p) => `<p>${esc(p)}</p>`).join('')
const lista = (t: string | undefined) => { const l = (t ?? '').split('\n').map((x) => x.trim()).filter(Boolean); return l.length ? `<ul>${l.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '' }

export interface Contexto { cliente: string; nit: string | null; proyecto: string | null; regimen: Regimen | null; firmante: string; cargo: string; sitio: string; correo: string }

export function htmlDocumento(d: Documento, c: Contexto): string {
  const vence = d.vigencia_dias ? new Date(Date.parse(`${d.fecha}T12:00:00`) + d.vigencia_dias * 86400000).toISOString().slice(0, 10) : null
  const cab = `<h1>${esc(d.titulo)}</h1><p class="sub">${esc(fechaLarga(d.fecha))}</p>`
  const para = `<dl><dt>Para</dt><dd>${esc(c.cliente)}</dd>${c.nit ? `<dt>NIT</dt><dd>${esc(c.nit)}</dd>` : ''}${c.proyecto ? `<dt>Proyecto</dt><dd>${esc(c.proyecto)}</dd>` : ''}${vence ? `<dt>Vigencia</dt><dd>Hasta el ${esc(fechaLarga(vence))}</dd>` : ''}</dl>`
  const firma = `<div class="firmas"><div>${esc(c.firmante || 'Studio Monterroso')}<br>${esc(c.cargo || '')}</div><div>${d.tipo === 'acuerdo' ? 'El cliente' : 'Recibido'}</div></div>`
  const contacto = [c.sitio, c.correo].filter(Boolean).map(esc).join(' · ')
  if (d.tipo === 'cotizacion') {
    const r = d.datos.renglones ?? []
    const filas = r.map((x) => `<tr><td>${esc(x.concepto)}</td><td class="n">${x.cantidad}</td><td class="n">${esc(quetzales(x.precio))}</td><td class="n">${esc(quetzales(deCentavos(Math.round(aCentavos(x.precio) * x.cantidad))))}</td></tr>`).join('')
    return `${cab}${para}<table><thead><tr><th>Concepto</th><th class="n">Cantidad</th><th class="n">Precio</th><th class="n">Subtotal</th></tr></thead><tbody>${filas}</tbody><tfoot><tr><td colspan="3">Total</td><td class="n">${esc(quetzales(totalRenglones(r)))}</td></tr></tfoot></table><p>${esc(notaImpuestos(c.regimen))}</p>${d.datos.condiciones ? `<h2>Condiciones</h2>${parrafos(d.datos.condiciones)}` : ''}${firma}${contacto ? `<p class="pie">${contacto}</p>` : ''}`
  }
  if (d.tipo === 'propuesta') {
    const montos = [(d.datos.inscripcion ?? 0) > 0 ? `<dt>Inscripción</dt><dd>${esc(quetzales(d.datos.inscripcion ?? 0))}</dd>` : '', (d.datos.mensualidad ?? 0) > 0 ? `<dt>Mensualidad</dt><dd>${esc(quetzales(d.datos.mensualidad ?? 0))}</dd>` : ''].join('')
    return `${cab}${para}${d.datos.alcance ? `<h2>Alcance</h2>${parrafos(d.datos.alcance)}` : ''}${d.datos.entregables ? `<h2>Entregables</h2>${lista(d.datos.entregables)}` : ''}${d.datos.plazo ? `<h2>Plazo</h2>${parrafos(d.datos.plazo)}` : ''}${montos ? `<h2>Inversión</h2><dl>${montos}</dl><p>${esc(notaImpuestos(c.regimen))}</p>` : ''}${d.datos.condiciones ? `<h2>Condiciones</h2>${parrafos(d.datos.condiciones)}` : ''}${firma}${contacto ? `<p class="pie">${contacto}</p>` : ''}`
  }
  if (d.tipo === 'acuerdo') return `${cab}<div class="texto">${parrafos(d.contenido ?? '')}</div>${firma}<p class="nota-legal">${NOTA_LEGAL}</p>`
  return `${d.datos.destinatario ? `<p>${esc(d.datos.destinatario)}</p>` : ''}<p class="sub">${esc(fechaLarga(d.fecha))}</p>${d.titulo ? `<h1>${esc(d.titulo)}</h1>` : ''}<div class="texto">${parrafos(d.contenido ?? '')}</div>${firma}${contacto ? `<p class="pie">${contacto}</p>` : ''}`
}
