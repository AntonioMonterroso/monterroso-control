import { FileDown, FileSpreadsheet } from 'lucide-react'
import { useMemo, useState } from 'react'
import Pestanas from '../../componentes/Pestanas'
import SelectorMes from '../../componentes/SelectorMes'
import { aCSV, descargar } from '../../lib/csv'
import { aCentavos, deCentavos, quetzales } from '../../lib/dinero'
import { fechaLarga } from '../../lib/fechas'
import { rangoMes, resultado, sumar } from '../../lib/finanzas'
import { esc, imprimir, SELLO } from '../../lib/imprimir'
import { balanceSA, movimientosSA, useSA } from '../../lib/saModelo'
import { useHoy, usePeriodo } from '../../lib/usos'

type Alcance = 'mes' | 'anio'

export default function EstadosSA() {
  const { m, s, inicio } = useSA()
  const hoy = useHoy()
  const [periodo, setPeriodo] = usePeriodo()
  const [alcance, setAlcance] = useState<Alcance>('mes')
  const [desde, hasta] = alcance === 'mes' ? rangoMes(periodo) : [`${periodo.slice(0, 4)}-01-01`, `${periodo.slice(0, 4)}-12-31`]
  const corte = hasta < hoy ? hasta : hoy
  const movs = useMemo(() => movimientosSA(m, desde, hasta), [m, desde, hasta])
  const r = resultado(movs)
  const cat = (tipo: 'ingreso' | 'gasto') => m.categorias.filter((c) => c.tipo === tipo).map((c) => ({ n: c.nombre, t: sumar(movs, (x) => x.tipo === tipo && x.categoria_id === c.id) })).filter((x) => x.t !== 0)
  const sinCat = (tipo: 'ingreso' | 'gasto') => sumar(movs, (x) => x.tipo === tipo && !x.categoria_id)
  const ing = [...cat('ingreso'), ...(sinCat('ingreso') ? [{ n: 'Otros ingresos', t: sinCat('ingreso') }] : [])]
  const gas = [...cat('gasto'), ...(sinCat('gasto') ? [{ n: 'Otros gastos', t: sinCat('gasto') }] : [])]
  const b = balanceSA(m, corte, hoy)
  const nombre = s?.denominacion || 'Sociedad anónima'
  const titulo = alcance === 'mes' ? `del ${fechaLarga(desde)} al ${fechaLarga(hasta)}` : `del 1 de enero al 31 de diciembre de ${periodo.slice(0, 4)}`

  const filasER: [string, number | null, boolean?][] = [['Ingresos', null], ...ing.map((x): [string, number] => [x.n, x.t]), ['Total ingresos', r.ingresos, true], ['Gastos', null], ...gas.map((x): [string, number] => [x.n, x.t]), ['Total gastos', r.gastos, true], [r.utilidad >= 0 ? 'Utilidad del período' : 'Pérdida del período', r.utilidad, true]]
  const filasBG: [string, number | null, boolean?][] = [
    ['Activo', null], ['Bancos', b.bancos], ['Cuentas por cobrar', b.porCobrar], ['Total activo', b.activo, true],
    ['Pasivo', null], ['Deudas', b.deudas], ['ISR de dividendos por pagar', b.isrPorPagar], ['Dividendos por pagar', b.dividendosPorPagar], ['Total pasivo', b.pasivo, true],
    ['Patrimonio', null], ['Capital pagado', b.capitalPagado], ['Reserva legal', b.reserva], ['Utilidades acumuladas', b.acumuladas], ['Total patrimonio', b.patrimonio, true],
    ['Total pasivo y patrimonio', deCentavos(aCentavos(b.pasivo) + aCentavos(b.patrimonio)), true],
    ...(b.diferencia !== 0 ? [['Diferencia por conciliar (efectivo fuera de bancos o movimientos sin pasar a Bancos)', b.diferencia] as [string, number]] : []),
  ]
  const html = (f: [string, number | null, boolean?][]) => f.map(([n, v, t]) => (v == null ? `<tr><td colspan="2" style="font-weight:700;padding-top:14px">${esc(n)}</td></tr>` : `<tr${t ? ' style="font-weight:700;background:#f1f5f9"' : ''}><td>${esc(n)}</td><td class="n">${esc(quetzales(v))}</td></tr>`)).join('')
  const pdf = () => imprimir(`Estados financieros ${nombre}`, `
    <h1>${esc(nombre)}</h1><p class="sub">${s?.nit ? `NIT ${esc(s.nit)} · ` : ''}Cifras en quetzales</p>
    <h1 style="font-size:12pt;margin-top:18px">Estado de resultados</h1><p class="sub">${esc(titulo)}</p>
    <table><thead><tr><th>Concepto</th><th class="n">Monto</th></tr></thead><tbody>${html(filasER)}</tbody></table>
    <h1 style="font-size:12pt;margin-top:18px">Balance general</h1><p class="sub">Al ${esc(fechaLarga(corte))}</p>
    <table><thead><tr><th>Concepto</th><th class="n">Monto</th></tr></thead><tbody>${html(filasBG)}</tbody></table>
    ${s?.representante ? `<div class="firmas"><div>${esc(s.representante)}<br>${esc(s.representante_cargo || 'Representante legal')}</div><div>Contador</div></div>` : ''}${SELLO}`, esc(fechaLarga(corte)))
  const excel = () => descargar(`estados-financieros-${alcance === 'mes' ? periodo : periodo.slice(0, 4)}.csv`, aCSV([[nombre], ['Estado de resultados', titulo], ...filasER.map(([n, v]) => [n, v ?? '']), [], ['Balance general', `Al ${fechaLarga(corte)}`], ...filasBG.map(([n, v]) => [n, v ?? ''])]))
  const Fila = ({ f }: { f: [string, number | null, boolean?][] }) => (
    <div className="m-tabla-envoltura c-tabla-erp c-estado-fin">
      <table className="m-tabla"><tbody>{f.map(([n, v, t], i) => (v == null ? <tr key={i} className="c-ef-grupo"><td colSpan={2}>{n}</td></tr> : <tr key={i} className={t ? 'c-ef-total' : undefined}><td>{n}</td><td className={`m-num${v < 0 ? ' m-negativo' : ''}`}>{quetzales(v)}</td></tr>))}</tbody></table>
    </div>
  )
  return (
    <>
      <div className="c-cabeza">
        <div><span className="m-etiqueta">Sociedad anónima</span><h1 className="erp-titulo">Estados financieros</h1></div>
        <div className="c-cabeza-acciones">
          <SelectorMes periodo={periodo} onCambio={setPeriodo} />
          <button type="button" className="m-btn m-btn-salida" onClick={excel} title="Bajar los estados para abrirlos en Excel"><FileSpreadsheet size={16} aria-hidden /> Excel</button>
          <button type="button" className="m-btn m-btn-salida" onClick={pdf} title="Abrir los estados con el formato de la firma para guardarlos en PDF"><FileDown size={16} aria-hidden /> PDF</button>
        </div>
      </div>
      <Pestanas etiqueta="Período" valor={alcance} onCambio={setAlcance} opciones={[{ valor: 'mes', nombre: 'Del mes' }, { valor: 'anio', nombre: 'Del año' }]} />
      {!inicio && <div className="m-vacio m-tarjeta"><b>Sin fecha de inicio de operaciones</b><span>Ponla en la ficha de la sociedad: desde ese día, lo de Dev Studio, Música y Diseño cuenta para la sociedad.</span></div>}
      <div className="c-dos">
        <section><h2 className="m-seccion-titulo">Estado de resultados</h2><p className="m-texto-suave">{titulo}</p><Fila f={filasER} /></section>
        <section><h2 className="m-seccion-titulo">Balance general</h2><p className="m-texto-suave">Al {fechaLarga(corte)}</p><Fila f={filasBG} /></section>
      </div>
    </>
  )
}
