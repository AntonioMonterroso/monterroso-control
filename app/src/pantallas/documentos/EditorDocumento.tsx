import { FileDown, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAvisar } from '../../componentes/Avisos'
import SelectBuscable from '../../componentes/SelectBuscable'
import Ventana from '../../componentes/Ventana'
import { useDatos } from '../../lib/datos'
import { htmlDocumento, numeroVisible, siguienteNumero, TIPOS_DOC, totalRenglones, type Documento, type Renglon, type TipoDocumento } from '../../lib/documentos'
import { leerMonto, quetzales } from '../../lib/dinero'
import { regimenVigente } from '../../lib/finanzas'
import { imprimir } from '../../lib/imprimir'
import { AREAS, type Area } from '../../lib/marca'
import { useModelo } from '../../lib/modelo'
import { useHoy } from '../../lib/usos'

interface RenglonForm { concepto: string; cantidad: string; precio: string }

export const ESTADOS_DOC: [Documento['estado'], string][] = [['borrador', 'Borrador'], ['enviado', 'Enviado'], ['aceptado', 'Aceptado'], ['rechazado', 'Rechazado']]

export function useHtmlDocumento() {
  const m = useModelo()
  return (d: Documento) => {
    const c = m.clientes.find((x) => x.id === d.cliente_id)
    const p = m.proyectos.find((x) => x.id === d.proyecto_id)
    const dev = m.negocios.find((n) => n.clave === 'dev')
    const ctx = { cliente: c?.nombre ?? '—', nit: c?.nit ?? null, proyecto: p?.nombre ?? null, regimen: c ? regimenVigente(m.modos, d.fecha.slice(0, 7), dev?.id ?? '', c.id) : null, firmante: m.marca?.nombre ?? '', cargo: m.marca?.cargo ?? '', sitio: m.marca?.sitio ?? 'studiomonterroso.com', correo: m.marca?.correo ?? '' }
    const tipo = TIPOS_DOC.find((t) => t.valor === d.tipo)?.nombre ?? ''
    return { titulo: `${tipo} ${c?.nombre ?? ''}`.trim(), cuerpo: htmlDocumento(d, ctx) }
  }
}

export function useImprimirDocumento() {
  const armar = useHtmlDocumento()
  return (d: Documento) => {
    const x = armar(d)
    imprimir(x.titulo, x.cuerpo, '', d.area)
  }
}

export default function EditorDocumento({ abierto, documento, tipoInicial, clienteFijo, onCerrar }: { abierto: boolean; documento: Documento | null; tipoInicial?: TipoDocumento; clienteFijo?: string; onCerrar: () => void }) {
  const m = useModelo()
  const { guardar } = useDatos()
  const avisar = useAvisar()
  const hoy = useHoy()
  const imprimirDoc = useImprimirDocumento()
  const [tipo, setTipo] = useState<TipoDocumento>('cotizacion')
  const [area, setArea] = useState<Area>('web')
  const [cliente, setCliente] = useState('')
  const [proyecto, setProyecto] = useState('')
  const [fecha, setFecha] = useState(hoy)
  const [vigencia, setVigencia] = useState('15')
  const [titulo, setTitulo] = useState('')
  const [renglones, setRenglones] = useState<RenglonForm[]>([])
  const [texto, setTexto] = useState<Record<string, string>>({})
  const [contenido, setContenido] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [estado, setEstado] = useState<Documento['estado']>('borrador')

  useEffect(() => {
    if (!abierto) return
    const d = documento
    setTipo(d?.tipo ?? tipoInicial ?? 'cotizacion'); setArea(d?.area ?? 'web'); setCliente(d?.cliente_id ?? clienteFijo ?? ''); setProyecto(d?.proyecto_id ?? ''); setFecha(d?.fecha ?? hoy)
    setVigencia(d?.vigencia_dias ? String(d.vigencia_dias) : '15'); setTitulo(d?.titulo ?? ''); setContenido(d?.contenido ?? '')
    setRenglones((d?.datos.renglones ?? [{ concepto: '', cantidad: 1, precio: 0 }]).map((r) => ({ concepto: r.concepto, cantidad: String(r.cantidad), precio: r.precio ? r.precio.toFixed(2) : '' })))
    setTexto({ alcance: d?.datos.alcance ?? '', entregables: d?.datos.entregables ?? '', plazo: d?.datos.plazo ?? '', condiciones: d?.datos.condiciones ?? '', destinatario: d?.datos.destinatario ?? '', inscripcion: d?.datos.inscripcion ? d.datos.inscripcion.toFixed(2) : '', mensualidad: d?.datos.mensualidad ? d.datos.mensualidad.toFixed(2) : '' })
    setEstado(d?.estado ?? 'borrador')
    setOcupado(false)
  }, [abierto])

  const nombreTipo = TIPOS_DOC.find((t) => t.valor === tipo)?.nombre ?? ''
  const pr = m.proyectos.find((x) => x.id === proyecto)
  const proyectosCliente = m.proyectos.filter((x) => x.cliente_id === cliente)
  const r: Renglon[] = renglones.filter((x) => x.concepto.trim()).map((x) => ({ concepto: x.concepto.trim(), cantidad: Math.max(1, Number(x.cantidad) || 1), precio: leerMonto(x.precio) ?? 0 }))
  const problema = !titulo.trim() ? 'Escribe el título.' : tipo !== 'membretada' && !cliente ? 'Elige el cliente.' : tipo === 'cotizacion' && !r.length ? 'Agrega al menos un renglón.' : renglones.some((x) => x.precio.trim() && leerMonto(x.precio) == null) ? 'Revisa los precios.' : null

  const tomarProyecto = (id: string) => {
    setProyecto(id)
    const p = m.proyectos.find((x) => x.id === id)
    if (p) setTexto((t) => ({ ...t, inscripcion: p.inscripcion_total ? p.inscripcion_total.toFixed(2) : t.inscripcion, mensualidad: p.mensualidad ? p.mensualidad.toFixed(2) : t.mensualidad }))
    if (p && !titulo.trim()) setTitulo(`${nombreTipo}: ${p.nombre}`)
  }

  const guardarDoc = async (pdf: boolean) => {
    if (problema || ocupado) return
    setOcupado(true)
    const anio = Number(fecha.slice(0, 4))
    const datos = {
      ...(tipo === 'cotizacion' ? { renglones: r, condiciones: texto.condiciones || undefined } : {}),
      ...(tipo === 'propuesta' ? { alcance: texto.alcance || undefined, entregables: texto.entregables || undefined, plazo: texto.plazo || undefined, condiciones: texto.condiciones || undefined, inscripcion: leerMonto(texto.inscripcion) ?? 0, mensualidad: leerMonto(texto.mensualidad) ?? 0 } : {}),
      ...(tipo === 'membretada' ? { destinatario: texto.destinatario || undefined } : {}),
    }
    const numero = documento?.numero ?? (tipo === 'cotizacion' ? siguienteNumero(m.documentos, 'cotizacion', anio) : null)
    try {
      const f = (await guardar('ctl_documentos', documento?.id ?? null, { tipo, area, anio, numero, cliente_id: cliente || null, proyecto_id: proyecto || null, fecha, vigencia_dias: tipo === 'cotizacion' || tipo === 'propuesta' ? Number(vigencia) || null : null, titulo: titulo.trim(), datos, contenido: tipo === 'acuerdo' || tipo === 'membretada' ? contenido : null, estado })) as unknown as Documento
      avisar(`${nombreTipo} guardada${numero && tipo === 'cotizacion' ? ` (No. ${numeroVisible({ anio, numero })})` : ''}.`)
      if (pdf) imprimirDoc(f)
      onCerrar()
    } catch (e) { avisar(e instanceof Error ? e.message : 'No se pudo guardar.', 'error'); setOcupado(false) }
  }

  const area_ = (k: string, etiqueta: string, ayuda?: string, filas = 4) => (
    <div className="m-campo c-ancho"><label htmlFor={`doc-${k}`}>{etiqueta} <span className="c-opcional">(opcional)</span></label><textarea id={`doc-${k}`} className="m-entrada" rows={filas} value={texto[k] ?? ''} onChange={(e) => setTexto((t) => ({ ...t, [k]: e.target.value }))} />{ayuda && <span className="m-ayuda">{ayuda}</span>}</div>
  )
  return (
    <Ventana abierta={abierto} ancho="amplia" titulo={documento ? `Editar ${nombreTipo.toLowerCase()}` : 'Nuevo documento'} subtitulo={documento?.numero ? `No. ${numeroVisible(documento)}` : 'Se guarda en la ficha del cliente.'} onCerrar={onCerrar} pie={
      <>
        <button type="button" className="m-btn m-btn-fantasma" onClick={onCerrar} title="Cerrar sin guardar">Cancelar</button>
        <button type="button" className="m-btn m-btn-secundario" disabled={!!problema || ocupado} onClick={() => void guardarDoc(false)} title={problema ?? 'Guardar el documento'}>Guardar</button>
        <button type="button" className="m-btn m-btn-primario" disabled={!!problema || ocupado} onClick={() => void guardarDoc(true)} title={problema ?? 'Guardar y abrir el PDF listo para enviar'}><FileDown size={16} aria-hidden /> Guardar y PDF</button>
      </>
    }>
      <div className="c-form">
        <div className="m-campo"><label htmlFor="doc-tipo">Documento</label><select id="doc-tipo" className="m-entrada" value={tipo} disabled={!!documento} onChange={(e) => setTipo(e.target.value as TipoDocumento)}>{TIPOS_DOC.filter((t) => t.valor !== 'acuerdo').map((t) => <option key={t.valor} value={t.valor}>{t.nombre}</option>)}</select>{!documento && <span className="m-ayuda">El acuerdo de servicios se arma en Contratos.</span>}</div>
        {documento && <div className="m-campo"><label htmlFor="doc-estado">Estado</label><select id="doc-estado" className="m-entrada" value={estado} onChange={(e) => setEstado(e.target.value as Documento['estado'])}>{ESTADOS_DOC.map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></div>}
        <div className="m-campo"><label htmlFor="doc-area">Área (logo)</label><select id="doc-area" className="m-entrada" value={area} onChange={(e) => setArea(e.target.value as Area)}>{AREAS.map((a) => <option key={a.valor} value={a.valor}>{a.nombre}</option>)}</select></div>
        <div className="m-campo"><label htmlFor="doc-cli">Cliente{tipo === 'membretada' ? <span className="c-opcional"> (opcional)</span> : ''}</label><SelectBuscable id="doc-cli" valor={cliente} vacio="Elige…" disabled={!!clienteFijo} onCambio={(v) => { setCliente(v); setProyecto('') }} opciones={m.clientes.filter((c) => !c.archivado || c.id === cliente).map((c) => ({ valor: c.id, nombre: c.nombre }))} /></div>
        <div className="m-campo"><label htmlFor="doc-pro">Proyecto <span className="c-opcional">(opcional)</span></label><SelectBuscable id="doc-pro" valor={proyecto} disabled={!cliente} onCambio={tomarProyecto} vacio="Sin proyecto" opciones={proyectosCliente.map((p) => ({ valor: p.id, nombre: p.nombre }))} /></div>
        <div className="m-campo c-ancho"><label htmlFor="doc-tit">Título</label><input id="doc-tit" className="m-entrada" maxLength={200} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder={pr ? `${nombreTipo}: ${pr.nombre}` : nombreTipo} /></div>
        <div className="m-campo"><label htmlFor="doc-fec">Fecha</label><input id="doc-fec" type="date" className="m-entrada" value={fecha} onChange={(e) => setFecha(e.target.value)} /></div>
        {(tipo === 'cotizacion' || tipo === 'propuesta') && <div className="m-campo"><label htmlFor="doc-vig">Vigencia (días)</label><input id="doc-vig" type="number" min={1} max={365} className="m-entrada m-num" value={vigencia} onChange={(e) => setVigencia(e.target.value)} /></div>}
      </div>
      {tipo === 'cotizacion' && (
        <fieldset className="c-bloque">
          <legend>Renglones</legend>
          {renglones.map((x, i) => (
            <div key={i} className="c-parte c-renglon">
              <div className="m-campo"><label htmlFor={`rg-c-${i}`}>Concepto</label><input id={`rg-c-${i}`} className="m-entrada" maxLength={200} value={x.concepto} onChange={(e) => setRenglones((l) => l.map((y, j) => (j === i ? { ...y, concepto: e.target.value } : y)))} /></div>
              <div className="m-campo"><label htmlFor={`rg-n-${i}`}>Cantidad</label><input id={`rg-n-${i}`} type="number" min={1} className="m-entrada m-num" value={x.cantidad} onChange={(e) => setRenglones((l) => l.map((y, j) => (j === i ? { ...y, cantidad: e.target.value } : y)))} /></div>
              <div className="m-campo"><label htmlFor={`rg-p-${i}`}>Precio</label><input id={`rg-p-${i}`} className="m-entrada m-num" inputMode="decimal" placeholder="Q 0.00" value={x.precio} onChange={(e) => setRenglones((l) => l.map((y, j) => (j === i ? { ...y, precio: e.target.value } : y)))} /></div>
              {renglones.length > 1 && <button type="button" className="m-icono-btn c-quitar" onClick={() => setRenglones((l) => l.filter((_, j) => j !== i))} aria-label="Quitar renglón" title="Quitar este renglón"><Trash2 aria-hidden /></button>}
            </div>
          ))}
          <div className="c-partes-pie">
            <span className="c-fila-botones">
              <button type="button" className="m-btn m-btn-secundario m-btn-sm" onClick={() => setRenglones((l) => [...l, { concepto: '', cantidad: '1', precio: '' }])} title="Agregar otro renglón"><Plus size={14} aria-hidden /> Renglón</button>
              {m.tarifas.filter((t) => t.activo).length > 0 && <span className="c-select-chico" title="Agrega un renglón con el nombre y precio de una tarifa de Precios y tarifas"><SelectBuscable id="doc-tarifa" valor="" vacio="Desde una tarifa…" onCambio={(v) => { const t = m.tarifas.find((y) => y.id === v); if (t) setRenglones((l) => [...l.filter((y) => y.concepto.trim()), { concepto: t.nombre, cantidad: '1', precio: (t.tipo === 'paquete' ? t.inscripcion : t.precio).toFixed(2) }]) }} opciones={m.tarifas.filter((t) => t.activo).map((t) => ({ valor: t.id, nombre: t.nombre }))} /></span>}
            </span>
            <b>Total {quetzales(totalRenglones(r))}</b>
          </div>
        </fieldset>
      )}
      {tipo === 'propuesta' && (
        <div className="c-form">
          {area_('alcance', 'Alcance', 'Qué se va a hacer.')}
          {area_('entregables', 'Entregables', 'Uno por línea.')}
          <div className="m-campo"><label htmlFor="doc-ins">Inscripción</label><input id="doc-ins" className="m-entrada m-num" inputMode="decimal" placeholder="Q 0.00" value={texto.inscripcion ?? ''} onChange={(e) => setTexto((t) => ({ ...t, inscripcion: e.target.value }))} /></div>
          <div className="m-campo"><label htmlFor="doc-men">Mensualidad</label><input id="doc-men" className="m-entrada m-num" inputMode="decimal" placeholder="Q 0.00" value={texto.mensualidad ?? ''} onChange={(e) => setTexto((t) => ({ ...t, mensualidad: e.target.value }))} /></div>
          {area_('plazo', 'Plazo', undefined, 2)}
        </div>
      )}
      {(tipo === 'cotizacion' || tipo === 'propuesta') && area_('condiciones', 'Condiciones', 'Forma de pago, qué no incluye, etc.')}
      {tipo === 'membretada' && area_('destinatario', 'Destinatario', 'Nombre y cargo de a quien va dirigida.', 2)}
      {(tipo === 'membretada' || tipo === 'acuerdo') && <div className="m-campo"><label htmlFor="doc-txt">Texto</label><textarea id="doc-txt" className="m-entrada c-texto-contrato" value={contenido} maxLength={60000} onChange={(e) => setContenido(e.target.value)} /></div>}
    </Ventana>
  )
}
