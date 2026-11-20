import SelectBuscable from '../../componentes/SelectBuscable'
import { FileDown } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useAvisar } from '../../componentes/Avisos'
import Ventana from '../../componentes/Ventana'
import { armarContrato, clausulasQueAplican } from '../../lib/contratos'
import { useDatos } from '../../lib/datos'
import { useModelo } from '../../lib/modelo'
import { useHoy } from '../../lib/usos'
import { htmlContrato, imprimirContrato } from './imprimir'
import VistaPrevia, { useAncho } from '../../componentes/VistaPrevia'
import Pestanas from '../../componentes/Pestanas'
import { faltantes } from '../../lib/contratos'
import { numeroWhatsApp } from '../../lib/cobros'

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
  const [pest, setPest] = useState<'datos' | 'previa'>('datos')
  const dos = useAncho(1100)

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
  const faltan = [...(!c ? ['cliente'] : []), ...faltantes(texto)]
  const textoPrevia = texto || 'Elige el cliente para armar el contrato.'
  const pdf = () => imprimirContrato(titulo, texto, prestador, c?.nombre ?? '')
  const whatsapp = () => { pdf(); window.open(`https://wa.me/${numeroWhatsApp(c?.whatsapp ?? null)}?text=${encodeURIComponent(`Hola${c ? `, ${c.nombre}` : ''}. Te comparto el contrato en PDF para revisarlo.`)}`, '_blank') }

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
    <Ventana abierta={abierto} ancho="doble" titulo="Armar contrato" subtitulo="Los datos del cliente y del proyecto se llenan solos." onCerrar={onCerrar} pie={
      <>
        <button type="button" className="m-btn m-btn-secundario" onClick={onCerrar} title="Cierra sin guardar">Cancelar</button>
        <button type="button" className="m-btn m-btn-secundario" disabled={!c || ocupado} onClick={() => void guardar(false)} title={c ? 'Guardar el contrato en la ficha del cliente' : 'Elige el cliente'}>Guardar</button>
        <button type="button" className="m-btn m-btn-primario" disabled={!c || ocupado} onClick={() => void guardar(true)} title={!c ? 'Apagado: elige el cliente' : faltan.length ? `Guarda y abre el PDF; todavía falta: ${faltan.join(', ')}` : 'Guarda y abre el PDF para imprimir y firmar'}><FileDown size={16} aria-hidden /> Guardar y PDF</button>
      </>
    }>
      {!dos && <div className="c-pest-doble"><Pestanas etiqueta="Ver" valor={pest} onCambio={setPest} opciones={[{ valor: 'datos', nombre: 'Datos' }, { valor: 'previa', nombre: 'Vista previa' }]} /></div>}
      <div className={`c-doble${dos ? ' c-doble-dos' : ''}`}>
      {(dos || pest === 'datos') && <div className="c-armador">
        <div className="c-form">
          <div className="m-campo">
            <label htmlFor="ar-cli">Cliente</label>
            <SelectBuscable id="ar-cli" valor={cliente} disabled={!!clienteFijo} onCambio={(v) => { setCliente(v); setProyecto('') }} vacio="Elige…" opciones={m.clientes.filter((x) => !x.archivado || x.id === cliente).map((x) => ({ valor: x.id, nombre: x.nombre }))} />
          </div>
          <div className="m-campo">
            <label htmlFor="ar-pro">Proyecto</label>
            <SelectBuscable id="ar-pro" valor={proyecto} onCambio={setProyecto} disabled={!cliente} vacio="Sin proyecto" opciones={proyectosCliente.map((x) => ({ valor: x.id, nombre: x.nombre }))} />
          </div>
          <div className="m-campo">
            <label htmlFor="ar-pla">Plantilla</label>
            <SelectBuscable id="ar-pla" valor={plantilla} onCambio={(v) => { setPlantilla(v); setTocado(false) }} opciones={m.plantillas.map((x) => ({ valor: x.id, nombre: x.nombre }))} />
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
      </div>}
      {(dos || pest === 'previa') && <VistaPrevia titulo={titulo} cuerpo={htmlContrato(titulo, textoPrevia, prestador || '[Falta: nombre del prestador]', c?.nombre ?? '[Falta: cliente]')} area="web" faltan={faltan} onPdf={pdf} onWhatsapp={whatsapp} />}
      </div>
    </Ventana>
  )
}
