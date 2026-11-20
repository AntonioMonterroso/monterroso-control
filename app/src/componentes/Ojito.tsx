import { Eye } from 'lucide-react'
import { useState } from 'react'
import { useDatos } from '../lib/datos'
import Ventana from './Ventana'

export default function Ojito({ ruta, titulo }: { ruta: string | null; titulo: string }) {
  const { almacen } = useDatos()
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState('')
  if (!ruta) return null
  const abrir = async () => {
    setError('')
    try { setUrl(await almacen.url(ruta)) } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo abrir.'); setUrl('') }
  }
  const pdf = /\.pdf($|\?)/i.test(ruta) || url?.startsWith('data:application/pdf')
  return (
    <>
      <button type="button" className="m-icono-btn c-ojito" onClick={() => void abrir()} aria-label={`Ver ${titulo}`} title="Ver el documento"><Eye aria-hidden /></button>
      <Ventana abierta={url != null} titulo={titulo} ancho="amplia" onCerrar={() => setUrl(null)}>
        {error ? <p className="c-error">{error}</p> : url ? (pdf ? <iframe className="c-visor" src={url} title={titulo} /> : <img className="c-visor-img" src={url} alt={titulo} />) : null}
      </Ventana>
    </>
  )
}
