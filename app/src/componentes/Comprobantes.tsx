import { Eye, FileText, Paperclip, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { Almacen } from '../lib/almacen'
import { useDatos } from '../lib/datos'
import Ventana from './Ventana'

export interface ValorComprobantes { existentes: string[]; nuevos: File[] }

export const SIN_COMPROBANTES: ValorComprobantes = { existentes: [], nuevos: [] }

const MAX = 10 * 1024 * 1024
const ACEPTA = 'image/*,application/pdf,.heic,.heif'

export function esPdf(r: string) {
  return /\.pdf($|\?)/i.test(r) || r.startsWith('data:application/pdf')
}

export async function subirComprobantes(almacen: Almacen, carpeta: string, v: ValorComprobantes): Promise<string[]> {
  const subidos: string[] = []
  for (const f of v.nuevos) subidos.push(await almacen.subir(`${carpeta}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${(f.name || 'captura.png').replace(/[^\w.-]+/g, '_')}`, f))
  return [...v.existentes, ...subidos]
}

function aceptable(f: File): string | null {
  if (f.size > MAX) return `«${f.name}» pesa más de 10 MB.`
  if (!(f.type.startsWith('image/') || f.type === 'application/pdf' || /\.(heic|heif|pdf)$/i.test(f.name))) return `«${f.name}» no es imagen ni PDF.`
  return null
}

function Miniatura({ ruta, archivo, onQuitar }: { ruta?: string; archivo?: File; onQuitar: () => void }) {
  const { almacen } = useDatos()
  const [src, setSrc] = useState<string | null>(null)
  const [falla, setFalla] = useState(false)
  useEffect(() => {
    if (archivo) { const u = URL.createObjectURL(archivo); setSrc(u); return () => URL.revokeObjectURL(u) }
    if (ruta) { let vivo = true; almacen.url(ruta).then((u) => { if (vivo) setSrc(u) }, () => setFalla(true)); return () => { vivo = false } }
  }, [ruta, archivo, almacen])
  const nombre = archivo?.name || (ruta ?? '').split('/').pop() || 'Comprobante'
  const pdf = archivo ? archivo.type === 'application/pdf' : esPdf(ruta ?? '')
  return (
    <li className="c-mini">
      {pdf || falla || !src ? <span className="c-mini-icono"><FileText aria-hidden /></span> : <img src={src} alt={nombre} onError={() => setFalla(true)} />}
      <small title={nombre}>{nombre.replace(/^\d+-[a-z0-9]{5}-/, '')}</small>
      <button type="button" className="c-mini-quitar" onClick={onQuitar} aria-label={`Quitar ${nombre}`} title="Quita este comprobante de la lista; no se guarda hasta tocar el botón principal"><X size={14} aria-hidden /></button>
    </li>
  )
}

export default function Comprobantes({ id, valor, onCambio }: { id: string; valor: ValorComprobantes; onCambio: (v: ValorComprobantes) => void }) {
  const caja = useRef<HTMLDivElement>(null)
  const [error, setError] = useState('')
  const [sobre, setSobre] = useState(false)
  const actual = useRef(valor)
  actual.current = valor

  const agregar = (lista: File[]) => {
    const malos = lista.map(aceptable).filter(Boolean) as string[]
    setError(malos[0] ?? '')
    const buenos = lista.filter((f) => !aceptable(f)).map((f, i) => (f.name ? f : new File([f], `captura-${Date.now()}-${i}.png`, { type: f.type || 'image/png' })))
    if (buenos.length) onCambio({ ...actual.current, nuevos: [...actual.current.nuevos, ...buenos] })
  }

  useEffect(() => {
    const pegar = (e: ClipboardEvent) => {
      const dlg = caja.current?.closest('dialog')
      if (dlg && !dlg.open) return
      const archivos = [...(e.clipboardData?.files ?? [])]
      if (!archivos.length) return
      e.preventDefault()
      agregar(archivos)
    }
    document.addEventListener('paste', pegar)
    return () => document.removeEventListener('paste', pegar)
  })

  return (
    <div ref={caja} className="c-comprobantes">
      <label
        htmlFor={id}
        className={`c-soltar${sobre ? ' c-soltar-sobre' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setSobre(true) }}
        onDragLeave={() => setSobre(false)}
        onDrop={(e) => { e.preventDefault(); setSobre(false); agregar([...e.dataTransfer.files]) }}
        title="Elige, arrastra o pega con Ctrl o ⌘ + V una foto, captura o PDF"
      >
        <Paperclip size={16} aria-hidden />
        <span>Elegir, arrastrar o pegar (Ctrl/⌘ + V) · imagen o PDF, hasta 10 MB</span>
        <input id={id} type="file" multiple accept={ACEPTA} onChange={(e) => { agregar([...(e.target.files ?? [])]); e.target.value = '' }} />
      </label>
      {error && <p className="c-error" role="alert">{error}</p>}
      {(valor.existentes.length > 0 || valor.nuevos.length > 0) && (
        <ul className="c-minis">
          {valor.existentes.map((r) => <Miniatura key={r} ruta={r} onQuitar={() => onCambio({ ...valor, existentes: valor.existentes.filter((x) => x !== r) })} />)}
          {valor.nuevos.map((f, i) => <Miniatura key={`${f.name}-${i}`} archivo={f} onQuitar={() => onCambio({ ...valor, nuevos: valor.nuevos.filter((_, j) => j !== i) })} />)}
        </ul>
      )}
    </div>
  )
}

export function VerComprobantes({ rutas, titulo }: { rutas: string[]; titulo: string }) {
  const { almacen } = useDatos()
  const [urls, setUrls] = useState<{ r: string; u: string }[] | null>(null)
  const [error, setError] = useState('')
  if (!rutas.length) return null
  const abrir = async () => {
    setError('')
    try { setUrls(await Promise.all(rutas.map(async (r) => ({ r, u: await almacen.url(r) })))) } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo abrir.'); setUrls([]) }
  }
  return (
    <>
      <button type="button" className="m-icono-btn c-ojito" onClick={(e) => { e.stopPropagation(); void abrir() }} aria-label={`Ver ${rutas.length === 1 ? 'el comprobante' : `los ${rutas.length} comprobantes`}`} title={`Muestra ${rutas.length === 1 ? 'el comprobante' : `los ${rutas.length} comprobantes`} encima, sin salir de aquí`}><Eye aria-hidden /></button>
      <Ventana abierta={urls != null} titulo={titulo} subtitulo={rutas.length > 1 ? `${rutas.length} comprobantes` : undefined} ancho="amplia" onCerrar={() => setUrls(null)}>
        {error ? <p className="c-error">{error}</p> : (
          <div className="c-visor-lista">
            {(urls ?? []).map(({ r, u }) => (esPdf(r) || u.startsWith('data:application/pdf') ? <iframe key={r} className="c-visor" src={u} title={titulo} /> : <img key={r} className="c-visor-img" src={u} alt={titulo} />))}
          </div>
        )}
      </Ventana>
    </>
  )
}
