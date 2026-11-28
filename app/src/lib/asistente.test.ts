import { describe, expect, it } from 'vitest'
import { buscarClientes, contextoAnotar, contextoPreguntas, estadoTope, leerHallazgos, leerPropuesta, leerRespuesta, negocioDeRuta, resumenDelMes, rutaDe, tareaDe, textoRevision, usd, type PropuestaCruda } from './asistente'
import type { Cobro } from './cobros'
import type { EntradaDinero } from './entradas'
import type { Modelo } from './modelo'
import type { Cliente, Pago } from './tipos'

const cliente = (id: string, nombre: string, negocio_id = 'n-dev'): Cliente => ({ id, negocio_id, nombre, rubro: null, whatsapp: null, correo: null, nit: null, direccion: null, regimen: null, notas: null, activo: true, creado: '2026-01-01' })
const pago = (id: string, cliente_id: string, fecha: string, monto: number, extra: Partial<Pago> = {}): Pago => ({ id, cliente_id, cobro_clave: `m:p1:${fecha.slice(0, 7)}`, fecha, monto, cuenta: '', referencia: null, nota: null, recibo_numero: null, creado: fecha, forma: 'transferencia', destino: 'p:1', comprobantes: [], anticipo_id: null, registrado_por: null, proyecto_id: 'p1', ...extra })
const cobro = (clave: string, cliente_id: string, saldo: number, estado: Cobro['estado'] = 'por_cobrar', vence = '2026-11-05'): Cobro => ({ clave, cliente_id, proyecto_id: 'p1', tipo: 'mensualidad', concepto: `Mensualidad ${clave}`, vence, monto: saldo, pagado: 0, saldo, estado, guardado: null })

function modelo(x: Partial<Modelo> = {}): Modelo {
  const base = {
    negocios: [{ id: 'n-dev', clave: 'dev', nombre: 'Monterroso Dev Studio', descripcion: null, activo: true, orden: 1 }, { id: 'n-mus', clave: 'musica', nombre: 'Música', descripcion: null, activo: true, orden: 4 }],
    categorias: [{ id: 'c-int', nombre: 'Internet', tipo: 'gasto', clave: null, activo: true, orden: 1 }, { id: 'c-men', nombre: 'Mensualidad', tipo: 'ingreso', clave: 'mensualidad', activo: true, orden: 1 }],
    clientes: [cliente('daniel-lopez', 'Daniel López'), cliente('daniel-ruiz', 'Daniel Ruiz', 'n-mus'), cliente('ana', 'Ana Pérez')],
    pagos: [], ventas: [], gastos: [], movimientos: [], deudas: [], gastosFijos: [], anticipos: [],
  }
  return { ...base, ...x } as unknown as Modelo
}

const cruda = (x: Partial<PropuestaCruda>): PropuestaCruda => ({ tipo: 'pago', cliente_dicho: '', cliente_id: '', cobro_clave: '', monto: 850, fecha: '2026-11-20', forma: 'transferencia', destino: 'p:1', negocio_clave: '', categoria_id: '', descripcion: '', nota: '', ...x })

describe('dónde está el asistente', () => {
  it('saca el negocio de la ruta sin confundir salario con la S.A.', () => {
    expect(negocioDeRuta('/dev/cobros')).toBe('dev')
    expect(negocioDeRuta('/musica')).toBe('musica')
    expect(negocioDeRuta('/tienda/pedidos')).toBe('canela')
    expect(negocioDeRuta('/salario/gastos')).toBe('salario')
    expect(negocioDeRuta('/sa/socios')).toBe('sa')
    expect(negocioDeRuta('/sa')).toBe('sa')
    expect(negocioDeRuta('/clientes/ana')).toBe('todos')
    expect(negocioDeRuta('/')).toBe('todos')
    expect(negocioDeRuta('/devoluciones')).toBe('todos')
  })
  it('lleva cada hallazgo a su pantalla', () => {
    expect(rutaDe('musica', 'pagos')).toBe('/musica/pagos')
    expect(rutaDe('canela', 'pagos')).toBe('/tienda/recibidos')
    expect(rutaDe('todos', 'gastos')).toBe('/gastos')
    expect(rutaDe('dev', 'cliente', 'daniel lópez')).toBe('/clientes/daniel%20l%C3%B3pez')
    expect(rutaDe('dev', 'cliente', '')).toBeNull()
    expect(rutaDe('dev', 'ninguna')).toBeNull()
  })
})

describe('qué quiere hacer', () => {
  it('separa anotar de preguntar', () => {
    expect(tareaDe('me pagó Daniel Q850 de la mensualidad')).toBe('anotar')
    expect(tareaDe('pagué Q120 de internet')).toBe('anotar')
    expect(tareaDe('gasté 300 en gasolina')).toBe('anotar')
    expect(tareaDe('¿cuánto gané en octubre con Música?')).toBe('preguntar')
    expect(tareaDe('quién me debe más')).toBe('preguntar')
    expect(tareaDe('hola')).toBe('preguntar')
  })
})

describe('clientes sin inventar', () => {
  const m = modelo()
  it('encuentra por nombre parcial y sin tildes', () => {
    expect(buscarClientes('ana perez', m.clientes).map((c) => c.id)).toEqual(['ana'])
    expect(buscarClientes('Daniel', m.clientes).map((c) => c.id)).toEqual(['daniel-lopez', 'daniel-ruiz'])
    expect(buscarClientes('Pedro', m.clientes)).toEqual([])
  })
  it('pregunta cuál cuando el nombre es de dos clientes', () => {
    const r = leerPropuesta(cruda({ cliente_dicho: 'Daniel', cliente_id: 'daniel-lopez' }), m, [cobro('m:p1:2026-11', 'daniel-lopez', 850)], 'todos', '2026-11-27')
    expect(r.tipo).toBe('elegir')
    if (r.tipo === 'elegir') expect(r.opciones.map((c) => c.id)).toEqual(['daniel-lopez', 'daniel-ruiz'])
  })
  it('si solo uno es del negocio en pantalla, usa ese', () => {
    const r = leerPropuesta(cruda({ cliente_dicho: 'Daniel' }), m, [cobro('m:p1:2026-11', 'daniel-ruiz', 850)], 'musica', '2026-11-27')
    expect(r.tipo).toBe('pago')
    if (r.tipo === 'pago') { expect(r.cliente.id).toBe('daniel-ruiz'); expect(r.cobro?.clave).toBe('m:p1:2026-11'); expect(r.problema).toBeNull() }
  })
  it('no acepta un id que el modelo inventó', () => {
    const r = leerPropuesta(cruda({ cliente_dicho: 'Pedro', cliente_id: 'pedro' }), m, [], 'todos', '2026-11-27')
    expect(r.tipo).toBe('elegir')
  })
  it('avisa cuando el monto pasa lo pendiente o falta dónde cayó', () => {
    const c = [cobro('m:p1:2026-11', 'ana', 500)]
    const a = leerPropuesta(cruda({ cliente_dicho: 'Ana', monto: 850 }), m, c, 'todos', '2026-11-27')
    expect(a.tipo === 'pago' && a.problema).toContain('Q 500.00')
    const b = leerPropuesta(cruda({ cliente_dicho: 'Ana', monto: 500, destino: '' }), m, c, 'todos', '2026-11-27')
    expect(b.tipo === 'pago' && b.problema).toBe('Falta decir dónde cayó el dinero.')
  })
  it('no deja fechas del futuro', () => {
    const r = leerPropuesta(cruda({ cliente_dicho: 'Ana', monto: 100, fecha: '2027-01-01' }), m, [cobro('m:p1:2026-11', 'ana', 500)], 'todos', '2026-11-27')
    expect(r.tipo === 'pago' && r.fecha).toBe('2026-11-27')
  })
  it('arma un gasto con negocio y categoría reales', () => {
    const r = leerPropuesta(cruda({ tipo: 'gasto', monto: 120, negocio_clave: 'dev', categoria_id: 'c-int', descripcion: 'Internet de noviembre' }), m, [], 'todos', '2026-11-27')
    expect(r.tipo).toBe('gasto')
    if (r.tipo === 'gasto') { expect(r.negocio_id).toBe('n-dev'); expect(r.categoria_id).toBe('c-int'); expect(r.problema).toBeNull() }
    const s = leerPropuesta(cruda({ tipo: 'gasto', monto: 120, categoria_id: 'inventada', descripcion: 'x' }), m, [], 'musica', '2026-11-27')
    expect(s.tipo === 'gasto' && s.problema).toBe('Falta la categoría.')
    expect(s.tipo === 'gasto' && s.negocio_id).toBe('n-mus')
  })
})

describe('revisar el mes con cifras exactas', () => {
  const pagos = [pago('a', 'ana', '2026-11-03', 850.1), pago('b', 'ana', '2026-11-03', 850.1), pago('c', 'daniel-lopez', '2026-11-10', 300, { comprobantes: ['x.png'], proyecto_id: 'p2' }), pago('d', 'ana', '2026-10-03', 999)]
  const gastos = [{ id: 'g1', fecha: '2026-11-04', negocio_id: 'n-dev', categoria_id: 'c-int', cliente_id: null, proyecto_id: null, descripcion: 'Internet', monto: 120.2, cuenta: null, proveedor: null, proveedor_nit: null, factura_serie: null, factura_numero: null, archivo: null, gasto_fijo_id: null, periodo: null, origen_mw_id: null, creado: '2026-11-04' }]
  const m = modelo({ pagos, gastos } as Partial<Modelo>)
  const entradas: EntradaDinero[] = pagos.map((p) => ({ id: p.id, tipo: 'pago', fecha: p.fecha, monto: p.monto, cliente_id: p.cliente_id, proyecto_id: p.proyecto_id, negocio_id: 'n-dev', forma: p.forma, destino: p.destino, referencia: null, recibo: null, comprobantes: p.comprobantes, concepto: 'Mensualidad', registrado_por: null, creado: p.creado, pago: p }))
  const cobros = [cobro('m:p1:2026-10', 'ana', 400, 'vencido', '2026-10-05'), cobro('m:p1:2026-12', 'ana', 400, 'por_cobrar', '2026-12-05')]
  const r = resumenDelMes(m, cobros, entradas, '2026-11', 'dev')
  it('calcula lo que entró, los gastos y lo ganado en centavos', () => {
    expect(r.resultado).toEqual({ ingresos: 2000.2, gastos: 120.2, utilidad: 1880 })
    expect(r.pagos).toEqual({ cuantos: 3, total: 2000.2 })
  })
  it('encuentra repetidos, sin comprobante y lo vencido del mes', () => {
    expect(r.repetidos).toEqual([{ fecha: '2026-11-03', monto: 850.1, quien: 'Ana Pérez', veces: 2 }])
    expect(r.sinComprobante.cuantos).toBe(2)
    expect(r.sinComprobante.total).toBe(1700.2)
    expect(r.pendientes).toEqual({ cuantos: 1, total: 400, vencidos: 1, totalVencido: 400 })
    expect(r.deudores[0]).toMatchObject({ cliente_id: 'ana', saldo: 400, vencido: 400 })
    expect(r.gastosSinFactura).toBe(1)
  })
  it('el texto para el modelo lleva las cifras ya formateadas', () => {
    const t = textoRevision(r, '2026-11-27')
    expect(t).toContain('Lo que de verdad ganó (ingresos menos gastos): Q 1,880.00')
    expect(t).toContain('Ana Pérez [ana] Q 400.00')
    expect(t).toContain('Posibles pagos repetidos: 03 nov 2026 Ana Pérez Q 850.10 (2 veces)')
  })
  it('el contexto de preguntas trae 12 meses y quién debe', () => {
    const t = contextoPreguntas(m, cobros, '2026-11', 'todos', '2026-11-27')
    expect(t.split('\n').filter((x) => x.startsWith('- ')).length).toBe(12)
    expect(t).toContain('- Noviembre 2026: Todos: Q 2,000.20 | Q 120.20 | Q 1,880.00')
    expect(t).toContain('Ana Pérez (Monterroso Dev Studio) Q 800.00, vencido Q 400.00')
  })
  it('el contexto de anotar lista clientes con sus cobros', () => {
    const t = contextoAnotar(m, cobros, 'dev', '2026-11-27', [{ valor: 'p:1', nombre: 'BI' }])
    expect(t).toContain('- ana | Ana Pérez | dev | m:p1:2026-10 = Mensualidad m:p1:2026-10, 400.00, 2026-10-05')
    expect(t).toContain('p:1 = BI')
    expect(t).toContain('c-int = Internet')
  })
})

describe('lo que responde la función', () => {
  it('lee una propuesta y el gasto del mes', () => {
    const r = leerRespuesta({ tipo: 'propuesta', propuesta: { tipo: 'pago', cliente_dicho: 'Ana', monto: '850', fecha: '2026-11-20' }, gastado: 1.234, tope: 25 })
    expect(r?.tipo).toBe('propuesta')
    if (r?.tipo === 'propuesta') { expect(r.propuesta.monto).toBe(850); expect(r.propuesta.cliente_id).toBe(''); expect(r.gastado).toBe(1.234) }
  })
  it('limpia los hallazgos que vienen mal', () => {
    const h = leerHallazgos({ hallazgos: [{ titulo: 'Cobro vencido', detalle: 'Ana', gravedad: 'alta', pantalla: 'cobros', cliente_id: '' }, { titulo: '', pantalla: 'cobros' }, { titulo: 'Otro', pantalla: 'inventada', gravedad: 'x' }, 7] })
    expect(h).toEqual([{ titulo: 'Cobro vencido', detalle: 'Ana', gravedad: 'alta', pantalla: 'cobros', cliente_id: '' }, { titulo: 'Otro', detalle: '', gravedad: 'media', pantalla: 'ninguna', cliente_id: '' }])
  })
  it('sin gasto del mes la respuesta no sirve', () => {
    expect(leerRespuesta({ tipo: 'texto', texto: 'hola' })).toBeNull()
  })
  it('avisa en 20 y corta en 25', () => {
    expect(estadoTope(null)).toBe('bien')
    expect(estadoTope(19.99)).toBe('bien')
    expect(estadoTope(20)).toBe('aviso')
    expect(estadoTope(25)).toBe('tope')
    expect(usd(1.234)).toBe('USD 1.23')
  })
})
