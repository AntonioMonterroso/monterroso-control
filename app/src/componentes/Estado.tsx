import { ESTADOS, type EstadoProyecto } from '../lib/tipos'

export default function Estado({ valor }: { valor: EstadoProyecto }) {
  const e = ESTADOS.find((x) => x.valor === valor) ?? ESTADOS[0]
  return <span className={`m-estado ${e.clase}`}>{e.nombre}</span>
}
