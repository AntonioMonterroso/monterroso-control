import { describe, expect, it } from 'vitest'
import { GUIAS } from './indice'
import { etiquetasDe, revisar } from './revisar'
import type { GuiaVideo } from './tipos'

const crudos = import.meta.glob<string>(['../pantallas/**/*.tsx', '../componentes/**/*.tsx', '../lib/tipos.ts'], { query: '?raw', import: 'default', eager: true })
const fuentes = Object.values(crudos).join('\n').toLowerCase()
const app = Object.values(import.meta.glob<string>('../App.tsx', { query: '?raw', import: 'default', eager: true }))[0]

export function tramoFijo(t: string): string {
  const tramos = t.replace(/·.*$/, '').split(/\s+/).reduce<string[][]>((acc: string[][], w: string) => { if (/\d/.test(w)) acc.push([]); else acc[acc.length - 1].push(w); return acc }, [[]])
  return tramos.map((x) => x.join(' ')).sort((a, b) => b.length - a.length)[0].trim()
}

const rutasApp = [...app.matchAll(/<Route path="([^"]+)"/g)].map((m) => m[1]).filter((r) => r !== '*')

describe('videos de cada pantalla', () => {
  it('cada pantalla tiene su video', () => {
    const faltan = rutasApp.filter((r) => !GUIAS.some((g) => g.ruta === r))
    expect(faltan).toEqual([])
  })
  it('ningún video sobra', () => {
    expect(GUIAS.filter((g) => !rutasApp.includes(g.ruta)).map((g) => g.ruta)).toEqual([])
  })
  it.each(GUIAS.map((g) => [g.ruta, g] as [string, GuiaVideo]))('%s: cada toma apunta a algo de su maqueta', (_r, g) => {
    expect(revisar(g)).toEqual([])
  })
  it.each(GUIAS.map((g) => [g.ruta, g] as [string, GuiaVideo]))('%s: los botones dicen lo mismo que la pantalla', (_r, g) => {
    const faltan = etiquetasDe(g).filter((t) => { const f = tramoFijo(t); return f.length > 0 && !fuentes.includes(f.toLowerCase()) })
    expect(faltan).toEqual([])
  })
})

describe('el revisor', () => {
  it('avisa cuando una toma apunta a algo que ya no existe', () => {
    const g: GuiaVideo = { ruta: '/x', menu: 'X', caps: [{ t: '1', e0: { titulo: 'X', piezas: [{ k: 'botones', l: [{ t: 'Guardar', g: 'guardar' }] }] }, tomas: [{ t: 'Toca «Guardar».', en: 'guardar', clic: true, luego: { piezas: [] } }, { t: 'Otra vez «Guardar».', en: 'guardar' }] }] }
    expect(revisar(g)).toEqual(['/x · 1 · toma 2: «guardar» no está en su maqueta'])
  })
  it('toma el tramo fijo de una etiqueta con números', () => {
    expect(tramoFijo('Marcar todas · 3')).toBe('Marcar todas')
    expect(tramoFijo('Borrar o archivar 3 clientes')).toBe('Borrar o archivar')
  })
})
