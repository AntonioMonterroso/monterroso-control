import { supabase } from './supabase'

export const TABLAS = [
  'projects', 'payments',
  'ctl_negocios', 'ctl_cliente_extra', 'ctl_proyecto_extra',
  'ctl_cobros', 'ctl_pagos', 'ctl_pago_extra',
  'ctl_categorias', 'ctl_gastos', 'ctl_gastos_fijos',
  'ctl_presupuestos',
  'ctl_productos', 'ctl_ventas_tienda', 'ctl_salario_aumentos', 'ctl_deudas', 'ctl_deuda_movimientos',
  'ctl_impuesto_modo', 'ctl_facturas',
  'ctl_tarifas', 'ctl_plantillas_contrato', 'ctl_contratos',
  'ctl_mw_areas',
  'ctl_dev_supabase', 'ctl_dev_tokens', 'ctl_dev_servicios', 'ctl_dev_enlaces', 'ctl_dev_bitacora',
  'ctl_tienda_pagos', 'ctl_tienda_pago_partes',
  'ctl_sa', 'ctl_sa_documentos', 'ctl_sa_socios', 'ctl_sa_acciones', 'ctl_sa_aportes', 'ctl_sa_transmisiones', 'ctl_sa_repartos', 'ctl_sa_reparto_socios',
  'ctl_bancos', 'ctl_banco_movimientos', 'ctl_banco_conciliaciones', 'ctl_sa_tramites', 'ctl_recordatorios',
  'ctl_marca', 'ctl_documentos',
] as const

export type Tabla = (typeof TABLAS)[number]
export type Fila = { id: string; creado?: string } & Record<string, unknown>

const NUMERICOS = new Set([
  'amount', 'setup_fee', 'monthly_fee',
  'capital_autorizado', 'capital_suscrito', 'valor_nominal', 'pagado', 'utilidad', 'isr_sociedad', 'reserva', 'repartido', 'isr_dividendos_tasa', 'bruto', 'isr', 'neto', 'porcentaje', 'saldo_banco',
  'monto', 'inscripcion_total', 'mensualidad', 'costo', 'precio', 'envio', 'comision', 'otros', 'precio_venta', 'costo_producto',
  'bruto', 'descuentos', 'total', 'cuota', 'limite', 'saldo_inicial', 'inscripcion', 'cantidad', 'envio_estimado', 'monto_ajustado', 'costo',
])

function normalizar(f: Record<string, unknown>): Fila {
  const r: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(f)) r[k] = typeof v === 'string' && NUMERICOS.has(k) ? Number(v) : v
  return r as Fila
}

export interface Almacen {
  remoto: boolean
  lista(t: Tabla): Promise<Fila[]>
  insertar(t: Tabla, d: Record<string, unknown>[]): Promise<Fila[]>
  actualizar(t: Tabla, id: string, d: Record<string, unknown>): Promise<Fila>
  borrar(t: Tabla, ids: string[]): Promise<void>
  subir(ruta: string, archivo: File): Promise<string>
  url(ruta: string): Promise<string>
  ajustes(): Promise<Record<string, unknown>>
  guardarAjustes(patch: Record<string, unknown>): Promise<Record<string, unknown>>
}

function revisar<T>(r: { data: T | null; error: { message: string; code?: string } | null }): T {
  if (r.error) {
    if (r.error.code === '23505') throw new Error('Ya existe: ese registro está repetido.')
    if (r.error.code === '42P01' || r.error.code === 'PGRST205') throw new Error('Falta crear las tablas de Monterroso Control en la base.')
    if (r.error.code === '23503') throw new Error('No se puede: hay otros registros ligados a este.')
    throw new Error(r.error.message)
  }
  return r.data as T
}

const BUCKET = 'ctl-archivos'

export const almacenSupabase: Almacen = {
  remoto: true,
  async lista(t) {
    const todas: Fila[] = []
    for (let desde = 0; ; desde += 1000) {
      const filas = revisar(await supabase.from(t).select('*').range(desde, desde + 999)) as Record<string, unknown>[]
      todas.push(...filas.map(normalizar))
      if (filas.length < 1000) break
    }
    return todas
  },
  async insertar(t, d) {
    if (!d.length) return []
    return (revisar(await supabase.from(t).insert(d).select()) as Record<string, unknown>[]).map(normalizar)
  },
  async actualizar(t, id, d) {
    return normalizar(revisar(await supabase.from(t).update(d).eq('id', id).select().single()) as Record<string, unknown>)
  },
  async borrar(t, ids) {
    if (!ids.length) return
    revisar(await supabase.from(t).delete().in('id', ids))
  },
  async subir(ruta, archivo) {
    const { data: u } = await supabase.auth.getUser()
    const completa = `${u.user?.id}/${ruta}`
    const { error } = await supabase.storage.from(BUCKET).upload(completa, archivo, { upsert: false, contentType: archivo.type })
    if (error) throw new Error('No se pudo subir el archivo.')
    return completa
  },
  async ajustes() {
    const r = await supabase.from('settings').select('data').maybeSingle()
    if (r.error) throw new Error('No se pudieron leer los ajustes de Monterroso World.')
    return ((r.data as { data?: Record<string, unknown> } | null)?.data ?? {}) as Record<string, unknown>
  },
  async guardarAjustes(patch) {
    const cur = await almacenSupabase.ajustes()
    const data = { ...cur, ...patch }
    const r = await supabase.from('settings').upsert({ data })
    if (r.error) throw new Error('No se pudieron guardar los ajustes de Monterroso World.')
    return data
  },
  async url(ruta) {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(ruta, 600)
    if (error || !data) throw new Error('No se pudo abrir el archivo.')
    return data.signedUrl
  },
}

const LLAVE = 'mc_datos_prueba'
const LLAVE_ARCHIVOS = 'mc_archivos_prueba'
const LLAVE_AJUSTES = 'mc_ajustes_prueba'

type Local = Partial<Record<Tabla, Fila[]>>

function leer(): Local {
  try { return JSON.parse(localStorage.getItem(LLAVE) ?? '{}') as Local } catch { return {} }
}

function escribir(d: Local) {
  localStorage.setItem(LLAVE, JSON.stringify(d))
}

const UNICOS: Partial<Record<Tabla, string[][]>> = {
  ctl_negocios: [['clave']],
  ctl_cliente_extra: [['client_key']],
  ctl_proyecto_extra: [['project_id']],
  ctl_pago_extra: [['payment_id']],
  ctl_cobros: [['clave']],
  ctl_gastos: [['gasto_fijo_id', 'periodo'], ['origen_mw_id'], ['dev_servicio_id', 'periodo']],
  ctl_presupuestos: [['periodo', 'negocio_id', 'categoria_id']],
  ctl_ventas_tienda: [['pedido']],
  ctl_categorias: [['nombre', 'tipo']],
  ctl_salario_aumentos: [['desde']],
  ctl_mw_areas: [['area']],
  ctl_tienda_pago_partes: [['pago_id', 'venta_id']],
  ctl_banco_conciliaciones: [['cuenta_id', 'periodo']],
  ctl_banco_movimientos: [['origen', 'origen_id']],
  ctl_sa_reparto_socios: [['reparto_id', 'socio_id']],
  ctl_documentos: [['tipo', 'anio', 'numero']],
}

function choca(t: Tabla, lista: Fila[], f: Fila): boolean {
  return (UNICOS[t] ?? []).some((cols) => {
    const val = (x: Fila) => cols.map((c) => String(x[c] ?? '').trim().toLowerCase())
    const mio = val(f)
    if (mio.some((v) => v === '' || v === 'null')) return false
    return lista.some((x) => x.id !== f.id && val(x).every((v, i) => v === mio[i]))
  })
}

const copia = <T,>(x: T): T => JSON.parse(JSON.stringify(x)) as T

export const almacenLocal: Almacen = {
  remoto: false,
  async lista(t) {
    return copia(leer()[t] ?? [])
  },
  async insertar(t, d) {
    const todo = leer()
    const lista = todo[t] ?? []
    const nuevas: Fila[] = []
    for (const x of d) {
      const ahora = new Date().toISOString()
      const f = { ...x, id: (x.id as string) ?? crypto.randomUUID(), ...(t === 'projects' || t === 'payments' ? { created_at: ahora, updated_at: ahora } : { creado: ahora }) } as Fila
      if (choca(t, [...lista, ...nuevas], f)) throw new Error('Ya existe: ese registro está repetido.')
      nuevas.push(f)
    }
    todo[t] = [...lista, ...nuevas]
    escribir(todo)
    return copia(nuevas)
  },
  async actualizar(t, id, d) {
    const todo = leer()
    const lista = todo[t] ?? []
    const previo = lista.find((x) => x.id === id)
    if (!previo) throw new Error('Ese registro ya no existe.')
    const f = { ...previo, ...d, id } as Fila
    if (choca(t, lista, f)) throw new Error('Ya existe: ese registro está repetido.')
    todo[t] = lista.map((x) => (x.id === id ? f : x))
    escribir(todo)
    return copia(f)
  },
  async borrar(t, ids) {
    const todo = leer()
    todo[t] = (todo[t] ?? []).filter((x) => !ids.includes(x.id))
    escribir(todo)
  },
  async subir(ruta, archivo) {
    if (archivo.size > 1_500_000) throw new Error('En modo de prueba el archivo debe pesar menos de 1.5 MB.')
    const datos = await new Promise<string>((ok, mal) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.onerror = () => mal(new Error('No se pudo leer el archivo.')); r.readAsDataURL(archivo) })
    const todo = JSON.parse(localStorage.getItem(LLAVE_ARCHIVOS) ?? '{}') as Record<string, string>
    todo[ruta] = datos
    localStorage.setItem(LLAVE_ARCHIVOS, JSON.stringify(todo))
    return ruta
  },
  async ajustes() {
    try { return JSON.parse(localStorage.getItem(LLAVE_AJUSTES) ?? '{}') as Record<string, unknown> } catch { return {} }
  },
  async guardarAjustes(patch) {
    const data = { ...(await almacenLocal.ajustes()), ...patch }
    localStorage.setItem(LLAVE_AJUSTES, JSON.stringify(data))
    return data
  },
  async url(ruta) {
    const todo = JSON.parse(localStorage.getItem(LLAVE_ARCHIVOS) ?? '{}') as Record<string, string>
    if (!todo[ruta]) throw new Error('No se encontró el archivo.')
    return todo[ruta]
  },
}
