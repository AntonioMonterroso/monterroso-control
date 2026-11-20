import { diasEntre } from './fechas'

export type PlanSupabase = 'gratis' | 'pro'
export type TipoToken = 'supabase' | 'github' | 'ia' | 'otro'
export type TipoServicio = 'dominio' | 'hosting' | 'suscripcion' | 'otro'
export type Periodo = 'mensual' | 'anual' | 'unico'
export type TipoEnlace = 'repo' | 'pagina' | 'supabase' | 'vercel' | 'pages' | 'otro'

export interface DevSupabase {
  id: string
  proyecto_id: string | null
  nombre: string
  ref: string
  plan: PlanSupabase
  anon_key: string | null
  ultimo_uso: string | null
  creado?: string
}

export interface DevToken {
  id: string
  proyecto_id: string | null
  nombre: string
  tipo: TipoToken
  donde: string | null
  ultimos4: string | null
  creado_el: string | null
  vence: string | null
  revocar_el: string | null
  revocado: boolean
  revocado_el: string | null
}

export interface DevServicio {
  id: string
  proyecto_id: string | null
  tipo: TipoServicio
  nombre: string
  proveedor: string | null
  renovacion: string | null
  periodo: Periodo
  costo: number
  paga: 'cliente' | 'yo'
  categoria_id: string | null
  activo: boolean
  nota: string | null
}

export interface DevEnlace {
  id: string
  proyecto_id: string | null
  tipo: TipoEnlace
  nombre: string
  url: string
  revisado_en: string | null
  responde: boolean | null
}

export interface DevBitacora {
  id: string
  proyecto_id: string
  fecha: string
  cambio: string
  version: string | null
}

export const TIPOS_TOKEN: { valor: TipoToken; nombre: string }[] = [
  { valor: 'supabase', nombre: 'Supabase (sbp_)' },
  { valor: 'github', nombre: 'GitHub' },
  { valor: 'ia', nombre: 'API de IA' },
  { valor: 'otro', nombre: 'Otro' },
]

export const TIPOS_SERVICIO: { valor: TipoServicio; nombre: string }[] = [
  { valor: 'dominio', nombre: 'Dominio' },
  { valor: 'hosting', nombre: 'Hosting' },
  { valor: 'suscripcion', nombre: 'Suscripción' },
  { valor: 'otro', nombre: 'Otro' },
]

export const TIPOS_ENLACE: { valor: TipoEnlace; nombre: string }[] = [
  { valor: 'repo', nombre: 'Repositorio' },
  { valor: 'pagina', nombre: 'Página publicada' },
  { valor: 'supabase', nombre: 'Panel de Supabase' },
  { valor: 'vercel', nombre: 'Vercel' },
  { valor: 'pages', nombre: 'GitHub Pages' },
  { valor: 'otro', nombre: 'Otro' },
]

export function soloUltimos4(texto: string): { valor: string; aviso: string | null } {
  const limpio = texto.replace(/\s+/g, '')
  if (limpio.length <= 4) return { valor: limpio, aviso: null }
  return { valor: limpio.slice(-4), aviso: 'Pegaste el valor completo: solo se guardan los últimos 4 caracteres. El token no se guardó.' }
}

function rolJwt(k: string): string | null {
  const p = k.split('.')
  if (p.length !== 3) return null
  try {
    const b = p[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = JSON.parse(atob(b + '='.repeat((4 - (b.length % 4)) % 4))) as { role?: string }
    return json.role ?? null
  } catch { return null }
}

export function revisarLlavePublica(k: string): { valor: string; aviso: string | null } {
  const v = k.trim()
  if (!v) return { valor: '', aviso: null }
  if (/^sbp_/i.test(v)) return { valor: '', aviso: 'Eso es un token de acceso (sbp_): no se guarda aquí. Revócalo si lo compartiste.' }
  if (/^sb_secret_/i.test(v)) return { valor: '', aviso: 'Esa es una llave secreta: no se guarda. Solo va la llave pública (anon o publishable).' }
  const rol = rolJwt(v)
  if (rol && rol !== 'anon') return { valor: '', aviso: 'Esa llave no es la pública (anon): no se guarda.' }
  if (!rol && !/^sb_publishable_/i.test(v)) return { valor: '', aviso: 'No parece una llave pública de Supabase: no se guardó.' }
  return { valor: v, aviso: null }
}

export function urlSupabase(ref: string): string {
  const r = ref.trim().replace(/\/+$/, '')
  if (/^https?:\/\//i.test(r)) return r
  return `https://${r}.supabase.co`
}

export function refDeUrl(ref: string): string {
  const m = ref.match(/https?:\/\/([a-z0-9]+)\.supabase\.co/i)
  return m ? m[1] : ref.trim()
}

export function panelSupabase(ref: string): string {
  return `https://supabase.com/dashboard/project/${refDeUrl(ref)}`
}

export function sumarPeriodo(fecha: string, p: Periodo): string {
  if (p === 'unico') return fecha
  const [a, m, d] = fecha.split('-').map(Number)
  const t = a * 12 + (m - 1) + (p === 'mensual' ? 1 : 12)
  const na = Math.floor(t / 12), nm = (t % 12) + 1
  const ult = new Date(na, nm, 0).getDate()
  return `${na}-${String(nm).padStart(2, '0')}-${String(Math.min(d, ult)).padStart(2, '0')}`
}

export type Nivel = 'peligro' | 'aviso'

export interface AvisoDev {
  id: string
  clave: string
  nivel: Nivel
  tipo: 'supabase' | 'token' | 'servicio' | 'enlace'
  titulo: string
  detalle: string
  dias: number
  proyecto_id: string | null
  registro_id: string
}

const plural = (n: number, s: string, p: string) => `${n} ${n === 1 ? s : p}`

export function avisosDev(d: { supabase: DevSupabase[]; tokens: DevToken[]; servicios: DevServicio[]; enlaces: DevEnlace[] }, hoy: string): AvisoDev[] {
  const r: AvisoDev[] = []
  for (const s of d.supabase) {
    if (s.plan !== 'gratis') continue
    const base = (s.ultimo_uso ?? s.creado ?? '').slice(0, 10)
    if (!base) continue
    const dias = diasEntre(base, hoy)
    if (dias < 5) continue
    const nivel: Nivel = dias >= 7 ? 'peligro' : 'aviso'
    r.push({ id: `sb:${s.id}:${nivel}`, clave: `sb:${s.id}`, nivel, tipo: 'supabase', titulo: `Supabase «${s.nombre}» sin actividad`, detalle: dias >= 7 ? `${plural(dias, 'día', 'días')} sin uso: el plan gratis ya puede estar en pausa.` : `${plural(dias, 'día', 'días')} sin uso: se pausa a los 7.`, dias: 7 - dias, proyecto_id: s.proyecto_id, registro_id: s.id })
  }
  for (const t of d.tokens) {
    if (t.revocado) continue
    const fechas = [t.vence ? ['vence', t.vence] : null, t.revocar_el ? ['revocar', t.revocar_el] : null].filter(Boolean) as [string, string][]
    if (!fechas.length) continue
    const [que, f] = fechas.sort((a, b) => a[1].localeCompare(b[1]))[0]
    const dias = diasEntre(hoy, f)
    if (dias > 14) continue
    const nivel: Nivel = dias <= 3 ? 'peligro' : 'aviso'
    const umbral = dias < 0 ? 'pasado' : dias <= 3 ? '3' : '14'
    const accion = que === 'vence' ? (dias < 0 ? 'venció' : dias === 0 ? 'vence hoy' : `vence en ${plural(dias, 'día', 'días')}`) : (dias < 0 ? 'ya tocaba revocarlo' : dias === 0 ? 'revócalo hoy' : `revocarlo en ${plural(dias, 'día', 'días')}`)
    r.push({ id: `tk:${t.id}:${umbral}`, clave: `tk:${t.id}`, nivel, tipo: 'token', titulo: `Token «${t.nombre}»${t.ultimos4 ? ` ···${t.ultimos4}` : ''}`, detalle: `${accion[0].toUpperCase()}${accion.slice(1)}.`, dias, proyecto_id: t.proyecto_id, registro_id: t.id })
  }
  for (const s of d.servicios) {
    if (!s.activo || !s.renovacion) continue
    const dias = diasEntre(hoy, s.renovacion)
    if (dias > 30) continue
    const nivel: Nivel = dias <= 7 ? 'peligro' : 'aviso'
    const umbral = dias < 0 ? 'pasado' : dias <= 7 ? '7' : '30'
    r.push({ id: `sv:${s.id}:${s.renovacion}:${umbral}`, clave: `sv:${s.id}`, nivel, tipo: 'servicio', titulo: `${s.nombre}${s.proveedor ? ` (${s.proveedor})` : ''}`, detalle: dias < 0 ? `La renovación era hace ${plural(-dias, 'día', 'días')}.` : dias === 0 ? 'Se renueva hoy.' : `Se renueva en ${plural(dias, 'día', 'días')}.`, dias, proyecto_id: s.proyecto_id, registro_id: s.id })
  }
  for (const e of d.enlaces) {
    if (e.responde !== false) continue
    r.push({ id: `en:${e.id}:${(e.revisado_en ?? '').slice(0, 10)}`, clave: `en:${e.id}`, nivel: 'peligro', tipo: 'enlace', titulo: `${e.nombre} no respondió`, detalle: 'La última revisión no tuvo respuesta.', dias: 0, proyecto_id: e.proyecto_id, registro_id: e.id })
  }
  return r.sort((a, b) => (a.nivel === b.nivel ? a.dias - b.dias : a.nivel === 'peligro' ? -1 : 1))
}

export function avisosPorNotificar(avisos: AvisoDev[], yaHoy: string[]): AvisoDev[] {
  const ya = new Set(yaHoy)
  return avisos.filter((a) => !ya.has(a.id))
}

export function workflowSupabase(nombre: string): string {
  return [
    `name: Mantener Supabase activo (${nombre.replace(/[^\w .-]/g, '')})`,
    '',
    'on:',
    '  schedule:',
    '    - cron: "17 13 */3 * *"',
    '  workflow_dispatch:',
    '',
    'jobs:',
    '  consulta:',
    '    runs-on: ubuntu-latest',
    '    steps:',
    '      - name: Consulta liviana a la API',
    '        env:',
    '          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}',
    '          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}',
    '        run: |',
    '          codigo=$(curl -sS -o /dev/null -w "%{http_code}" "$SUPABASE_URL/rest/v1/" -H "apikey: $SUPABASE_ANON_KEY" -H "Authorization: Bearer $SUPABASE_ANON_KEY")',
    '          echo "Supabase respondió $codigo"',
    '          test "$codigo" -lt 500',
    '',
  ].join('\n')
}
