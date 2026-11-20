import { aCentavos, deCentavos } from './dinero'
import type { FormaInscripcion, ParteInscripcion } from './tipos'

export const FORMAS: { valor: FormaInscripcion; nombre: string; ayuda: string }[] = [
  { valor: 'completa', nombre: 'Completa al firmar', ayuda: 'Un solo pago al firmar el contrato.' },
  { valor: 'mitad', nombre: '50 % y 50 %', ayuda: 'La mitad al firmar y la otra mitad al entregar.' },
  { valor: 'personalizada', nombre: 'Personalizada', ayuda: 'Tú defines cuántas partes, cuánto y cuándo.' },
]

export function partesDeForma(total: number, forma: FormaInscripcion, actuales: ParteInscripcion[] = []): ParteInscripcion[] {
  const c = aCentavos(total)
  if (c <= 0) return []
  if (forma === 'completa') return [{ orden: 1, concepto: 'Inscripción', momento: 'firma', fecha: null, monto: deCentavos(c) }]
  if (forma === 'mitad') {
    const primera = Math.ceil(c / 2)
    return [
      { orden: 1, concepto: 'Inscripción, primera mitad', momento: 'firma', fecha: null, monto: deCentavos(primera) },
      { orden: 2, concepto: 'Inscripción, segunda mitad', momento: 'entrega', fecha: null, monto: deCentavos(c - primera) },
    ]
  }
  if (actuales.length > 0) return actuales.map((p, i) => ({ ...p, orden: i + 1 }))
  return [{ orden: 1, concepto: 'Inscripción, parte 1', momento: 'firma', fecha: null, monto: deCentavos(c) }]
}

export function sumaPartes(partes: ParteInscripcion[]): number {
  return deCentavos(partes.reduce((s, p) => s + aCentavos(p.monto), 0))
}

export function problemasInscripcion(total: number, forma: FormaInscripcion | null, partes: ParteInscripcion[]): string[] {
  const t = aCentavos(total)
  if (t < 0) return ['La inscripción no puede ser negativa.']
  if (t === 0) return []
  const lista: string[] = []
  if (!forma) lista.push('Elige cómo se divide la inscripción.')
  if (partes.length === 0) lista.push('La inscripción necesita al menos una parte.')
  partes.forEach((p, i) => {
    if (aCentavos(p.monto) <= 0) lista.push(`La parte ${i + 1} necesita un monto mayor a cero.`)
    if (!p.concepto.trim()) lista.push(`La parte ${i + 1} necesita un concepto.`)
    if (p.momento === 'fecha' && !p.fecha) lista.push(`La parte ${i + 1} necesita su fecha.`)
  })
  const suma = partes.reduce((s, p) => s + aCentavos(p.monto), 0)
  if (partes.length > 0 && suma !== t) lista.push(`Las partes suman ${(suma / 100).toFixed(2)} y la inscripción es ${(t / 100).toFixed(2)}.`)
  return lista
}

export function textoMomento(p: ParteInscripcion): string {
  if (p.momento === 'firma') return 'Al firmar'
  if (p.momento === 'entrega') return 'Al entregar'
  return 'En fecha'
}
