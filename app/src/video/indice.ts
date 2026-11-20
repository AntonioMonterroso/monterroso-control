import { matchPath } from 'react-router-dom'
import type { GuiaVideo } from './tipos'

const mods = import.meta.glob<{ default: GuiaVideo }>('./guias/*.ts', { eager: true })

export const GUIAS: GuiaVideo[] = Object.values(mods).map((m) => m.default)

export function guiaDe(ruta: string): GuiaVideo | undefined {
  return GUIAS.find((g) => matchPath({ path: g.ruta, end: true }, ruta))
}
