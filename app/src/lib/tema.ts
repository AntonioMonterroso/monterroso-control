import { supabase } from './supabase'

export type Modo = 'claro' | 'oscuro' | 'auto'

interface Version { bg: string; primary: string; accent: string; par: string }
interface Api {
  COLORES: string[]
  GRUPOS?: [string, string[]][]
  version: (k: string, modo: 'claro' | 'oscuro') => Version
  aplicar: (k: string, modo?: Modo) => void
  alternarModo: () => void
  actual: () => string
  modo: () => Modo
  efectivo: () => 'claro' | 'oscuro'
}

export function temaApi(): Api | null {
  return (window as unknown as { MonterrosoTema?: Api }).MonterrosoTema ?? null
}

export async function traerTemaDelUsuario() {
  const t = temaApi()
  if (!t) return
  const { data } = await supabase.auth.getUser()
  const g = data.user?.user_metadata?.ctl_tema as { color?: string; modo?: Modo } | undefined
  if (g?.color) t.aplicar(g.color, g.modo)
}

let espera: ReturnType<typeof setTimeout> | undefined

export function guardarTemaEnUsuario() {
  const t = temaApi()
  if (!t) return
  clearTimeout(espera)
  espera = setTimeout(() => { void supabase.auth.updateUser({ data: { ctl_tema: { color: t.actual(), modo: t.modo() } } }) }, 600)
}
