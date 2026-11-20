import { Pencil, Printer } from 'lucide-react'
import { VerComprobantes } from '../../componentes/Comprobantes'
import Historia from '../../componentes/Historia'
import Ventana from '../../componentes/Ventana'
import { saldoAnticipo } from '../../lib/anticipos'
import { conceptoDePago } from '../../lib/cobros'
import { quetzales } from '../../lib/dinero'
import type { EntradaDinero } from '../../lib/entradas'
import { fechaCorta, fechaLarga } from '../../lib/fechas'
import { cambiosDe } from '../../lib/historial'
import { useModelo } from '../../lib/modelo'
import { nombreForma } from '../../lib/pagosDestino'
import { useCobros } from '../../lib/usos'
import { htmlRecibo, imprimirRecibo } from '../cobros/documentos'
import BotonesWeb from '../web/BotonesWeb'
import { origenDe, useNombres, useRepetidos } from './TablaEntradas'

export default function DetalleEntrada({ entrada: e, onCerrar, onEditar }: { entrada: EntradaDinero | null; onCerrar: () => void; onEditar: (e: EntradaDinero) => void }) {
  const m = useModelo()
  const cobros = useCobros()
  const n = useNombres()
  const repetidos = useRepetidos()
  if (!e) return <Ventana abierta={false} titulo="" onCerrar={onCerrar}>{null}</Ventana>
  const aplicaciones = e.anticipo ? m.pagos.filter((p) => p.anticipo_id === e.anticipo!.id) : []
  const tabla = e.pago ? (e.pago.origen === 'world' ? 'payments' : 'ctl_pagos') : e.anticipo ? 'ctl_anticipos' : ''
  const historia = tabla ? cambiosDe(m.historial, tabla, e.pago?.id ?? e.anticipo?.id ?? '') : []
  const delAnticipo = e.pago?.anticipo_id ? m.anticipos.find((a) => a.id === e.pago!.anticipo_id) : null
  const cuando = e.creado ? new Date(e.creado).toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short' }) : ''
  return (
    <Ventana abierta ancho="amplia" titulo={`${e.concepto} · ${quetzales(e.monto)}`} subtitulo={`${n.cliente(e.cliente_id) || (e.tipo === 'tienda' ? 'Hogar Canela' : 'Mi salario')} · ${fechaLarga(e.fecha)}`} onCerrar={onCerrar} pie={
      <>
        {e.pago && e.recibo && <button type="button" className="m-btn m-btn-salida" onClick={() => imprimirRecibo(e.pago!, m.clientes.find((c) => c.id === e.cliente_id), e.concepto)} title="Abre el recibo listo para guardar en PDF o imprimir"><Printer size={16} aria-hidden /> Recibo</button>}
        <button type="button" className="m-btn m-btn-secundario" onClick={() => onEditar(e)} title="Abre el pago para corregirlo"><Pencil size={16} aria-hidden /> Editar</button>
        <button type="button" className="m-btn m-btn-secundario" onClick={onCerrar} title="Cierra el detalle (Esc)">Cerrar</button>
      </>
    }>
      <dl className="c-datos">
        <div><dt>Forma de pago</dt><dd>{nombreForma(e.forma)}</dd></div>
        <div><dt>Dónde cayó</dt><dd>{e.forma === 'anticipo' ? 'Del saldo a favor' : n.destino(e.destino)}</dd></div>
        <div><dt>Referencia</dt><dd>{e.referencia ?? <span className="m-vacia">Sin anotar</span>}</dd></div>
        <div><dt>Recibo</dt><dd>{e.recibo ? String(e.recibo).padStart(5, '0') : <span className="m-vacia">—</span>}</dd></div>
        {e.proyecto_id && <div><dt>Proyecto</dt><dd>{n.proyecto(e.proyecto_id)}</dd></div>}
        <div><dt>De dónde viene</dt><dd>{origenDe(e)}</dd></div>
        {e.pago?.nota && <div><dt>Nota</dt><dd>«{e.pago.nota}»</dd></div>}
        <div><dt>Registrado</dt><dd>{[e.registrado_por, cuando].filter(Boolean).join(' · ') || <span className="m-vacia">Sin dato</span>}</dd></div>
      </dl>
      {(repetidos.get(e.id) ?? []).length > 0 && (
        <section className="c-detalle-seccion">
          <p className="c-aviso-fuerte">¿Repetido? Hay otro pago igual. Si es el mismo dinero anotado dos veces, elimina uno con «Editar» › «Eliminar pago».</p>
          <ul className="c-lista-saldos">{(repetidos.get(e.id) ?? []).map((id) => { const o = m.pagos.find((p) => p.id === id); return o ? <li key={id}><span>{conceptoDePago(o.cobro_clave, cobros)}<small> · {fechaCorta(o.fecha)} · {o.origen === 'world' ? 'de Monterroso World' : 'de Control'}{o.nota ? ` · «${o.nota}»` : ''}</small></span><b className="m-cifra">{quetzales(o.monto)}</b></li> : null })}</ul>
        </section>
      )}
      {e.pago && (
        <section className="c-detalle-seccion">
          <h3 className="m-seccion-titulo">Qué pagó</h3>
          <ul className="c-lista-saldos">
            <li><span>{conceptoDePago(e.pago.cobro_clave, cobros)}{delAnticipo && <small> · del anticipo del {fechaCorta(delAnticipo.fecha)}</small>}</span><b className="m-cifra">{quetzales(e.monto)}</b></li>
          </ul>
        </section>
      )}
      {e.anticipo && (
        <section className="c-detalle-seccion">
          <h3 className="m-seccion-titulo">Cómo se fue aplicando</h3>
          {aplicaciones.length ? (
            <ul className="c-lista-saldos">
              {aplicaciones.map((p) => <li key={p.id}><span>{conceptoDePago(p.cobro_clave, cobros)}<small> · {fechaCorta(p.fecha)}</small></span><b className="m-cifra">{quetzales(p.monto)}</b></li>)}
              {(e.anticipo.devuelto_monto ?? 0) > 0 && <li><span>Devuelto{e.anticipo.devuelto_el && <small> · {fechaCorta(e.anticipo.devuelto_el)}</small>}</span><b className="m-cifra">{quetzales(e.anticipo.devuelto_monto ?? 0)}</b></li>}
              <li className="c-lista-total"><span>Queda a favor</span><b className="m-cifra">{quetzales(saldoAnticipo(e.anticipo, m.pagos))}</b></li>
            </ul>
          ) : <p className="m-texto-suave">Todavía no se ha aplicado. Queda a favor {quetzales(saldoAnticipo(e.anticipo, m.pagos))}.</p>}
        </section>
      )}
      {e.pago && e.recibo && (
        <section className="c-detalle-seccion">
          <h3 className="m-seccion-titulo">Recibo en la web</h3>
          <BotonesWeb origen={{ tipo: 'recibo', pago_id: e.id, cliente_id: e.cliente_id }} telefono={m.clientes.find((c) => c.id === e.cliente_id)?.whatsapp} armar={() => { const d = htmlRecibo(e.pago!, m.clientes.find((c) => c.id === e.cliente_id), e.concepto); return { titulo: d.titulo, cuerpo: d.cuerpo, area: 'web' } }} />
        </section>
      )}
      <section className="c-detalle-seccion">
        <h3 className="m-seccion-titulo">Comprobantes</h3>
        {e.comprobantes.length ? <p><VerComprobantes rutas={e.comprobantes} titulo={`Comprobante · ${e.concepto}`} /> {e.comprobantes.length} {e.comprobantes.length === 1 ? 'comprobante' : 'comprobantes'}</p> : <p className="m-texto-suave">Sin comprobante. Agrégalo con «Editar».</p>}
      </section>
      {historia.length > 0 && <Historia cambios={historia} titulo="Su historia de cambios" formato={(campo, x) => (x == null || x === '' ? '—' : campo === 'forma' ? nombreForma(x) : campo === 'destino' ? n.destino(x) : campo === 'monto' ? quetzales(Number(x)) : campo === 'fecha' ? fechaCorta(x) : x)} />}
    </Ventana>
  )
}
