import { useState } from 'react'
import { Link } from 'react-router-dom'
import Tabla from '../../componentes/Tabla'
import { aCentavos, deCentavos, quetzales } from '../../lib/dinero'
import { useModelo } from '../../lib/modelo'
import { useHoy } from '../../lib/usos'

export function costoYGanancia(m: ReturnType<typeof useModelo>, clienteId: string, anio?: string) {
  const en = (f: string) => !anio || f.startsWith(anio)
  const ingresos = deCentavos(m.pagos.filter((p) => p.cliente_id === clienteId && en(p.fecha)).reduce((s, p) => s + aCentavos(p.monto), 0))
  const costo = deCentavos(m.gastos.filter((g) => g.cliente_id === clienteId && en(g.fecha)).reduce((s, g) => s + aCentavos(g.monto), 0))
  return { ingresos, costo, ganancia: deCentavos(aCentavos(ingresos) - aCentavos(costo)) }
}

export default function PorCliente() {
  const m = useModelo()
  const hoy = useHoy()
  const [anio, setAnio] = useState(hoy.slice(0, 4))
  const anios = [...new Set([hoy.slice(0, 4), ...m.pagos.map((p) => p.fecha.slice(0, 4)), ...m.gastos.map((g) => g.fecha.slice(0, 4))])].sort().reverse()
  const filas = m.clientes.map((c) => ({ c, ...costoYGanancia(m, c.id, anio || undefined) })).filter((x) => x.ingresos || x.costo).sort((a, b) => b.ganancia - a.ganancia)
  const t = filas.reduce((s, x) => ({ i: s.i + aCentavos(x.ingresos), c: s.c + aCentavos(x.costo) }), { i: 0, c: 0 })
  return (
    <>
      <div className="c-chips" role="group" aria-label="Año">
        {anios.map((a) => <button key={a} type="button" className="m-chip" aria-pressed={anio === a} onClick={() => setAnio(a)} title={`Ver ${a}`}>{a}</button>)}
        <button type="button" className="m-chip" aria-pressed={anio === ''} onClick={() => setAnio('')} title="Ver desde el inicio">Desde el inicio</button>
      </div>
      <Tabla
        titulo="Costo y ganancia por cliente"
        nota="Ingresos: pagos recibidos. Costo: gastos marcados con ese cliente."
        filas={filas}
        clave={(x) => x.c.id}
        vacio="Todavía no hay pagos ni gastos ligados a clientes."
        columnas={[
          { titulo: 'Cliente', principal: true, valor: (x) => <Link to={`/clientes/${encodeURIComponent(x.c.id ?? "")}`} className="c-enlace">{x.c.nombre}</Link> },
          { titulo: 'Ingresos', num: true, valor: (x) => quetzales(x.ingresos) },
          { titulo: 'Costo', num: true, valor: (x) => quetzales(x.costo) },
          { titulo: 'Ganancia', num: true, valor: (x) => <span className={x.ganancia < 0 ? 'm-negativo' : undefined}>{quetzales(x.ganancia)}</span> },
        ]}
        pie={<tr><td>Total</td><td className="m-num">{quetzales(deCentavos(t.i))}</td><td className="m-num">{quetzales(deCentavos(t.c))}</td><td className="m-num">{quetzales(deCentavos(t.i - t.c))}</td></tr>}
      />
    </>
  )
}
