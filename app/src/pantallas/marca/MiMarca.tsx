import { Download, FileDown, Pencil } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useAvisar } from '../../componentes/Avisos'
import FormRegistro from '../../componentes/FormRegistro'
import { descargar } from '../../lib/csv'
import { useDatos } from '../../lib/datos'
import { AREAS, COLORES_MARCA, type Area } from '../../lib/marca'
import { fuenteBase64, lineasContacto, portada, publicacion, REDES, svgAPng, tarjetaFrente, tarjetaReverso, type DatosMarca } from '../../lib/marcaPiezas'
import { useModelo } from '../../lib/modelo'

const PIEZAS = [
  { k: 'portada', nombre: 'Portada 1500 × 500', w: 1500, h: 500 },
  { k: 'portada', nombre: 'Portada 1640 × 624', w: 1640, h: 624 },
  { k: 'publicacion', nombre: 'Publicación 1080 × 1080', w: 1080, h: 1080 },
  { k: 'publicacion', nombre: 'Publicación 1080 × 1350', w: 1080, h: 1350 },
] as const

export default function MiMarca() {
  const m = useModelo()
  const { guardar } = useDatos()
  const avisar = useAvisar()
  const [editar, setEditar] = useState(false)
  const [area, setArea] = useState<Area>('web')
  const [color, setColor] = useState(m.marca?.color ?? 'Oficial')
  const [ocupado, setOcupado] = useState('')
  const c = COLORES_MARCA.find((x) => x.nombre === color) ?? COLORES_MARCA[0]
  const d: DatosMarca = { nombre: m.marca?.nombre ?? '', cargo: m.marca?.cargo ?? '', correo: m.marca?.correo ?? '', telefono: m.marca?.telefono ?? '', sitio: m.marca?.sitio ?? 'studiomonterroso.com', redes: m.marca?.redes ?? {} }
  const vista = useMemo(() => ({ frente: tarjetaFrente(area, c), reverso: tarjetaReverso(area, c, d), portada: portada(area, c, 1500, 500, d), post: publicacion(area, c, 1080, 1080, d) }), [area, c, d.nombre, d.cargo, d.correo, d.telefono, d.sitio, JSON.stringify(d.redes)])
  const nombreArchivo = (p: string) => `${p}-${AREAS.find((a) => a.valor === area)?.carpeta}-${c.nombre}`.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-')

  const bajarPng = async (k: string, svg: (f: string) => string, w: number, h: number, nombre: string) => {
    setOcupado(k)
    try {
      const f = await fuenteBase64()
      const b = await svgAPng(svg(f), w, h)
      const url = URL.createObjectURL(b)
      const a = document.createElement('a'); a.href = url; a.download = `${nombre}.png`; document.body.appendChild(a); a.click(); a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (e) { avisar(e instanceof Error ? e.message : 'No se pudo.', 'error') }
    setOcupado('')
  }
  const tarjetaPdf = async () => {
    const f = await fuenteBase64()
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Tarjeta ${c.nombre}</title><style>@page{size:96mm 56mm;margin:0}html,body{margin:0;padding:0}.p{width:96mm;height:56mm;page-break-after:always;overflow:hidden}.p svg{width:96mm;height:56mm;display:block}</style></head><body><div class="p">${tarjetaFrente(area, c, f)}</div><div class="p">${tarjetaReverso(area, c, d, f)}</div><script>document.fonts.ready.then(function(){setTimeout(function(){window.print()},300)})<\/script></body></html>`)
    w.document.close()
  }

  return (
    <>
      <div className="c-cabeza">
        <div><span className="m-etiqueta">Ajustes</span><h1 className="erp-titulo">Mi marca</h1></div>
        <button type="button" className="m-btn m-btn-primario" onClick={() => setEditar(true)} title="Editar tus datos de contacto para tarjetas y documentos"><Pencil size={16} aria-hidden /> Editar datos</button>
      </div>
      <section className="m-tarjeta c-ficha">
        <h2 className="m-seccion-titulo">Datos para tarjetas y documentos</h2>
        <dl className="c-datos">
          {([['Nombre', d.nombre], ['Cargo', d.cargo], ['Correo', d.correo], ['Teléfono', d.telefono], ['Sitio', d.sitio]] as [string, string][]).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v || <span className="m-vacia">Sin anotar</span>}</dd></div>)}
          {REDES.filter((k) => d.redes[k]).map((k) => <div key={k}><dt>{k[0].toUpperCase() + k.slice(1)}</dt><dd>{d.redes[k]}</dd></div>)}
        </dl>
        <p className="m-texto-suave">Solo salen los datos que pongas aquí. {lineasContacto(d).length ? '' : 'Por ahora solo sale el sitio.'}</p>
      </section>
      <div className="c-herramientas">
        <div className="c-chips" role="group" aria-label="Área">{AREAS.map((a) => <button key={a.valor} type="button" className="m-chip" aria-pressed={area === a.valor} onClick={() => setArea(a.valor)} title={`Ver ${a.nombre}`}>{a.nombre}</button>)}</div>
        <div className="m-campo"><label htmlFor="mm-color">Color</label><select id="mm-color" className="m-entrada" value={color} onChange={(e) => setColor(e.target.value)}>{COLORES_MARCA.map((x) => <option key={x.nombre} value={x.nombre}>{x.nombre}</option>)}</select></div>
      </div>
      <section className="c-seccion-dev">
        <div className="c-ficha-cabeza">
          <h2 className="m-seccion-titulo">Tarjeta de presentación · 9 × 5 cm con sangrado</h2>
          <span className="c-fila-botones">
            <button type="button" className="m-btn m-btn-salida m-btn-sm" onClick={() => void tarjetaPdf()} title="Abrir el PDF para imprimir (frente y reverso, 96 × 56 mm con 3 mm de sangrado)"><FileDown size={14} aria-hidden /> PDF para imprimir</button>
            <button type="button" className="m-btn m-btn-salida m-btn-sm" disabled={ocupado === 'tf'} onClick={() => void bajarPng('tf', (f) => tarjetaFrente(area, c, f), 1134, 661, nombreArchivo('tarjeta-frente'))} title="Bajar el frente en PNG (300 ppp)"><Download size={14} aria-hidden /> Frente PNG</button>
            <button type="button" className="m-btn m-btn-salida m-btn-sm" disabled={ocupado === 'tr'} onClick={() => void bajarPng('tr', (f) => tarjetaReverso(area, c, d, f), 1134, 661, nombreArchivo('tarjeta-reverso'))} title="Bajar el reverso en PNG (300 ppp)"><Download size={14} aria-hidden /> Reverso PNG</button>
          </span>
        </div>
        <div className="c-piezas c-piezas-tarjeta">
          <figure className="c-pieza" dangerouslySetInnerHTML={{ __html: vista.frente }} />
          <figure className="c-pieza" dangerouslySetInnerHTML={{ __html: vista.reverso }} />
        </div>
      </section>
      <section className="c-seccion-dev">
        <div className="c-ficha-cabeza">
          <h2 className="m-seccion-titulo">Redes</h2>
          <span className="c-fila-botones">
            {PIEZAS.map((p) => (
              <button key={p.nombre} type="button" className="m-btn m-btn-salida m-btn-sm" disabled={ocupado === p.nombre} onClick={() => void bajarPng(p.nombre, (f) => (p.k === 'portada' ? portada(area, c, p.w, p.h, d, f) : publicacion(area, c, p.w, p.h, d, f)), p.w, p.h, nombreArchivo(`${p.k}-${p.w}x${p.h}`))} title={`Bajar ${p.nombre.toLowerCase()} en PNG`}><Download size={14} aria-hidden /> {p.nombre}</button>
            ))}
          </span>
        </div>
        <div className="c-piezas">
          <figure className="c-pieza c-pieza-ancha" dangerouslySetInnerHTML={{ __html: vista.portada }} />
          <figure className="c-pieza c-pieza-cuadrada" dangerouslySetInnerHTML={{ __html: vista.post }} />
        </div>
      </section>
      <FormRegistro abierta={editar} titulo="Mis datos de marca" subtitulo="Lo que salga en tarjetas, documentos y redes. Deja vacío lo que no quieras mostrar."
        campos={[
          { k: 'nombre', etiqueta: 'Nombre', tipo: 'texto', max: 120 },
          { k: 'cargo', etiqueta: 'Cargo', tipo: 'texto', max: 120 },
          { k: 'correo', etiqueta: 'Correo', tipo: 'texto', max: 120 },
          { k: 'telefono', etiqueta: 'Teléfono de trabajo', tipo: 'texto', max: 30 },
          { k: 'sitio', etiqueta: 'Sitio', tipo: 'texto', max: 120 },
          { k: 'color', etiqueta: 'Color preferido', tipo: 'select', opciones: COLORES_MARCA.map((x) => ({ valor: x.nombre, nombre: x.nombre })) },
          ...REDES.map((k) => ({ k: `r_${k}`, etiqueta: k[0].toUpperCase() + k.slice(1), tipo: 'texto' as const, max: 120 })),
        ]}
        inicial={{ ...(m.marca ?? {}), sitio: m.marca?.sitio ?? 'studiomonterroso.com', color: m.marca?.color ?? 'Oficial', ...Object.fromEntries(REDES.map((k) => [`r_${k}`, m.marca?.redes?.[k] ?? ''])) }}
        onGuardar={async (x) => {
          const redes = Object.fromEntries(REDES.map((k) => [k, String(x[`r_${k}`] ?? '').trim()]).filter(([, v]) => v))
          const fila = { nombre: x.nombre, cargo: x.cargo, correo: x.correo, telefono: x.telefono, sitio: x.sitio, color: x.color, redes }
          await guardar('ctl_marca', m.marca?.id ?? null, fila)
          if (x.color) setColor(String(x.color))
        }}
        onCerrar={() => setEditar(false)} />
    </>
  )
}

export function descargarSvg(nombre: string, svg: string) {
  descargar(`${nombre}.svg`, svg, 'image/svg+xml')
}
