import { CheckCircle2, CircleAlert, FileDown, FileSpreadsheet } from 'lucide-react'
import { useMemo, useState } from 'react'
import Pasos from '../../componentes/Pasos'
import Pestanas from '../../componentes/Pestanas'
import SelectorMes from '../../componentes/SelectorMes'
import { aCSV, descargar } from '../../lib/csv'
import { aCentavos, deCentavos } from '../../lib/dinero'
import { fechaLarga, nombreMes, partes } from '../../lib/fechas'
import { rangoMes, resultado, sumar, sumarMeses } from '../../lib/finanzas'
import { esc, imprimir, SELLO } from '../../lib/imprimir'
import type { Modelo } from '../../lib/modelo'
import type { Balance2, LineaBalance } from '../../lib/saBalance'
import { balanceDe, movimientosSA, useSA } from '../../lib/saModelo'
import { useHoy, usePeriodo } from '../../lib/usos'

type Alcance = 'mes' | 'anio'
type Tipo = 'grupo' | 'linea' | 'subtotal' | 'total' | 'resultado'
interface Fila { t: string; tipo: Tipo; nivel: 0 | 1 | 2; v: (number | null)[]; nota?: number }

export function cifra(n: number | null): string {
  if (n == null) return ''
  if (Math.abs(n) < 0.005) return '—'
  const s = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(n))
  return n < 0 ? `(${s})` : s
}

function filasResultado(m: Modelo, rangos: [string, string][]): Fila[] {
  const movs = rangos.map(([d, h]) => movimientosSA(m, d, h))
  const r = movs.map((x) => resultado(x))
  const cats = (tipo: 'ingreso' | 'gasto') => {
    const l = m.categorias.filter((c) => c.tipo === tipo).map((c) => ({ t: c.nombre, v: movs.map((x) => sumar(x, (y) => y.tipo === tipo && y.categoria_id === c.id)) }))
    const sin = movs.map((x) => sumar(x, (y) => y.tipo === tipo && !y.categoria_id))
    return [...l, { t: tipo === 'ingreso' ? 'Otros ingresos' : 'Otros gastos', v: sin }].filter((x) => x.v.some((y) => y !== 0))
  }
  return [
    { t: 'Ingresos', tipo: 'grupo', nivel: 0, v: [] },
    ...cats('ingreso').map((x): Fila => ({ t: x.t, tipo: 'linea', nivel: 1, v: x.v })),
    { t: 'Total ingresos', tipo: 'subtotal', nivel: 1, v: r.map((x) => x.ingresos) },
    { t: 'Gastos', tipo: 'grupo', nivel: 0, v: [] },
    ...cats('gasto').map((x): Fila => ({ t: x.t, tipo: 'linea', nivel: 1, v: x.v.map((y) => -y) })),
    { t: 'Total gastos', tipo: 'subtotal', nivel: 1, v: r.map((x) => -x.gastos) },
    { t: 'Utilidad (pérdida) del período', tipo: 'resultado', nivel: 0, v: r.map((x) => x.utilidad) },
  ]
}

function filasBalance(bs: (Balance2 | null)[], notas: string[]): Fila[] {
  const llaves = (sel: (b: Balance2) => LineaBalance[]) => [...new Map(bs.flatMap((b) => (b ? sel(b) : [])).map((x) => [x.k, x])).values()]
  const valor = (sel: (b: Balance2) => LineaBalance[], k: string) => bs.map((b) => (b ? sel(b).find((x) => x.k === k)?.monto ?? 0 : null))
  const nota = (n?: string) => { if (!n) return undefined; const i = notas.indexOf(n); if (i >= 0) return i + 1; notas.push(n); return notas.length }
  const bloque = (titulo: string, sel: (b: Balance2) => LineaBalance[]): Fila[] => {
    const l = llaves(sel)
    if (!l.length) return []
    return [
      { t: titulo, tipo: 'grupo', nivel: 1, v: [] },
      ...l.map((x): Fila => ({ t: x.texto, tipo: 'linea', nivel: 2, v: valor(sel, x.k), nota: nota(x.nota) })),
      { t: `Total ${titulo.toLowerCase()}`, tipo: 'subtotal', nivel: 2, v: bs.map((b) => (b ? deCentavos(sel(b).reduce((t, x) => t + aCentavos(x.monto), 0)) : null)) },
    ]
  }
  return [
    { t: 'Activo', tipo: 'grupo', nivel: 0, v: [] },
    ...bloque('Activo corriente', (b) => b.activoCorriente),
    ...bloque('Activo no corriente', (b) => b.activoNoCorriente),
    { t: 'Total activo', tipo: 'total', nivel: 0, v: bs.map((b) => b?.activo ?? null) },
    { t: 'Pasivo', tipo: 'grupo', nivel: 0, v: [] },
    ...bloque('Pasivo corriente', (b) => b.pasivoCorriente),
    ...bloque('Pasivo no corriente', (b) => b.pasivoNoCorriente),
    { t: 'Total pasivo', tipo: 'subtotal', nivel: 0, v: bs.map((b) => b?.pasivo ?? null) },
    { t: 'Patrimonio', tipo: 'grupo', nivel: 0, v: [] },
    ...llaves((b) => b.patrimonio).map((x): Fila => ({ t: x.texto, tipo: 'linea', nivel: 1, v: valor((b) => b.patrimonio, x.k), nota: nota(x.nota) })),
    { t: 'Total patrimonio', tipo: 'subtotal', nivel: 0, v: bs.map((b) => b?.totalPatrimonio ?? null) },
    { t: 'Total pasivo y patrimonio', tipo: 'total', nivel: 0, v: bs.map((b) => (b ? deCentavos(aCentavos(b.pasivo) + aCentavos(b.totalPatrimonio)) : null)) },
  ]
}

function TablaEstado({ filas, columnas }: { filas: Fila[]; columnas: string[] }) {
  return (
    <div className="c-ef-envoltura">
      <table className="c-ef">
        <thead><tr><th>Concepto</th><th className="c-ef-nota">Notas</th>{columnas.map((c) => <th key={c} className="m-num">{c}</th>)}</tr></thead>
        <tbody>
          {filas.map((f, i) => (
            <tr key={i} className={`c-ef-${f.tipo}`}>
              <td className={`c-ef-n${f.nivel}`}>{f.t}</td>
              <td className="c-ef-nota">{f.nota ?? ''}</td>
              {f.tipo === 'grupo' ? columnas.map((c) => <td key={c} />) : f.v.map((v, j) => <td key={j} className={`m-num${v != null && v < 0 ? ' c-ef-neg' : ''}`}>{cifra(v)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const ESTILO_FILA: Record<Tipo, string> = { grupo: '', linea: '', subtotal: 'font-weight:600;border-top:1px solid #152736', total: 'font-weight:700;border-top:1px solid #152736;border-bottom:3px double #152736', resultado: 'font-weight:700;border-top:1px solid #152736;border-bottom:3px double #152736' }

function htmlEstado(filas: Fila[], columnas: string[]): string {
  return `<table class="ef"><thead><tr><th>Concepto</th><th style="width:44px;text-align:center">Notas</th>${columnas.map((c) => `<th class="n">${esc(c)}</th>`).join('')}</tr></thead><tbody>${filas.map((f) => `<tr><td style="padding-left:${8 + f.nivel * 16}px;${f.tipo === 'grupo' || f.tipo === 'total' || f.tipo === 'resultado' ? 'font-weight:700' : ''}">${esc(f.t)}</td><td style="text-align:center">${f.nota ?? ''}</td>${f.tipo === 'grupo' ? columnas.map(() => '<td></td>').join('') : f.v.map((v) => `<td class="n" style="${ESTILO_FILA[f.tipo]}">${esc(cifra(v))}</td>`).join('')}</tr>`).join('')}</tbody></table>`
}

export default function EstadosSA() {
  const { m, s, inicio } = useSA()
  const hoy = useHoy()
  const [periodo, setPeriodo] = usePeriodo()
  const [alcance, setAlcance] = useState<Alcance>('mes')
  const anio = Number(periodo.slice(0, 4))
  const anterior = sumarMeses(periodo, -1)
  const rangos: [string, string][] = alcance === 'mes' ? [rangoMes(periodo), rangoMes(anterior)] : [[`${anio}-01-01`, `${anio}-12-31`], [`${anio - 1}-01-01`, `${anio - 1}-12-31`]]
  const mesNombre = (p: string) => { const [a, mm] = partes(`${p}-01`); return nombreMes(a, mm) }
  const columnas = alcance === 'mes' ? [mesNombre(periodo), mesNombre(anterior)] : [String(anio), String(anio - 1)]
  const cortes = rangos.map(([, h]) => (h < hoy ? h : hoy))
  const er = useMemo(() => filasResultado(m, rangos), [m, rangos[0][0], rangos[1][0]])
  const bs = useMemo(() => cortes.map((c) => balanceDe(m, c)), [m, cortes[0], cortes[1]])
  const notas: string[] = []
  const bg = filasBalance(bs, notas)
  const colBalance = cortes.map((c) => `Al ${fechaLarga(c)}`)
  const nombre = s?.denominacion || 'Sociedad anónima'
  const periodoTexto = alcance === 'mes' ? `Del ${fechaLarga(rangos[0][0])} al ${fechaLarga(rangos[0][1])}` : `Del 1 de enero al 31 de diciembre de ${anio}`
  const diferencia = bs[0]?.diferencia ?? 0
  const cuadra = Math.abs(diferencia) < 0.005

  const encabezado = (estado: string, sub: string) => `<div class="ef-cab"><b>${esc(nombre)}</b>${s?.nit ? `<span>NIT ${esc(s.nit)}</span>` : ''}<b>${esc(estado)}</b><span>${esc(sub)}</span><span>Cifras expresadas en quetzales</span></div>`
  const pdf = () => imprimir(`Estados financieros ${nombre}`, `<style>.ef-cab{text-align:center;display:grid;gap:2px;margin:6px 0 12px}.ef-cab b{font-size:11pt}.ef td,.ef th{padding:5px 8px}</style>
    ${encabezado('Estado de resultados', periodoTexto)}${htmlEstado(er, columnas)}
    <div style="page-break-before:always"></div>
    ${encabezado('Balance general', `Al ${fechaLarga(cortes[0])}, comparado con el ${fechaLarga(cortes[1])}`)}${htmlEstado(bg, colBalance)}
    <p style="font-weight:600">${cuadra ? 'Total activo = Total pasivo y patrimonio: cuadra.' : `No cuadra por ${esc(cifra(diferencia))}. ${esc(bs[0]?.explicacion ?? '')}`}</p>
    ${notas.length ? `<h2>Notas</h2><ol>${notas.map((n) => `<li>${esc(n)}</li>`).join('')}</ol>` : ''}
    ${s?.representante ? `<div class="firmas"><div>${esc(s.representante)}<br>${esc(s.representante_cargo || 'Representante legal')}</div><div>Contador</div></div>` : ''}${SELLO}`, esc(fechaLarga(cortes[0])))
  const filaCsv = (f: Fila, n: number) => [`${'  '.repeat(f.nivel)}${f.t}`, f.nota ?? '', ...(f.tipo === 'grupo' ? Array(n).fill('') : f.v.map((v) => (v == null ? '' : v.toFixed(2))))]
  const excel = () => descargar(`estados-financieros-${alcance === 'mes' ? periodo : anio}.csv`, aCSV([
    [nombre], ['Estado de resultados', periodoTexto], ['Cifras expresadas en quetzales'], ['Concepto', 'Notas', ...columnas], ...er.map((f) => filaCsv(f, 2)),
    [], ['Balance general'], ['Concepto', 'Notas', ...colBalance], ...bg.map((f) => filaCsv(f, 2)),
    [], [cuadra ? 'Cuadra' : `No cuadra por ${diferencia.toFixed(2)}`], ...notas.map((n, i) => [`Nota ${i + 1}`, n]),
  ]))

  return (
    <>
      <div className="c-cabeza">
        <div><span className="m-etiqueta">Sociedad anónima</span><h1 className="erp-titulo">Estados financieros</h1><Pasos /><p className="c-subtitulo">Estado de resultados y balance general de la sociedad, comparados con el período anterior.</p></div>
        <div className="c-cabeza-acciones">
          <SelectorMes periodo={periodo} onCambio={setPeriodo} />
          <button type="button" className="m-btn m-btn-salida" onClick={excel} title="Baja los dos estados a Descargas para abrirlos en Excel"><FileSpreadsheet size={16} aria-hidden /> Excel</button>
          <button type="button" className="m-btn m-btn-salida" onClick={pdf} title="Abre los estados con el formato de la firma para guardarlos en PDF o imprimirlos"><FileDown size={16} aria-hidden /> PDF</button>
        </div>
      </div>
      <Pestanas etiqueta="Período" valor={alcance} onCambio={setAlcance} opciones={[{ valor: 'mes', nombre: 'Del mes' }, { valor: 'anio', nombre: 'Del año' }]} />
      {!inicio ? <div className="m-vacio m-tarjeta"><b>Sin fecha de inicio de operaciones</b><span>Ponla en la ficha de la sociedad: desde ese día, lo de Dev Studio, Música y Diseño cuenta para la sociedad.</span></div> : (
        <>
          <section className="m-tarjeta c-ef-hoja">
            <header className="c-ef-cab"><b>{nombre}</b><b>Estado de resultados</b><span>{periodoTexto}</span><span>Cifras expresadas en quetzales</span></header>
            <TablaEstado filas={er} columnas={columnas} />
          </section>
          <section className="m-tarjeta c-ef-hoja">
            <header className="c-ef-cab"><b>{nombre}</b><b>Balance general</b><span>Al {fechaLarga(cortes[0])}, comparado con el {fechaLarga(cortes[1])}</span><span>Cifras expresadas en quetzales</span></header>
            <TablaEstado filas={bg} columnas={colBalance} />
            <div className={`c-ef-cuadre ${cuadra ? 'c-ef-ok' : 'c-ef-mal'}`}>
              <span>Total activo = Total pasivo y patrimonio</span>
              {cuadra ? <span className="m-estado aprobado"><CheckCircle2 size={14} aria-hidden /> Cuadra</span> : <span className="m-estado error"><CircleAlert size={14} aria-hidden /> No cuadra por Q {cifra(diferencia)}</span>}
            </div>
            {!cuadra && bs[0]?.explicacion && <p className="c-alerta-txt">{bs[0].explicacion}</p>}
            {notas.length > 0 && <ol className="c-ef-notas">{notas.map((n, i) => <li key={i}>{n}</li>)}</ol>}
          </section>
        </>
      )}
    </>
  )
}
