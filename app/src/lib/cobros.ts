import { aCentavos, deCentavos, quetzales } from './dinero'
import { fechaCorta, nombreMes, partes } from './fechas'
import { fechasDeCobro, mensualidadEn } from './mensualidad'
import { textoMomento } from './inscripcion'
import { aumentoVigente, fechaPagoSalario, mesesEntre, netoSalario, periodoDe } from './finanzas'
import type { AumentoSalario, CobroGuardado, EstadoCobro, Pago, Proyecto, TipoCobro } from './tipos'

export interface Cobro {
  clave: string
  cliente_id: string
  proyecto_id: string | null
  tipo: TipoCobro
  concepto: string
  vence: string | null
  monto: number
  pagado: number
  saldo: number
  estado: EstadoCobro
  guardado: CobroGuardado | null
}

export function tipoDeClave(clave: string): TipoCobro {
  if (clave.startsWith('s:')) return 'salario'
  if (clave.startsWith('i:')) return 'inscripcion'
  if (clave.startsWith('a:')) return 'extra'
  if (clave.startsWith('m:')) return 'mensualidad'
  return 'extra'
}

export function generarCobros(proyectos: Proyecto[], guardados: CobroGuardado[], pagos: Pago[], hasta: string, hoy: string, aumentos: AumentoSalario[] = []): Cobro[] {
  const pagadoPor = new Map<string, number>()
  for (const p of pagos) pagadoPor.set(p.cobro_clave, (pagadoPor.get(p.cobro_clave) ?? 0) + aCentavos(p.monto))
  const porClave = new Map(guardados.map((g) => [g.clave, g]))
  const base: Omit<Cobro, 'pagado' | 'saldo' | 'estado' | 'guardado'>[] = []

  for (const p of proyectos) {
    if (p.estado === 'propuesta') continue
    let restoIns = pagadoPor.get(`i:${p.id}`) ?? 0
    p.partes.forEach((parte, i) => {
      const clave = `i:${p.id}:${i + 1}`
      const toca = Math.min(restoIns, aCentavos(parte.monto))
      restoIns -= toca
      if (toca > 0) pagadoPor.set(clave, (pagadoPor.get(clave) ?? 0) + toca)
      const firma = p.fecha_firma ?? (p.mensualidad_inicio ?? (p.mes ? `${p.mes}-01` : null))
      const vence = parte.momento === 'firma' ? firma : parte.momento === 'entrega' ? p.fecha_entrega : parte.fecha
      base.push({ clave, cliente_id: p.cliente_id, proyecto_id: p.id, tipo: 'inscripcion', concepto: `${parte.concepto} (${textoMomento(parte).toLowerCase()})`, vence, monto: parte.monto })
    })
    if ((p.monto_unico ?? 0) > 0) base.push({ clave: `a:${p.id}`, cliente_id: p.cliente_id, proyecto_id: p.id, tipo: 'extra', concepto: 'Pago del trabajo', vence: p.fecha_entrega, monto: p.monto_unico ?? 0 })
    if (p.mensualidad > 0 && p.mensualidad_inicio) {
      for (const f of fechasDeCobro(p, p.mensualidad_inicio, hasta)) {
        const [a, m] = partes(f)
        base.push({ clave: `m:${p.id}:${f.slice(0, 7)}`, cliente_id: p.cliente_id, proyecto_id: p.id, tipo: 'mensualidad', concepto: `Mensualidad de ${nombreMes(a, m).toLowerCase()}`, vence: f, monto: mensualidadEn(p, f.slice(0, 7)) })
      }
    }
  }
  if (aumentos.length) {
    const desde = periodoDe([...aumentos].sort((a, b) => a.desde.localeCompare(b.desde))[0].desde)
    for (const per of mesesEntre(desde, periodoDe(hasta))) {
      const a = aumentoVigente(aumentos, per)
      if (!a) continue
      const f = fechaPagoSalario(a, per)
      if (f > hasta) continue
      const [y, m] = partes(f)
      base.push({ clave: `s:${per}`, cliente_id: '', proyecto_id: null, tipo: 'salario', concepto: `Salario de ${nombreMes(y, m).toLowerCase()}`, vence: f, monto: netoSalario(a) })
    }
  }
  for (const g of guardados) {
    if (g.tipo !== 'extra') continue
    base.push({ clave: g.clave, cliente_id: g.cliente_id ?? '', proyecto_id: g.proyecto_id, tipo: 'extra', concepto: g.concepto ?? 'Cobro extra', vence: g.vence, monto: g.monto ?? 0 })
  }

  return base.map((b) => {
    const g = porClave.get(b.clave) ?? null
    const monto = g && g.tipo !== 'extra' && g.monto != null ? g.monto : b.monto
    const pagadoC = pagadoPor.get(b.clave) ?? 0
    const saldoC = Math.max(0, aCentavos(monto) - pagadoC)
    const estado: EstadoCobro = saldoC === 0 ? 'pagado' : g?.saldado ? 'saldado' : b.vence && b.vence < hoy ? 'vencido' : 'por_cobrar'
    return { ...b, concepto: g?.concepto && g.tipo !== 'extra' ? g.concepto : b.concepto, monto, pagado: deCentavos(pagadoC), saldo: deCentavos(saldoC), estado, guardado: g }
  }).sort((x, y) => (x.vence ?? '9999').localeCompare(y.vence ?? '9999') || x.concepto.localeCompare(y.concepto, 'es'))
}

export function pendientes(cobros: Cobro[]): Cobro[] {
  return cobros.filter((c) => c.estado === 'por_cobrar' || c.estado === 'vencido')
}

export function totalSaldo(cobros: Cobro[]): number {
  return deCentavos(pendientes(cobros).reduce((s, c) => s + aCentavos(c.saldo), 0))
}

export function siguienteRecibo(pagos: Pago[]): number {
  return pagos.reduce((m, p) => Math.max(m, p.recibo_numero ?? 0), 0) + 1
}

export function textoEstadoCuenta(nombre: string, cobros: Cobro[], hoy: string): string {
  const lista = pendientes(cobros)
  if (lista.length === 0) return `Hola, ${nombre}. Te confirmo que estás al día con tus pagos. ¡Gracias!`
  const lineas = lista.map((c) => `• ${c.concepto}${c.vence ? `, ${c.vence < hoy ? 'venció' : 'vence'} el ${fechaCorta(c.vence)}` : ''}: ${quetzales(c.saldo)}`)
  return [`Hola, ${nombre}. Te comparto tu estado de cuenta al ${fechaCorta(hoy)}:`, '', ...lineas, '', `Total pendiente: ${quetzales(totalSaldo(lista))}`, '', 'Cualquier duda me escribes. ¡Gracias!'].join('\n')
}

export function numeroWhatsApp(t: string | null): string {
  const d = (t ?? '').replace(/\D/g, '')
  if (d.length === 8) return `502${d}`
  return d
}

export function conceptoDePago(clave: string, cobros: Cobro[]): string {
  const c = cobros.find((x) => x.clave === clave)
  if (c) return c.concepto
  if (clave.startsWith('i:')) return 'Inscripción'
  if (clave.startsWith('a:')) return 'Pago del trabajo'
  if (clave.startsWith('s:')) return 'Salario'
  return 'Pago'
}
