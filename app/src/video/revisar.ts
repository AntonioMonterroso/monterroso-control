import type { Boton, Escena, GuiaVideo, Pieza } from './tipos'

function idsBotones(l: Boton[] | undefined, out: Set<string>) {
  for (const b of l ?? []) if (b.g) out.add(b.g)
}

function idsPiezas(l: Pieza[], out: Set<string>) {
  for (const p of l) {
    if (p.g) out.add(p.g)
    switch (p.k) {
      case 'cifras': case 'chips': case 'pestanas': case 'campos': for (const x of p.l) if (x.g) out.add(x.g); break
      case 'botones': case 'menu': idsBotones(p.l, out); break
      case 'tabla': for (const f of p.filas) { if (f.g) out.add(f.g); idsBotones(f.acc, out) } break
      default: break
    }
  }
}

export function idsDe(e: Escena): Set<string> {
  const out = new Set<string>(['titulo'])
  idsBotones(e.acciones, out)
  idsPiezas(e.piezas, out)
  if (e.hoja) { out.add('hoja'); idsPiezas(e.hoja.piezas, out); idsBotones(e.hoja.pie, out) }
  return out
}

export function escenaHasta(g: GuiaVideo, c: number, i: number): Escena {
  let e: Escena = { ...g.caps[c].e0 }
  for (const s of g.caps[c].tomas.slice(0, i)) if (s.luego) e = { ...e, ...s.luego }
  return e
}

function textosPiezas(l: Pieza[], out: string[]) {
  for (const p of l) {
    if (p.k === 'botones' || p.k === 'menu' || p.k === 'chips' || p.k === 'pestanas') for (const x of p.l) out.push(x.t)
    if (p.k === 'tabla') for (const f of p.filas) for (const b of f.acc ?? []) out.push(b.t)
  }
}

export function etiquetasDe(g: GuiaVideo): string[] {
  const out: string[] = []
  for (const c of g.caps) {
    const escenas: Escena[] = [c.e0, ...c.tomas.map((s) => s.luego).filter((x): x is Partial<Escena> => !!x).map((x) => ({ titulo: '', piezas: [], ...x }))]
    for (const e of escenas) {
      for (const b of e.acciones ?? []) out.push(b.t)
      textosPiezas(e.piezas ?? [], out)
      if (e.hoja) { out.push(e.hoja.titulo); textosPiezas(e.hoja.piezas, out); for (const b of e.hoja.pie ?? []) out.push(b.t) }
    }
  }
  return [...new Set(out.filter((t) => t.trim()))]
}

export function revisar(g: GuiaVideo): string[] {
  const malos: string[] = []
  if (!g.caps.length) malos.push(`${g.ruta}: no tiene capítulos`)
  g.caps.forEach((c, ci) => {
    if (!c.tomas.length) malos.push(`${g.ruta} · ${c.t}: sin tomas`)
    c.tomas.forEach((s, i) => {
      if (!s.t.trim()) malos.push(`${g.ruta} · ${c.t} · toma ${i + 1}: sin explicación`)
      if (s.en && !idsDe(escenaHasta(g, ci, i)).has(s.en)) malos.push(`${g.ruta} · ${c.t} · toma ${i + 1}: «${s.en}» no está en su maqueta`)
    })
  })
  return malos
}
