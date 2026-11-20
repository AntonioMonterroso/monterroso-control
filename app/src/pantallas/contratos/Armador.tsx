import { FileDown } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useAvisar } from '../../componentes/Avisos'
import Ventana from '../../componentes/Ventana'
import { armarContrato, clausulasQueAplican } from '../../lib/contratos'
import { useDatos } from '../../lib/datos'
import { useModelo } from '../../lib/modelo'
import { useHoy } from '../../lib/usos'
import { imprimirContrato } from './imprimir'

const LLAVE = 'mc_contrato_prestador'

function leerPrestador(): { prestador: string; ciudad: string } {
  try { return JSON.parse(localStorage.getItem(LLAVE) ?? '') as { prestador: string; ciudad: string } } catch { return { prestador: 'Monterroso Dev Studio', ciudad: '' } }
}

export default function Armador({ abierto, clienteFijo, onCerrar }: { abierto: boolean; clienteFijo?: string; onCerrar: () => void }) {
  const m = useModelo()
  const { insertar } = useDatos()
  const avisar = useAvisar()
  const hoy = useHoy()
  const [cliente, setCliente] = useState('')
  const [proyecto, setProyecto] = useState('')
  const [plantilla, setPlantilla] = useState('')
  const [fecha, setFecha] = useState(hoy)
  const [prestador, setPrestador] = useState('')
  const [ciudad, setCiudad] = useState('')
  const [elegidas, setElegidas] = useState<boolean[]>([])
  const [texto, setTexto] = useState('')
  const [tocado, setTocado] = useState(false)
  const [ocupado, setOcupado] = useState(false)

  useEffect(() => {
    if (!abierto) return
    const p = leerPrestador()
    setCliente(clienteFijo ?? ''); setProyecto(''); setFecha(hoy); setPrestador(p.prestador); setCiudad(p.ciudad); setTocado(false); setOcupado(false)
    setPlantilla(m.plantillas[0]?.id ?? '')
  }, [abierto])

  const pl = m.plantillas.find((x) => x.id === plantilla)
  useEffect(() => { setElegidas(pl ? pl.clausulas.map(() => true) : []) }, [pl])
  const c = m.clientes.find((x) => x.id === cliente)
  const pr = m.proyectos.find((x) => x.id === proyecto) ?? null
  const proyectosCliente = m.proyectos.filter((x) => x.cliente_id === cliente)
  const armado = useMemo(() => (pl && c ? armarContrato(pl.encabezado, clausulasQueAplican(pl.clausulas, elegidas, pr), pl.cierre, { ciudad, prestador, fecha, cliente: c, proyecto: pr }) : ''), [pl, c, pr, elegidas, ciudad, prestador, fecha])
  useEffect(() => { if (!tocado) setTexto(armado) }, [armado, tocado])
  const titulo = `Contrato ${pr ? `de ${pr.nombre}` : 'de servicios'} · ${c?.nombre ?? ''}`

  const guardar = async (pdf: boolean) => {
    if (!c || !texto.trim()) return
    setOcupado(true)
    try {
      localStorage.setItem(LLAVE, JSON.stringify({ prestador, ciudad }))
      await insertar('ctl_contratos', [{ cliente_id: c.id, proyecto_id: pr?.id ?? null, plantilla_id: pl?.id ?? null, titulo, contenido: texto, fecha }])
      if (pdf) imprimirContrato(titulo, texto, prestador, c.nombre)
      avisar('Contrato guardado en el cliente.')
      onCerrar()
    } catch (e) { avisar(e instanceof Error ? e.message : 'No se pudo guardar.', 'error'); setOcupado(false) }
  }

  return (
    <Ventana abierta={abierto} ancho="amplia" titulo="Armar contrato" subtitulo="Los datos del cliente y del proyecto se llenan solos." onCerrar={onCerrar} pie={
      <>
        <button type="button" className="m-btn m-btn-fantasma" onClick={onCerrar} title="Cerrar sin guardar">Cancelar</button>
        <button type="button" className="m-btn m-btn-secundario" disabled={!c || ocupado} onClick={() => void guardar(false)} title={c ? 'Guardar el contrato en la ficha del cliente' : 'Elige el cliente'}>Guardar</button>
        <button type="button" className="m-btn m-btn-primario" disabled={!c || ocupado} onClick={() => void guardar(true)} title={c ? 'Guardar y abrir el PDF para imprimir y firmar' : 'Elige el cliente'}><FileDown size={16} aria-hidden /> Guardar y PDF</button>
      </>
    }>
      <div className="c-armador">
        <div className="c-form">
          <div className="m-campo">
            <label htmlFor="ar-cli">Cliente</label>
            <select id="ar-cli" className="m-entrada" value={cliente} disabled={!!clienteFijo} onChange={(e) => { setCliente(e.target.value); setProyecto('') }}>
              <option value="">Elige…</option>
              {m.clientes.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
            </select>
          </div>
          <div className="m-campo">
            <label htmlFor="ar-pro">Proyecto</label>
            <select id="ar-pro" className="m-entrada" value={proyecto} onChange={(e) => setProyecto(e.target.value)} disabled={!cliente}>
              <option value="">Sin proyecto</option>
              {proyectosCliente.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
            </select>
          </div>
          <div className="m-campo">
            <label htmlFor="ar-pla">Plantilla</label>
            <select id="ar-pla" className="m-entrada" value={plantilla} onChange={(e) => { setPlantilla(e.target.value); setTocado(false) }}>
              {m.plantillas.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
            </select>
          </div>
          <div className="m-campo">
            <label htmlFor="ar-fec">Fecha</label>
            <input id="ar-fec" type="date" className="m-entrada" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
          <div className="m-campo">
            <label htmlFor="ar-pre">Prestador</label>
            <input id="ar-pre" className="m-entrada" value={prestador} maxLength={200} onChange={(e) => setPrestador(e.target.value)} />
          </div>
          <div className="m-campo">
            <label htmlFor="ar-ciu">Ciudad</label>
            <input id="ar-ciu" className="m-entrada" value={ciudad} maxLength={120} onChange={(e) => setCiudad(e.target.value)} />
          </div>
          {pl && (
            <fieldset className="c-bloque c-ancho">
              <legend>Cláusulas</legend>
              <div className="c-clausulas">
                {pl.clausulas.map((cl, i) => (
                  <label key={i} className="c-casilla">
                    <input type="checkbox" checked={elegidas[i] ?? false} disabled={cl.fija} onChange={(e) => { setElegidas((l) => l.map((x, j) => (j === i ? e.target.checked : x))); setTocado(false) }} />
                    {cl.titulo}{cl.fija && <span className="m-ayuda">Siempre va</span>}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
        </div>
        <div className="m-campo">
          <label htmlFor="ar-txt">Texto del contrato {tocado && <button type="button" className="m-btn m-btn-fantasma m-btn-sm" onClick={() => setTocado(false)} title="Quitar tus cambios y volver a armarlo con los datos">Volver a armar</button>}</label>
          <textarea id="ar-txt" className="m-entrada c-texto-contrato" value={texto} onChange={(e) => { setTexto(e.target.value); setTocado(true) }} placeholder="Elige el cliente para armarlo." />
          <span className="m-ayuda">Puedes corregir el texto antes de guardarlo. Revísalo antes de firmar.</span>
        </div>
      </div>
    </Ventana>
  )
}
