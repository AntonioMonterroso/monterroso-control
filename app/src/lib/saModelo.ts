import { useMemo } from 'react'
import { aCentavos, deCentavos } from './dinero'
import { movimientos, resultado, type Movimiento } from './finanzas'
import type { Modelo } from './modelo'
import { useModelo } from './modelo'
import { generarCobros, pendientes } from './cobros'
import { saldoDeuda } from './finanzas'
import { capital, saldoCuenta } from './sa'
import { NEGOCIOS_SA } from './tipos'
import { pendienteAl, pendientesTrasladar, type Entrada } from './traslados'
import { armarBalance, type Balance2 } from './saBalance'

export function idsSA(m: Modelo): string[] {
  return m.negocios.filter((n) => NEGOCIOS_SA.includes(n.clave) || n.en_sa).map((n) => n.id)
}

export function entradasTraslado(m: Modelo): Entrada[] {
  const neg = (id: string | null) => m.clientes.find((c) => c.id === id)?.negocio_id ?? null
  return [
    ...m.pagos.filter((p) => !p.cobro_clave.startsWith('s:')).map((p) => ({ id: p.id, fecha: p.fecha, monto: p.monto, destino: p.destino, forma: p.forma, negocio_id: neg(p.cliente_id), texto: `${m.clientes.find((c) => c.id === p.cliente_id)?.nombre ?? 'Pago'}${p.recibo_numero ? ` · recibo ${p.recibo_numero}` : ''}` })),
    ...m.anticipos.map((a) => ({ id: `a:${a.id}`, fecha: a.fecha, monto: a.monto, destino: a.destino, forma: a.forma, negocio_id: neg(a.cliente_id), texto: `${m.clientes.find((c) => c.id === a.cliente_id)?.nombre ?? 'Cliente'} · anticipo` })),
  ]
}

export function pendientesSA(m: Modelo): Entrada[] {
  return pendientesTrasladar(entradasTraslado(m), idsSA(m), m.sociedad?.inicio_operaciones ?? null, m.traslados)
}

export function movimientosSA(m: Modelo, desde: string, hasta: string): Movimiento[] {
  const inicio = m.sociedad?.inicio_operaciones
  if (!inicio) return []
  const d = desde < inicio ? inicio : desde
  if (d > hasta) return []
  const ids = new Set(idsSA(m))
  return movimientos(m, d, hasta).filter((x) => ids.has(x.negocio_id))
}

export function utilidadSA(m: Modelo, desde: string, hasta: string): number {
  return resultado(movimientosSA(m, desde, hasta)).utilidad
}

export interface Balance {
  bancos: number
  porCobrar: number
  porCobrarSocio: number
  activo: number
  deudas: number
  isrPorPagar: number
  dividendosPorPagar: number
  pasivo: number
  capitalPagado: number
  reserva: number
  acumuladas: number
  patrimonio: number
  diferencia: number
}

export function balanceSA(m: Modelo, corte: string, hoy: string): Balance {
  const inicio = m.sociedad?.inicio_operaciones ?? corte
  const ids = new Set(idsSA(m))
  const bancos = deCentavos(m.bancos.reduce((s, c) => s + aCentavos(saldoCuenta(c, m.movBancos, corte)), 0))
  const cobros = generarCobros(m.proyectos, m.cobros, m.pagos.filter((p) => p.fecha <= corte), corte, hoy, [])
  const porCobrar = deCentavos(pendientes(cobros).filter((c) => (!c.vence || (c.vence >= inicio && c.vence <= corte)) && ids.has(m.clientes.find((x) => x.id === c.cliente_id)?.negocio_id ?? '')).reduce((s, c) => s + aCentavos(c.saldo), 0))
  const deudas = deCentavos(m.deudas.filter((d) => ids.has(d.negocio_id) && d.inicio <= corte).reduce((s, d) => s + aCentavos(saldoDeuda(d, m.movimientos.filter((x) => x.fecha <= corte))), 0))
  const repartos = m.repartos.filter((r) => r.fecha_acuerdo <= corte)
  const lineas = m.repartoSocios.filter((l) => repartos.some((r) => r.id === l.reparto_id))
  const isrPorPagar = deCentavos(repartos.filter((r) => !r.isr_pagado_el || r.isr_pagado_el > corte).reduce((s, r) => s + lineas.filter((l) => l.reparto_id === r.id).reduce((t, l) => t + aCentavos(l.isr), 0), 0))
  const dividendosPorPagar = deCentavos(lineas.filter((l) => !l.pagado_el || l.pagado_el > corte).reduce((s, l) => s + aCentavos(l.neto), 0))
  const capitalPagado = capital([], m.aportes.filter((a) => a.fecha <= corte)).pagado
  const reserva = deCentavos(repartos.reduce((s, r) => s + aCentavos(r.reserva), 0))
  const declarados = deCentavos(lineas.reduce((s, l) => s + aCentavos(l.bruto), 0))
  const isrSoc = deCentavos(repartos.reduce((s, r) => s + aCentavos(r.isr_sociedad), 0))
  const acumuladas = deCentavos(aCentavos(utilidadSA(m, inicio, corte)) - aCentavos(isrSoc) - aCentavos(reserva) - aCentavos(declarados))
  const porCobrarSocio = pendienteAl(entradasTraslado(m), [...ids], m.sociedad?.inicio_operaciones ?? null, m.traslados, corte)
  const activo = deCentavos(aCentavos(bancos) + aCentavos(porCobrar) + aCentavos(porCobrarSocio))
  const pasivo = deCentavos(aCentavos(deudas) + aCentavos(isrPorPagar) + aCentavos(dividendosPorPagar))
  const patrimonio = deCentavos(aCentavos(capitalPagado) + aCentavos(reserva) + aCentavos(acumuladas))
  return { bancos, porCobrar, porCobrarSocio, activo, deudas, isrPorPagar, dividendosPorPagar, pasivo, capitalPagado, reserva, acumuladas, patrimonio, diferencia: deCentavos(aCentavos(activo) - aCentavos(pasivo) - aCentavos(patrimonio)) }
}

export function useSA() {
  const m = useModelo()
  return useMemo(() => ({ m, s: m.sociedad, ids: idsSA(m), inicio: m.sociedad?.inicio_operaciones ?? null }), [m])
}

export function balanceDe(m: Modelo, corte: string): Balance2 | null {
  const inicio = m.sociedad?.inicio_operaciones
  if (!inicio) return null
  const ids = new Set(idsSA(m))
  const neg = (id: string | null) => m.clientes.find((c) => c.id === id)?.negocio_id ?? ''
  const movs = m.movBancos.filter((x) => x.fecha <= corte)
  const ligados = new Set(movs.filter((x) => x.origen_id).map((x) => `${x.origen}:${x.origen_id}`))
  const pagosCorte = m.pagos.filter((p) => p.fecha <= corte)
  const deudasSA = m.deudas.filter((x) => ids.has(x.negocio_id) && x.inicio >= inicio)
  const repartos = m.repartos.map((r) => ({
    fecha: r.fecha_acuerdo, reserva: r.reserva, isr_sociedad: r.isr_sociedad,
    isr: deCentavos(m.repartoSocios.filter((l) => l.reparto_id === r.id).reduce((t, l) => t + aCentavos(l.isr), 0)),
    isr_pagado: !!r.isr_pagado_el && r.isr_pagado_el <= corte,
    lineas: m.repartoSocios.filter((l) => l.reparto_id === r.id).map((l) => ({ bruto: l.bruto, neto: l.neto, pagado: !!l.pagado_el && l.pagado_el <= corte, ligado: ligados.has(`dividendo:${l.id}`) })),
  }))
  return armarBalance({
    corte, inicio,
    utilidad: utilidadSA(m, inicio, corte),
    pagosEfectivo: m.pagos.filter((p) => !p.cobro_clave.startsWith('s:') && p.forma !== 'anticipo' && ids.has(neg(p.cliente_id))).map((p) => ({ id: p.id, fecha: p.fecha, monto: p.monto, destino: p.destino, ligado: ligados.has(`pago:${p.id}`) })),
    anticipos: m.anticipos.filter((a) => ids.has(neg(a.cliente_id))).map((a) => ({ id: `a:${a.id}`, fecha: a.fecha, monto: a.monto, destino: a.destino, ligado: ligados.has(`anticipo:${a.id}`), saldo: deCentavos(Math.max(0, aCentavos(a.monto) - pagosCorte.filter((p) => p.anticipo_id === a.id).reduce((t, p) => t + aCentavos(p.monto), 0) - (a.devuelto_el && a.devuelto_el <= corte ? aCentavos(a.devuelto_monto ?? 0) : 0))) })),
    gastos: [
      ...m.gastos.filter((g) => ids.has(g.negocio_id)).map((g) => ({ id: g.id, fecha: g.fecha, monto: g.monto, destino: g.destino ?? null, ligado: ligados.has(`gasto:${g.id}`) })),
      ...m.movimientos.filter((x) => x.tipo === 'pago' && ids.has(m.deudas.find((y) => y.id === x.deuda_id)?.negocio_id ?? '')).map((x) => ({ id: x.id, fecha: x.fecha, monto: x.monto, destino: null, ligado: ligados.has(`deuda:${x.id}`) })),
    ],
    aportes: m.aportes.map((a) => ({ fecha: a.fecha, monto: a.monto, pagado: a.pagado, forma: a.forma, ligado: ligados.has(`aporte:${a.id}`) })),
    repartos,
    deudas: deCentavos(deudasSA.reduce((t, x) => t + aCentavos(saldoDeuda(x, m.movimientos.filter((y) => y.fecha <= corte))), 0)),
    bancos: deCentavos(m.bancos.reduce((t, c) => t + aCentavos(saldoCuenta(c, m.movBancos, corte)), 0)),
    bancoInicial: deCentavos(m.bancos.filter((c) => c.fecha_saldo <= corte).reduce((t, c) => t + aCentavos(c.saldo_inicial), 0)),
    bancoManual: deCentavos(movs.filter((x) => x.origen === 'manual').reduce((t, x) => t + (x.tipo === 'ingreso' ? 1 : -1) * aCentavos(x.monto), 0)),
    trasladados: new Set(m.traslados.filter((t) => t.fecha <= corte).flatMap((t) => t.pagos)),
  })
}
