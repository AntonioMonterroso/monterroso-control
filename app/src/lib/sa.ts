import { aCentavos, deCentavos } from './dinero'
import { aISO, diasDelMes, diasEntre, partes } from './fechas'

export interface Sociedad {
  id: string
  denominacion: string | null
  nombre_comercial: string | null
  nit: string | null
  escritura_numero: string | null
  escritura_fecha: string | null
  notario: string | null
  rm_numero: string | null
  rm_folio: string | null
  rm_libro: string | null
  patente_empresa: string | null
  patente_sociedad: string | null
  representante: string | null
  representante_cargo: string | null
  nombramiento_fecha: string | null
  nombramiento_vence: string | null
  nombramiento_registro: string | null
  organo_administracion: 'administrador_unico' | 'consejo' | null
  domicilio: string | null
  regimen: 'pequeno' | 'general' | 'utilidades' | null
  inicio_operaciones: string | null
  cierre_mes: number
  capital_autorizado: number
  capital_suscrito: number
}

export interface Socio { id: string; nombre: string; nit: string | null; dpi: string | null; correo: string | null; telefono: string | null; activo: boolean }
export interface Accion { id: string; socio_id: string; serie: string | null; numero_desde: number | null; numero_hasta: number | null; cantidad: number; valor_nominal: number; fecha: string; titulo: string | null; estado: 'vigente' | 'transmitida' | 'anulada'; nota: string | null }
export interface Aporte { id: string; socio_id: string; fecha: string; monto: number; pagado: number; forma: 'efectivo' | 'especie'; descripcion: string | null }
export interface Transmision { id: string; fecha: string; de_socio_id: string; a_socio_id: string; cantidad: number; serie: string | null; precio: number | null; nota: string | null }
export interface Reparto { id: string; desde: string; hasta: string; utilidad: number; isr_sociedad: number; reserva: number; repartido: number; isr_dividendos_tasa: number; fecha_acuerdo: string; isr_pagado_el: string | null; nota: string | null }
export interface RepartoSocio { id: string; reparto_id: string; socio_id: string; acciones: number; porcentaje: number; bruto: number; isr: number; neto: number; pagado_el: string | null; cuenta_id: string | null }
export interface CuentaBanco { id: string; banco: string; numero: string; nombre: string | null; moneda: 'GTQ' | 'USD'; saldo_inicial: number; fecha_saldo: string; activo: boolean }
export interface MovBanco { id: string; cuenta_id: string; fecha: string; tipo: 'ingreso' | 'egreso'; monto: number; descripcion: string; origen: string; origen_id: string | null; referencia: string | null; conciliado: boolean }
export interface Conciliacion { id: string; cuenta_id: string; periodo: string; saldo_banco: number; nota: string | null }
export interface Tramite { id: string; nombre: string; detalle: string | null; estado: 'pendiente' | 'en_proceso' | 'hecho' | 'no_aplica'; fecha: string | null; costo: number; responsable: string | null; archivo: string | null; orden: number; gasto_id: string | null }
export interface Recordatorio { id: string; titulo: string; detalle: string | null; cada: 'mensual' | 'trimestral' | 'anual' | 'unico'; proxima: string; dias_aviso: number; activo: boolean; hecho_el: string | null }

export const TASA_RESERVA = 5
export const TASA_ISR_DIVIDENDOS = 5

export function accionesPorSocio(acciones: Accion[], transmisiones: Transmision[], fecha: string): Map<string, number> {
  const r = new Map<string, number>()
  const sumar = (id: string, n: number) => r.set(id, (r.get(id) ?? 0) + n)
  for (const a of acciones) if (a.estado !== 'anulada' && a.fecha <= fecha) sumar(a.socio_id, a.cantidad)
  for (const t of [...transmisiones].sort((a, b) => a.fecha.localeCompare(b.fecha))) {
    if (t.fecha > fecha) continue
    sumar(t.de_socio_id, -t.cantidad)
    sumar(t.a_socio_id, t.cantidad)
  }
  for (const [k, v] of r) if (v <= 0) r.delete(k)
  return r
}

export function capital(acciones: Accion[], aportes: Aporte[]) {
  const suscrito = acciones.filter((a) => a.estado !== 'anulada').reduce((s, a) => s + Math.round(a.cantidad * aCentavos(a.valor_nominal)), 0)
  const aportado = aportes.reduce((s, a) => s + aCentavos(a.monto), 0)
  const pagado = aportes.reduce((s, a) => s + aCentavos(a.pagado), 0)
  return { suscrito: deCentavos(suscrito), aportado: deCentavos(aportado), pagado: deCentavos(pagado), porPagar: deCentavos(Math.max(0, suscrito - pagado)) }
}

export function reservaLegal(utilidadNeta: number): number {
  return utilidadNeta > 0 ? deCentavos(Math.round((aCentavos(utilidadNeta) * TASA_RESERVA) / 100)) : 0
}

export function distribuible(utilidad: number, isrSociedad: number): { reserva: number; distribuible: number; neta: number } {
  const neta = deCentavos(aCentavos(utilidad) - aCentavos(isrSociedad))
  const reserva = reservaLegal(neta)
  return { neta, reserva, distribuible: deCentavos(Math.max(0, aCentavos(neta) - aCentavos(reserva))) }
}

export interface LineaReparto { socio_id: string; acciones: number; porcentaje: number; bruto: number; isr: number; neto: number }

export function repartirPorAcciones(monto: number, porSocio: Map<string, number>, tasaIsr = TASA_ISR_DIVIDENDOS): LineaReparto[] {
  const total = [...porSocio.values()].reduce((s, n) => s + n, 0)
  if (total <= 0 || monto <= 0) return []
  const c = aCentavos(monto)
  const lineas = [...porSocio.entries()].sort((a, b) => b[1] - a[1]).map(([socio_id, acciones]) => ({ socio_id, acciones, exacto: (c * acciones) / total }))
  const base = lineas.map((l) => Math.floor(l.exacto))
  let resto = c - base.reduce((s, n) => s + n, 0)
  const orden = lineas.map((l, i) => ({ i, f: l.exacto - Math.floor(l.exacto) })).sort((a, b) => b.f - a.f)
  for (const o of orden) { if (resto <= 0) break; base[o.i] += 1; resto -= 1 }
  return lineas.map((l, i) => {
    const isr = Math.round((base[i] * tasaIsr) / 100)
    return { socio_id: l.socio_id, acciones: l.acciones, porcentaje: Math.round((l.acciones / total) * 1e8) / 1e6, bruto: deCentavos(base[i]), isr: deCentavos(isr), neto: deCentavos(base[i] - isr) }
  })
}

export function saldoCuenta(c: CuentaBanco, movs: MovBanco[], hasta?: string): number {
  const propios = movs.filter((m) => m.cuenta_id === c.id && m.fecha >= c.fecha_saldo && (!hasta || m.fecha <= hasta))
  return deCentavos(aCentavos(c.saldo_inicial) + propios.reduce((s, m) => s + (m.tipo === 'ingreso' ? 1 : -1) * aCentavos(m.monto), 0))
}

export function conciliar(c: CuentaBanco, movs: MovBanco[], periodo: string, saldoBanco: number | null) {
  const [a, m] = partes(`${periodo}-01`)
  const fin = aISO(a, m, diasDelMes(a, m))
  const libros = saldoCuenta(c, movs, fin)
  const sinConciliar = movs.filter((x) => x.cuenta_id === c.id && x.fecha <= fin && x.fecha >= c.fecha_saldo && !x.conciliado)
  const transito = deCentavos(sinConciliar.reduce((s, x) => s + (x.tipo === 'ingreso' ? 1 : -1) * aCentavos(x.monto), 0))
  const ajustado = deCentavos(aCentavos(libros) - aCentavos(transito))
  return { fin, libros, transito, ajustado, sinConciliar, diferencia: saldoBanco == null ? null : deCentavos(aCentavos(saldoBanco) - aCentavos(ajustado)) }
}

export function siguienteFecha(f: string, cada: Recordatorio['cada']): string {
  if (cada === 'unico') return f
  const [a, m, d] = partes(f)
  const n = cada === 'mensual' ? 1 : cada === 'trimestral' ? 3 : 12
  const t = a * 12 + (m - 1) + n
  const na = Math.floor(t / 12), nm = (t % 12) + 1
  return aISO(na, nm, Math.min(d, diasDelMes(na, nm)))
}

export function obligacionesComunes(s: Pick<Sociedad, 'regimen' | 'cierre_mes'>, hoy: string): Omit<Recordatorio, 'id'>[] {
  const [a, m] = partes(hoy)
  const finMes = (y: number, mm: number) => aISO(y, mm, diasDelMes(y, mm))
  const sig = m === 12 ? [a + 1, 1] : [a, m + 1]
  const l: Omit<Recordatorio, 'id'>[] = []
  if (s.regimen === 'pequeno') l.push({ titulo: 'Declaración mensual del IVA (pequeño contribuyente)', detalle: 'Formulario de pequeño contribuyente: 5 % de lo facturado del mes anterior.', cada: 'mensual', proxima: finMes(sig[0], sig[1]), dias_aviso: 7, activo: true, hecho_el: null })
  else l.push({ titulo: 'Declaración mensual del IVA', detalle: 'Débito y crédito fiscal del mes anterior.', cada: 'mensual', proxima: finMes(sig[0], sig[1]), dias_aviso: 7, activo: true, hecho_el: null })
  if (s.regimen === 'utilidades' || s.regimen === 'general') {
    const q = Math.ceil(m / 3) * 3
    const [qa, qm] = q === 12 ? [a + 1, 1] : [a, q + 1]
    l.push({ titulo: 'Pago trimestral del ISR', detalle: 'Régimen sobre las utilidades: pago a cuenta del trimestre vencido.', cada: 'trimestral', proxima: finMes(qa, qm), dias_aviso: 10, activo: true, hecho_el: null })
    l.push({ titulo: 'Pago trimestral del ISO', detalle: 'Impuesto de Solidaridad, si aplica a la sociedad.', cada: 'trimestral', proxima: finMes(qa, qm), dias_aviso: 10, activo: true, hecho_el: null })
  }
  const cierre = s.cierre_mes || 12
  const anioCierre = a
  const asambleaM = ((cierre + 4 - 1) % 12) + 1
  const asambleaA = cierre + 4 > 12 ? anioCierre + 1 : anioCierre
  let asamblea = finMes(asambleaA, asambleaM)
  while (asamblea < hoy) asamblea = siguienteFecha(asamblea, 'anual')
  l.push({ titulo: 'Asamblea general ordinaria anual', detalle: 'Dentro de los cuatro meses siguientes al cierre del ejercicio: aprobar estados financieros, utilidades y nombramientos.', cada: 'anual', proxima: asamblea, dias_aviso: 30, activo: true, hecho_el: null })
  const eeffM = cierre === 12 ? 3 : ((cierre + 3 - 1) % 12) + 1
  let eeff = finMes(cierre + 3 > 12 ? a + 1 : a, eeffM)
  while (eeff < hoy) eeff = siguienteFecha(eeff, 'anual')
  l.push({ titulo: 'Declaración anual del ISR y estados financieros', detalle: 'Cierre del ejercicio fiscal con sus estados financieros.', cada: 'anual', proxima: eeff, dias_aviso: 30, activo: true, hecho_el: null })
  l.push({ titulo: 'Actualizar el RTU', detalle: 'Revisar que los datos del RTU estén al día (domicilio, representante, actividades).', cada: 'anual', proxima: aISO(a + 1, 1, 31), dias_aviso: 15, activo: true, hecho_el: null })
  return l
}

export function diasPara(f: string, hoy: string): number {
  return diasEntre(hoy, f)
}

export const TRAMITES_BASE: { nombre: string; detalle: string; orden: number }[] = [
  { nombre: 'Escritura constitutiva ante notario', detalle: 'Denominación, objeto, capital, socios, órgano de administración.', orden: 1 },
  { nombre: 'Inscripción provisional en el Registro Mercantil', detalle: 'Presentar el testimonio de la escritura.', orden: 2 },
  { nombre: 'Publicación del edicto', detalle: 'En el Diario Oficial, después de la inscripción provisional.', orden: 3 },
  { nombre: 'Inscripción definitiva en el Registro Mercantil', detalle: 'Pasado el plazo del edicto sin oposición.', orden: 4 },
  { nombre: 'Patente de comercio de sociedad', detalle: 'Se entrega con la inscripción definitiva.', orden: 5 },
  { nombre: 'Patente de comercio de empresa', detalle: 'Inscripción de la empresa mercantil de la sociedad.', orden: 6 },
  { nombre: 'Nombramiento del representante legal inscrito', detalle: 'Acta de nombramiento inscrita en el Registro Mercantil.', orden: 7 },
  { nombre: 'Inscripción en la SAT: NIT y RTU', detalle: 'Afiliación al régimen y actividades económicas.', orden: 8 },
  { nombre: 'Habilitar libros contables', detalle: 'Libros autorizados por la SAT.', orden: 9 },
  { nombre: 'Facturación electrónica (FEL)', detalle: 'Habilitar el certificador y los tipos de documento.', orden: 10 },
  { nombre: 'Libros de actas y de registro de accionistas', detalle: 'Autorizados en el Registro Mercantil.', orden: 11 },
  { nombre: 'Apertura de la cuenta bancaria de la sociedad', detalle: 'Con el nombramiento y las patentes.', orden: 12 },
  { nombre: 'Inscripción en el IGSS', detalle: 'Solo si la sociedad contrata trabajadores.', orden: 13 },
]

export function avisosSA(recs: Recordatorio[], s: Pick<Sociedad, 'nombramiento_vence' | 'representante'> | null, hoy: string): { id: string; clave: string; nivel: 'peligro' | 'aviso'; tipo: 'recordatorio' | 'sociedad'; titulo: string; detalle: string; dias: number; proyecto_id: null; registro_id: string }[] {
  const r: ReturnType<typeof avisosSA> = []
  for (const x of recs) {
    if (!x.activo) continue
    const d = diasEntre(hoy, x.proxima)
    if (d > x.dias_aviso) continue
    r.push({ id: `rc:${x.id}:${x.proxima}:${d < 0 ? 'v' : d <= 3 ? '3' : 'a'}`, clave: `rc:${x.id}`, nivel: d <= 3 ? 'peligro' : 'aviso', tipo: 'recordatorio', titulo: x.titulo, detalle: d < 0 ? `Venció hace ${-d} ${d === -1 ? 'día' : 'días'}.` : d === 0 ? 'Es hoy.' : `Faltan ${d} ${d === 1 ? 'día' : 'días'}.`, dias: d, proyecto_id: null, registro_id: x.id })
  }
  if (s?.nombramiento_vence) {
    const d = diasEntre(hoy, s.nombramiento_vence)
    if (d <= 60) r.push({ id: `sa:nombramiento:${s.nombramiento_vence}:${d < 0 ? 'v' : d <= 15 ? '15' : '60'}`, clave: 'sa:nombramiento', nivel: d <= 15 ? 'peligro' : 'aviso', tipo: 'sociedad', titulo: 'Nombramiento del representante legal', detalle: d < 0 ? `Venció hace ${-d} días.` : `Vence en ${d} ${d === 1 ? 'día' : 'días'}.`, dias: d, proyecto_id: null, registro_id: 'sa' })
  }
  return r
}
