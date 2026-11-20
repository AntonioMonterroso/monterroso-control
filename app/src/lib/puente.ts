import { formaDeTexto } from './pagosDestino'
import { diasDelMes } from './fechas'
import { partesDeForma } from './inscripcion'
import type { Cliente, EstadoProyecto, FormaInscripcion, Pago, ParteInscripcion, Proyecto } from './tipos'
import { cleanAll, clientKey, clientName, type AllExtra, type WNewProject, type WPayment, type WProject, type WStatus } from './world'

export interface ExtraProyecto { id: string; project_id: string; inscripcion_forma: FormaInscripcion | null; partes: ParteInscripcion[]; fecha_firma: string | null; notas_tecnicas: string | null }
export interface ExtraCliente { id: string; client_key: string; direccion: string | null; notas: string | null; activo: boolean; archivado?: boolean }
export interface ExtraPago { id: string; payment_id: string; recibo_numero: number | null; referencia: string | null; forma?: string | null; destino?: string | null; comprobantes?: string[] | null; anticipo_id?: string | null; registrado_por?: string | null }

const DE_WORLD: Record<WStatus, EstadoProyecto> = { idea: 'propuesta', active: 'en_curso', review: 'en_curso', delivered: 'entregado', closed: 'cerrado' }

export function estadoAWorld(e: EstadoProyecto, previo?: string): WStatus {
  if (e === 'propuesta') return 'idea'
  if (e === 'en_curso') return previo === 'review' ? 'review' : 'active'
  if (e === 'entregado') return 'delivered'
  return 'closed'
}

const sumaC = (l: ParteInscripcion[]) => l.reduce((s, p) => s + Math.round(p.monto * 100), 0)

export function proyectoDeWorld(w: WProject, x?: ExtraProyecto): Proyecto {
  const setup = Number(w.setup_fee ?? 0)
  const mensual = Number(w.monthly_fee ?? 0)
  const guardadas = (x?.partes ?? []).map((p, i) => ({ ...p, orden: i + 1, monto: Number(p.monto) }))
  const cuadra = guardadas.length > 0 && sumaC(guardadas) === Math.round(setup * 100)
  const forma: FormaInscripcion | null = setup > 0 ? (cuadra ? x?.inscripcion_forma ?? 'personalizada' : 'completa') : null
  const partes = setup > 0 ? (cuadra ? guardadas : partesDeForma(setup, 'completa').map((p) => ({ ...p, id: 'u1' }))) : []
  const [fa, fm] = (w.monthly_end ?? '').split('-').map(Number)
  return {
    id: w.id,
    cliente_id: clientKey(clientName(w)),
    nombre: w.title,
    descripcion: w.notes,
    estado: DE_WORLD[w.status] ?? 'en_curso',
    fecha_firma: x?.fecha_firma ?? null,
    fecha_entrega: w.due_date,
    inscripcion_total: setup,
    inscripcion_forma: forma,
    mensualidad: mensual,
    dia_cobro: mensual > 0 ? w.billing_day ?? 1 : w.billing_day ?? null,
    mensualidad_inicio: w.monthly_start ? `${w.monthly_start}-01` : null,
    mensualidad_fin: w.monthly_end ? `${w.monthly_end}-${String(diasDelMes(fa, fm)).padStart(2, '0')}` : null,
    notas_tecnicas: x?.notas_tecnicas ?? null,
    creado: w.created_at ?? `${w.month}-01`,
    partes,
    monto_unico: Number(w.amount ?? 0),
    mes: w.month,
    sitio: w.site_url,
    world_status: w.status,
  }
}

export interface DatosProyecto {
  nombre: string
  clienteNombre: string
  descripcion: string | null
  estado: EstadoProyecto
  fecha_entrega: string | null
  inscripcion_total: number
  mensualidad: number
  dia_cobro: number | null
  mensualidad_inicio: string | null
  mensualidad_fin: string | null
  monto_unico: number
}

export function proyectoAWorld(d: DatosProyecto, previo: WProject | null, hoyMes: string): Partial<WNewProject> {
  const inicio = d.mensualidad > 0 && d.mensualidad_inicio ? d.mensualidad_inicio.slice(0, 7) : null
  const fila: Partial<WNewProject> = {
    title: d.nombre.trim().slice(0, 200),
    client: d.clienteNombre.trim().slice(0, 200) || null,
    status: estadoAWorld(d.estado, previo?.status),
    due_date: d.fecha_entrega,
    notes: d.descripcion ? d.descripcion.slice(0, 4000) : null,
    amount: d.monto_unico,
    setup_fee: d.inscripcion_total,
    monthly_fee: d.mensualidad,
    billing_day: d.mensualidad > 0 && d.dia_cobro ? Math.min(28, Math.max(1, d.dia_cobro)) : null,
    monthly_start: inicio,
    monthly_end: d.mensualidad > 0 && d.mensualidad_fin ? d.mensualidad_fin.slice(0, 7) : null,
  }
  if (!previo) Object.assign(fila, { month: inicio ?? hoyMes, currency: 'GTQ', site_url: null, checklist: [], account_id: null })
  return fila
}

export function claveDePago(p: WPayment): string {
  if (p.kind === 'setup') return `i:${p.project_id}`
  if (p.kind === 'monthly' && p.period) return `m:${p.project_id}:${p.period}`
  return `a:${p.project_id}`
}

export function pagoDeWorld(p: WPayment, proyectos: Map<string, WProject>, x?: ExtraPago): Pago | null {
  if (!p.paid_at) return null
  const w = proyectos.get(p.project_id)
  return {
    id: p.id,
    cliente_id: w ? clientKey(clientName(w)) : null,
    cobro_clave: claveDePago(p),
    fecha: p.paid_at,
    monto: Number(p.amount),
    cuenta: p.method || 'Sin anotar',
    referencia: x?.referencia ?? null,
    nota: p.note,
    recibo_numero: x?.recibo_numero ?? null,
    creado: p.created_at ?? p.paid_at,
    origen: 'world',
    forma: x?.forma ?? formaDeTexto(p.method),
    destino: x?.destino ?? (p.account_id ? `w:${p.account_id}` : null),
    comprobantes: Array.isArray(x?.comprobantes) ? x!.comprobantes! : [],
    anticipo_id: x?.anticipo_id ?? null,
    registrado_por: x?.registrado_por ?? null,
    proyecto_id: p.project_id,
    extra_id: x?.id ?? null,
  }
}

export function clientesDeWorld(projects: WProject[], rawExtra: unknown, extras: ExtraCliente[], negocioDev: string): Cliente[] {
  const extra: AllExtra = cleanAll(rawExtra)
  const nombres = new Map<string, string>()
  for (const p of projects) { const n = clientName(p); const k = clientKey(n); if (!nombres.has(k)) nombres.set(k, n) }
  for (const [k, v] of Object.entries(extra)) if (v.name && !nombres.has(k)) nombres.set(k, v.name)
  return [...nombres.entries()].map(([k, n]) => {
    const e = extra[k] ?? {}
    const c = extras.find((x) => x.client_key === k)
    return {
      id: k,
      negocio_id: negocioDev,
      nombre: e.name ?? n,
      rubro: e.rubro ?? null,
      whatsapp: e.phone ?? null,
      correo: e.email ?? null,
      nit: e.nit ?? null,
      direccion: c?.direccion ?? null,
      regimen: null,
      notas: c?.notas ?? null,
      activo: c?.activo ?? true,
      creado: '',
      aka: e.aka ?? [],
      archivado: c?.archivado ?? false,
    }
  }).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
}

export function filasARenombrar<T extends { id: string }>(filas: T[], campo: keyof T, viejo: string): string[] {
  return filas.filter((f) => f[campo] === viejo).map((f) => f.id)
}

export function proyectosDelCliente(projects: WProject[], key: string): WProject[] {
  return projects.filter((p) => clientKey(clientName(p)) === key)
}
