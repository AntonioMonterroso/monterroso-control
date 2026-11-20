export type WStatus = 'idea' | 'active' | 'review' | 'delivered' | 'closed'
export type WPayKind = 'setup' | 'monthly' | 'other'

export interface WProject {
  id: string
  title: string
  client: string | null
  status: WStatus
  month: string
  due_date: string | null
  amount: number
  currency: string
  site_url: string | null
  notes: string | null
  checklist: unknown[]
  setup_fee?: number
  monthly_fee?: number
  billing_day?: number | null
  monthly_start?: string | null
  monthly_end?: string | null
  account_id?: string | null
  reminder_event_id?: string | null
  created_at?: string
}

export type WNewProject = Omit<WProject, 'id' | 'created_at'>

export interface WPayment {
  id: string
  project_id: string
  amount: number
  due_date: string | null
  paid_at: string | null
  method: string | null
  note: string | null
  kind?: WPayKind
  period?: string | null
  account_id?: string | null
  created_at?: string
}

export type LogEntry = { id: string; date: string; text: string }
export type ClientExtra = { name?: string; phone?: string; rubro?: string; email?: string; nit?: string; aka?: string[]; log?: LogEntry[]; domains?: unknown[]; hours?: unknown[] }
export type ClientInfo = { name: string; rubro: string; phone: string; email: string; nit: string }
export type AllExtra = Record<string, ClientExtra>

export const clientName = (p: Pick<WProject, 'client' | 'title'>) => (p.client?.trim() || p.title).trim()
export const clientKey = (name: string) => name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()

export const cleanAll = (raw: unknown): AllExtra => {
  if (!raw || typeof raw !== 'object') return {}
  const out: AllExtra = {}
  for (const [k, v] of Object.entries(raw as Record<string, ClientExtra>)) out[k] = { ...(typeof v?.name === 'string' && v.name.trim() ? { name: v.name.slice(0, 200) } : {}), phone: typeof v?.phone === 'string' ? v.phone.slice(0, 30) : undefined, ...(typeof v?.email === 'string' ? { email: v.email.slice(0, 120) } : {}), ...(typeof v?.nit === 'string' ? { nit: v.nit.slice(0, 30) } : {}), ...(Array.isArray(v?.aka) ? { aka: v.aka.filter((a) => typeof a === 'string').slice(0, 20) } : {}), ...(typeof v?.rubro === 'string' ? { rubro: v.rubro.slice(0, 60) } : {}), log: Array.isArray(v?.log) ? v.log.filter((e) => e && typeof e.text === 'string').slice(0, 200) : [], ...(Array.isArray(v?.domains) ? { domains: v.domains.filter((d) => d && typeof (d as { label?: unknown }).label === 'string').slice(0, 20) } : {}), ...(Array.isArray(v?.hours) ? { hours: v.hours.filter((h) => h && typeof (h as { projectId?: unknown }).projectId === 'string' && typeof (h as { min?: unknown }).min === 'number').slice(-500) } : {}) }
  return out
}

const clean = (v: string, n: number) => v.trim().slice(0, n) || undefined

export function conClienteCreado(raw: unknown, key: string, info: ClientInfo): AllExtra {
  const all = cleanAll(raw)
  const cur = all[key] ?? {}
  all[key] = { ...cur, name: clean(info.name, 200), rubro: clean(info.rubro, 60), phone: clean(info.phone, 30), email: clean(info.email, 120), nit: clean(info.nit, 30) }
  return all
}

export function conInfoCambiada(raw: unknown, key: string, info: ClientInfo, newKey: string): AllExtra {
  const all = cleanAll(raw)
  const cur = all[key] ?? {}
  const next: AllExtra = { ...all }
  const merged: ClientExtra = { ...(next[newKey] ?? {}), ...cur, name: clean(info.name, 200), rubro: clean(info.rubro, 60), phone: clean(info.phone, 30), email: clean(info.email, 120), nit: clean(info.nit, 30) }
  if (newKey !== key) { delete next[key]; merged.aka = [...new Set([...(cur.aka ?? []), key])].filter((a) => a !== newKey) }
  next[newKey] = merged
  return next
}

export function nuevoTrabajo(o: { title: string; client: string; month: string }): WNewProject {
  return { title: o.title, client: o.client.trim() || null, status: 'active', month: o.month, due_date: null, amount: 0, currency: 'GTQ', site_url: null, notes: null, checklist: [], setup_fee: 0, monthly_fee: 0, billing_day: null, monthly_start: null, monthly_end: null, account_id: null }
}

export function clavesDeClientes(projects: Pick<WProject, 'client' | 'title'>[], extra: AllExtra): Map<string, string> {
  const m = new Map<string, string>()
  for (const p of projects) { const n = clientName(p); const k = clientKey(n); if (!m.has(k)) m.set(k, n) }
  for (const [k, v] of Object.entries(extra)) if (v.name && !m.has(k)) m.set(k, v.name)
  return m
}

export function claveVigente(key: string, extra: AllExtra): string {
  if (extra[key]) return key
  for (const [k, v] of Object.entries(extra)) if (v.aka?.includes(key)) return k
  return key
}
