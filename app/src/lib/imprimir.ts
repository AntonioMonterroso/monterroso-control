export function esc(t: string | number | null | undefined): string {
  return String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)
}

const ESTILO = `
@font-face { font-family: "Cormorant Garamond"; font-weight: 700; src: url("/marca/fuentes/cormorant-garamond-latin-700-normal.woff2") format("woff2"); }
@font-face { font-family: "IBM Plex Sans"; font-weight: 400; src: url("/marca/fuentes/ibm-plex-sans-latin-400-normal.woff2") format("woff2"); }
@font-face { font-family: "IBM Plex Sans"; font-weight: 600; src: url("/marca/fuentes/ibm-plex-sans-latin-600-normal.woff2") format("woff2"); }
@font-face { font-family: "IBM Plex Mono"; font-weight: 400; src: url("/marca/fuentes/ibm-plex-mono-latin-400-normal.woff2") format("woff2"); }
@page { size: letter; margin: 18mm 16mm; }
* { box-sizing: border-box; }
body { margin: 0; font: 400 11pt/1.55 "IBM Plex Sans", sans-serif; color: #2a1a1d; background: #fffdf9; }
.hoja { max-width: 760px; margin: 0 auto; padding: 24px; }
header { display: flex; align-items: center; gap: 16px; padding-bottom: 14px; border-bottom: 2px solid #7a2e3b; margin-bottom: 20px; }
.logo { width: 54px; aspect-ratio: 1797 / 1449; background: #7a2e3b; -webkit-mask: url("/marca/logo-am.png") center / contain no-repeat; mask: url("/marca/logo-am.png") center / contain no-repeat; }
header b { display: block; font: 700 20pt/1 "Cormorant Garamond", serif; letter-spacing: 0.08em; text-transform: uppercase; }
header small { display: block; font-size: 8pt; letter-spacing: 0.16em; text-transform: uppercase; color: #6b5558; margin-top: 4px; }
header .dato { margin-left: auto; text-align: right; font-size: 9pt; color: #6b5558; }
h1 { font: 600 15pt/1.2 "IBM Plex Sans", sans-serif; margin: 0 0 4px; }
.sub { color: #6b5558; margin: 0 0 18px; }
table { width: 100%; border-collapse: collapse; margin: 12px 0 18px; font-size: 10pt; }
th { text-align: left; background: #7a2e3b; color: #fffdf9; font-size: 8pt; letter-spacing: 0.08em; text-transform: uppercase; padding: 7px 10px; }
td { padding: 7px 10px; border-bottom: 1px solid #e2d6c4; vertical-align: top; }
.n { text-align: right; font-family: "IBM Plex Mono", monospace; white-space: nowrap; }
tfoot td { font-weight: 600; border-top: 2px solid #7a2e3b; background: #f7f2ea; }
dl { display: grid; grid-template-columns: max-content 1fr; gap: 6px 18px; margin: 0 0 18px; }
dt { color: #6b5558; }
dd { margin: 0; font-weight: 600; }
.texto p { margin: 0 0 12px; text-align: justify; }
.firmas { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; margin-top: 64px; }
.firmas div { border-top: 1px solid #2a1a1d; padding-top: 6px; text-align: center; font-size: 9pt; }
.sello { width: 118px; height: 118px; border: 3px double #7a2e3b; border-radius: 50%; display: grid; place-items: center; text-align: center; color: #7a2e3b; font: 700 8pt/1.3 "IBM Plex Sans", sans-serif; letter-spacing: 0.1em; text-transform: uppercase; transform: rotate(-8deg); margin: 24px 0 0 auto; padding: 12px; }
.pie { margin-top: 28px; font-size: 8.5pt; color: #6b5558; border-top: 1px solid #e2d6c4; padding-top: 8px; }
@media print { .hoja { padding: 0; } }
`

export function imprimir(titulo: string, cuerpo: string, dato = '') {
  const w = window.open('', '_blank')
  if (!w) return false
  w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${esc(titulo)}</title><style>${ESTILO}</style></head><body><div class="hoja"><header><span class="logo"></span><span><b>Monterroso</b><small>Dev Studio</small></span><span class="dato">${dato}</span></header>${cuerpo}</div><script>document.fonts.ready.then(function(){setTimeout(function(){window.print()},150)})<\/script></body></html>`)
  w.document.close()
  return true
}

export const SELLO = '<div class="sello">Monterroso<br>Dev Studio</div>'
