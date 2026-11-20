import Pasos from '../../componentes/Pasos'
import { HandCoins, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useAvisar } from '../../componentes/Avisos'
import FormRegistro from '../../componentes/FormRegistro'
import Tabla from '../../componentes/Tabla'
import { useDatos } from '../../lib/datos'
import { aCentavos, deCentavos, leerMonto, quetzales } from '../../lib/dinero'
import { aISO, diasDelMes, fechaCorta, fechaLarga } from '../../lib/fechas'
import Confirmar from '../../componentes/Confirmar'
import { accionesPorSocio, distribuible, repartirPorAcciones, TASA_ISR_DIVIDENDOS, TASA_RESERVA, type RepartoSocio } from '../../lib/sa'
import { useSA, utilidadSA } from '../../lib/saModelo'
import { useHoy } from '../../lib/usos'

export default function UtilidadesSA() {
  const { m, s, inicio } = useSA()
  const { insertar, guardar, borrar, tablas } = useDatos()
  const avisar = useAvisar()
  const hoy = useHoy()
  const [quitarR, setQuitarR] = useState<{ id: string } | null>(null)
  const cierre = s?.cierre_mes ?? 12
  const cerrado = Number(hoy.slice(0, 4)) - (Number(hoy.slice(5, 7)) > cierre ? 0 : 1)
  const anioDef = inicio && aISO(cerrado, cierre, diasDelMes(cerrado, cierre)) < inicio ? cerrado + 1 : cerrado
  const [hasta, setHasta] = useState(() => aISO(anioDef, cierre, diasDelMes(anioDef, cierre)))
  const [desde, setDesde] = useState(() => (cierre === 12 ? `${anioDef}-01-01` : aISO(anioDef - 1, cierre + 1, 1)))
  const [isrSoc, setIsrSoc] = useState('')
  const [monto, setMonto] = useState('')
  const [fecha, setFecha] = useState(hoy)
  const [pagar, setPagar] = useState<RepartoSocio | null>(null)
  const utilidad = useMemo(() => utilidadSA(m, desde, hasta), [m, desde, hasta])
  const dist = distribuible(utilidad, leerMonto(isrSoc) ?? 0)
  const aRepartir = monto.trim() ? leerMonto(monto) ?? 0 : dist.distribuible
  const porSocio = accionesPorSocio(m.acciones, m.transmisiones, hasta)
  const lineas = repartirPorAcciones(aRepartir, porSocio)
  const nombre = (id: string) => m.socios.find((x) => x.id === id)?.nombre ?? ''
  const cuentas = m.bancos.filter((c) => c.activo).map((c) => ({ valor: c.id, nombre: `${c.banco} ${c.numero}` }))
  const problema = !inicio ? 'Pon la fecha de inicio de operaciones en la ficha.' : !porSocio.size ? 'No hay acciones vigentes a esa fecha.' : aRepartir <= 0 ? 'No hay monto para repartir.' : aRepartir > dist.distribuible + 0.001 ? `No puede pasar lo distribuible (${quetzales(dist.distribuible)}).` : null

  const registrar = async () => {
    if (problema) return
    try {
      const [r] = await insertar('ctl_sa_repartos', [{ desde, hasta, utilidad, isr_sociedad: leerMonto(isrSoc) ?? 0, reserva: dist.reserva, repartido: aRepartir, isr_dividendos_tasa: TASA_ISR_DIVIDENDOS, fecha_acuerdo: fecha }])
      await insertar('ctl_sa_reparto_socios', lineas.map((l) => ({ reparto_id: r.id, socio_id: l.socio_id, acciones: l.acciones, porcentaje: l.porcentaje, bruto: l.bruto, isr: l.isr, neto: l.neto })))
      avisar(`Reparto registrado: ${quetzales(aRepartir)} entre ${lineas.length} socios.`)
      setMonto('')
    } catch (e) { avisar(e instanceof Error ? e.message : 'No se pudo registrar.', 'error') }
  }

  return (
    <>
      <div className="c-cabeza"><div><span className="m-etiqueta">Sociedad anónima</span><h1 className="erp-titulo">Utilidades por acciones</h1><Pasos /></div></div>
      <p className="m-texto-suave c-intro">Utilidad de Dev Studio, Música, Diseño y generales de la sociedad, desde su inicio de operaciones. La reserva legal es el {TASA_RESERVA} % de la utilidad neta de cada ejercicio (artículo 36 del Código de Comercio). A cada socio se le retiene el {TASA_ISR_DIVIDENDOS} % de ISR sobre los dividendos.</p>
      <section className="m-tarjeta c-ficha">
        <h2 className="m-seccion-titulo">Calcular el reparto</h2>
        <div className="c-form">
          <div className="m-campo"><label htmlFor="ut-d">Desde</label><input id="ut-d" type="date" className="m-entrada" value={desde} onChange={(e) => setDesde(e.target.value)} /></div>
          <div className="m-campo"><label htmlFor="ut-h">Hasta (cierre)</label><input id="ut-h" type="date" className="m-entrada" value={hasta} onChange={(e) => setHasta(e.target.value)} /></div>
          <div className="m-campo"><label htmlFor="ut-i">ISR de la sociedad del período</label><input id="ut-i" className="m-entrada m-num" inputMode="decimal" placeholder="Q 0.00" value={isrSoc} onChange={(e) => setIsrSoc(e.target.value)} /><span className="m-ayuda">Lo que la sociedad paga de ISR sobre ese ejercicio.</span></div>
          <div className="m-campo"><label htmlFor="ut-m">Monto a repartir</label><input id="ut-m" className="m-entrada m-num" inputMode="decimal" placeholder={quetzales(dist.distribuible)} value={monto} onChange={(e) => setMonto(e.target.value)} /><span className="m-ayuda">Vacío: todo lo distribuible.</span></div>
          <div className="m-campo"><label htmlFor="ut-f">Fecha del acuerdo de asamblea</label><input id="ut-f" type="date" className="m-entrada" value={fecha} onChange={(e) => setFecha(e.target.value)} /></div>
        </div>
        <dl className="c-datos">
          <div><dt>Utilidad del período</dt><dd className={utilidad < 0 ? 'm-negativo' : undefined}>{quetzales(utilidad)}</dd></div>
          <div><dt>Menos ISR de la sociedad</dt><dd>{quetzales(leerMonto(isrSoc) ?? 0)}</dd></div>
          <div><dt>Utilidad neta</dt><dd>{quetzales(dist.neta)}</dd></div>
          <div><dt>Reserva legal ({TASA_RESERVA} %)</dt><dd>{quetzales(dist.reserva)}</dd></div>
          <div><dt>Distribuible</dt><dd><b>{quetzales(dist.distribuible)}</b></dd></div>
          <div><dt>A repartir</dt><dd><b>{quetzales(aRepartir)}</b></dd></div>
        </dl>
      </section>
      <Tabla titulo={`Reparto a ${fechaCorta(hasta)}`} filas={lineas} clave={(l) => l.socio_id} vacio={problema ?? 'Sin socios.'}
        columnas={[
          { titulo: 'Socio', principal: true, valor: (l) => nombre(l.socio_id) },
          { titulo: 'Acciones', num: true, valor: (l) => l.acciones, orden: (l) => l.acciones },
          { titulo: 'Participación', num: true, valor: (l) => `${l.porcentaje.toFixed(2)} %`, orden: (l) => l.porcentaje },
          { titulo: 'Dividendo', num: true, valor: (l) => quetzales(l.bruto), orden: (l) => l.bruto },
          { titulo: `ISR ${TASA_ISR_DIVIDENDOS} %`, num: true, valor: (l) => quetzales(l.isr), orden: (l) => l.isr },
          { titulo: 'Neto a pagar', num: true, valor: (l) => quetzales(l.neto), orden: (l) => l.neto },
        ]}
        pie={<tr><td colSpan={3}>Total</td><td className="m-num">{quetzales(aRepartir)}</td><td className="m-num">{quetzales(deCentavos(lineas.reduce((t, l) => t + aCentavos(l.isr), 0)))}</td><td className="m-num">{quetzales(deCentavos(lineas.reduce((t, l) => t + aCentavos(l.neto), 0)))}</td></tr>} />
      <div className="c-fila-botones"><button type="button" className="m-btn m-btn-primario" disabled={!!problema} onClick={() => void registrar()} title={problema ?? 'Guardar el reparto acordado por la asamblea'}>Registrar el reparto</button></div>
      <section className="c-seccion-dev">
        <h2 className="m-seccion-titulo">Repartos registrados</h2>
        {m.repartos.length === 0 ? <div className="m-vacio c-vacio-chico"><b>Sin repartos todavía</b></div> : m.repartos.map((r) => {
          const ls = m.repartoSocios.filter((l) => l.reparto_id === r.id)
          return (
            <div key={r.id} className="c-seccion-dev">
              <Tabla titulo={`Ejercicio ${fechaCorta(r.desde)} al ${fechaCorta(r.hasta)} · acuerdo del ${fechaLarga(r.fecha_acuerdo)}`} nota={`Utilidad ${quetzales(r.utilidad)} · reserva ${quetzales(r.reserva)} · repartido ${quetzales(r.repartido)}${r.isr_pagado_el ? ` · ISR pagado el ${fechaCorta(r.isr_pagado_el)}` : ' · ISR retenido por pagar'}`}
                filas={ls} clave={(l) => l.id} vacio=""
                columnas={[
                  { titulo: 'Socio', principal: true, valor: (l) => nombre(l.socio_id) },
                  { titulo: 'Dividendo', num: true, valor: (l) => quetzales(l.bruto) },
                  { titulo: 'ISR', num: true, valor: (l) => quetzales(l.isr) },
                  { titulo: 'Neto', num: true, valor: (l) => quetzales(l.neto) },
                  { titulo: 'Estado', valor: (l) => (l.pagado_el ? <span className="m-estado aprobado">Pagado {fechaCorta(l.pagado_el)}</span> : <span className="m-estado pendiente">Por pagar</span>) },
                ]}
                acciones={(l) => (!l.pagado_el ? <button type="button" className="m-btn m-btn-primario m-btn-sm" onClick={() => setPagar(l)} title="Registrar el pago al socio"><HandCoins size={14} aria-hidden /> Pagado</button> : null)} />
              <div className="c-fila-botones">
                {!r.isr_pagado_el && <button type="button" className="m-btn m-btn-secundario m-btn-sm" onClick={() => void guardar('ctl_sa_repartos', r.id, { isr_pagado_el: hoy })} title="Marcar que ya se pagó a la SAT el ISR retenido">ISR pagado hoy</button>}
                {ls.every((l) => !l.pagado_el) && <button type="button" className="m-btn m-btn-fantasma m-btn-sm" onClick={() => setQuitarR(r)} title="Quitar el reparto (ningún socio ha cobrado)"><Trash2 size={14} aria-hidden /> Quitar reparto</button>}
              </div>
            </div>
          )
        })}
      </section>
      <FormRegistro abierta={pagar != null} titulo="Pago del dividendo" subtitulo={pagar ? `${nombre(pagar.socio_id)} · neto ${quetzales(pagar.neto)}` : ''}
        campos={[
          { k: 'pagado_el', etiqueta: 'Fecha del pago', tipo: 'fecha', requerido: true },
          { k: 'cuenta_id', etiqueta: 'Desde la cuenta', tipo: 'select', opciones: cuentas, ayuda: cuentas.length ? 'Se anota como egreso en esa cuenta.' : 'Agrega una cuenta en Bancos para anotarlo ahí.' },
        ]}
        inicial={{ pagado_el: hoy }}
        onGuardar={async (x) => {
          if (!pagar) return
          await guardar('ctl_sa_reparto_socios', pagar.id, x)
          if (x.cuenta_id) await insertar('ctl_banco_movimientos', [{ cuenta_id: x.cuenta_id, fecha: x.pagado_el, tipo: 'egreso', monto: pagar.neto, descripcion: `Dividendo a ${nombre(pagar.socio_id)}`, origen: 'dividendo', origen_id: pagar.id, conciliado: false }])
        }}
        onCerrar={() => setPagar(null)} />
      <Confirmar abierta={quitarR != null} titulo="Quitar reparto" peligro boton="Quitar el reparto" texto="Se quita el reparto y lo que le tocaba a cada socio. Ningún socio ha cobrado." onNo={() => setQuitarR(null)}
        onSi={async () => {
          if (!quitarR) return
          const r = tablas.ctl_sa_repartos.find((x) => x.id === quitarR.id)
          const ls = tablas.ctl_sa_reparto_socios.filter((x) => x.reparto_id === quitarR.id)
          setQuitarR(null)
          await borrar('ctl_sa_reparto_socios', ls.map((x) => x.id)); await borrar('ctl_sa_repartos', [quitarR.id])
          avisar('Reparto quitado.', 'bien', { texto: 'Deshacer', hacer: async () => { if (r) await insertar('ctl_sa_repartos', [{ ...r }]); if (ls.length) await insertar('ctl_sa_reparto_socios', ls.map((x) => ({ ...x }))); avisar('Se deshizo.') } })
        }} />
    </>
  )
}
