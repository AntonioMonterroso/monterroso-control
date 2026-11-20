import { HandCoins, Pencil, Plus } from 'lucide-react'
import { useState } from 'react'
import FormRegistro from '../componentes/FormRegistro'
import Tabla from '../componentes/Tabla'
import { useDatos } from '../lib/datos'
import { quetzales } from '../lib/dinero'
import { fechaCorta, nombreMes, partes } from '../lib/fechas'
import { aumentoVigente, fechaPagoSalario, mesesEntre, netoSalario, sumarMeses } from '../lib/finanzas'
import { useModelo } from '../lib/modelo'
import { useCobros, useHoy } from '../lib/usos'
import { aCentavos, deCentavos } from '../lib/dinero'
import type { Cobro } from '../lib/cobros'
import { EstadoCobro } from './cobros/Cobros'
import { VentanaPago } from './cobros/Ventanas'
import type { AumentoSalario } from '../lib/tipos'
import { Link } from 'react-router-dom'

export default function Salario() {
  const { aumentos, pagos } = useModelo()
  const cobrosSal = useCobros().filter((c) => c.tipo === 'salario')
  const [recibir, setRecibir] = useState<Cobro | null>(null)
  const { guardar } = useDatos()
  const hoy = useHoy()
  const [editar, setEditar] = useState<AumentoSalario | 'nuevo' | null>(null)
  const periodo = hoy.slice(0, 7)
  const actual = aumentoVigente(aumentos, periodo)
  const meses = actual ? mesesEntre(sumarMeses(periodo, -11), periodo).reverse() : []
  const anio = hoy.slice(0, 4)
  const delAnio = deCentavos(pagos.filter((p) => p.cobro_clave.startsWith('s:') && p.fecha.startsWith(anio)).reduce((s, p) => s + aCentavos(p.monto), 0))
  const cobroDe = (p: string) => cobrosSal.find((c) => c.clave === `s:${p}`)
  const a = editar && editar !== 'nuevo' ? editar : null
  return (
    <>
      <div className="c-cabeza">
        <div><span className="m-etiqueta">Salario</span><h1 className="erp-titulo">Mi salario</h1></div>
        <button type="button" className="m-btn m-btn-primario" onClick={() => setEditar('nuevo')} title={actual ? 'Registrar un aumento desde un mes' : 'Poner tu salario'}><Plus size={16} aria-hidden /> {actual ? 'Registrar aumento' : 'Poner salario'}</button>
      </div>
      <p className="m-texto-suave c-intro">Es un monto fijo que se repite solo cada mes: sale en Cobros como «por recibir» y, al marcarlo recibido, entra a los ingresos. Cuando te suben el sueldo, registras el aumento desde ese mes. Sus gastos (transporte, tokens de API, internet…) se registran en <Link to="/gastos" className="c-enlace">Gastos</Link> con el negocio «Salario».</p>
      <div className="erp-kpis">
        <div className="erp-kpi exito"><span className="m-etiqueta">Neto mensual</span><b>{quetzales(netoSalario(actual))}</b><small>{actual ? `bruto ${quetzales(actual.bruto)} menos ${quetzales(actual.descuentos)}` : 'sin salario registrado'}</small></div>
        <div className="erp-kpi"><span className="m-etiqueta">Día de pago</span><b>{actual?.dia_pago ?? '—'}</b><small>de cada mes</small></div>
        <div className="erp-kpi"><span className="m-etiqueta">Recibido en {anio}</span><b>{quetzales(delAnio)}</b><small>lo marcado como recibido</small></div>
      </div>
      <Tabla
        titulo="Historial de aumentos"
        filas={[...aumentos].reverse()}
        clave={(x) => x.id}
        vacio="Todavía no has puesto tu salario."
        columnas={[
          { titulo: 'Desde', principal: true, valor: (x) => { const [y, mm] = partes(x.desde); return nombreMes(y, mm) } },
          { titulo: 'Bruto', num: true, valor: (x) => quetzales(x.bruto) },
          { titulo: 'Descuentos', num: true, valor: (x) => quetzales(x.descuentos) },
          { titulo: 'Neto', num: true, valor: (x) => quetzales(netoSalario(x)) },
          { titulo: 'Nota', valor: (x) => x.nota ?? '' },
        ]}
        acciones={(x) => <button type="button" className="m-icono-btn" onClick={() => setEditar(x)} aria-label="Editar" title="Corregir este monto"><Pencil aria-hidden /></button>}
      />
      {meses.length > 0 && (
        <Tabla
          titulo="Últimos 12 meses"
          filas={meses}
          clave={(p) => p}
          vacio=""
          columnas={[
            { titulo: 'Mes', principal: true, valor: (p) => { const [y, mm] = partes(`${p}-01`); return nombreMes(y, mm) } },
            { titulo: 'Fecha de pago', valor: (p) => { const x = aumentoVigente(aumentos, p); return x ? fechaCorta(fechaPagoSalario(x, p)) : '' } },
            { titulo: 'Neto', num: true, valor: (p) => { const x = aumentoVigente(aumentos, p); return x ? quetzales(netoSalario(x)) : <span className="m-vacia">Sin salario</span> } },
            { titulo: 'Estado', valor: (p) => { const c = cobroDe(p); return c ? <EstadoCobro c={c} /> : <span className="m-vacia">—</span> } },
          ]}
          acciones={(p) => { const c = cobroDe(p); return c && (c.estado === 'por_cobrar' || c.estado === 'vencido') ? <button type="button" className="m-btn m-btn-primario m-btn-sm" onClick={() => setRecibir(c)} title="Marcar que ya lo recibiste"><HandCoins size={14} aria-hidden /> Recibido</button> : null }}
        />
      )}
      <VentanaPago cobro={recibir} onCerrar={() => setRecibir(null)} />
      <FormRegistro
        abierta={editar != null}
        titulo={a ? 'Corregir salario' : actual ? 'Registrar aumento' : 'Poner salario'}
        campos={[
          { k: 'desde', etiqueta: 'Desde el mes de', tipo: 'fecha', requerido: true, ayuda: 'Cuenta todo el mes de esta fecha.' },
          { k: 'dia_pago', etiqueta: 'Día de pago', tipo: 'numero', requerido: true, min: 1, max: 31 },
          { k: 'bruto', etiqueta: 'Salario bruto', tipo: 'monto', requerido: true },
          { k: 'descuentos', etiqueta: 'Descuentos (IGSS, ISR, otros)', tipo: 'monto', requerido: true },
          { k: 'nota', etiqueta: 'Nota', tipo: 'texto', max: 300, ancho: true },
        ]}
        inicial={a ? (a as unknown as Record<string, unknown>) : { desde: `${periodo}-01`, dia_pago: actual?.dia_pago ?? 30, bruto: actual?.bruto.toFixed(2), descuentos: actual?.descuentos.toFixed(2) ?? '0' }}
        validar={(v) => {
          const b = Number((v.bruto ?? '').replace(/[^\d.]/g, '')), d = Number((v.descuentos ?? '').replace(/[^\d.]/g, ''))
          if (d > b) return 'Los descuentos no pueden pasar el bruto.'
          if (aumentos.some((x) => x.id !== a?.id && x.desde.slice(0, 7) === (v.desde ?? '').slice(0, 7))) return 'Ya hay un monto registrado desde ese mes.'
          return null
        }}
        onGuardar={async (d) => { await guardar('ctl_salario_aumentos', a?.id ?? null, { ...d, desde: `${String(d.desde).slice(0, 7)}-01` }) }}
        onCerrar={() => setEditar(null)}
      />
    </>
  )
}
