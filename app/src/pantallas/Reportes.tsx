import Pasos from '../componentes/Pasos'
import { FileDown, FileSpreadsheet } from 'lucide-react'
import { useMemo, useState } from 'react'
import Pestanas from '../componentes/Pestanas'
import Tabla from '../componentes/Tabla'
import { aCSV, descargar } from '../lib/csv'
import { aCentavos, deCentavos, quetzales } from '../lib/dinero'
import { nombreMes, partes } from '../lib/fechas'
import { mesesEntre, movimientos, periodoDe, resultado, sumar } from '../lib/finanzas'
import { esc, imprimir } from '../lib/imprimir'
import { useModelo } from '../lib/modelo'
import { useHoy } from '../lib/usos'
import { costoYGanancia } from './gastos/PorCliente'

type Vista = 'resultados' | 'clientes' | 'flujo'

export default function Reportes() {
  const m = useModelo()
  const hoy = useHoy()
  const [vista, setVista] = useState<Vista>('resultados')
  const [anio, setAnio] = useState(hoy.slice(0, 4))
  const [negocio, setNegocio] = useState('')
  const movs = useMemo(() => movimientos(m, `${anio}-01-01`, `${anio}-12-31`, hoy).filter((x) => !negocio || x.negocio_id === negocio), [m, anio, hoy, negocio])
  const anios = [...new Set([hoy.slice(0, 4), ...m.pagos.map((p) => p.fecha.slice(0, 4)), ...m.gastos.map((g) => g.fecha.slice(0, 4)), ...m.ventas.map((v) => v.fecha.slice(0, 4))])].sort().reverse()
  const meses = mesesEntre(`${anio}-01`, `${anio}-12`)
  const nomMes = (p: string) => { const [a, mm] = partes(`${p}-01`); return nombreMes(a, mm) }
  const nomNeg = negocio ? m.negocios.find((n) => n.id === negocio)?.nombre ?? '' : 'Todos los negocios'
  const r = resultado(movs)

  const porCategoria = (tipo: 'ingreso' | 'gasto') => m.categorias.filter((c) => c.tipo === tipo).map((c) => ({ c, total: sumar(movs, (x) => x.tipo === tipo && x.categoria_id === c.id) })).filter((x) => x.total !== 0)
  const sinCat = (tipo: 'ingreso' | 'gasto') => sumar(movs, (x) => x.tipo === tipo && !x.categoria_id)
  const ingresosCat = porCategoria('ingreso')
  const gastosCat = porCategoria('gasto')

  let acumulado = 0
  const flujo = meses.map((p) => {
    const e = sumar(movs, (x) => x.tipo === 'ingreso' && periodoDe(x.fecha) === p)
    const s = sumar(movs, (x) => x.tipo === 'gasto' && periodoDe(x.fecha) === p)
    acumulado += aCentavos(e) - aCentavos(s)
    return { p, e, s, neto: deCentavos(aCentavos(e) - aCentavos(s)), acumulado: deCentavos(acumulado) }
  })
  const clientes = m.clientes.map((c) => ({ c, ...costoYGanancia(m, c.id, anio) })).filter((x) => x.ingresos || x.costo).sort((a, b) => b.ganancia - a.ganancia)

  const filasExport = (): (string | number)[][] => {
    if (vista === 'resultados') return [['Estado de resultados', nomNeg, anio], [], ['Ingresos'], ...ingresosCat.map((x) => [x.c.nombre, x.total]), ['Total ingresos', r.ingresos], [], ['Gastos'], ...gastosCat.map((x) => [x.c.nombre, x.total]), ...(sinCat('gasto') ? [['Sin categoría', sinCat('gasto')]] : []), ['Total gastos', r.gastos], [], ['Utilidad', r.utilidad]]
    if (vista === 'flujo') return [['Flujo de caja', nomNeg, anio], ['Mes', 'Entradas', 'Salidas', 'Neto', 'Acumulado'], ...flujo.map((x) => [nomMes(x.p), x.e, x.s, x.neto, x.acumulado])]
    return [['Costo y ganancia por cliente', anio], ['Cliente', 'Ingresos', 'Costo', 'Ganancia'], ...clientes.map((x) => [x.c.nombre, x.ingresos, x.costo, x.ganancia])]
  }
  const nombreArchivo = `${vista === 'resultados' ? 'estado-de-resultados' : vista === 'flujo' ? 'flujo-de-caja' : 'ganancia-por-cliente'}-${anio}.csv`
  const pdf = () => {
    const f = filasExport()
    const titulo = String(f[0][0])
    const cuerpo = f.slice(1).filter((x) => x.length).map((x, i) => `<tr${/^Total|^Utilidad/.test(String(x[0])) ? ' style="font-weight:600;background:#f7f2ea"' : ''}>${x.map((v, j) => (i === 0 && vista !== 'resultados' ? `<th${j ? ' class="n"' : ''}>${esc(v)}</th>` : `<td${typeof v === 'number' ? ' class="n"' : ''}>${esc(typeof v === 'number' ? quetzales(v) : v)}</td>`)).join('')}</tr>`).join('')
    imprimir(`${titulo} ${anio}`, `<h1>${esc(titulo)}</h1><p class="sub">${esc(vista === 'clientes' ? 'Dev Studio' : nomNeg)} · ${esc(anio)}</p><table><tbody>${cuerpo}</tbody></table>`, esc(anio))
  }

  return (
    <>
      <div className="c-cabeza">
        <div><span className="m-etiqueta">Todos los negocios</span><h1 className="erp-titulo">Reportes</h1><Pasos /></div>
        <div className="c-cabeza-acciones">
          <button type="button" className="m-btn m-btn-salida" onClick={() => descargar(nombreArchivo, aCSV(filasExport()))} title="Descargar este reporte para abrirlo en Excel"><FileSpreadsheet size={16} aria-hidden /> Excel</button>
          <button type="button" className="m-btn m-btn-salida" onClick={pdf} title="Abrir este reporte para guardarlo en PDF o imprimirlo"><FileDown size={16} aria-hidden /> PDF</button>
        </div>
      </div>
      <Pestanas etiqueta="Reporte" valor={vista} onCambio={setVista} opciones={[{ valor: 'resultados', nombre: 'Estado de resultados' }, { valor: 'flujo', nombre: 'Flujo de caja' }, { valor: 'clientes', nombre: 'Ganancia por cliente' }]} />
      <div className="c-herramientas">
        <div className="c-chips" role="group" aria-label="Año">
          {anios.map((a) => <button key={a} type="button" className="m-chip" aria-pressed={anio === a} onClick={() => setAnio(a)} title={`Ver ${a}`}>{a}</button>)}
        </div>
        {vista !== 'clientes' && (
          <div className="c-chips" role="group" aria-label="Negocio">
            <button type="button" className="m-chip" aria-pressed={!negocio} onClick={() => setNegocio('')} title="Todos los negocios juntos">Todos</button>
            {m.negocios.filter((n) => n.activo).map((n) => <button key={n.id} type="button" className="m-chip" aria-pressed={negocio === n.id} onClick={() => setNegocio(n.id)} title={`Solo ${n.nombre}`}>{n.nombre}</button>)}
          </div>
        )}
      </div>

      {vista === 'resultados' && (
        <>
          <div className="erp-kpis">
            <div className="erp-kpi exito"><span className="m-etiqueta">Ingresos {anio}</span><b>{quetzales(r.ingresos)}</b></div>
            <div className="erp-kpi peligro"><span className="m-etiqueta">Gastos {anio}</span><b>{quetzales(r.gastos)}</b></div>
            <div className="erp-kpi"><span className="m-etiqueta">Utilidad {anio}</span><b className={`${r.utilidad < 0 ? ' m-negativo' : ''}`}>{quetzales(r.utilidad)}</b></div>
          </div>
          <div className="c-dos">
            <Tabla titulo="Ingresos" filas={ingresosCat} clave={(x) => x.c.id} vacio="Sin ingresos en el año." columnas={[{ titulo: 'Categoría', principal: true, valor: (x) => x.c.nombre }, { titulo: 'Total', num: true, valor: (x) => quetzales(x.total) }]} pie={<tr><td>Total</td><td className="m-num">{quetzales(r.ingresos)}</td></tr>} />
            <Tabla titulo="Gastos" filas={gastosCat} clave={(x) => x.c.id} vacio="Sin gastos en el año." columnas={[{ titulo: 'Categoría', principal: true, valor: (x) => x.c.nombre }, { titulo: 'Total', num: true, valor: (x) => quetzales(x.total) }]} pie={<tr><td>Total</td><td className="m-num">{quetzales(r.gastos)}</td></tr>} />
          </div>
          <Tabla titulo="Mes a mes" filas={meses} clave={(p) => p} vacio=""
            columnas={[
              { titulo: 'Mes', principal: true, valor: (p) => nomMes(p) },
              { titulo: 'Ingresos', num: true, valor: (p) => quetzales(sumar(movs, (x) => x.tipo === 'ingreso' && periodoDe(x.fecha) === p)) },
              { titulo: 'Gastos', num: true, valor: (p) => quetzales(sumar(movs, (x) => x.tipo === 'gasto' && periodoDe(x.fecha) === p)) },
              { titulo: 'Utilidad', num: true, valor: (p) => { const u = resultado(movs.filter((x) => periodoDe(x.fecha) === p)).utilidad; return <span className={u < 0 ? 'm-negativo' : undefined}>{quetzales(u)}</span> } },
            ]} />
        </>
      )}

      {vista === 'flujo' && (
        <Tabla titulo={`Flujo de caja ${anio}`} nota="Entradas: cobros, ventas y salario. Salidas: gastos, costos de pedidos y pagos de deudas." filas={flujo} clave={(x) => x.p} vacio=""
          columnas={[
            { titulo: 'Mes', principal: true, valor: (x) => nomMes(x.p) },
            { titulo: 'Entradas', num: true, valor: (x) => quetzales(x.e) },
            { titulo: 'Salidas', num: true, valor: (x) => quetzales(x.s) },
            { titulo: 'Neto', num: true, valor: (x) => <span className={x.neto < 0 ? 'm-negativo' : undefined}>{quetzales(x.neto)}</span> },
            { titulo: 'Acumulado', num: true, valor: (x) => <span className={x.acumulado < 0 ? 'm-negativo' : undefined}>{quetzales(x.acumulado)}</span> },
          ]}
          pie={<tr><td>Año</td><td className="m-num">{quetzales(r.ingresos)}</td><td className="m-num">{quetzales(r.gastos)}</td><td className="m-num">{quetzales(r.utilidad)}</td><td /></tr>} />
      )}

      {vista === 'clientes' && (
        <Tabla titulo={`Ganancia por cliente ${anio}`} filas={clientes} clave={(x) => x.c.id} vacio="Sin pagos ni gastos de clientes en el año."
          columnas={[
            { titulo: 'Cliente', principal: true, valor: (x) => x.c.nombre },
            { titulo: 'Ingresos', num: true, valor: (x) => quetzales(x.ingresos) },
            { titulo: 'Costo', num: true, valor: (x) => quetzales(x.costo) },
            { titulo: 'Ganancia', num: true, valor: (x) => <span className={x.ganancia < 0 ? 'm-negativo' : undefined}>{quetzales(x.ganancia)}</span> },
          ]} />
      )}
    </>
  )
}
