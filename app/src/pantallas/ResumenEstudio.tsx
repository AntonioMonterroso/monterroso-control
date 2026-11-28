import { Link } from 'react-router-dom'
import ResumenNegocio from '../componentes/ResumenNegocio'
import Tabla from '../componentes/Tabla'
import { aCentavos, deCentavos, quetzales } from '../lib/dinero'
import type { ClaveEstudio } from '../lib/estudio'
import { useModelo } from '../lib/modelo'
import { useCobros } from '../lib/usos'
import ParaNoOlvidar from './desarrollo/ParaNoOlvidar'

export default function ResumenEstudio({ negocioClave }: { negocioClave: ClaveEstudio }) {
  const m = useModelo()
  const cobros = useCobros()
  const negocio = m.negocios.find((n) => n.clave === negocioClave)
  const clientes = m.clientes.filter((c) => c.negocio_id === negocio?.id && !c.archivado)
  const filas = clientes
    .map((c) => {
      const suyos = cobros.filter((x) => x.cliente_id === c.id && x.tipo !== 'salario' && x.saldo > 0)
      const vencido = deCentavos(suyos.filter((x) => x.estado === 'vencido').reduce((s, x) => s + aCentavos(x.saldo), 0))
      const debe = deCentavos(suyos.reduce((s, x) => s + aCentavos(x.saldo), 0))
      return { c, debe, vencido }
    })
    .filter((f) => f.debe > 0)
    .sort((a, b) => b.vencido - a.vencido || b.debe - a.debe)
  const total = deCentavos(filas.reduce((s, f) => s + aCentavos(f.debe), 0))
  const totalVencido = deCentavos(filas.reduce((s, f) => s + aCentavos(f.vencido), 0))
  return (
    <ResumenNegocio clave={negocioClave} titulo="Tus clientes">
      {negocioClave === 'dev' && <ParaNoOlvidar limite={5} ocultarVacio />}
      <Tabla
        titulo={`Clientes que te deben · ${filas.length}`}
        filas={filas}
        clave={(f) => f.c.id}
        vacio={clientes.length ? 'Ningún cliente te debe. Todo cobrado.' : 'Todavía no tienes clientes en este negocio.'}
        columnas={[
          { titulo: 'Cliente', principal: true, valor: (f) => <Link to={`/clientes/${encodeURIComponent(f.c.id)}`} className="c-enlace">{f.c.nombre}</Link>, orden: (f) => f.c.nombre.toLowerCase() },
          { titulo: 'Vencido', num: true, valor: (f) => (f.vencido > 0 ? <span className="m-negativo">{quetzales(f.vencido)}</span> : <span className="m-vacia">—</span>), orden: (f) => f.vencido },
          { titulo: 'Me debe', num: true, valor: (f) => quetzales(f.debe), orden: (f) => f.debe },
        ]}
        pie={<tr><td>Total</td><td className="m-num">{quetzales(totalVencido)}</td><td className="m-num">{quetzales(total)}</td></tr>}
      />
    </ResumenNegocio>
  )
}
