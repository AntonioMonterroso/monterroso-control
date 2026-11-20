import type { Session } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { activarPrueba, modoPrueba, supabase } from './supabase'

interface Sesion {
  listo: boolean
  correo: string | null
  prueba: boolean
  entrar: (correo: string, clave: string) => Promise<string | null>
  entrarPrueba: () => void
  salir: () => Promise<void>
}

const Ctx = createContext<Sesion | null>(null)

export function ProveedorSesion({ children }: { children: ReactNode }) {
  const [prueba, setPrueba] = useState(modoPrueba)
  const [sesion, setSesion] = useState<Session | null>(null)
  const [listo, setListo] = useState(prueba)

  useEffect(() => {
    if (prueba) return
    let vivo = true
    supabase.auth.getSession().then(({ data }) => { if (vivo) { setSesion(data.session); setListo(true) } })
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSesion(s))
    return () => { vivo = false; data.subscription.unsubscribe() }
  }, [prueba])

  const valor: Sesion = {
    listo,
    prueba,
    correo: prueba ? 'modo de prueba' : sesion?.user.email ?? null,
    async entrar(correo, clave) {
      if (!correo.trim() || !clave) return 'Escribe tu correo y tu contraseña.'
      if (typeof navigator !== 'undefined' && navigator.onLine === false) return 'No hay internet. Revisa tu conexión e intenta otra vez.'
      try {
        const { error } = await supabase.auth.signInWithPassword({ email: correo.trim(), password: clave })
        if (!error) return null
        const m = `${error.message} ${(error as { code?: string }).code ?? ''}`
        if (/invalid.*credential|invalid_credentials|invalid login/i.test(m)) return 'El correo o la contraseña no coinciden.'
        if (/not.*confirmed|email_not_confirmed/i.test(m)) return 'Tu correo todavía no está confirmado. Revisa tu bandeja de entrada.'
        if (/rate|too many|over_request/i.test(m)) return 'Hubo demasiados intentos. Espera un momento y vuelve a probar.'
        if (/fetch|network|failed/i.test(m)) return 'No se pudo conectar. Revisa tu internet e intenta otra vez.'
        return 'No se pudo entrar. Intenta otra vez en un momento.'
      } catch {
        return 'No se pudo conectar. Revisa tu internet e intenta otra vez.'
      }
    },
    entrarPrueba() { if (!import.meta.env.DEV) return; activarPrueba(true); setPrueba(true); setListo(true) },
    async salir() {
      if (prueba) { activarPrueba(false); setPrueba(false); setListo(false); return }
      await supabase.auth.signOut()
    },
  }
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>
}

export function useSesion(): Sesion {
  const v = useContext(Ctx)
  if (!v) throw new Error('useSesion fuera del proveedor')
  return v
}
