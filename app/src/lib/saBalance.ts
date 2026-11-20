import { aCentavos, deCentavos, quetzales } from './dinero'
import { esDeAntonio } from './pagosDestino'

export interface MovSA { id: string; fecha: string; monto: number; destino: string | null; ligado: boolean }

export interface DatosBalance {
  corte: string
  inicio: string
  utilidad: number
  pagosEfectivo: MovSA[]
  anticipos: (MovSA & { saldo: number })[]
  gastos: MovSA[]
  aportes: { fecha: string; monto: number; pagado: number; forma: 'efectivo' | 'especie'; ligado: boolean }[]
  repartos: { fecha: string; reserva: number; isr_sociedad: number; isr: number; isr_pagado: boolean; lineas: { bruto: number; neto: number; pagado: boolean; ligado: boolean }[] }[]
  deudas: number
  bancos: number
  bancoInicial: number
  bancoManual: number
  trasladados: Set<string>
}

export interface LineaBalance { k: string; texto: string; monto: number; nota?: string }

export interface Balance2 {
  activoCorriente: LineaBalance[]
  activoNoCorriente: LineaBalance[]
  pasivoCorriente: LineaBalance[]
  pasivoNoCorriente: LineaBalance[]
  patrimonio: LineaBalance[]
  activo: number
  pasivo: number
  totalPatrimonio: number
  diferencia: number
  explicacion: string | null
}

const suma = (l: number[]) => deCentavos(l.reduce((t, x) => t + aCentavos(x), 0))

export function armarBalance(d: DatosBalance): Balance2 {
  const enRango = <T extends { fecha: string }>(l: T[]) => l.filter((x) => x.fecha >= d.inicio && x.fecha <= d.corte)
  const pagos = enRango(d.pagosEfectivo)
  const anticipos = enRango(d.anticipos)
  const gastos = enRango(d.gastos)
  const aportes = d.aportes.filter((a) => a.fecha <= d.corte)
  const repartos = d.repartos.filter((r) => r.fecha <= d.corte)

  const conSocio = (x: MovSA) => esDeAntonio(x.destino) && !d.trasladados.has(x.id)
  const cxcSocio = suma([...pagos, ...anticipos].filter((x) => !x.ligado && conSocio(x)).map((x) => x.monto))
  const cxpSocio = suma(gastos.filter((g) => !g.ligado && !(g.destino ?? '').startsWith('s:')).map((g) => g.monto))
  const lineas = repartos.flatMap((r) => r.lineas)
  const porPasar = suma([
    ...[...pagos, ...anticipos].filter((x) => !x.ligado && !esDeAntonio(x.destino)).map((x) => x.monto),
    ...aportes.filter((a) => a.forma === 'efectivo' && !a.ligado).map((a) => a.pagado),
    ...gastos.filter((g) => !g.ligado && (g.destino ?? '').startsWith('s:')).map((g) => -g.monto),
    ...lineas.filter((l) => l.pagado && !l.ligado).map((l) => -l.neto),
    ...repartos.filter((r) => r.isr_pagado).map((r) => -r.isr),
    ...repartos.map((r) => -r.isr_sociedad),
  ])
  const especie = suma(aportes.filter((a) => a.forma === 'especie').map((a) => a.pagado))
  const suscrito = suma(aportes.map((a) => a.monto))
  const noPagado = suma(aportes.map((a) => a.monto - a.pagado))
  const reserva = suma(repartos.map((r) => r.reserva))
  const declarados = suma(lineas.map((l) => l.bruto))
  const isrSoc = suma(repartos.map((r) => r.isr_sociedad))
  const acumuladas = suma([d.utilidad, -isrSoc, -reserva, -declarados])
  const isrPorPagar = suma(repartos.filter((r) => !r.isr_pagado).map((r) => r.isr))
  const divPorPagar = suma(lineas.filter((l) => !l.pagado).map((l) => l.neto))
  const anticiposClientes = suma(anticipos.map((a) => a.saldo))

  const activoCorriente: LineaBalance[] = [
    { k: 'bancos', texto: 'Bancos', monto: d.bancos },
    { k: 'socio', texto: 'Cuenta por cobrar al socio o administrador', monto: cxcSocio, nota: 'Cobros de la S.A. que cayeron en cuentas o efectivo del socio y no se han trasladado.' },
    { k: 'porPasar', texto: 'Movimientos por pasar a Bancos', monto: porPasar, nota: 'Cobros, aportaciones y pagos de la S.A. que todavía no se registran en sus cuentas de banco.' },
  ].filter((x) => x.monto !== 0 || x.k === 'bancos')
  const activoNoCorriente: LineaBalance[] = [
    { k: 'especie', texto: 'Aportaciones en especie', monto: especie },
    { k: 'credito', texto: 'Bienes y servicios comprados a crédito', monto: d.deudas, nota: 'Lo que se compró a crédito para la S.A. y falta pagar; su contrapartida está en Deudas.' },
  ].filter((x) => x.monto !== 0)
  const pasivoCorriente: LineaBalance[] = [
    { k: 'cxp', texto: 'Cuenta por pagar al socio o administrador', monto: cxpSocio, nota: 'Gastos de la S.A. que pagó el socio con su dinero.' },
    { k: 'anticipos', texto: 'Anticipos de clientes', monto: anticiposClientes },
    { k: 'isr', texto: 'ISR de dividendos por pagar', monto: isrPorPagar },
    { k: 'div', texto: 'Dividendos por pagar', monto: divPorPagar },
  ].filter((x) => x.monto !== 0)
  const pasivoNoCorriente: LineaBalance[] = [{ k: 'deudas', texto: 'Deudas de la S.A.', monto: d.deudas }].filter((x) => x.monto !== 0)
  const patrimonio: LineaBalance[] = [
    { k: 'suscrito', texto: 'Capital suscrito', monto: suscrito },
    { k: 'noPagado', texto: 'Capital suscrito no pagado', monto: -noPagado },
    { k: 'reserva', texto: 'Reserva legal', monto: reserva },
    { k: 'acumuladas', texto: 'Utilidades acumuladas', monto: acumuladas },
  ].filter((x) => x.monto !== 0 || x.k === 'suscrito' || x.k === 'acumuladas')
  const activo = suma([...activoCorriente, ...activoNoCorriente].map((x) => x.monto))
  const pasivo = suma([...pasivoCorriente, ...pasivoNoCorriente].map((x) => x.monto))
  const totalPatrimonio = suma(patrimonio.map((x) => x.monto))
  const diferencia = suma([activo, -pasivo, -totalPatrimonio])
  const partes: string[] = []
  if (d.bancoInicial) partes.push(`el saldo con el que empezó la cuenta de banco (${quetzales(d.bancoInicial)})`)
  if (d.bancoManual) partes.push(`movimientos del banco anotados a mano sin cobro, gasto ni aportación ligada (${quetzales(d.bancoManual)})`)
  const explicacion = diferencia === 0 ? null : partes.length && Math.abs(diferencia - suma([d.bancoInicial, d.bancoManual])) < 0.005 ? `La diferencia es ${partes.join(' y ')}: liga esos movimientos a su cobro, gasto o aportación.` : 'Hay movimientos que no están ligados entre Bancos, Cobros, Gastos y Socios. Revisa los movimientos a mano del banco.'
  return { activoCorriente, activoNoCorriente, pasivoCorriente, pasivoNoCorriente, patrimonio, activo, pasivo, totalPatrimonio, diferencia, explicacion }
}
