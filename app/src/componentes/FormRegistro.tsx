import { Paperclip } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useDatos } from '../lib/datos'
import { leerMonto } from '../lib/dinero'
import { useAvisar } from './Avisos'
import Ventana from './Ventana'

export type TipoCampo = 'texto' | 'area' | 'monto' | 'numero' | 'fecha' | 'mes' | 'select' | 'casilla' | 'archivo'
export type Valores = Record<string, string>

export interface Campo {
  k: string
  etiqueta: string
  tipo: TipoCampo
  opciones?: { valor: string; nombre: string }[]
  requerido?: boolean
  ancho?: boolean
  ayuda?: string
  max?: number
  min?: number
  visible?: (v: Valores) => boolean
  limpiar?: (v: string) => { valor: string; aviso: string | null }
  secreto?: boolean
}

const aTexto = (v: unknown) => (v == null ? '' : typeof v === 'boolean' ? (v ? '1' : '') : String(v))

export function convertir(campos: Campo[], v: Valores): Record<string, unknown> {
  const r: Record<string, unknown> = {}
  for (const c of campos) {
    if (c.tipo === 'archivo') continue
    const x = (v[c.k] ?? '').trim()
    const oculto = c.visible && !c.visible(v)
    if (c.tipo === 'casilla') r[c.k] = x === '1'
    else if (oculto || x === '') r[c.k] = c.tipo === 'monto' && c.requerido ? 0 : null
    else if (c.tipo === 'monto') r[c.k] = leerMonto(x)
    else if (c.tipo === 'numero') r[c.k] = Number(x)
    else r[c.k] = x
  }
  return r
}

export default function FormRegistro({ abierta, titulo, subtitulo, campos, inicial, textoGuardar = 'Guardar', validar, onGuardar, onCerrar, carpeta = 'archivos' }: {
  abierta: boolean
  titulo: string
  subtitulo?: string
  campos: Campo[]
  inicial: Record<string, unknown>
  textoGuardar?: string
  validar?: (v: Valores) => string | null
  onGuardar: (datos: Record<string, unknown>, v: Valores) => Promise<void>
  onCerrar: () => void
  carpeta?: string
}) {
  const { almacen } = useDatos()
  const avisar = useAvisar()
  const [v, setV] = useState<Valores>({})
  const [archivos, setArchivos] = useState<Record<string, File | null>>({})
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState('')
  const [avisosCampo, setAvisosCampo] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!abierta) return
    setAvisosCampo({})
    setV(Object.fromEntries(campos.map((c) => [c.k, aTexto(inicial[c.k])])))
    setArchivos({}); setError(''); setOcupado(false)
  }, [abierta])

  const visibles = campos.filter((c) => !c.visible || c.visible(v))
  const faltan = visibles.filter((c) => c.requerido && c.tipo !== 'casilla' && c.tipo !== 'archivo' && !(v[c.k] ?? '').trim())
  const malos = visibles.filter((c) => c.tipo === 'monto' && (v[c.k] ?? '').trim() !== '' && leerMonto(v[c.k]) == null)
  const problema = faltan.length ? `Falta: ${faltan.map((c) => c.etiqueta.toLowerCase()).join(', ')}.` : malos.length ? `Revisa el monto de ${malos[0].etiqueta.toLowerCase()}.` : validar?.(v) ?? null

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (problema || ocupado) return
    setOcupado(true); setError('')
    try {
      const datos = convertir(campos, v)
      for (const c of campos.filter((x) => x.tipo === 'archivo')) {
        const f = archivos[c.k]
        if (f) datos[c.k] = await almacen.subir(`${carpeta}/${Date.now()}-${f.name.replace(/[^\w.-]+/g, '_')}`, f)
      }
      await onGuardar(datos, v)
      avisar('Guardado.')
      onCerrar()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar.')
      setOcupado(false)
    }
  }

  const id = (k: string) => `fr-${k}`
  return (
    <Ventana
      abierta={abierta}
      titulo={titulo}
      subtitulo={subtitulo}
      onCerrar={onCerrar}
      pie={
        <>
          <button type="button" className="m-btn m-btn-fantasma" onClick={onCerrar} title="Cerrar sin guardar">Cancelar</button>
          <button type="submit" form="form-registro" className="m-btn m-btn-primario" disabled={!!problema || ocupado} title={problema ?? 'Guardar los cambios'}>{ocupado ? 'Guardando…' : textoGuardar}</button>
        </>
      }
    >
      <form id="form-registro" className="c-form" onSubmit={guardar}>
        {visibles.map((c, i) => {
          const val = v[c.k] ?? ''
          const set = (x: string) => {
            if (c.limpiar) {
              const r = c.limpiar(x)
              setAvisosCampo((a) => ({ ...a, [c.k]: r.aviso ?? '' }))
              x = r.valor
            }
            setV((y) => ({ ...y, [c.k]: x }))
          }
          if (c.tipo === 'casilla') return (
            <label key={c.k} className="c-casilla c-ancho"><input type="checkbox" checked={val === '1'} onChange={(e) => set(e.target.checked ? '1' : '')} />{c.etiqueta}{c.ayuda && <span className="m-ayuda">{c.ayuda}</span>}</label>
          )
          return (
            <div key={c.k} className={`m-campo${c.ancho || c.tipo === 'area' ? ' c-ancho' : ''}`}>
              <label htmlFor={id(c.k)}>{c.etiqueta}{c.requerido ? '' : <span className="c-opcional"> (opcional)</span>}</label>
              {c.tipo === 'select' ? (
                <select id={id(c.k)} className="m-entrada" value={val} onChange={(e) => set(e.target.value)} autoFocus={i === 0}>
                  {!c.requerido || !val ? <option value="">{c.requerido ? 'Elige…' : 'Ninguno'}</option> : null}
                  {c.opciones?.map((o) => <option key={o.valor} value={o.valor}>{o.nombre}</option>)}
                </select>
              ) : c.tipo === 'area' ? (
                <textarea id={id(c.k)} className="m-entrada" value={val} maxLength={c.max ?? 2000} onChange={(e) => set(e.target.value)} />
              ) : c.tipo === 'archivo' ? (
                <label className="c-archivo">
                  <Paperclip size={16} aria-hidden />
                  <span>{archivos[c.k]?.name ?? (val ? 'Ya tiene archivo: elige otro para cambiarlo' : 'Elegir foto o PDF')}</span>
                  <input id={id(c.k)} type="file" accept="image/*,application/pdf" onChange={(e) => setArchivos((x) => ({ ...x, [c.k]: e.target.files?.[0] ?? null }))} />
                </label>
              ) : (
                <input
                  id={id(c.k)}
                  className={`m-entrada${c.tipo === 'monto' || c.tipo === 'numero' ? ' m-num' : ''}`}
                  type={c.tipo === 'fecha' ? 'date' : c.tipo === 'mes' ? 'month' : c.tipo === 'numero' ? 'number' : 'text'}
                  inputMode={c.tipo === 'monto' ? 'decimal' : undefined}
                  min={c.min}
                  max={c.tipo === 'numero' ? c.max : undefined}
                  maxLength={c.tipo === 'texto' ? c.max ?? 200 : undefined}
                  placeholder={c.tipo === 'monto' ? 'Q 0.00' : undefined}
                  value={val}
                  onChange={(e) => set(e.target.value)}
                  autoFocus={i === 0}
                  autoComplete="off"
                  spellCheck={c.secreto ? false : undefined}
                />
              )}
              {c.ayuda && <span className="m-ayuda">{c.ayuda}</span>}
              {avisosCampo[c.k] && <span className="c-nota" role="alert">{avisosCampo[c.k]}</span>}
            </div>
          )
        })}
        {problema && <p className="c-nota c-ancho">{problema}</p>}
        {error && <p className="c-error c-ancho" role="alert">{error}</p>}
      </form>
    </Ventana>
  )
}
