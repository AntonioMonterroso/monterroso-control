export type TipoLink = 'cotizacion' | 'propuesta' | 'estado_cuenta' | 'recibo'

export const TIPOS_WEB: TipoLink[] = ['cotizacion', 'propuesta', 'estado_cuenta', 'recibo']

export interface LinkPublico {
  id: string
  codigo: string
  tipo: TipoLink
  documento_id: string | null
  cliente_id: string | null
  pago_id: string | null
  titulo: string
  area: string
  cuerpo: string
  vence: string | null
  estado: 'activo' | 'retirado'
  whatsapp: string | null
  visto_primero: string | null
  vistas: number
  aceptado_por: string | null
  aceptado_el: string | null
  creado: string
}

export interface DocPublico {
  estado: 'activo' | 'vencido' | 'no_existe'
  tipo?: TipoLink
  titulo?: string
  area?: string
  cuerpo?: string
  vence?: string | null
  whatsapp?: string | null
  puede_aceptar?: boolean
  aceptado_por?: string | null
  aceptado_el?: string | null
}

const ALFABETO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'

export function generarCodigo(largo = 40): string {
  const b = new Uint8Array(largo)
  crypto.getRandomValues(b)
  return Array.from(b, (x) => ALFABETO[x & 63]).join('')
}

export const codigoValido = (c: string) => /^[A-Za-z0-9_-]{32,64}$/.test(c)

export function esTipoWeb(t: string): t is TipoLink {
  return (TIPOS_WEB as string[]).includes(t)
}

export function whatsappNegocio(t: string | null | undefined): string | null {
  const d = (t ?? '').replace(/\D/g, '')
  if (!d || d.endsWith('37645139')) return null
  const n = d.length === 8 ? `502${d}` : d
  return /^[0-9]{8,15}$/.test(n) ? n : null
}

export function limpiarCuerpo(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/No\.\s*\d{4}-\d{3,}/g, '')
    .replace(/\b3764[\s-]?5139\b/g, '')
}

export function publicoDeLink(l: LinkPublico | undefined, hoy: string): DocPublico {
  if (!l || l.estado === 'retirado' || !esTipoWeb(l.tipo)) return { estado: 'no_existe' }
  if (l.vence && l.vence < hoy) return { estado: 'vencido', titulo: l.titulo, area: l.area, whatsapp: l.whatsapp }
  return { estado: 'activo', tipo: l.tipo, titulo: l.titulo, area: l.area, cuerpo: l.cuerpo, vence: l.vence, whatsapp: l.whatsapp, puede_aceptar: l.tipo === 'cotizacion' || l.tipo === 'propuesta', aceptado_por: l.aceptado_por, aceptado_el: l.aceptado_el }
}

export function estadoLink(l: LinkPublico, hoy: string): { texto: string; clase: string } {
  if (l.estado === 'retirado') return { texto: 'Retirado', clase: 'bloqueado' }
  if (l.vence && l.vence < hoy) return { texto: 'Vencido', clase: 'error' }
  if (l.aceptado_el) return { texto: 'Aceptado', clase: 'aprobado' }
  if (l.vistas > 0) return { texto: `Visto ${l.vistas} ${l.vistas === 1 ? 'vez' : 'veces'}`, clase: 'en-proceso' }
  return { texto: 'Sin abrir', clase: 'pendiente' }
}

export const urlPublica = (codigo: string) => `${window.location.origin}/d/#${codigo}`
