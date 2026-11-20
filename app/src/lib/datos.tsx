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
  recargar: () => Promise<void>
  guardar: (t: Tabla, id: string | null, d: Record<string, unknown>) => Promise<Fila>
  insertar: (t: Tabla, d: Record<string, unknown>[]) => Promise<Fila[]>
  borrar: (t: Tabla, ids: string[]) => Promise<void>
  ajustes: Record<string, unknown>
  guardarAjustes: (patch: Record<string, unknown>) => Promise<void>
}

const Ctx = createContext<Datos | null>(null)

const vacias = (): Tablas => Object.fromEntries(TABLAS.map((t) => [t, []])) as unknown as Tablas

export function ProveedorDatos({ prueba, children }: { prueba: boolean; children: ReactNode }) {
  const almacen = prueba ? almacenLocal : almacenSupabase
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tablas, setTablas] = useState<Tablas>(vacias)
  const [ajustes, setAjustes] = useState<Record<string, unknown>>({})
  const sembrando = useRef(false)

  const recargar = useCallback(async () => {
    try {
      const [listas, aj] = await Promise.all([Promise.all(TABLAS.map((t) => almacen.lista(t).catch((e: Error) => { if (t === 'ctl_negocios' || t === 'projects') throw e; return [] as Fila[] }))), almacen.ajustes().catch(() => ({}))])
      setAjustes(aj)
      let nuevo = Object.fromEntries(TABLAS.map((t, i) => [t, listas[i]])) as unknown as Tablas
      if (!sembrando.current) {
        sembrando.current = true
        const faltan = semillas(nuevo)
        for (const [t, filas] of faltan) {
          const hechas = await almacen.insertar(t, filas).catch(() => [] as Fila[])
          nuevo = { ...nuevo, [t]: [...nuevo[t], ...hechas] }
        }
      }
      setTablas(nuevo); setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo leer la base.')
    } finally {
      setCargando(false)
    }
  }, [almacen])

  useEffect(() => { void recargar() }, [recargar])

  useEffect(() => {
    const alVolver = () => { if (document.visibilityState === 'visible') void recargar() }
    document.addEventListener('visibilitychange', alVolver)
    return () => document.removeEventListener('visibilitychange', alVolver)
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
