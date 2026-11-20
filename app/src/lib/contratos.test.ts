import { describe, expect, it } from 'vitest'
import { armarContrato, clausulasQueAplican, rellenar } from './contratos'
import { PLANTILLA_BASE } from './semillas'
import type { Cliente, Proyecto } from './tipos'

const cliente = { id: 'c', nombre: 'Panadería Sol', nit: '1234567-8', direccion: null } as Cliente
const proyecto = { id: 'p', nombre: 'Tienda en línea', descripcion: null, inscripcion_total: 2000, mensualidad: 350, dia_cobro: 5, mensualidad_inicio: '2026-12-01', mensualidad_fin: null, fecha_entrega: null, partes: [{ orden: 1, concepto: 'A', momento: 'firma', fecha: null, monto: 1000 }, { orden: 2, concepto: 'B', momento: 'entrega', fecha: null, monto: 1000 }] } as unknown as Proyecto

describe('contratos', () => {
  it('rellena los datos del cliente y del proyecto', () => {
    const t = armarContrato(PLANTILLA_BASE.encabezado, PLANTILLA_BASE.clausulas.slice(0, 3), PLANTILLA_BASE.cierre, { ciudad: 'Guatemala', prestador: 'Monterroso Dev Studio', fecha: '2026-11-19', cliente, proyecto })
    expect(t).toContain('Panadería Sol, con NIT 1234567-8')
    expect(t).toContain('el 19 de noviembre de 2026')
    expect(t).toContain('Q 1,000.00 al firmar; Q 1,000.00 al entregar')
    expect(t).toContain('TERCERA. MENSUALIDAD.')
    expect(t).not.toMatch(/\{\w+\}/)
  })

  it('quita mensualidad e inscripción cuando no aplican', () => {
    const sin = { ...proyecto, mensualidad: 0, inscripcion_total: 0 }
    const l = clausulasQueAplican(PLANTILLA_BASE.clausulas, PLANTILLA_BASE.clausulas.map(() => true), sin)
    expect(l.map((c) => c.titulo)).not.toContain('Mensualidad')
    expect(l.map((c) => c.titulo)).not.toContain('Inscripción')
  })

  it('deja las marcas desconocidas como están', () => {
    expect(rellenar('Hola {nombre} {x}', { nombre: 'Ana' })).toBe('Hola Ana {x}')
  })
})
