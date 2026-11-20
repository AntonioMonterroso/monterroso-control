import { Plus } from 'lucide-react'
import { useState } from 'react'
import Buscador, { coincide } from '../../componentes/Buscador'
import Pasos from '../../componentes/Pasos'
import { saldoAnticipo } from '../../lib/anticipos'
import { quetzales } from '../../lib/dinero'
import { useModelo } from '../../lib/modelo'
import { useHoy } from '../../lib/usos'
import { TablaAnticipos, VentanaAnticipo } from './Anticipos'

export default function SaldoAFavor() {
  const m = useModelo()
  const hoy = useHoy()
  const [nuevo, setNuevo] = useState(false)
  const [q, setQ] = useState('')
  const [solo, setSolo] = useState(true)
  const cliente = (id: string) => m.clientes.find((c) => c.id === id)?.nombre ?? ''
  const lista = m.anticipos.filter((a) => (!solo || saldoAnticipo(a, m.pagos) > 0) && coincide(q, cliente(a.cliente_id), a.referencia, a.monto.toFixed(2)))
  const total = m.anticipos.reduce((t, a) => t + Math.round(saldoAnticipo(a, m.pagos) * 100), 0) / 100
  const conSaldo = new Set(m.anticipos.filter((a) => saldoAnticipo(a, m.pagos) > 0).map((a) => a.cliente_id)).size
  const aplicadoMes = m.pagos.filter((p) => p.forma === 'anticipo' && p.fecha.slice(0, 7) === hoy.slice(0, 7)).reduce((t, p) => t + Math.round(p.monto * 100), 0) / 100
  return (
    <>
      <div className="c-cabeza">
        <div><span className="m-etiqueta">Dinero</span><h1 className="erp-titulo">Saldo a favor de clientes</h1><Pasos /><p className="c-subtitulo">Dinero que los clientes te pagaron por adelantado y que todavía no se usa en sus cobros.</p></div>
        <div className="c-cabeza-acciones">
          <button type="button" className="m-btn m-btn-primario c-btn-principal" onClick={() => setNuevo(true)} title="Registra un pago adelantado que queda como saldo a favor del cliente"><Plus size={16} aria-hidden /> Registrar anticipo</button>
        </div>
      </div>
      <div className="erp-kpis">
        <div className="erp-kpi exito"><span className="m-etiqueta">Saldo a favor hoy</span><b>{quetzales(total)}</b><small>{conSaldo} {conSaldo === 1 ? 'cliente' : 'clientes'}</small></div>
        <div className="erp-kpi"><span className="m-etiqueta">Usado este mes</span><b>{quetzales(aplicadoMes)}</b><small>aplicado a sus cobros</small></div>
      </div>
      <div className="c-herramientas">
        <Buscador valor={q} onCambio={setQ} ayuda="Cliente, referencia o monto" />
        <div className="c-chips" role="group" aria-label="Ver">
          <button type="button" className="m-chip" aria-pressed={solo} onClick={() => setSolo(true)} title="Muestra solo los anticipos que todavía tienen saldo">Con saldo</button>
          <button type="button" className="m-chip" aria-pressed={!solo} onClick={() => setSolo(false)} title="Muestra también los anticipos ya usados por completo">Todos</button>
        </div>
      </div>
      <TablaAnticipos anticipos={lista} />
      <VentanaAnticipo abierta={nuevo} anticipo={null} onCerrar={() => setNuevo(false)} />
    </>
  )
}
