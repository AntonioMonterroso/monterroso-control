import { NOTA_LEGAL } from '../../lib/documentos'
import { esc, imprimir } from '../../lib/imprimir'

export function htmlContrato(titulo: string, texto: string, prestador: string, cliente: string): string {
  const parrafos = texto.split(/\n{2,}/).map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('')
  return `<h1>${esc(titulo)}</h1><div class="texto">${parrafos}</div><div class="firmas"><div>${esc(prestador)}<br>El prestador</div><div>${esc(cliente)}<br>El cliente</div></div><p class="nota-legal">${NOTA_LEGAL}</p>`
}

export function imprimirContrato(titulo: string, texto: string, prestador: string, cliente: string) {
  imprimir(titulo, htmlContrato(titulo, texto, prestador, cliente), '', 'web')
}
