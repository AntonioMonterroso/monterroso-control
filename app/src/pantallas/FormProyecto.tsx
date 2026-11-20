import { Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAvisar } from '../componentes/Avisos'
import Ventana from '../componentes/Ventana'
import { useEscribir } from '../lib/escribir'
import { leerMonto, quetzales } from '../lib/dinero'
import { hoyISO } from '../lib/fechas'
import { FORMAS, partesDeForma, problemasInscripcion, sumaPartes } from '../lib/inscripcion'
import { problemasMensualidad } from '../lib/mensualidad'
import { useModelo } from '../lib/modelo'
import { ESTADOS, type EstadoProyecto, type FormaInscripcion, type Momento, type ParteInscripcion, type Proyecto } from '../lib/tipos'

interface ParteForm { id?: string; concepto: string; momento: Momento; fecha: string; monto: string }

const aForm = (p: ParteInscripcion): ParteForm => ({ id: p.id, concepto: p.concepto, momento: p.momento, fecha: p.fecha ?? '', monto: p.monto.toFixed(2) })

export default function FormProyecto({ abierta, proyecto, clienteFijo, onCerrar }: { abierta: boolean; proyecto: Proyecto | null; clienteFijo?: string; onCerrar: () => void }) {
  const esc = useEscribir()
  const { clientes, tarifas } = useModelo()
  const avisar = useAvisar()
  const [v, setV] = useState({ cliente_id: '', nombre: '', descripcion: '', estado: '' as EstadoProyecto | '', fecha_firma: '', fecha_entrega: '', inscripcion: '', mensualidad: '', dia_cobro: '', inicio: '', fin: '', unico: '' })
  const [forma, setForma] = useState<FormaInscripcion | null>(null)
  const [partes, setPartes] = useState<ParteForm[]>([])
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!abierta) return
    setError(''); setOcupado(false)
    if (proyecto) {
      setV({ cliente_id: proyecto.cliente_id, nombre: proyecto.nombre, descripcion: proyecto.descripcion ?? '', estado: proyecto.estado, fecha_firma: proyecto.fecha_firma ?? '', fecha_entrega: proyecto.fecha_entrega ?? '', inscripcion: proyecto.inscripcion_total ? proyecto.inscripcion_total.toFixed(2) : '', mensualidad: proyecto.mensualidad ? proyecto.mensualidad.toFixed(2) : '', dia_cobro: proyecto.dia_cobro ? String(proyecto.dia_cobro) : '', inicio: proyecto.mensualidad_inicio ?? '', fin: proyecto.mensualidad_fin ?? '', unico: proyecto.monto_unico ? proyecto.monto_unico.toFixed(2) : '' })
      setForma(proyecto.inscripcion_forma)
      setPartes(proyecto.partes.map(aForm))
    } else {
      setV({ cliente_id: clienteFijo ?? '', nombre: '', descripcion: '', estado: 'propuesta', fecha_firma: '', fecha_entrega: '', inscripcion: '', mensualidad: '', dia_cobro: '', inicio: '', fin: '', unico: '' })
      setForma(null)
      setPartes([])
    }
  }, [abierta, proyecto, clienteFijo])

  const total = leerMonto(v.inscripcion)
  const mensual = leerMonto(v.mensualidad)
  const partesNum: ParteInscripcion[] = partes.map((p, i) => ({ id: p.id, orden: i + 1, concepto: p.concepto, momento: p.momento, fecha: p.fecha || null, monto: leerMonto(p.monto) ?? 0 }))
  const datosMensual = { mensualidad: mensual ?? 0, dia_cobro: v.dia_cobro ? Number(v.dia_cobro) : null, mensualidad_inicio: v.inicio || null, mensualidad_fin: v.fin || null, estado: (v.estado || 'propuesta') as EstadoProyecto }
  const problemas = [
    ...(!v.cliente_id ? ['Elige el cliente.'] : []),
    ...(!v.nombre.trim() ? ['Escribe el nombre del proyecto.'] : []),
    ...(total == null ? ['Revisa el monto de la inscripción.'] : problemasInscripcion(total, forma, partesNum)),
    ...(mensual == null ? ['Revisa el monto de la mensualidad.'] : problemasMensualidad(datosMensual)),
    ...((mensual ?? 0) > 0 && Number(v.dia_cobro) > 28 ? ['El día de cobro va del 1 al 28.'] : []),
    ...(leerMonto(v.unico) == null ? ['Revisa el pago único del trabajo.'] : []),
    ...(partes.some((p) => leerMonto(p.monto) == null) ? ['Revisa los montos de las partes.'] : []),
  ]

  const elegirForma = (f: FormaInscripcion) => {
    setForma(f)
    if (total && total > 0) setPartes(partesDeForma(total, f, f === 'personalizada' ? partesNum : []).map(aForm))
  }
  const cambiarTotal = (t: string) => {
    setV((x) => ({ ...x, inscripcion: t }))
    const n = leerMonto(t)
    if (n != null && forma && forma !== 'personalizada') setPartes(partesDeForma(n, forma).map(aForm))
    if (n === 0) setPartes([])
  }
  const usarTarifa = (id: string) => {
    const t = tarifas.find((x) => x.id === id)
    if (!t) return
    setV((x) => ({ ...x, nombre: x.nombre || t.nombre, inscripcion: t.inscripcion ? t.inscripcion.toFixed(2) : '', mensualidad: t.mensualidad ? t.mensualidad.toFixed(2) : '' }))
    if (forma && forma !== 'personalizada') setPartes(partesDeForma(t.inscripcion, forma).map(aForm))
    else setPartes([])
  }
  const cambiarParte = (i: number, k: keyof ParteForm, val: string) => setPartes((l) => l.map((p, j) => (j === i ? { ...p, [k]: val } : p)))

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (problemas.length || ocupado) return
    setOcupado(true); setError('')
    const fin = v.estado === 'cerrado' && (mensual ?? 0) > 0 && !v.fin ? hoyISO() : v.fin || null
    const cli = clientes.find((c) => c.id === v.cliente_id)
    const datos = {
      nombre: v.nombre.trim(), clienteNombre: cli?.nombre ?? '', descripcion: v.descripcion.trim() || null, estado: (v.estado || 'propuesta') as EstadoProyecto,
      fecha_entrega: v.fecha_entrega || null, inscripcion_total: total ?? 0,
      mensualidad: mensual ?? 0, dia_cobro: (mensual ?? 0) > 0 && v.dia_cobro ? Number(v.dia_cobro) : null,
      mensualidad_inicio: (mensual ?? 0) > 0 ? v.inicio || null : null, mensualidad_fin: (mensual ?? 0) > 0 ? fin : null,
      monto_unico: leerMonto(v.unico) ?? 0,
    }
    try {
      await esc.guardarProyecto(proyecto?.id ?? null, datos, { inscripcion_forma: forma, partes: partesNum.map((x) => ({ ...x, concepto: x.concepto.trim() })), fecha_firma: v.fecha_firma || null })
      avisar(proyecto ? 'Proyecto guardado.' : 'Proyecto creado.')
      onCerrar()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar.')
      setOcupado(false)
    }
  }

  const suma = sumaPartes(partesNum)
  return (
    <Ventana abierta={abierta} ancho="amplia" titulo={proyecto ? 'Editar proyecto' : 'Nuevo proyecto'} subtitulo={proyecto?.nombre} onCerrar={onCerrar} pie={
      <>
        <button type="button" className="m-btn m-btn-fantasma" onClick={onCerrar} title="Cerrar sin guardar">Cancelar</button>
        <button type="submit" form="form-proyecto" className="m-btn m-btn-primario" disabled={problemas.length > 0 || ocupado} title={problemas[0] ?? 'Guardar el proyecto'}>{ocupado ? 'Guardando…' : proyecto ? 'Guardar cambios' : 'Crear proyecto'}</button>
      </>
    }>
      <form id="form-proyecto" className="c-form" onSubmit={enviar}>
        <div className="m-campo">
          <label htmlFor="pr-cliente">Cliente</label>
          <select id="pr-cliente" className="m-entrada" value={v.cliente_id} disabled={!!clienteFijo} onChange={(e) => setV((x) => ({ ...x, cliente_id: e.target.value }))}>
            <option value="">Elige…</option>
            {clientes.filter((c) => c.activo || c.id === v.cliente_id).map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
        <div className="m-campo">
          <label htmlFor="pr-estado">Estado</label>
          <select id="pr-estado" className="m-entrada" value={v.estado} onChange={(e) => setV((x) => ({ ...x, estado: e.target.value as EstadoProyecto }))}>
            {ESTADOS.map((s) => <option key={s.valor} value={s.valor}>{s.nombre}</option>)}
          </select>
          {v.estado === 'propuesta' && <span className="m-ayuda">Mientras sea propuesta no genera cobros.</span>}
        </div>
        <div className="m-campo c-ancho">
          <label htmlFor="pr-nombre">Nombre del proyecto</label>
          <input id="pr-nombre" className="m-entrada" value={v.nombre} maxLength={200} onChange={(e) => setV((x) => ({ ...x, nombre: e.target.value }))} autoComplete="off" />
        </div>
        {!proyecto && tarifas.some((t) => t.activo && t.tipo === 'paquete') && (
          <div className="m-campo c-ancho">
            <label htmlFor="pr-tarifa">Tomar los precios de una tarifa <span className="c-opcional">(opcional)</span></label>
            <select id="pr-tarifa" className="m-entrada" defaultValue="" onChange={(e) => usarTarifa(e.target.value)}>
              <option value="">Ninguna</option>
              {tarifas.filter((t) => t.activo && t.tipo === 'paquete').map((t) => <option key={t.id} value={t.id}>{t.nombre}: {quetzales(t.inscripcion)} + {quetzales(t.mensualidad)} al mes</option>)}
            </select>
          </div>
        )}
        <div className="m-campo c-ancho">
          <label htmlFor="pr-desc">Descripción <span className="c-opcional">(opcional)</span></label>
          <textarea id="pr-desc" className="m-entrada" value={v.descripcion} maxLength={2000} onChange={(e) => setV((x) => ({ ...x, descripcion: e.target.value }))} />
        </div>
        <div className="m-campo">
          <label htmlFor="pr-firma">Fecha de firma <span className="c-opcional">(opcional)</span></label>
          <input id="pr-firma" type="date" className="m-entrada" value={v.fecha_firma} onChange={(e) => setV((x) => ({ ...x, fecha_firma: e.target.value }))} />
        </div>
        <div className="m-campo">
          <label htmlFor="pr-entrega">Fecha de entrega <span className="c-opcional">(opcional)</span></label>
          <input id="pr-entrega" type="date" className="m-entrada" value={v.fecha_entrega} onChange={(e) => setV((x) => ({ ...x, fecha_entrega: e.target.value }))} />
        </div>

        <div className="m-campo">
          <label htmlFor="pr-unico">Pago único del trabajo <span className="c-opcional">(opcional)</span></label>
          <input id="pr-unico" className="m-entrada m-num" inputMode="decimal" placeholder="Q 0.00" value={v.unico} onChange={(e) => setV((x) => ({ ...x, unico: e.target.value }))} />
          <span className="m-ayuda">El «monto» del trabajo en Monterroso World, aparte de la inscripción.</span>
        </div>
        <fieldset className="c-bloque c-ancho">
          <legend>Inscripción</legend>
          <div className="m-campo">
            <label htmlFor="pr-insc">Monto de la inscripción</label>
            <input id="pr-insc" className="m-entrada m-num" inputMode="decimal" placeholder="Q 0.00" value={v.inscripcion} onChange={(e) => cambiarTotal(e.target.value)} />
          </div>
          {(total ?? 0) > 0 && (
            <>
              <div className="c-formas" role="radiogroup" aria-label="Cómo se divide la inscripción">
                {FORMAS.map((f) => (
                  <button key={f.valor} type="button" role="radio" aria-checked={forma === f.valor} className="c-forma" onClick={() => elegirForma(f.valor)} title={f.ayuda}>
                    <b>{f.nombre}</b><span>{f.ayuda}</span>
                  </button>
                ))}
              </div>
              {!forma && <p className="c-nota">Elige cómo se divide: no hay una forma por defecto.</p>}
              {forma && (
                <div className="c-partes">
                  {partes.map((p, i) => (
                    <div key={i} className="c-parte">
                      <div className="m-campo">
                        <label htmlFor={`pt-c-${i}`}>Concepto</label>
                        <input id={`pt-c-${i}`} className="m-entrada" value={p.concepto} maxLength={120} disabled={forma !== 'personalizada'} onChange={(e) => cambiarParte(i, 'concepto', e.target.value)} />
                      </div>
                      <div className="m-campo">
                        <label htmlFor={`pt-m-${i}`}>Cuándo</label>
                        <select id={`pt-m-${i}`} className="m-entrada" value={p.momento} disabled={forma !== 'personalizada'} onChange={(e) => cambiarParte(i, 'momento', e.target.value)}>
                          <option value="firma">Al firmar</option>
                          <option value="entrega">Al entregar</option>
                          <option value="fecha">En una fecha</option>
                        </select>
                      </div>
                      {p.momento === 'fecha' && (
                        <div className="m-campo">
                          <label htmlFor={`pt-f-${i}`}>Fecha</label>
                          <input id={`pt-f-${i}`} type="date" className="m-entrada" value={p.fecha} onChange={(e) => cambiarParte(i, 'fecha', e.target.value)} />
                        </div>
                      )}
                      <div className="m-campo">
                        <label htmlFor={`pt-x-${i}`}>Monto</label>
                        <input id={`pt-x-${i}`} className="m-entrada m-num" inputMode="decimal" value={p.monto} disabled={forma !== 'personalizada'} onChange={(e) => cambiarParte(i, 'monto', e.target.value)} />
                      </div>
                      {forma === 'personalizada' && partes.length > 1 && (
                        <button type="button" className="m-icono-btn c-quitar" onClick={() => setPartes((l) => l.filter((_, j) => j !== i))} aria-label={`Quitar la parte ${i + 1}`} title="Quitar esta parte"><Trash2 aria-hidden /></button>
                      )}
                    </div>
                  ))}
                  <div className="c-partes-pie">
                    {forma === 'personalizada' && (
                      <button type="button" className="m-btn m-btn-secundario m-btn-sm" onClick={() => setPartes((l) => [...l, { concepto: `Inscripción, parte ${l.length + 1}`, momento: 'fecha', fecha: '', monto: '' }])} title="Agregar otra parte de pago"><Plus size={14} aria-hidden /> Agregar parte</button>
                    )}
                    <span className={suma === total ? 'c-cuadra' : 'c-no-cuadra'}>Suman {quetzales(suma)} de {quetzales(total ?? 0)}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </fieldset>

        <fieldset className="c-bloque c-ancho">
          <legend>Mensualidad</legend>
          <div className="c-form c-form-interno">
            <div className="m-campo">
              <label htmlFor="pr-mens">Monto mensual</label>
              <input id="pr-mens" className="m-entrada m-num" inputMode="decimal" placeholder="Q 0.00" value={v.mensualidad} onChange={(e) => setV((x) => ({ ...x, mensualidad: e.target.value }))} />
            </div>
            {(mensual ?? 0) > 0 && (
              <>
                <div className="m-campo">
                  <label htmlFor="pr-dia">Día de cobro</label>
                  <input id="pr-dia" type="number" min={1} max={28} className="m-entrada m-num" value={v.dia_cobro} onChange={(e) => setV((x) => ({ ...x, dia_cobro: e.target.value }))} />
                  <span className="m-ayuda">Del 1 al 28, como en Monterroso World.</span>
                </div>
                <div className="m-campo">
                  <label htmlFor="pr-ini">Empieza</label>
                  <input id="pr-ini" type="date" className="m-entrada" value={v.inicio} onChange={(e) => setV((x) => ({ ...x, inicio: e.target.value }))} />
                </div>
                <div className="m-campo">
                  <label htmlFor="pr-fin">Termina <span className="c-opcional">(opcional)</span></label>
                  <input id="pr-fin" type="date" className="m-entrada" value={v.fin} onChange={(e) => setV((x) => ({ ...x, fin: e.target.value }))} />
                  {v.estado === 'cerrado' && !v.fin && <span className="m-ayuda">Al cerrar sin fecha de fin, termina hoy.</span>}
                </div>
              </>
            )}
          </div>
        </fieldset>
        {problemas.length > 0 && <p className="c-nota c-ancho">{problemas[0]}</p>}
        {error && <p className="c-error c-ancho" role="alert">{error}</p>}
      </form>
    </Ventana>
  )
}
