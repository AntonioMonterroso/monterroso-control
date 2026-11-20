export type FormaPago = 'efectivo' | 'transferencia' | 'deposito' | 'tarjeta' | 'cheque' | 'anticipo' | 'otro'

export const FORMAS: { valor: Exclude<FormaPago, 'anticipo'>; nombre: string }[] = [
  { valor: 'transferencia', nombre: 'Transferencia' },
  { valor: 'deposito', nombre: 'Depósito' },
  { valor: 'efectivo', nombre: 'Efectivo' },
  { valor: 'tarjeta', nombre: 'Tarjeta' },
  { valor: 'cheque', nombre: 'Cheque' },
  { valor: 'otro', nombre: 'Otro' },
]

export function nombreForma(f: string | null | undefined): string {
  if (f === 'anticipo') return 'Saldo a favor'
  return FORMAS.find((x) => x.valor === f)?.nombre ?? 'Sin indicar'
}

export function formaDeTexto(t: string | null | undefined): FormaPago | null {
  const n = (t ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  if (!n) return null
  if (n.includes('anticipo') || n.includes('saldo a favor')) return 'anticipo'
  if (n.includes('transfer')) return 'transferencia'
  if (n.includes('deposit')) return 'deposito'
  if (n.includes('efectivo') || n.includes('cash')) return 'efectivo'
  if (n.includes('tarjeta') || n.includes('card')) return 'tarjeta'
  if (n.includes('cheque')) return 'cheque'
  return null
}

export interface CuentaPersonal { id: string; banco: string; nombre: string | null; ultimos4: string | null; moneda: 'GTQ' | 'USD'; activo: boolean; orden: number; tipo?: 'banco' | 'efectivo'; saldo_inicial?: number }
export interface CuentaSA { id: string; banco: string; numero: string | null; nombre: string | null; moneda?: string; activo: boolean }
export interface CuentaWorld { id: string; name: string; bank: string | null; last4: string | null; archived?: boolean }
export interface OpcionDestino { valor: string; nombre: string; grupo: string }

export type GrupoDestino = 'personal' | 'sa' | 'efectivo' | 'otro' | 'sin'

export const GRUPOS_DESTINO: [GrupoDestino, string][] = [['personal', 'Cuentas personales'], ['efectivo', 'Efectivo'], ['sa', 'Cuentas de la S.A.'], ['otro', 'Otro'], ['sin', 'Sin indicar']]

export function grupoDestino(d: string | null | undefined): GrupoDestino {
  if (!d) return 'sin'
  if (d.startsWith('p:') || d.startsWith('w:')) return 'personal'
  if (d.startsWith('e:') || d === 'efectivo') return 'efectivo'
  if (d.startsWith('s:')) return 'sa'
  return 'otro'
}

export const esDeAntonio = (d: string | null | undefined) => grupoDestino(d) === 'personal' || grupoDestino(d) === 'efectivo'

export const enmascarar = (u: string | null | undefined) => (u ? `···${u.slice(-4)}` : '')

export const nombreCaja = (c: CuentaPersonal) => c.nombre || c.banco

export function cajaPorDefecto(cuentas: CuentaPersonal[]): CuentaPersonal | undefined {
  const cajas = cuentas.filter((c) => c.tipo === 'efectivo')
  return cajas.find((c) => /billetera/i.test(nombreCaja(c))) ?? cajas[0]
}

export function opcionesDestino(personales: CuentaPersonal[], sa: CuentaSA[], actual?: string | null, world: CuentaWorld[] = []): OpcionDestino[] {
  const bancos = personales.filter((c) => c.tipo !== 'efectivo')
  const cajas = personales.filter((c) => c.tipo === 'efectivo')
  return [
    ...bancos.filter((c) => c.activo || `p:${c.id}` === actual).map((c) => ({ grupo: 'Cuentas personales', valor: `p:${c.id}`, nombre: `${c.banco}${c.nombre ? ` ${c.nombre}` : ''} ${enmascarar(c.ultimos4)}${c.moneda === 'USD' ? ' (US$)' : ''}`.trim() })),
    ...world.filter((w) => !w.archived || `w:${w.id}` === actual).map((w) => ({ grupo: 'Cuentas personales', valor: `w:${w.id}`, nombre: `${w.name}${w.bank && w.bank !== w.name ? ` (${w.bank})` : ''} ${enmascarar(w.last4)} · de World`.trim() })),
    ...cajas.filter((c) => c.activo || `e:${c.id}` === actual).map((c) => ({ grupo: 'Efectivo', valor: `e:${c.id}`, nombre: nombreCaja(c) })),
    ...(cajas.length === 0 || actual === 'efectivo' ? [{ grupo: 'Efectivo', valor: 'efectivo', nombre: 'Efectivo' }] : []),
    ...sa.filter((c) => c.activo || `s:${c.id}` === actual).map((c) => ({ grupo: 'Cuentas de la S.A.', valor: `s:${c.id}`, nombre: `${c.banco} ${enmascarar(c.numero)}`.trim() })),
    { grupo: 'Otro', valor: 'otro', nombre: 'Otro' },
  ]
}

export function nombreDestino(d: string | null | undefined, personales: CuentaPersonal[], sa: CuentaSA[], world: CuentaWorld[] = []): string {
  if (!d) return 'Sin indicar'
  if (d.startsWith('w:') && !world.some((x) => `w:${x.id}` === d)) return 'Cuenta de Monterroso World'
  const o = opcionesDestino(personales, sa, d, world).find((x) => x.valor === d)
  if (!o) return 'Cuenta quitada'
  return o.grupo === 'Otro' ? o.nombre : o.grupo === 'Efectivo' ? `Efectivo · ${o.nombre}` : o.grupo === 'Cuentas de la S.A.' ? `S.A. · ${o.nombre}` : `Personal · ${o.nombre}`
}
