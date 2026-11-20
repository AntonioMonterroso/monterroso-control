import { AREAS, FUENTE, iconoArea, svgIsotipo, svgLogo, type Area, type ColorMarca } from './marca'

export interface DatosMarca { nombre: string; cargo: string; correo: string; telefono: string; sitio: string; redes: Record<string, string> }

const e = (t: string) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string)

function anidar(svg: string, x: number, y: number, w: number, h: number): string {
  return svg.replace(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="([^"]+)"/, `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="$1"`)
}

function abrir(w: number, h: number, fuente?: string | null, extra = ''): string {
  const f = fuente ? `<style>@font-face{font-family:"Instrument Sans";font-weight:400 700;src:url(data:font/woff2;base64,${fuente}) format("woff2");}</style>` : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"${extra}>${f}`
}

export const REDES = ['instagram', 'facebook', 'linkedin', 'tiktok', 'youtube', 'behance', 'github'] as const

export function lineasContacto(d: DatosMarca): string[] {
  const r = REDES.filter((k) => d.redes[k]?.trim()).map((k) => `${k[0].toUpperCase()}${k.slice(1)}: ${d.redes[k].trim()}`)
  return [d.correo, d.telefono, d.sitio, ...r].map((x) => (x ?? '').trim()).filter(Boolean)
}

export function tarjetaFrente(area: Area, c: ColorMarca, fuente?: string | null): string {
  return `${abrir(960, 560, fuente)}<rect width="960" height="560" style="fill:${c.fondo}"/>${anidar(svgLogo({ area, m: c.m, texto: c.texto }), 105, 135, 750, 320)}</svg>`
}

export function tarjetaReverso(area: Area, c: ColorMarca, d: DatosMarca, fuente?: string | null): string {
  const ls = lineasContacto(d).slice(0, 5)
  const etiqueta = AREAS.find((a) => a.valor === area)?.etiqueta
  return `${abrir(960, 560, fuente)}<rect width="960" height="560" style="fill:${c.fondo}"/>${anidar(svgIsotipo(c.m), 650, 150, 240, 240)}<rect x="90" y="120" width="5" height="320" style="fill:${c.m}"/><text x="120" y="182" font-family='${FUENTE}' font-size="44" font-weight="700" style="fill:${c.texto}">${e(d.nombre || 'Studio Monterroso')}</text><text x="120" y="226" font-family='${FUENTE}' font-size="24" letter-spacing="3" style="fill:${c.m}">${e((d.cargo || etiqueta || '').toUpperCase())}</text>${ls.map((l, i) => `<text x="120" y="${300 + i * 34}" font-family='${FUENTE}' font-size="24" style="fill:${c.texto}">${e(l)}</text>`).join('')}</svg>`
}

export function portada(area: Area, c: ColorMarca, w: number, h: number, d: DatosMarca, fuente?: string | null): string {
  const lh = Math.round(h * 0.62)
  const lw = Math.round((lh * 2400) / 1024)
  const etiqueta = AREAS.find((a) => a.valor === area)?.etiqueta
  return `${abrir(w, h, fuente)}<rect width="${w}" height="${h}" style="fill:${c.fondo}"/><g opacity="0.06">${anidar(svgIsotipo(c.m), w - h * 1.1, -h * 0.15, h * 1.3, h * 1.3)}</g>${anidar(svgLogo({ area, m: c.m, texto: c.texto }), Math.round(w * 0.06), Math.round((h - lh) / 2), lw, lh)}<text x="${w - Math.round(w * 0.05)}" y="${h - Math.round(h * 0.1)}" text-anchor="end" font-family='${FUENTE}' font-size="${Math.round(h * 0.055)}" letter-spacing="2" style="fill:${c.texto}">${e(d.sitio || (etiqueta ?? ''))}</text></svg>`
}

export function publicacion(area: Area, c: ColorMarca, w: number, h: number, d: DatosMarca, fuente?: string | null): string {
  const iso = Math.round(w * 0.46)
  const a = AREAS.find((x) => x.valor === area)!
  const fs = Math.round(w * 0.04)
  const icW = 160 * (w * 0.06) / 100
  const gap = Math.round(w * 0.025)
  const lw = (a.etiqueta || '').length * (fs * 0.68 + 4)
  const x0 = w / 2 - (icW + gap + lw) / 2
  const y0 = Math.round(h * 0.2)
  return `${abrir(w, h, fuente)}<rect width="${w}" height="${h}" style="fill:${c.fondo}"/>${anidar(svgIsotipo(c.m), Math.round((w - iso) / 2), y0, iso, iso)}<text x="${w / 2}" y="${y0 + iso + Math.round(w * 0.1)}" text-anchor="middle" font-family='${FUENTE}' font-size="${Math.round(w * 0.075)}" font-weight="700" style="fill:${c.texto}">STUDIO MONTERROSO</text>${a.etiqueta ? `<g transform="translate(${Math.round(x0)} ${y0 + iso + Math.round(w * 0.14)}) scale(${(w * 0.06) / 100})">${iconoArea(area, c.m)}</g><text x="${Math.round(x0 + icW + gap)}" y="${y0 + iso + Math.round(w * 0.175)}" font-family='${FUENTE}' font-size="${Math.round(w * 0.04)}" letter-spacing="4" style="fill:${c.texto}">${a.etiqueta}</text>` : ''}<text x="${w / 2}" y="${h - Math.round(h * 0.06)}" text-anchor="middle" font-family='${FUENTE}' font-size="${Math.round(w * 0.03)}" letter-spacing="2" style="fill:${c.m}">${e(d.sitio || 'studiomonterroso.com')}</text></svg>`
}

export async function fuenteBase64(): Promise<string> {
  const r = await fetch('/marca/fuentes/instrument-sans-latin-variable.woff2')
  const b = new Uint8Array(await r.arrayBuffer())
  let s = ''
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000))
  return btoa(s)
}

export function svgAPng(svg: string, w: number, h: number): Promise<Blob> {
  return new Promise((ok, mal) => {
    const img = new Image()
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
    img.onload = () => {
      const c = document.createElement('canvas')
      c.width = w; c.height = h
      c.getContext('2d')!.drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      c.toBlob((b) => (b ? ok(b) : mal(new Error('No se pudo crear la imagen.'))), 'image/png')
    }
    img.onerror = () => { URL.revokeObjectURL(url); mal(new Error('No se pudo dibujar la imagen.')) }
    img.src = url
  })
}
