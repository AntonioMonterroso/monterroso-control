import { CheckCircle2, FileDown, MessageCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { documentoHtml, imprimir } from '../../lib/imprimir'
import { codigoValido, type DocPublico } from '../../lib/links'
import { aceptarDocumento, leerDocumentoPublico } from '../../lib/linksDatos'
import { svgLogo, type Area } from '../../lib/marca'

const NOMBRES: Record<string, string> = { cotizacion: 'Cotización', propuesta: 'Propuesta comercial', estado_cuenta: 'Estado de cuenta', recibo: 'Recibo de pago' }

export default function DocumentoWeb() {
  const { codigo = '' } = useParams()
  const [doc, setDoc] = useState<DocPublico | null>(null)
  const [nombre, setNombre] = useState('')
  const [aceptando, setAceptando] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    document.title = 'Studio Monterroso'
    if (!codigoValido(codigo)) { setDoc({ estado: 'no_existe' }); return }
    void leerDocumentoPublico(codigo).then(setDoc, () => setDoc({ estado: 'no_existe' }))
  }, [codigo])
  useEffect(() => { if (doc?.titulo) document.title = `${doc.titulo} · Studio Monterroso` }, [doc])
  const area = (doc?.area ?? 'corporativo') as Area
  const logo = <span className="w-logo" dangerouslySetInnerHTML={{ __html: svgLogo({ area, m: 'var(--w-m)', texto: 'var(--w-texto)' }) }} />
  const pregunta = doc?.whatsapp ? `https://wa.me/${doc.whatsapp}?text=${encodeURIComponent(`Hola, tengo una pregunta sobre «${doc.titulo ?? 'el documento'}».`)}` : null

  if (!doc) return <main className="w-pagina"><div className="w-caja w-centro">{logo}<p>Cargando…</p></div></main>
  if (doc.estado !== 'activo') return (
    <main className="w-pagina">
      <div className="w-caja w-centro">
        {logo}
        <h1>{doc.estado === 'vencido' ? 'Este documento ya venció' : 'No encontramos este documento'}</h1>
        <p>{doc.estado === 'vencido' ? 'Su vigencia terminó. Escríbenos y te mandamos uno al día.' : 'El enlace no existe o ya no está disponible. Si te lo mandaron hace poco, pide uno nuevo.'}</p>
        {pregunta && <a className="w-btn w-btn-principal" href={pregunta} target="_blank" rel="noreferrer"><MessageCircle size={18} aria-hidden /> Escribir por WhatsApp</a>}
        <a className="w-enlace" href="https://studiomonterroso.com">studiomonterroso.com</a>
      </div>
    </main>
  )
  const html = documentoHtml(doc.titulo ?? '', doc.cuerpo ?? '', '', area, '', false)
  const aceptar = async () => {
    if (nombre.trim().length < 2) { setError('Escribe tu nombre.'); return }
    setAceptando(true); setError('')
    const ok = await aceptarDocumento(codigo, nombre)
    setAceptando(false)
    if (ok) setDoc({ ...doc, aceptado_por: nombre.trim(), aceptado_el: new Date().toISOString() })
    else setError('No se pudo registrar. Intenta de nuevo o escríbenos.')
  }
  return (
    <main className="w-pagina">
      <header className="w-cabeza">
        {logo}
        <div className="w-botones">
          <button type="button" className="w-btn" onClick={() => imprimir(doc.titulo ?? '', doc.cuerpo ?? '', '', area)} title="Abre el documento listo para guardar en PDF o imprimir"><FileDown size={18} aria-hidden /> Bajar PDF</button>
          {pregunta && <a className="w-btn" href={pregunta} target="_blank" rel="noreferrer" title="Abre WhatsApp para escribirnos"><MessageCircle size={18} aria-hidden /> Tengo una pregunta</a>}
        </div>
      </header>
      <section className="w-caja">
        <span className="w-etiqueta">{NOMBRES[doc.tipo ?? ''] ?? 'Documento'}</span>
        <h1>{doc.titulo}</h1>
        {doc.vence && <p className="w-suave">Vigente hasta el {new Date(`${doc.vence}T12:00:00`).toLocaleDateString('es-GT', { dateStyle: 'long' })}.</p>}
        <iframe className="w-hoja" title={doc.titulo ?? 'Documento'} srcDoc={html} sandbox="allow-same-origin" />
      </section>
      {doc.puede_aceptar && (
        <section className="w-caja w-aceptar">
          {doc.aceptado_el ? (
            <p className="w-ok"><CheckCircle2 size={20} aria-hidden /> Aceptado por {doc.aceptado_por} el {new Date(doc.aceptado_el).toLocaleString('es-GT', { dateStyle: 'long', timeStyle: 'short' })}. ¡Gracias!</p>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); if ((document.activeElement as HTMLElement | null)?.closest('.c-combo')) return; void aceptar() }}>
              <h2>¿Estás de acuerdo?</h2>
              <p className="w-suave">Al aceptar queda registrado tu nombre, la fecha y la hora, y nos llega el aviso.</p>
              <label htmlFor="w-nombre">Tu nombre</label>
              <input id="w-nombre" className="w-entrada" value={nombre} maxLength={120} onChange={(e) => setNombre(e.target.value)} autoComplete="name" />
              {error && <p className="w-error" role="alert">{error}</p>}
              <button type="submit" className="w-btn w-btn-principal" disabled={aceptando} title="Registra que aceptas este documento">{aceptando ? 'Registrando…' : 'Aceptar'}</button>
            </form>
          )}
        </section>
      )}
      <footer className="w-pie"><a className="w-enlace" href="https://studiomonterroso.com">studiomonterroso.com</a></footer>
    </main>
  )
}
