import { Copy, ExternalLink, FileDown, Link2, Link2Off, MessageCircle, RefreshCw, Share2 } from 'lucide-react'
import { useState } from 'react'
import Ventana from '../../componentes/Ventana'
import { useAvisar } from '../../componentes/Avisos'
import { numeroWhatsApp } from '../../lib/cobros'
import { useDatos } from '../../lib/datos'
import { imprimir } from '../../lib/imprimir'
import { estadoLink, generarCodigo, limpiarCuerpo, urlPublica, whatsappNegocio, type LinkPublico, type TipoLink } from '../../lib/links'
import { useModelo } from '../../lib/modelo'
import { useHoy } from '../../lib/usos'

export interface Origen { tipo: TipoLink; documento_id?: string | null; cliente_id?: string | null; pago_id?: string | null }
export interface Armado { titulo: string; cuerpo: string; area?: string; vence?: string | null }

const mismo = (l: LinkPublico, o: Origen) => l.tipo === o.tipo && (o.documento_id ? l.documento_id === o.documento_id : o.pago_id ? l.pago_id === o.pago_id : l.cliente_id === (o.cliente_id ?? null) && !l.documento_id && !l.pago_id)

export function useLinkDe(o: Origen): LinkPublico | undefined {
  const m = useModelo()
  return m.links.filter((l) => mismo(l, o) && l.estado === 'activo').sort((a, b) => b.creado.localeCompare(a.creado))[0]
}

export function useLinks() {
  const m = useModelo()
  const { insertar, guardar } = useDatos()
  const asegurar = async (o: Origen, a: Armado, nuevo = false): Promise<LinkPublico> => {
    const actual = m.links.filter((l) => mismo(l, o) && l.estado === 'activo').sort((x, y) => y.creado.localeCompare(x.creado))[0]
    const datos = { titulo: a.titulo.slice(0, 200), cuerpo: limpiarCuerpo(a.cuerpo), area: a.area ?? 'corporativo', vence: a.vence ?? null, whatsapp: whatsappNegocio(m.marca?.telefono) }
    if (actual && !nuevo) return (await guardar('ctl_links', actual.id, datos)) as unknown as LinkPublico
    if (actual) await guardar('ctl_links', actual.id, { estado: 'retirado' })
    const [h] = await insertar('ctl_links', [{ ...datos, codigo: generarCodigo(), tipo: o.tipo, documento_id: o.documento_id ?? null, cliente_id: o.cliente_id ?? null, pago_id: o.pago_id ?? null, estado: 'activo', vistas: 0 }])
    return h as unknown as LinkPublico
  }
  const retirar = async (ids: string[]) => { for (const id of ids) await guardar('ctl_links', id, { estado: 'retirado' }) }
  return { asegurar, retirar }
}

export function ChipLink({ link }: { link?: LinkPublico }) {
  const hoy = useHoy()
  if (!link) return null
  const e = estadoLink(link, hoy)
  return <span className={`m-estado ${e.clase}`} title={link.visto_primero ? `Visto por primera vez el ${new Date(link.visto_primero).toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short' })}${link.aceptado_el ? ` · aceptado por ${link.aceptado_por}` : ''}` : 'El cliente todavía no lo ha abierto'}>{e.texto}</span>
}

export default function BotonesWeb({ origen, armar, telefono, compacto }: { origen: Origen; armar: () => Armado; telefono?: string | null; compacto?: boolean }) {
  const avisar = useAvisar()
  const { asegurar, retirar } = useLinks()
  const { guardar } = useDatos()
  const link = useLinkDe(origen)
  const conLink = async (nuevo = false) => { try { return await asegurar(origen, armar(), nuevo) } catch (e) { avisar(e instanceof Error ? e.message : 'No se pudo crear el link.', 'error'); return null } }
  const copiar = async () => { const l = await conLink(); if (!l) return; try { await navigator.clipboard.writeText(urlPublica(l.codigo)); avisar('Link copiado.') } catch { avisar(urlPublica(l.codigo)) } }
  const whatsapp = async () => {
    const ventana = window.open('', '_blank')
    const l = await conLink(); if (!l) { ventana?.close(); return }
    const texto = `Hola, te comparto ${armar().titulo}: ${urlPublica(l.codigo)}`
    const url = `https://wa.me/${numeroWhatsApp(telefono ?? null)}?text=${encodeURIComponent(texto)}`
    if (ventana) ventana.location.href = url; else window.location.href = url
  }
  const ver = async () => { const ventana = window.open('', '_blank'); const l = await conLink(); if (!l) { ventana?.close(); return } if (ventana) ventana.location.href = urlPublica(l.codigo) }
  const pdf = () => { const a = armar(); imprimir(a.titulo, limpiarCuerpo(a.cuerpo), '', (a.area ?? 'corporativo') as never) }
  const t = compacto ? 'm-icono-btn c-salida' : 'm-btn m-btn-salida m-btn-sm'
  return (
    <span className="c-links">
      <ChipLink link={link} />
      <button type="button" className={t} onClick={() => void copiar()} aria-label="Copiar link" title="Copia el link de la versión web para mandarlo al cliente">{<Copy size={14} aria-hidden />}{!compacto && ' Copiar link'}</button>
      <button type="button" className={t} onClick={() => void whatsapp()} aria-label="Enviar por WhatsApp" title="Abre WhatsApp del cliente con el link listo">{<MessageCircle size={14} aria-hidden />}{!compacto && ' Enviar por WhatsApp'}</button>
      <button type="button" className={t} onClick={() => void ver()} aria-label="Ver como el cliente" title="Abre la página tal como la verá el cliente">{<ExternalLink size={14} aria-hidden />}{!compacto && ' Ver como el cliente'}</button>
      <button type="button" className={t} onClick={pdf} aria-label="Bajar PDF" title="Abre el PDF listo para guardar o imprimir">{<FileDown size={14} aria-hidden />}{!compacto && ' Bajar PDF'}</button>
      {link ? (
        <>
          <button type="button" className={compacto ? 'm-icono-btn' : 'm-btn m-btn-secundario m-btn-sm'} onClick={async () => { await retirar([link.id]); avisar('Link retirado: ya no se puede abrir.', 'bien', { texto: 'Deshacer', hacer: async () => { await guardar('ctl_links', link.id, { estado: 'activo' }) } }) }} aria-label="Retirar link" title="El link deja de abrirse; el cliente verá que ya no está disponible">{<Link2Off size={14} aria-hidden />}{!compacto && ' Retirar link'}</button>
          <button type="button" className={compacto ? 'm-icono-btn' : 'm-btn m-btn-secundario m-btn-sm'} onClick={async () => { const l = await conLink(true); if (l) { try { await navigator.clipboard.writeText(urlPublica(l.codigo)) } catch { void 0 } avisar('Link nuevo creado y copiado; el anterior dejó de abrirse.') } }} aria-label="Crear link nuevo" title="Retira el link actual y crea otro">{<RefreshCw size={14} aria-hidden />}{!compacto && ' Crear link nuevo'}</button>
        </>
      ) : !compacto && <span className="m-ayuda"><Link2 size={12} aria-hidden /> El link se crea al copiarlo o enviarlo.</span>}
    </span>
  )
}

export function BotonCompartir({ origen, armar, telefono, nombre }: { origen: Origen; armar: () => Armado; telefono?: string | null; nombre: string }) {
  const [abierta, setAbierta] = useState(false)
  const link = useLinkDe(origen)
  return (
    <>
      <ChipLink link={link} />
      <button type="button" className="m-icono-btn c-salida" onClick={(e) => { e.stopPropagation(); setAbierta(true) }} aria-label={`Compartir ${nombre} en la web`} title="Abre las opciones para compartir la versión web: copiar link, WhatsApp, ver como el cliente o bajar PDF"><Share2 aria-hidden /></button>
      <Ventana abierta={abierta} titulo="Compartir en la web" subtitulo={nombre} onCerrar={() => setAbierta(false)}>
        <BotonesWeb origen={origen} armar={armar} telefono={telefono} />
        {link && <p className="m-texto-suave">{link.vistas ? `Visto ${link.vistas} ${link.vistas === 1 ? 'vez' : 'veces'}${link.visto_primero ? `; la primera el ${new Date(link.visto_primero).toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short' })}` : ''}.` : 'El cliente todavía no lo ha abierto.'}{link.aceptado_el && ` Aceptado por ${link.aceptado_por} el ${new Date(link.aceptado_el).toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short' })}.`}</p>}
      </Ventana>
    </>
  )
}
