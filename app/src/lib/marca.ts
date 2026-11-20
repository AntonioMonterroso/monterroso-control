import { M_PATHS } from './marcaM'

export type Area = 'corporativo' | 'web' | 'musica' | 'diseno'

export const AREAS: { valor: Area; nombre: string; carpeta: string; etiqueta: string | null }[] = [
  { valor: 'corporativo', nombre: 'Corporativo', carpeta: 'Corporativo', etiqueta: null },
  { valor: 'web', nombre: 'Desarrollo Web', carpeta: 'Desarrollo Web', etiqueta: 'DESARROLLO WEB' },
  { valor: 'musica', nombre: 'Música', carpeta: 'Música', etiqueta: 'MÚSICA' },
  { valor: 'diseno', nombre: 'Diseño', carpeta: 'Diseño', etiqueta: 'DISEÑO' },
]

export interface ColorMarca { nombre: string; fondo: string; m: string; texto: string }

export const COLORES_MARCA: ColorMarca[] = [
  { nombre: 'Oficial', fondo: '#0f172a', m: '#0ea5e9', texto: '#f1f5f9' },
  { nombre: 'Hielo', fondo: '#f0f6fb', m: '#3b82c4', texto: '#152736' },
  { nombre: 'Amarillo', fondo: '#171717', m: '#ffdc00', texto: '#ffffff' },
  { nombre: 'Blanco', fondo: '#ffffff', m: '#152736', texto: '#152736' },
  { nombre: 'Borgona', fondo: '#421827', m: '#f0a6b5', texto: '#ffffff' },
  { nombre: 'Bosque', fondo: '#102b23', m: '#79d5a5', texto: '#ffffff' },
  { nombre: 'Celeste', fondo: '#dcefff', m: '#23659c', texto: '#163650' },
  { nombre: 'Champan', fondo: '#f8eedc', m: '#967244', texto: '#392d20' },
  { nombre: 'Ciruela', fondo: '#30173e', m: '#d9b1ff', texto: '#ffffff' },
  { nombre: 'Cobre', fondo: '#251c19', m: '#d28b65', texto: '#ffffff' },
  { nombre: 'Crema', fondo: '#fff4d9', m: '#8b6a30', texto: '#49381f' },
  { nombre: 'Dorado', fondo: '#191919', m: '#c8a96a', texto: '#ffffff' },
  { nombre: 'Durazno', fondo: '#ffe6d6', m: '#b34c29', texto: '#53291b' },
  { nombre: 'Fucsia', fondo: '#241024', m: '#ff42b3', texto: '#ffffff' },
  { nombre: 'Grafito', fondo: '#262a31', m: '#aeb8c5', texto: '#ffffff' },
  { nombre: 'Gris', fondo: '#e5e7eb', m: '#475569', texto: '#152736' },
  { nombre: 'Lavanda', fondo: '#eee5ff', m: '#7651af', texto: '#302044' },
  { nombre: 'Menta', fondo: '#d9f8eb', m: '#147b60', texto: '#143c32' },
  { nombre: 'Naranja', fondo: '#fff0e3', m: '#e05200', texto: '#532500' },
  { nombre: 'Negro', fondo: '#080808', m: '#ffffff', texto: '#ffffff' },
  { nombre: 'Petroleo', fondo: '#073b46', m: '#7de2df', texto: '#ffffff' },
  { nombre: 'Rojo', fondo: '#fff0f0', m: '#d52232', texto: '#521119' },
  { nombre: 'Rosa', fondo: '#ffe5ed', m: '#b34572', texto: '#482035' },
  { nombre: 'Turquesa', fondo: '#092b30', m: '#00e4d0', texto: '#ffffff' },
  { nombre: 'Verde electrico', fondo: '#182315', m: '#baff28', texto: '#ffffff' },
  { nombre: 'Violeta', fondo: '#23143e', m: '#a777ff', texto: '#ffffff' },
]

export const FUENTE = '"Instrument Sans", "Inter", "Helvetica Neue", Arial, sans-serif'

export function iconoArea(area: Area, color: string): string {
  const st = `style="fill:none;stroke:${color};stroke-width:10;stroke-linecap:round;stroke-linejoin:round"`
  if (area === 'web') return `<g ${st}><polyline points="40,6 8,31 40,56"/><line x1="90" y1="2" x2="70" y2="60"/><polyline points="120,6 152,31 120,56"/></g>`
  if (area === 'musica') return `<g ${st}><path d="M6 31 C 18 31 20 6 32 6 S 48 56 60 56 S 76 10 88 10 S 104 50 116 50 S 136 31 154 31"/></g>`
  if (area === 'diseno') return `<g ${st}><path d="M80 2 L106 28 L80 60 L54 28 Z"/><line x1="80" y1="36" x2="80" y2="60"/><circle cx="80" cy="28" r="7"/></g>`
  return ''
}

export function mSvg(color: string): string {
  return `<g transform="translate(0,1449) scale(0.1,-0.1)" style="fill:${color};stroke:none">${M_PATHS.map((d) => `<path d="${d}"/>`).join('')}</g>`
}

export interface OpcionesLogo { area?: Area; m: string; texto: string; fondo?: string | null; fuenteEmbebida?: string | null; ancho?: number }

export function svgLogo(o: OpcionesLogo): string {
  const area = AREAS.find((a) => a.valor === (o.area ?? 'corporativo'))!
  const fuente = o.fuenteEmbebida ? `<style>@font-face{font-family:"Instrument Sans";font-weight:400 700;src:url(data:font/woff2;base64,${o.fuenteEmbebida}) format("woff2");}</style>` : ''
  const fondo = o.fondo ? `<rect width="2400" height="1024" fill="${o.fondo}"/>` : ''
  const linea = area.etiqueta ? `<g transform="translate(952 688)">${iconoArea(area.valor, o.m)}</g><text x="1132" y="738" font-family='${FUENTE}' font-size="62" font-weight="400" letter-spacing="9" style="fill:${o.texto}">${area.etiqueta}</text>` : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2400 1024"${o.ancho ? ` width="${o.ancho}" height="${Math.round((o.ancho * 1024) / 2400)}"` : ''} role="img" aria-label="Studio Monterroso${area.etiqueta ? ` ${area.nombre}` : ''}">${fuente}${fondo}<g transform="translate(140 245) scale(0.3673)">${mSvg(o.m)}</g><rect x="862" y="258" width="7" height="508" style="fill:${o.texto}"/><text x="950" y="384" font-family='${FUENTE}' font-size="112" font-weight="400" letter-spacing="18" style="fill:${o.texto}">STUDIO</text><text x="944" y="590" font-family='${FUENTE}' font-size="182" font-weight="700" style="fill:${o.texto}" textLength="1205" lengthAdjust="spacingAndGlyphs">MONTERROSO</text>${linea}</svg>`
}

export function svgIsotipo(m: string, fondo?: string | null): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1536 1536">${fondo ? `<rect width="1536" height="1536" rx="300" fill="${fondo}"/>` : ''}<g transform="translate(218 382) scale(0.6116)">${mSvg(m)}</g></svg>`
}
