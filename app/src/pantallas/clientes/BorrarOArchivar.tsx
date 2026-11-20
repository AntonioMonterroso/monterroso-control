import { Archive, Trash2 } from 'lucide-react'
import { useRef, useState, type ReactNode } from 'react'
import { useAvisar } from '../../componentes/Avisos'
import Ventana from '../../componentes/Ventana'
import { textoPlan, unirConY } from '../../lib/clientesBorrar'
import { useEscribir } from '../../lib/escribir'
import type { Cliente } from '../../lib/tipos'

export function useBorrarOArchivar(despues?: (borrados: string[]) => void): { pedir: (l: Cliente[]) => void; ventana: ReactNode; titulo: (c: Cliente) => string } {
  const esc = useEscribir()
  const escRef = useRef(esc)
  escRef.current = esc
  const avisar = useAvisar()
  const [lista, setLista] = useState<Cliente[]>([])
  const [ocupado, setOcupado] = useState(false)

  const planes = lista.map((c) => ({ c, plan: esc.planBorrar(c.id) }))
  const aBorrar = planes.filter((x) => x.plan.modo === 'borrar')
  const aArchivar = planes.filter((x) => x.plan.modo === 'archivar')

  const confirmar = async () => {
    setOcupado(true)
    try {
      const borrados = aBorrar.map((x) => x.c.id)
      const archivados = aArchivar.map((x) => x.c.id)
      const deshacerBorrar = borrados.length ? await esc.borrarClientes(borrados) : null
      for (const k of archivados) await esc.archivarCliente(k, true)
      const partes = [borrados.length ? `se ${borrados.length === 1 ? 'borró' : 'borraron'} ${borrados.length}` : '', archivados.length ? `se ${archivados.length === 1 ? 'archivó' : 'archivaron'} ${archivados.length}` : ''].filter(Boolean)
      const uno = lista.length === 1 ? lista[0] : null
      setLista([])
      despues?.(borrados)
      avisar(uno ? `${uno.nombre} ${borrados.length ? 'se borró' : 'quedó archivado'}.` : `Listo: ${unirConY(partes)}.`, 'bien', {
        texto: 'Deshacer',
        hacer: async () => {
          try {
            if (deshacerBorrar) await deshacerBorrar()
            for (const k of archivados) await escRef.current.archivarCliente(k, false)
            avisar('Se deshizo.')
          } catch (e) { avisar(e instanceof Error ? e.message : 'No se pudo deshacer.', 'error') }
        },
      })
    } catch (e) { avisar(e instanceof Error ? e.message : 'No se pudo.', 'error') }
    setOcupado(false)
  }

  const soloBorrar = aArchivar.length === 0
  const soloArchivar = aBorrar.length === 0
  const tituloVentana = lista.length === 1 ? (soloBorrar ? 'Borrar cliente' : 'Archivar cliente') : `Borrar o archivar ${lista.length} clientes`
  const boton = soloBorrar ? 'Borrar' : soloArchivar ? 'Archivar' : 'Borrar y archivar'

  const ventana = (
    <Ventana abierta={lista.length > 0} titulo={tituloVentana} subtitulo={lista.length === 1 ? lista[0].nombre : 'Vista previa antes de hacerlo'} onCerrar={() => setLista([])} pie={
      <>
        <button type="button" className="m-btn m-btn-secundario" onClick={() => setLista([])} title="Cierra sin borrar ni archivar nada">Cancelar</button>
        <button type="button" className={`m-btn ${soloArchivar ? 'm-btn-primario' : 'm-btn-peligro'}`} disabled={ocupado} onClick={() => void confirmar()} title={soloBorrar ? 'Borra los clientes de la lista; se puede deshacer' : soloArchivar ? 'Archiva los clientes; se pueden reactivar' : 'Borra los que no tienen movimientos y archiva los demás; se puede deshacer'}>{boton}</button>
      </>
    }>
      {aBorrar.length > 0 && (
        <div className="c-previa">
          <h3 className="c-previa-titulo"><Trash2 size={16} aria-hidden /> Se {aBorrar.length === 1 ? 'borra' : 'borran'} · {aBorrar.length}</h3>
          <p className="m-texto-suave">No tienen trabajos, pagos, contratos ni facturas. Se borra su ficha aquí y en Monterroso World, y sus cobros extra. Sus gastos se conservan, solo dejan de estar ligados.</p>
          <ul className="c-previa-lista">{aBorrar.map((x) => <li key={x.c.id}>{x.c.nombre}</li>)}</ul>
        </div>
      )}
      {aArchivar.length > 0 && (
        <div className="c-previa">
          <h3 className="c-previa-titulo"><Archive size={16} aria-hidden /> Se {aArchivar.length === 1 ? 'archiva' : 'archivan'} · {aArchivar.length}</h3>
          <p className="m-texto-suave">Tienen movimientos: para no perder esa historia no se borran. Dejan de salir en listas y selectores, siguen en reportes y se ven en Clientes › Archivados, donde se pueden reactivar.</p>
          <ul className="c-previa-lista">{aArchivar.map((x) => <li key={x.c.id}><b>{x.c.nombre}</b><small>Tiene {unirConY(x.plan.motivos)}</small></li>)}</ul>
        </div>
      )}
    </Ventana>
  )

  return {
    pedir: (l) => setLista(l.filter((c) => !c.archivado)),
    ventana,
    titulo: (c) => textoPlan(esc.planBorrar(c.id)),
  }
}
