import { describe, expect, it } from 'vitest'
import { claveDePago, clientesDeWorld, filasARenombrar, pagoDeWorld, proyectoAWorld, proyectoDeWorld, proyectosDelCliente, type DatosProyecto } from './puente'
import { claveVigente, cleanAll, clientKey, clientName, conClienteCreado, conInfoCambiada, nuevoTrabajo, type WPayment, type WProject } from './world'

const w = (o: Partial<WProject>): WProject => ({ id: 'p1', title: 'Página', client: 'Panadería Sol', status: 'active', month: '2026-11', due_date: null, amount: 0, currency: 'GTQ', site_url: null, notes: null, checklist: [], setup_fee: 0, monthly_fee: 0, billing_day: null, monthly_start: null, monthly_end: null, account_id: null, ...o })

describe('clientes con la forma de Monterroso World', () => {
  it('la llave es la misma que usa World', () => {
    expect(clientKey('  Panadería   Sól ')).toBe('panaderia sol')
    expect(clientName({ client: null, title: 'Tienda X' })).toBe('Tienda X')
  })

  it('crear un cliente deja en clientExtra exactamente lo que guarda World', () => {
    const all = conClienteCreado({ otro: { name: 'Otro', phone: '1' } }, 'panaderia sol', { name: 'Panadería Sol', rubro: ' Panadería ', phone: '5555 1234', email: '', nit: 'CF' })
    expect(all['panaderia sol']).toEqual({ name: 'Panadería Sol', rubro: 'Panadería', phone: '5555 1234', email: undefined, nit: 'CF' })
    expect(cleanAll(all)['panaderia sol']).toMatchObject({ name: 'Panadería Sol', phone: '5555 1234', log: [] })
    expect(all.otro).toMatchObject({ name: 'Otro' })
  })

  it('crear el mismo cliente dos veces no lo duplica', () => {
    const a = conClienteCreado({}, 'panaderia sol', { name: 'Panadería Sol', rubro: '', phone: '', email: '', nit: '' })
    const b = conClienteCreado(a, 'panaderia sol', { name: 'Panadería Sol', rubro: 'Pan', phone: '', email: '', nit: '' })
    expect(Object.keys(b)).toEqual(['panaderia sol'])
    const lista = clientesDeWorld([w({}), w({ id: 'p2', title: 'Otro trabajo', client: null })], b, [], 'dev')
    expect(lista.map((c) => c.id)).toEqual(['otro trabajo', 'panaderia sol'])
  })

  it('renombrar mueve los datos a la llave nueva y guarda la vieja en aka', () => {
    const antes = { 'panaderia sol': { name: 'Panadería Sol', phone: '5555 1234', log: [{ id: '1', date: '2026-11-01', text: 'nota' }] } }
    const despues = conInfoCambiada(antes, 'panaderia sol', { name: 'Pan Sol', rubro: '', phone: '5555 1234', email: '', nit: '' }, 'pan sol')
    expect(despues['panaderia sol']).toBeUndefined()
    expect(despues['pan sol']).toMatchObject({ name: 'Pan Sol', phone: '5555 1234', aka: ['panaderia sol'] })
    expect(despues['pan sol'].log).toHaveLength(1)
    expect(claveVigente('panaderia sol', despues)).toBe('pan sol')
  })

  it('al renombrar se ubican todos sus trabajos y todo lo de Control ligado a la llave vieja', () => {
    const ps = [w({}), w({ id: 'p2', client: 'panaderia SOL' }), w({ id: 'p3', client: 'Otro' })]
    expect(proyectosDelCliente(ps, 'panaderia sol').map((p) => p.id)).toEqual(['p1', 'p2'])
    expect(filasARenombrar([{ id: 'g1', cliente_id: 'panaderia sol' }, { id: 'g2', cliente_id: 'otro' }], 'cliente_id', 'panaderia sol')).toEqual(['g1'])
  })
})

describe('proyectos y pagos con la forma de Monterroso World', () => {
  const datos: DatosProyecto = { nombre: 'Tienda en línea', clienteNombre: 'Panadería Sol', descripcion: null, estado: 'en_curso', fecha_entrega: '2026-12-15', inscripcion_total: 2000, mensualidad: 350, dia_cobro: 31, mensualidad_inicio: '2026-12-01', mensualidad_fin: null, monto_unico: 0 }

  it('un proyecto nuevo tiene todas las columnas que World pone al crear un trabajo', () => {
    const fila = proyectoAWorld(datos, null, '2026-11')
    const base = nuevoTrabajo({ title: 'Tienda en línea', client: 'Panadería Sol', month: '2026-12' })
    for (const k of Object.keys(base)) expect(fila).toHaveProperty(k)
    expect(fila).toMatchObject({ title: 'Tienda en línea', client: 'Panadería Sol', status: 'active', month: '2026-12', currency: 'GTQ', setup_fee: 2000, monthly_fee: 350, billing_day: 28, monthly_start: '2026-12', monthly_end: null, due_date: '2026-12-15', checklist: [] })
  })

  it('editar no toca el mes, la moneda ni la lista de tareas, y respeta «en revisión»', () => {
    const fila = proyectoAWorld({ ...datos, estado: 'en_curso' }, w({ status: 'review' }), '2026-11')
    expect(fila.status).toBe('review')
    expect(fila).not.toHaveProperty('month')
    expect(fila).not.toHaveProperty('checklist')
  })

  it('ida y vuelta: lo que World guarda se lee igual en Control', () => {
    const p = proyectoDeWorld(w({ setup_fee: 2000, monthly_fee: 350, billing_day: 10, monthly_start: '2026-12', monthly_end: '2027-02', status: 'idea' }))
    expect(p).toMatchObject({ cliente_id: 'panaderia sol', estado: 'propuesta', inscripcion_total: 2000, inscripcion_forma: 'completa', mensualidad: 350, dia_cobro: 10, mensualidad_inicio: '2026-12-01', mensualidad_fin: '2027-02-28' })
    expect(p.partes.map((x) => x.monto)).toEqual([2000])
  })

  it('las partes de Control se usan solo si suman lo que World tiene de inscripción', () => {
    const partes = [{ id: 'a', orden: 1, concepto: 'A', momento: 'firma' as const, fecha: null, monto: 1000 }, { id: 'b', orden: 2, concepto: 'B', momento: 'entrega' as const, fecha: null, monto: 1000 }]
    const x = { id: 'x', project_id: 'p1', inscripcion_forma: 'mitad' as const, partes, fecha_firma: '2026-11-02', notas_tecnicas: null }
    expect(proyectoDeWorld(w({ setup_fee: 2000 }), x).partes).toHaveLength(2)
    expect(proyectoDeWorld(w({ setup_fee: 2500 }), x).partes.map((p) => p.monto)).toEqual([2500])
  })

  it('los pagos de World se leen como pagos de Control y los pendientes no cuentan', () => {
    const pay = (o: Partial<WPayment>): WPayment => ({ id: 'y', project_id: 'p1', amount: 350, due_date: null, paid_at: '2026-11-05', method: 'Banco', note: null, kind: 'monthly', period: '2026-11', ...o })
    expect(claveDePago(pay({}))).toBe('m:p1:2026-11')
    expect(claveDePago(pay({ kind: 'setup', period: null }))).toBe('i:p1')
    expect(claveDePago(pay({ kind: 'other', period: null }))).toBe('a:p1')
    const m = new Map([['p1', w({})]])
    expect(pagoDeWorld(pay({}), m, { id: 'e', payment_id: 'y', recibo_numero: 7, referencia: '123' })).toMatchObject({ cliente_id: 'panaderia sol', monto: 350, cuenta: 'Banco', recibo_numero: 7, referencia: '123', origen: 'world' })
    expect(pagoDeWorld(pay({ paid_at: null }), m)).toBeNull()
  })
})
