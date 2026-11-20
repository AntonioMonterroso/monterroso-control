import { svgLogo, type Area } from './marca'

export function esc(t: string | number | null | undefined): string {
  return String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)
}

const ESTILO = `
@font-face { font-family: "Instrument Sans"; font-weight: 400 700; src: url("/marca/fuentes/instrument-sans-latin-variable.woff2") format("woff2"); }
@page { size: letter; margin: 16mm 16mm 18mm; }
* { box-sizing: border-box; }
body { margin: 0; font: 400 10.5pt/1.55 "Instrument Sans", "Helvetica Neue", Arial, sans-serif; color: #152736; background: #ffffff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.hoja { max-width: 760px; margin: 0 auto; padding: 24px; }
header { display: flex; align-items: center; gap: 16px; padding-bottom: 12px; border-bottom: 2px solid #3b82c4; margin-bottom: 22px; }
header .marca { width: 230px; line-height: 0; }
header .marca svg { width: 100%; height: auto; display: block; }
header .dato { margin-left: auto; text-align: right; font-size: 9pt; color: #5b7f96; }
h1 { font: 700 15pt/1.2 "Instrument Sans", sans-serif; margin: 0 0 4px; color: #152736; }
h2 { font: 700 11.5pt/1.3 "Instrument Sans", sans-serif; margin: 18px 0 6px; color: #3b82c4; text-transform: uppercase; letter-spacing: 0.06em; }
.sub { color: #5b7f96; margin: 0 0 18px; }
table { width: 100%; border-collapse: collapse; margin: 12px 0 18px; font-size: 10pt; }
th { text-align: left; background: #152736; color: #f0f6fb; font-size: 8pt; letter-spacing: 0.08em; text-transform: uppercase; padding: 7px 10px; }
td { padding: 7px 10px; border-bottom: 1px solid #cbe0f2; vertical-align: top; }
.n { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
tfoot td { font-weight: 700; border-top: 2px solid #3b82c4; background: #f0f6fb; }
dl { display: grid; grid-template-columns: max-content 1fr; gap: 6px 18px; margin: 0 0 18px; }
dt { color: #5b7f96; }
dd { margin: 0; font-weight: 600; }
.texto p { margin: 0 0 12px; text-align: justify; }
.firmas { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; margin-top: 64px; }
.firmas div { border-top: 1px solid #152736; padding-top: 6px; text-align: center; font-size: 9pt; }
.sello { width: 118px; height: 118px; border: 3px double #3b82c4; border-radius: 50%; display: grid; place-items: center; text-align: center; color: #3b82c4; font: 700 8pt/1.3 "Instrument Sans", sans-serif; letter-spacing: 0.1em; text-transform: uppercase; transform: rotate(-8deg); margin: 24px 0 0 auto; padding: 12px; }
.pie { margin-top: 28px; font-size: 8.5pt; color: #5b7f96; border-top: 1px solid #cbe0f2; padding-top: 8px; }
.nota-legal { margin-top: 18px; padding: 8px 12px; border-left: 3px solid #3b82c4; background: #f0f6fb; font-size: 8.5pt; color: #5b7f96; }
.membrete-pie { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; font-size: 8pt; color: #5b7f96; }
@media print { .hoja { padding: 0; } }
`

export function documentoHtml(titulo: string, cuerpo: string, dato = '', area: Area = 'corporativo', pie = '', conImprimir = true): string {
  const logo = svgLogo({ area, m: '#3b82c4', texto: '#152736' })
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${esc(titulo)}</title><style>${ESTILO}</style></head><body><div class="hoja"><header><span class="marca">${logo}</span><span class="dato">${dato}</span></header>${cuerpo}${pie ? `<p class="pie">${pie}</p>` : ''}</div>${conImprimir ? '<script>document.fonts.ready.then(function(){setTimeout(function(){window.print()},200)})<\/script>' : ''}</body></html>`
}

export function imprimir(titulo: string, cuerpo: string, dato = '', area: Area = 'corporativo', pie = '') {
  const w = window.open('', '_blank')
  if (!w) return false
  w.document.write(documentoHtml(titulo, cuerpo, dato, area, pie))
  w.document.close()
  return true
}

export const SELLO = '<div class="sello">Studio<br>Monterroso</div>'
