import { HandCoins } from 'lucide-react'
import { useEffect, useState } from 'react'
import SelectBuscable from '../../componentes/SelectBuscable'
import Ventana from '../../componentes/Ventana'
import { pendientes, type Cobro } from '../../lib/cobros'
import { quetzales } from '../../lib/dinero'
import { fechaCorta } from '../../lib/fechas'
import { useModelo } from '../../lib/modelo'
import { useCobros } from '../../lib/usos'
import { EstadoCobro } from '../cobros/Cobros'
import { VentanaPago } from '../cobros/Ventanas'

export default function RegistrarPago({ clienteFijo, proyectoFijo, pequeno, icono }: { clienteFijo?: string; proyectoFijo?: string; pequeno?: boolean; icono?: boolean }) {
  const m = useModelo()
  const cobros = useCobros()
  const [abierta, setAbierta] = useState(false)
  const [cliente, setCliente] = useState('')
  const [marcados, setMarcados] = useState<Set<string>>(new Set())
  const [pagar, setPagar] = useState<Cobro[]>([])
  const todos = pendientes(cobros).filter((c) => c.tipo !== 'salario' && (!proyectoFijo || c.proyecto_id === proyectoFijo))
  const deudores = m.clientes.filter((c) => todos.some((x) => x.cliente_id === c.id))
  const lista = todos.filter((c) => c.cliente_id === cliente)
  useEffect(() => {
    if (!abierta) return
    const cli = clienteFijo ?? (proyectoFijo ? m.proyectos.find((p) => p.id === proyectoFijo)?.cliente_id ?? '' : '')
    setCliente(cli)
    setMarcados(new Set(todos.filter((c) => c.cliente_id === cli && c.estado === 'vencido').map((c) => c.clave)))
  }, [abierta])
  const elegidos = lista.filter((c) => marcados.has(c.clave))
  const total = elegidos.reduce((t, c) => t + Math.round(c.saldo * 100), 0) / 100
  const problema = !cliente ? 'Elige el cliente.' : !elegidos.length ? 'Marca al menos un cobro.' : null
  return (
    <>
      {icono ? <button type="button" className="m-icono-btn" onClick={() => setAbierta(true)} aria-label="Registrar pago" title="Registra un pago de este cliente: eliges qué pagó, la forma, dónde cayó y el comprobante"><HandCoins aria-hidden /></button> : <button type="button" className={`m-btn m-btn-primario c-btn-principal${pequeno ? ' m-btn-sm' : ''}`} onClick={() => setAbierta(true)} title="Elige al cliente y lo que pagó; después pones la fecha, la forma, dónde cayó y el comprobante"><HandCoins size={16} aria-hidden /> Registrar pago</button>}
      <Ventana abierta={abierta} titulo="Registrar pago" subtitulo="Paso 1 de 2 · ¿Qué pagó?" onCerrar={() => setAbierta(false)} pie={
        <>
          <button type="button" className="m-btn m-btn-secundario" onClick={() => setAbierta(false)} title="Cierra sin registrar nada">Cancelar</button>
          <button type="button" className="m-btn m-btn-primario c-btn-principal" disabled={!!problema} onClick={() => { setPagar(elegidos); setAbierta(false) }} title={problema ? `Apagado: ${problema}` : `Sigue con la fecha, la forma y dónde cayó de ${quetzales(total)}`}>Siguiente · {quetzales(total)}</button>
        </>
      }>
        <div className="c-form">
          <div className="m-campo c-ancho"><label htmlFor="rp-cli">Cliente</label><SelectBuscable id="rp-cli" valor={cliente} disabled={!!clienteFijo} vacio="Elige…" onCambio={(x) => { setCliente(x); setMarcados(new Set()) }} opciones={(clienteFijo ? m.clientes.filter((c) => c.id === clienteFijo) : deudores).map((c) => ({ valor: c.id, nombre: c.nombre }))} /></div>
        </div>
        {cliente && (lista.length === 0 ? <p>Este cliente no debe nada. Si te pagó por adelantado, usa «Registrar anticipo».</p> : (
          <ul className="c-lista-saldos c-lista-pagar">
            {lista.map((c) => (
              <li key={c.clave}>
                <label className="c-casilla"><input type="checkbox" checked={marcados.has(c.clave)} onChange={(e) => setMarcados((x) => { const n = new Set(x); if (e.target.checked) n.add(c.clave); else n.delete(c.clave); return n })} /><span>{c.concepto}<small> · {c.vence ? fechaCorta(c.vence) : 'sin fecha'}</small></span></label>
                <span className="c-fila-botones"><EstadoCobro c={c} /><b className="m-cifra">{quetzales(c.saldo)}</b></span>
              </li>
            ))}
          </ul>
        ))}
      </Ventana>
      <VentanaPago varios={pagar} onCerrar={() => setPagar([])} />
    </>
  )
}
