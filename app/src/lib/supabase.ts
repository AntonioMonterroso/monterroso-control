import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const configurado = Boolean(url && key)

export const supabase = createClient(url ?? 'http://localhost', key ?? 'sin-llave', {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'mc-sesion' },
})

const LLAVE_PRUEBA = 'mc_prueba'

export function modoPrueba(): boolean {
  if (!import.meta.env.DEV) return false
  try { return localStorage.getItem(LLAVE_PRUEBA) === '1' } catch { return false }
}

export function activarPrueba(si: boolean) {
  try { if (si) localStorage.setItem(LLAVE_PRUEBA, '1'); else localStorage.removeItem(LLAVE_PRUEBA) } catch { return }
}
