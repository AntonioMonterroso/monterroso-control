import { aCentavos, deCentavos } from './dinero'

export interface Traspaso { id: string; fecha: string; monto: number; de: string; a: string; nota: string | null; creado: string }

export interface MovDinero { destino: string | null; monto: number; fecha: string }

export interface SaldoCuenta { destino: string; inicial: number; entro: number; salio: number; traspasos: number; saldo: number }

export function saldoDe(destino: string, inicial: number, entradas: MovDinero[], salidas: MovDinero[], traspasos: Traspaso[], hasta?: string): SaldoCuenta {
  const dentro = (f: string) => !hasta || f <= hasta
  const suma = (l: MovDinero[]) => l.filter((x) => x.destino === destino && dentro(x.fecha)).reduce((t, x) => t + aCentavos(x.monto), 0)
  const entro = suma(entradas)
  const salio = suma(salidas)
  const tr = traspasos.filter((t) => dentro(t.fecha)).reduce((t, x) => t + (x.a === destino ? aCentavos(x.monto) : 0) - (x.de === destino ? aCentavos(x.monto) : 0), 0)
  return { destino, inicial, entro: deCentavos(entro), salio: deCentavos(salio), traspasos: deCentavos(tr), saldo: deCentavos(aCentavos(inicial) + entro - salio + tr) }
}
