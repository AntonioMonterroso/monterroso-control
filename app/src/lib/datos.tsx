import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { almacenLocal, almacenSupabase, TABLAS, type Almacen, type Fila, type Tabla } from './almacen'
import { semillas } from './semillas'

type Tablas = Record<Tabla, Fila[]>

interface Datos {
  cargando: boolean
  error: string | null
  remoto: boolean
  tablas: Tablas
  almacen: Almacen
  recargar: (silencioso?: boolean) => Promise<void>
  guardar: (t: Tabla, id: string | null, d: Record<string, unknown>) => Promise<Fila>
  insertar: (t: Tabla, d: Record<string, unknown>[]) => Promise<Fila[]>
  borrar: (t: Tabla, ids: string[]) => Promise<void>
  ajustes: Record<string, unknown>
  guardarAjustes: (patch: Record<string, unknown>) => Promise<void>
}

const Ctx = createContext<Datos | null>(null)

function puedePintar(): boolean {
  if (document.querySelector('dialog[open]')) return false
  const a = document.activeElement
  return !(a instanceof HTMLElement && a.matches('input:not([type=search]):not([type=checkbox]):not([type=radio]), textarea, select, [contenteditable=true]'))
}

const vacias = (): Tablas => Object.fromEntries(TABLAS.map((t) => [t, []])) as unknown as Tablas

export function ProveedorDatos({ prueba, children }: { prueba: boolean; children: ReactNode }) {
  const almacen = prueba ? almacenLocal : almacenSupabase
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tablas, setTablas] = useState<Tablas>(vacias)
  const [ajustes, setAjustes] = useState<Record<string, unknown>>({})
  const sembrando = useRef(false)

  const ultimo = useRef('')
  const recargar = useCallback(async (silencioso = false) => {
    try {
      const [listas, aj] = await Promise.all([Promise.all(TABLAS.map((t) => almacen.lista(t).catch((e: Error) => { if (t === 'ctl_negocios' || t === 'projects') throw e; return [] as Fila[] }))), almacen.ajustes().catch(() => ({}))])
      let nuevo = Object.fromEntries(TABLAS.map((t, i) => [t, listas[i]])) as unknown as Tablas
      if (!sembrando.current) {
        sembrando.current = true
        const faltan = semillas(nuevo)
        for (const [t, filas] of faltan) {
          const hechas = await almacen.insertar(t, filas).catch(() => [] as Fila[])
          nuevo = { ...nuevo, [t]: [...nuevo[t], ...hechas] }
        }
      }
      if (silencioso && !puedePintar()) return
      const firma = JSON.stringify([nuevo, aj])
      if (firma === ultimo.current) return
      ultimo.current = firma
      setAjustes(aj)
      setTablas(nuevo); setError(null)
    } catch (e) {
      if (!silencioso) setError(e instanceof Error ? e.message : 'No se pudo leer la base.')
    } finally {
      setCargando(false)
    }
  }, [almacen])

  useEffect(() => { void recargar() }, [recargar])

  useEffect(() => {
    const revisar = () => { if (document.visibilityState === 'visible') void recargar(true) }
    const alAlmacen = (e: StorageEvent) => { if (e.key === 'mc_datos_prueba' || e.key === 'mc_ajustes_prueba') revisar() }
    document.addEventListener('visibilitychange', revisar)
    window.addEventListener('focus', revisar)
    window.addEventListener('storage', alAlmacen)
    const t = setInterval(revisar, 20000)
    return () => {
      document.removeEventListener('visibilitychange', revisar)
      window.removeEventListener('focus', revisar)
      window.removeEventListener('storage', alAlmacen)
      clearInterval(t)
    }
  }, [recargar])

  const valor = useMemo<Datos>(() => ({
    cargando, error, tablas, almacen, recargar, remoto: almacen.remoto, ajustes,
    async guardarAjustes(patch) {
      setAjustes(await almacen.guardarAjustes(patch))
    },
    async guardar(t, id, d) {
      const f = id ? await almacen.actualizar(t, id, d) : (await almacen.insertar(t, [d]))[0]
      setTablas((x) => ({ ...x, [t]: id ? x[t].map((r) => (r.id === id ? f : r)) : [...x[t], f] }))
      return f
    },
    async insertar(t, d) {
      const fs = await almacen.insertar(t, d)
      setTablas((x) => ({ ...x, [t]: [...x[t], ...fs] }))
      return fs
    },
    async borrar(t, ids) {
      await almacen.borrar(t, ids)
      setTablas((x) => ({ ...x, [t]: x[t].filter((r) => !ids.includes(r.id)) }))
    },
  }), [almacen, cargando, error, tablas, recargar, ajustes])

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>
}

export function useDatos(): Datos {
  const v = useContext(Ctx)
  if (!v) throw new Error('useDatos fuera del proveedor')
  return v
}
