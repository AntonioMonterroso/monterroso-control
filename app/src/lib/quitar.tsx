import { useState, type ReactNode } from 'react'
import { useAvisar } from '../componentes/Avisos'
import Confirmar from '../componentes/Confirmar'
import type { Fila, Tabla } from './almacen'
import { useDatos } from './datos'

interface Pedido { t: Tabla; filas: Fila[]; texto: string; despues?: () => Promise<void> }

export function useQuitar(): { pedir: (t: Tabla, filas: { id: string }[], texto: string, despues?: () => Promise<void>) => void; ventana: ReactNode } {
  const { borrar, insertar } = useDatos()
  const avisar = useAvisar()
  const [p, setP] = useState<Pedido | null>(null)
  const pedir = (t: Tabla, filas: { id: string }[], texto: string, despues?: () => Promise<void>) => {
    if (t === 'projects' || t === 'payments') return
    if (filas.length) setP({ t, filas: filas as Fila[], texto, despues })
  }
  const si = async () => {
    if (!p) return
    const { t, filas } = p
    setP(null)
    try {
      await borrar(t, filas.map((f) => f.id))
      if (p.despues) await p.despues()
      avisar(filas.length === 1 ? 'Quitado.' : `Se quitaron ${filas.length}.`, 'bien', {
        texto: 'Deshacer',
        hacer: async () => {
          try { await insertar(t, filas.map((f) => ({ ...f }))); avisar('Se deshizo.') } catch (e) { avisar(e instanceof Error ? e.message : 'No se pudo deshacer.', 'error') }
        },
      })
    } catch (e) { avisar(e instanceof Error ? e.message : 'No se pudo quitar.', 'error') }
  }
  const ventana = <Confirmar abierta={p != null} titulo={p && p.filas.length > 1 ? `Quitar ${p.filas.length}` : 'Quitar'} peligro boton="Quitar" texto={p?.texto ?? ''} onNo={() => setP(null)} onSi={() => void si()} />
  return { pedir, ventana }
}
