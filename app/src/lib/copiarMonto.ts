const MONTO = /^\(?\s*(-?)\s*(?:US\$|Q)\s?(-?)([\d,]+\.\d{2})\s*\)?$/

export function montoParaCopiar(texto: string): string | null {
  const m = texto.trim().match(MONTO)
  if (!m) return null
  const negativo = m[1] === '-' || m[2] === '-' || /^\(.*\)$/.test(texto.trim())
  return `${negativo ? '-' : ''}${m[3].replace(/,/g, '')}`
}

export function instalarCopiarMonto() {
  document.addEventListener('copy', (e) => {
    const sel = window.getSelection()?.toString() ?? ''
    const n = montoParaCopiar(sel)
    if (n == null || !e.clipboardData) return
    e.clipboardData.setData('text/plain', n)
    e.preventDefault()
  })
}
