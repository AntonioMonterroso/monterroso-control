import { describe, expect, it } from 'vitest'
import { avisosDev, avisosPorNotificar, refDeUrl, revisarLlavePublica, soloUltimos4, sumarPeriodo, urlSupabase, workflowSupabase, type DevServicio, type DevSupabase, type DevToken } from './desarrollo'

const jwt = (role: string) => `x.${btoa(JSON.stringify({ role })).replace(/=+$/, '')}.y`
const sb = (o: Partial<DevSupabase>): DevSupabase => ({ id: 's', proyecto_id: null, nombre: 'Base', ref: 'abc', plan: 'gratis', anon_key: null, ultimo_uso: null, ...o })
const tk = (o: Partial<DevToken>): DevToken => ({ id: 't', proyecto_id: null, nombre: 'Tok', tipo: 'github', donde: null, ultimos4: 'a1b2', creado_el: null, vence: null, revocar_el: null, revocado: false, revocado_el: null, ...o })
const sv = (o: Partial<DevServicio>): DevServicio => ({ id: 'v', proyecto_id: null, tipo: 'dominio', nombre: 'dominio.com', proveedor: 'Porkbun', renovacion: null, periodo: 'anual', costo: 100, paga: 'yo', categoria_id: null, activo: true, nota: null, ...o })
const vacio = { supabase: [], tokens: [], servicios: [], enlaces: [] }

describe('tokens y llaves', () => {
  it('solo guarda los últimos 4 y avisa si pegan el completo', () => {
    expect(soloUltimos4('ab12')).toEqual({ valor: 'ab12', aviso: null })
    const r = soloUltimos4('sbp_1234567890abcdef')
    expect(r.valor).toBe('cdef')
    expect(r.aviso).toMatch(/no se guardó/)
  })

  it('la llave pública acepta anon y publishable y rechaza las demás', () => {
    expect(revisarLlavePublica(jwt('anon')).aviso).toBeNull()
    expect(revisarLlavePublica('sb_publishable_xyz').aviso).toBeNull()
    expect(revisarLlavePublica(jwt('service_role')).valor).toBe('')
    expect(revisarLlavePublica('sbp_abc').valor).toBe('')
    expect(revisarLlavePublica('sb_secret_abc').valor).toBe('')
    expect(revisarLlavePublica('hola').valor).toBe('')
  })

  it('URL y referencia de Supabase', () => {
    expect(urlSupabase('mrujxfkrvz')).toBe('https://mrujxfkrvz.supabase.co')
    expect(urlSupabase('https://abc.supabase.co/')).toBe('https://abc.supabase.co')
    expect(refDeUrl('https://abc.supabase.co')).toBe('abc')
  })

  it('el workflow usa los secretos y corre cada 3 días', () => {
    const y = workflowSupabase('Mi base')
    expect(y).toContain('*/3')
    expect(y).toContain('secrets.SUPABASE_ANON_KEY')
    expect(y).not.toMatch(/eyJ|sbp_/)
  })
})

describe('avisos de desarrollo', () => {
  it('Supabase gratis avisa a los 5 días y es urgente desde los 7; pro no avisa', () => {
    expect(avisosDev({ ...vacio, supabase: [sb({ ultimo_uso: '2026-11-15' })] }, '2026-11-19')).toHaveLength(0)
    const a5 = avisosDev({ ...vacio, supabase: [sb({ ultimo_uso: '2026-11-14' })] }, '2026-11-19')
    expect(a5[0].nivel).toBe('aviso')
    expect(avisosDev({ ...vacio, supabase: [sb({ ultimo_uso: '2026-11-12' })] }, '2026-11-19')[0].nivel).toBe('peligro')
    expect(avisosDev({ ...vacio, supabase: [sb({ ultimo_uso: '2026-10-01', plan: 'pro' })] }, '2026-11-19')).toHaveLength(0)
  })

  it('tokens: avisa a 14 días, urgente a 3, nada si está revocado', () => {
    expect(avisosDev({ ...vacio, tokens: [tk({ vence: '2026-12-10' })] }, '2026-11-19')).toHaveLength(0)
    expect(avisosDev({ ...vacio, tokens: [tk({ vence: '2026-12-03' })] }, '2026-11-19')[0].nivel).toBe('aviso')
    expect(avisosDev({ ...vacio, tokens: [tk({ revocar_el: '2026-11-21' })] }, '2026-11-19')[0].nivel).toBe('peligro')
    expect(avisosDev({ ...vacio, tokens: [tk({ vence: '2026-11-20', revocado: true })] }, '2026-11-19')).toHaveLength(0)
    expect(avisosDev({ ...vacio, tokens: [tk({ vence: '2026-11-10' })] }, '2026-11-19')[0].detalle).toBe('Venció.')
  })

  it('servicios: avisa a 30 días y urgente a 7', () => {
    expect(avisosDev({ ...vacio, servicios: [sv({ renovacion: '2027-01-01' })] }, '2026-11-19')).toHaveLength(0)
    expect(avisosDev({ ...vacio, servicios: [sv({ renovacion: '2026-12-15' })] }, '2026-11-19')[0].nivel).toBe('aviso')
    expect(avisosDev({ ...vacio, servicios: [sv({ renovacion: '2026-11-25' })] }, '2026-11-19')[0].nivel).toBe('peligro')
    expect(avisosDev({ ...vacio, servicios: [sv({ renovacion: '2026-11-25', activo: false })] }, '2026-11-19')).toHaveLength(0)
  })

  it('ordena lo urgente primero y no repite el mismo aviso el mismo día', () => {
    const l = avisosDev({ ...vacio, servicios: [sv({ id: 'a', renovacion: '2026-12-15' })], tokens: [tk({ vence: '2026-11-20' })] }, '2026-11-19')
    expect(l.map((x) => x.tipo)).toEqual(['token', 'servicio'])
    expect(avisosPorNotificar(l, [l[0].id])).toHaveLength(1)
  })

  it('renovación siguiente', () => {
    expect(sumarPeriodo('2026-01-31', 'mensual')).toBe('2026-02-28')
    expect(sumarPeriodo('2026-11-19', 'anual')).toBe('2027-11-19')
    expect(sumarPeriodo('2026-11-19', 'unico')).toBe('2026-11-19')
  })
})
