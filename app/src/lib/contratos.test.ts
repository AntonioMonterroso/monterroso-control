import { describe, expect, it } from 'vitest'
import { faltantes, rellenar, valores } from './contratos'
import type { Cliente } from './tipos'

const cliente = { id: 'c', nombre: 'Cliente de prueba', nit: null, direccion: null } as unknown as Cliente

describe('vista previa del contrato', () => {
  it('lo que falta sale marcado en el texto', () => {
    const t = rellenar('{cliente}, NIT {nit}, con domicilio en {direccion}, en {ciudad}.', valores({ ciudad: '', prestador: 'Studio', fecha: '2026-11-20', cliente, proyecto: null }))
    expect(t).toBe('Cliente de prueba, NIT [Falta: NIT del cliente], con domicilio en [Falta: dirección del cliente], en [Falta: ciudad].')
    expect(faltantes(t)).toEqual(['NIT del cliente', 'dirección del cliente', 'ciudad'])
  })
  it('sin faltantes no dice nada', () => {
    expect(faltantes('Todo completo.')).toEqual([])
  })
})
