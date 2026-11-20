import Pasos from '../componentes/Pasos'
import SelectBuscable from '../componentes/SelectBuscable'
import { Download } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAvisar } from '../componentes/Avisos'
import Tabla from '../componentes/Tabla'
import { useDatos } from '../lib/datos'
import { quetzales } from '../lib/dinero'
import { fechaCorta } from '../lib/fechas'
import { useModelo } from '../lib/modelo'
import { supabase } from '../lib/supabase'
import { opcCategorias, opcNegocios } from './gastos/campos'

interface MovMundo { id: string; fecha: string; tipo: string; monto: number; moneda: string; categoria: string; area: string; nota: string | null }

export default function Mundo() {
  const m = useModelo()
  const { remoto, insertar, borrar, tablas } = useDatos()
  const avisar = useAvisar()
  const [areas, setAreas] = useState<string[] | null>(null)
  const [movs, setMovs] = useState<MovMundo[]>([])
  const [error, setError] = useState('')
  const [negocio, setNegocio] = useState(() => m.negocios.find((n) => n.clave === 'dev')?.id ?? '')
  const [categoria, setCategoria] = useState(() => m.categorias.find((c) => c.tipo === 'gasto' && c.nombre === 'Otros gastos')?.id ?? '')
  const [ocupado, setOcupado] = useState(false)

  const cargar = async () => {
    if (!remoto) return
    setError('')
    const a = await supabase.rpc('ctl_mw_areas_disponibles')
    if (a.error) { setError('La conexión con Monterroso World todavía no está creada en la base.'); setAreas([]); return }
    setAreas((a.data as string[]) ?? [])
    const v = await supabase.from('ctl_dinero_empresa').select('*').eq('tipo', 'expense').order('fecha', { ascending: false }).limit(500)
    if (!v.error) setMovs((v.data as MovMundo[]).map((x) => ({ ...x, monto: Number(x.monto) })))
  }
  useEffect(() => { void cargar() }, [remoto, tablas.ctl_mw_areas.length])

  const yaTraidos = new Set(m.gastos.map((g) => g.origen_mw_id).filter(Boolean))
  const nuevos = movs.filter((x) => !yaTraidos.has(x.id) && x.moneda === 'GTQ')
  const otraMoneda = movs.filter((x) => !yaTraidos.has(x.id) && x.moneda !== 'GTQ').length

  const alternar = async (area: string, si: boolean) => {
    try {
      if (si) await insertar('ctl_mw_areas', [{ area }])
      else await borrar('ctl_mw_areas', tablas.ctl_mw_areas.filter((x) => x.area === area).map((x) => x.id))
    } catch (e) { avisar(e instanceof Error ? e.message : 'No se pudo guardar.', 'error') }
  }
  const traer = async () => {
    setOcupado(true)
    try {
      await insertar('ctl_gastos', nuevos.map((x) => ({ fecha: x.fecha, negocio_id: negocio, categoria_id: categoria, descripcion: (x.nota || x.categoria).slice(0, 300), monto: x.monto, origen_mw_id: x.id })))
      avisar(`${nuevos.length} gastos traídos de Monterroso World.`)
    } catch (e) { avisar(e instanceof Error ? e.message : 'No se pudo traer.', 'error') }
    setOcupado(false)
  }

  return (
    <>
      <div className="c-cabeza"><div><span className="m-etiqueta">Ajustes</span><h1 className="erp-titulo">Conexión con Monterroso World</h1><Pasos /></div></div>
      <p className="m-texto-suave c-intro">Aquí solo entran los movimientos de Dinero que estén en las áreas que marques como «Empresa». Lo personal se queda en Monterroso World y este sistema nunca lo lee. Allá no se cambia nada.</p>
      {!remoto ? (
        <div className="m-vacio m-tarjeta"><b>No disponible en modo de prueba</b><span>La conexión lee tu cuenta real de Monterroso World.</span></div>
      ) : (
        <>
          {error && <p className="c-error">{error}</p>}
          <section className="m-tarjeta">
            <h2 className="m-seccion-titulo">Áreas que cuentan como Empresa</h2>
            {areas == null ? <p>Cargando…</p> : areas.length === 0 ? <p className="m-texto-suave">No se encontraron áreas en Dinero.</p> : (
              <div className="c-clausulas">
                {areas.map((a) => <label key={a} className="c-casilla"><input type="checkbox" checked={m.mwAreas.includes(a)} onChange={(e) => void alternar(a, e.target.checked)} />{a}</label>)}
              </div>
            )}
          </section>
          <section>
            <div className="c-herramientas">
              <div className="m-campo"><label htmlFor="mw-neg">Entran al negocio</label><SelectBuscable id="mw-neg" valor={negocio} onCambio={setNegocio} opciones={opcNegocios(m)} /></div>
              <div className="m-campo"><label htmlFor="mw-cat">Con la categoría</label><SelectBuscable id="mw-cat" valor={categoria} onCambio={setCategoria} opciones={opcCategorias(m)} /></div>
              <button type="button" className="m-btn m-btn-primario" disabled={!nuevos.length || !negocio || !categoria || ocupado} onClick={() => void traer()} title={nuevos.length ? 'Copiar estos gastos a Gastos, una sola vez y sin duplicar' : 'No hay gastos nuevos de Empresa'}><Download size={16} aria-hidden /> Traer {nuevos.length} gastos</button>
            </div>
            {otraMoneda > 0 && <p className="c-nota">{otraMoneda} movimientos están en otra moneda y no se traen.</p>}
            <Tabla titulo="Gastos de Empresa por traer" filas={nuevos} clave={(x) => x.id} vacio="No hay gastos nuevos en las áreas marcadas."
              columnas={[
                { titulo: 'Fecha', valor: (x) => fechaCorta(x.fecha) },
                { titulo: 'Descripción', principal: true, valor: (x) => <>{x.nota || x.categoria}<small>{x.area} · {x.categoria}</small></> },
                { titulo: 'Monto', num: true, valor: (x) => quetzales(x.monto) },
              ]} />
          </section>
        </>
      )}
    </>
  )
}
