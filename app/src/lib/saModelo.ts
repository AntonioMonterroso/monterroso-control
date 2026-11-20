import { useMemo } from 'react'
import { aCentavos, deCentavos } from './dinero'
import { movimientos, resultado, type Movimiento } from './finanzas'
import type { Modelo } from './modelo'
import { useModelo } from './modelo'
import { generarCobros, pendientes } from './cobros'
import { saldoDeuda } from './finanzas'
import { capital, saldoCuenta } from './sa'
import { NEGOCIOS_SA } from './tipos'

export function idsSA(m: Modelo): string[] {
  return m.negocios.filter((n) => NEGOCIOS_SA.includes(n.clave) || n.en_sa).map((n) => n.id)
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
  const activo = deCentavos(aCentavos(bancos) + aCentavos(porCobrar))
  const pasivo = deCentavos(aCentavos(deudas) + aCentavos(isrPorPagar) + aCentavos(dividendosPorPagar))
  const patrimonio = deCentavos(aCentavos(capitalPagado) + aCentavos(reserva) + aCentavos(acumuladas))
  return { bancos, porCobrar, activo, deudas, isrPorPagar, dividendosPorPagar, pasivo, capitalPagado, reserva, acumuladas, patrimonio, diferencia: deCentavos(aCentavos(activo) - aCentavos(pasivo) - aCentavos(patrimonio)) }
}

export function useSA() {
  const m = useModelo()
  return useMemo(() => ({ m, s: m.sociedad, ids: idsSA(m), inicio: m.sociedad?.inicio_operaciones ?? null }), [m])
}
