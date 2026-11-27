import { useEntradas } from '../lib/usos'
import { nombreForma } from '../lib/pagosDestino'
import Pasos from '../componentes/Pasos'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Tabla from '../componentes/Tabla'
import { pendientes, totalSaldo } from '../lib/cobros'
import { aCentavos, deCentavos, quetzales } from '../lib/dinero'
import { cobrosDeVentas, porCobrarTienda } from '../lib/tiendaPagos'
import { diasEntre, fechaCorta, nombreMes, partes } from '../lib/fechas'
import { movimientos, rangoMes, resultado } from '../lib/finanzas'
import { useModelo } from '../lib/modelo'
import { lineasPresupuesto } from '../lib/presupuesto'
import { useCobros, useHoy } from '../lib/usos'
import { EstadoCobro } from './cobros/Cobros'
import Barra from './presupuesto/Barra'
import ParaNoOlvidar from './desarrollo/ParaNoOlvidar'

export default function Inicio({ negocioClave }: { negocioClave?: 'dev' } = {}) {
  const m = useModelo()
  const hoy = useHoy()
  const periodo = hoy.slice(0, 7)
  const [a, mes] = partes(hoy)
  const fijo = negocioClave ? m.negocios.find((n) => n.clave === negocioClave) : undefined
  const [negocioSel, setNegocio] = useState('')
  const negocio = fijo?.id ?? negocioSel
  const [desde, hasta] = rangoMes(periodo)
  const movs = useMemo(() => movimientos(m, desde, hasta, hoy), [m, desde, hasta, hoy])
  const cobros = useCobros()
  const r = resultado(movs, negocio || undefined)
  const dev = m.negocios.find((n) => n.clave === 'dev')
  const salarioId = m.negocios.find((n) => n.clave === 'salario')?.id
  const canelaId = m.negocios.find((n) => n.clave === 'canela')?.id
  const negocioDe = (c: (typeof cobros)[number]) => (c.tipo === 'salario' ? salarioId : m.clientes.find((x) => x.id === c.cliente_id)?.negocio_id)
  const cobrosNeg = cobros.filter((c) => !negocio || negocioDe(c) === negocio)
  const tiendaDebe = !negocio || negocio === canelaId ? porCobrarTienda(cobrosDeVentas(m.ventas.filter((v) => v.fecha <= hasta), m.partesTienda)) : 0
  const falta = deCentavos(aCentavos(totalSaldo(cobrosNeg.filter((c) => !c.vence || c.vence <= hasta))) + aCentavos(tiendaDebe))
  const proximos = pendientes(cobrosNeg).filter((c) => c.estado === 'vencido' || (c.vence && diasEntre(hoy, c.vence) <= 7)).slice(0, 12)
  const lineas = lineasPresupuesto(m.categorias, m.presupuestos, movs, periodo, negocio || null).filter((l) => l.plan > 0 || l.real > 0)
  const cliente = (id: string) => m.clientes.find((c) => c.id === id)?.nombre ?? ''
  const entradas = useEntradas()
  const ultimos = entradas.filter((e) => !negocio || e.negocio_id === negocio).slice(0, 5)
  const activos = m.negocios.filter((n) => n.activo)

  return (
    <>
      <div className="c-cabeza">
        <div><span className="m-etiqueta">{nombreMes(a, mes)}</span><h1 className="erp-titulo">{fijo ? 'Resumen' : 'Inicio'}</h1><Pasos /></div>
      </div>
      {!fijo && <div className="c-chips" role="group" aria-label="Negocio">
        <button type="button" className="m-chip" aria-pressed={!negocio} onClick={() => setNegocio('')} title="Ver todos los negocios juntos">Todos</button>
        {activos.map((n) => <button key={n.id} type="button" className="m-chip" aria-pressed={negocio === n.id} onClick={() => setNegocio(n.id)} title={`Ver solo ${n.nombre}`}>{n.nombre}</button>)}
      </div>}

      <ParaNoOlvidar limite={5} ocultarVacio />

      <div className="erp-kpis">
        <div className="erp-kpi exito"><span className="m-etiqueta">Entró este mes</span><b>{quetzales(r.ingresos)}</b><small>{fijo ? 'cobros de tus clientes' : 'cobros, ventas de la tienda y salario recibido'}</small></div>
        <div className="erp-kpi aviso"><span className="m-etiqueta">Me deben</span><b>{quetzales(falta)}</b><small>{tiendaDebe > 0 ? `incluye ${quetzales(tiendaDebe)} de pedidos de la tienda` : 'hasta fin de mes, con lo vencido'}</small></div>
        <div className="erp-kpi peligro"><span className="m-etiqueta">Gastos del mes</span><b>{quetzales(r.gastos)}</b><small>{fijo ? 'del estudio y de cada cliente' : 'empresa, clientes, deudas y pedidos'}</small></div>
        <div className="erp-kpi"><span className="m-etiqueta">Utilidad del mes</span><b className={`${r.utilidad < 0 ? ' m-negativo' : ''}`}>{quetzales(r.utilidad)}</b><small>lo que entró menos los gastos</small></div>
      </div>

      {!negocio && (
        <Tabla
          titulo="Por negocio"
          filas={activos}
          clave={(n) => n.id}
          vacio="Sin negocios."
          columnas={[
            { titulo: 'Negocio', principal: true, valor: (n) => n.nombre },
            { titulo: 'Ingresos', num: true, valor: (n) => quetzales(resultado(movs, n.id).ingresos) },
            { titulo: 'Gastos', num: true, valor: (n) => quetzales(resultado(movs, n.id).gastos) },
            { titulo: 'Utilidad', num: true, valor: (n) => { const u = resultado(movs, n.id).utilidad; return <span className={u < 0 ? 'm-negativo' : undefined}>{quetzales(u)}</span> } },
          ]}
          pie={<tr><td>Total</td><td className="m-num">{quetzales(r.ingresos)}</td><td className="m-num">{quetzales(r.gastos)}</td><td className="m-num">{quetzales(r.utilidad)}</td></tr>}
        />
      )}

      <div className="c-dos">
        <section>
          <h2 className="m-seccion-titulo">Presupuesto del mes</h2>
          {lineas.length === 0 ? (
            <div className="m-vacio c-vacio-chico"><b>Sin presupuesto este mes</b><span>Ponlo en <Link to={fijo ? '/dev/presupuesto' : '/presupuestos'}>{fijo ? 'Presupuesto' : 'Presupuestos'}</Link>.</span></div>
          ) : (
            <ul className="c-lista-presupuesto">
              {lineas.map((l) => (
                <li key={l.categoria.id}>
                  <div><span>{l.categoria.nombre}<small> · {l.categoria.tipo === 'ingreso' ? 'ingreso' : 'gasto'}</small></span><span className="m-cifra">{quetzales(l.real)} <small>de {quetzales(l.plan)}</small></span></div>
                  <Barra avance={l.avance} tipo={l.categoria.tipo} />
                </li>
              ))}
            </ul>
          )}
        </section>
        <section>
          <h2 className="m-seccion-titulo">Lo que me deben: vencido y esta semana</h2>
          {proximos.length === 0 ? (
            <div className="m-vacio c-vacio-chico"><b>Nada urgente</b><span>{dev && (!negocio || negocio === dev.id) ? 'No hay cobros vencidos ni por vencer esta semana.' : 'Este negocio no tiene cobros a clientes.'}</span></div>
          ) : (
            <ul className="c-lista-saldos">
              {proximos.map((c) => (
                <li key={c.clave}>
                  <span>{c.tipo === 'salario' ? <Link to="/salario" className="c-enlace">Mi salario</Link> : <Link to={`/clientes/${encodeURIComponent(c.cliente_id ?? "")}`} className="c-enlace">{cliente(c.cliente_id)}</Link>}<small> · {c.concepto}{c.vence ? ` · ${fechaCorta(c.vence)}` : ''}</small></span>
                  <span className="c-fila-botones"><EstadoCobro c={c} /><b className="m-cifra">{quetzales(c.saldo)}</b></span>
                </li>
              ))}
              <li className="c-lista-pie"><Link to={fijo ? '/dev/cobros' : '/cobros'} className="c-enlace">Ver todo lo que me deben</Link></li>
            </ul>
          )}
        </section>
      </div>

      <section>
        <div className="c-ficha-cabeza">
          <h2 className="m-seccion-titulo">Pagos que recibí</h2>
          <Link to={fijo ? '/dev/pagos' : '/pagos'} className="m-btn m-btn-secundario m-btn-sm" title="Abre el historial completo de pagos recibidos">Ver todos</Link>
        </div>
        {ultimos.length === 0 ? <div className="m-vacio c-vacio-chico"><b>Todavía no hay pagos</b></div> : (
          <ul className="c-lista-saldos">
            {ultimos.map((e) => (
              <li key={e.id}>
                <span>{e.cliente_id ? <Link to={`/clientes/${encodeURIComponent(e.cliente_id)}`} className="c-enlace">{cliente(e.cliente_id)}</Link> : e.tipo === 'tienda' ? 'Hogar Canela' : 'Mi salario'}<small> · {e.concepto} · {fechaCorta(e.fecha)} · {e.forma === 'anticipo' ? 'del saldo a favor' : nombreForma(e.forma).toLowerCase()}</small></span>
                <b className="m-cifra">{quetzales(e.monto)}</b>
              </li>
            ))}
          </ul>
        )}
      </section>

      {m.clientes.length === 0 && (
        <section className="m-tarjeta c-primeros">
          <h2 className="m-seccion-titulo">Para empezar</h2>
          <ol>
            <li>Crea tu primer cliente en <Link to="/clientes">Clientes</Link> y asígnale un proyecto.</li>
            <li>Registra tus gastos fijos en <Link to="/gastos">Gastos</Link>.</li>
            <li>Pon tu salario en <Link to="/salario">Salario</Link> y tu presupuesto en <Link to="/presupuestos">Presupuestos</Link>.</li>
          </ol>
        </section>
      )}
    </>
  )
}
