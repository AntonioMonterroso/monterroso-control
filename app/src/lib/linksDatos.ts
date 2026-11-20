import { esTipoWeb, publicoDeLink, type DocPublico, type LinkPublico } from './links'
import { hoyISO } from './fechas'
import { supabase } from './supabase'

function enPrueba(): boolean {
  try { return localStorage.getItem('mc_prueba') === '1' } catch { return false }
}

function linksLocales(): { todo: Record<string, unknown[]>; links: LinkPublico[] } {
  const todo = JSON.parse(localStorage.getItem('mc_datos_prueba') ?? '{}') as Record<string, unknown[]>
  return { todo, links: (todo.ctl_links ?? []) as LinkPublico[] }
}

export async function leerDocumentoPublico(codigo: string): Promise<DocPublico> {
  if (enPrueba()) {
    const { todo, links } = linksLocales()
    const l = links.find((x) => x.codigo === codigo)
    const r = publicoDeLink(l, hoyISO())
    if (l && r.estado === 'activo') { l.vistas = (l.vistas ?? 0) + 1; l.visto_primero = l.visto_primero ?? new Date().toISOString(); localStorage.setItem('mc_datos_prueba', JSON.stringify({ ...todo, ctl_links: links })) }
    return r
  }
  const { data, error } = await supabase.rpc('ctl_documento_publico', { p_codigo: codigo })
  if (error || !data) return { estado: 'no_existe' }
  const r = data as DocPublico
  if (r.estado === 'activo' && (!r.tipo || !esTipoWeb(r.tipo))) return { estado: 'no_existe' }
  return r
}

export async function aceptarDocumento(codigo: string, nombre: string): Promise<boolean> {
  if (enPrueba()) {
    const { todo, links } = linksLocales()
    const l = links.find((x) => x.codigo === codigo)
    if (!l || l.estado !== 'activo' || (l.tipo !== 'cotizacion' && l.tipo !== 'propuesta')) return false
    if (!l.aceptado_el) { l.aceptado_por = nombre.trim().slice(0, 120); l.aceptado_el = new Date().toISOString() }
    localStorage.setItem('mc_datos_prueba', JSON.stringify({ ...todo, ctl_links: links }))
    return true
  }
  const { data, error } = await supabase.rpc('ctl_documento_aceptar', { p_codigo: codigo, p_nombre: nombre })
  return !error && Boolean((data as { ok?: boolean } | null)?.ok)
}
