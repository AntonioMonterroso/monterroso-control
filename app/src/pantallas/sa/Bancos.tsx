import Pasos from '../../componentes/Pasos'
import { Download, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useAvisar } from '../../componentes/Avisos'
import FormRegistro from '../../componentes/FormRegistro'
import SelectorMes from '../../componentes/SelectorMes'
import Tabla from '../../componentes/Tabla'
import Ventana from '../../componentes/Ventana'
import { conceptoDePago } from '../../lib/cobros'
import { useDatos } from '../../lib/datos'
import { leerMonto, quetzales } from '../../lib/dinero'
import { fechaCorta, nombreMes, partes } from '../../lib/fechas'
import { periodoDe } from '../../lib/finanzas'
import { useQuitar } from '../../lib/quitar'
import { conciliar, saldoCuenta, type CuentaBanco, type MovBanco } from '../../lib/sa'
import { useSA } from '../../lib/saModelo'
import { useCobros, useHoy, usePeriodo } from '../../lib/usos'

interface Candidato { origen: 'pago' | 'gasto' | 'aporte' | 'deuda' | 'anticipo'; origen_id: string; fecha: string; tipo: 'ingreso' | 'egreso'; monto: number; descripcion: string }

export default function BancosSA() {
  const { m, ids, inicio } = useSA()
  const { guardar, insertar } = useDatos()
  const avisar = useAvisar()
  const hoy = useHoy()
  const cobros = useCobros()
  const q = useQuitar()
  const [periodo, setPeriodo] = usePeriodo()
  const [sel, setSel] = useState<string>('')
  const [cuenta, setCuenta] = useState<CuentaBanco | 'nueva' | null>(null)
  const [mov, setMov] = useState<MovBanco | 'nuevo' | null>(null)
  const [traer, setTraer] = useState(false)
  const [marcados, setMarcados] = useState<Set<string>>(new Set())
  const [saldoBanco, setSaldoBanco] = useState('')
  const c = m.bancos.find((x) => x.id === sel) ?? m.bancos[0]
  const cu = cuenta && cuenta !== 'nueva' ? cuenta : null
  const mv = mov && mov !== 'nuevo' ? mov : null
  const movsMes = c ? m.movBancos.filter((x) => x.cuenta_id === c.id && periodoDe(x.fecha) === periodo) : []
  const guardada = c ? m.conciliaciones.find((x) => x.cuenta_id === c.id && x.periodo === periodo) : undefined
  const saldoB = saldoBanco.trim() ? leerMonto(saldoBanco) : guardada?.saldo_banco ?? null
  const con = c ? conciliar(c, m.movBancos, periodo, saldoB) : null
  const ligados = new Set(m.movBancos.filter((x) => x.origen_id).map((x) => `${x.origen}:${x.origen_id}`))
  const clienteNeg = (k: string | null) => m.clientes.find((x) => x.id === k)?.negocio_id ?? ''
  const candidatos: Candidato[] = inicio ? [
    ...m.pagos.filter((p) => p.fecha >= inicio && !p.cobro_clave.startsWith('s:') && p.forma !== 'anticipo' && ids.includes(clienteNeg(p.cliente_id)) && (!p.destino || p.destino === `s:${c?.id}`)).map((p) => ({ origen: 'pago' as const, origen_id: p.id, fecha: p.fecha, tipo: 'ingreso' as const, monto: p.monto, descripcion: `${m.clientes.find((x) => x.id === p.cliente_id)?.nombre ?? 'Cliente'} · ${conceptoDePago(p.cobro_clave, cobros)}` })),
    ...m.gastos.filter((g) => g.fecha >= inicio && ids.includes(g.negocio_id)).map((g) => ({ origen: 'gasto' as const, origen_id: g.id, fecha: g.fecha, tipo: 'egreso' as const, monto: g.monto, descripcion: g.descripcion })),
    ...m.anticipos.filter((a) => a.fecha >= inicio && ids.includes(clienteNeg(a.cliente_id)) && (!a.destino || a.destino === `s:${c?.id}`)).map((a) => ({ origen: 'anticipo' as const, origen_id: a.id, fecha: a.fecha, tipo: 'ingreso' as const, monto: a.monto, descripcion: `${m.clientes.find((x) => x.id === a.cliente_id)?.nombre ?? 'Cliente'} · anticipo` })),
    ...m.aportes.filter((a) => a.pagado > 0 && a.forma === 'efectivo').map((a) => ({ origen: 'aporte' as const, origen_id: a.id, fecha: a.fecha, tipo: 'ingreso' as const, monto: a.pagado, descripcion: `Aportación de ${m.socios.find((x) => x.id === a.socio_id)?.nombre ?? 'socio'}` })),
    ...m.movimientos.filter((x) => x.tipo === 'pago' && x.fecha >= inicio && ids.includes(m.deudas.find((d) => d.id === x.deuda_id)?.negocio_id ?? '')).map((x) => ({ origen: 'deuda' as const, origen_id: x.id, fecha: x.fecha, tipo: 'egreso' as const, monto: x.monto, descripcion: `Pago de ${m.deudas.find((d) => d.id === x.deuda_id)?.nombre ?? 'deuda'}` })),
  ].filter((x) => !ligados.has(`${x.origen}:${x.origen_id}`)).sort((a, b) => a.fecha.localeCompare(b.fecha)) : []

  const traerMarcados = async () => {
    if (!c) return
    const l = candidatos.filter((x) => marcados.has(`${x.origen}:${x.origen_id}`))
    try {
      const hechos = await insertar('ctl_banco_movimientos', l.map((x) => ({ cuenta_id: c.id, fecha: x.fecha, tipo: x.tipo, monto: x.monto, descripcion: x.descripcion.slice(0, 300), origen: x.origen, origen_id: x.origen_id, conciliado: false })))
      setTraer(false); setMarcados(new Set())
      avisar(`${hechos.length} movimientos agregados a ${c.banco} ${c.numero}.`)
    } catch (e) { avisar(e instanceof Error ? e.message : 'No se pudo.', 'error') }
  }
  const guardarConciliacion = async () => {
    if (!c || saldoB == null) return
    await guardar('ctl_banco_conciliaciones', guardada?.id ?? null, guardada ? { saldo_banco: saldoB } : { cuenta_id: c.id, periodo, saldo_banco: saldoB })
    setSaldoBanco('')
    avisar('Saldo del estado de cuenta guardado.')
  }

  return (
    <>
      <div className="c-cabeza">
        <div><span className="m-etiqueta">Sociedad anónima</span><h1 className="erp-titulo">Bancos</h1><Pasos /></div>
        <div className="c-cabeza-acciones">
          <SelectorMes periodo={periodo} onCambio={setPeriodo} />
          <button type="button" className="m-btn m-btn-primario" onClick={() => setCuenta('nueva')} title="Agregar una cuenta bancaria de la sociedad"><Plus size={16} aria-hidden /> Cuenta</button>
        </div>
      </div>
      <Tabla
        marcable={(x) => !m.movBancos.some((y) => y.cuenta_id === x.id)}
        quitarVarias={(l) => q.pedir('ctl_bancos', l, `Se quitan ${l.length} cuentas sin movimientos.`)} filas={m.bancos} clave={(x) => x.id} vacio="Sin cuentas. Agrega la cuenta de la sociedad cuando la abras." onFila={(x) => setSel(x.id)}
        columnas={[
          { titulo: 'Cuenta', principal: true, valor: (x) => <>{x.banco} {x.numero}{x.nombre && <small>{x.nombre}</small>}{c?.id === x.id && <span className="m-estado en-proceso">Viendo</span>}</> },
          { titulo: 'Moneda', valor: (x) => (x.moneda === 'GTQ' ? 'Quetzales' : 'Dólares') },
          { titulo: 'Saldo inicial', num: true, valor: (x) => quetzales(x.saldo_inicial), orden: (x) => x.saldo_inicial },
          { titulo: 'Saldo hoy', num: true, valor: (x) => quetzales(saldoCuenta(x, m.movBancos, hoy)), orden: (x) => saldoCuenta(x, m.movBancos, hoy) },
        ]}
        acciones={(x) => (
          <>
            <button type="button" className="m-icono-btn" onClick={() => setCuenta(x)} aria-label="Editar" title="Editar la cuenta"><Pencil aria-hidden /></button>
            {!m.movBancos.some((y) => y.cuenta_id === x.id) && <button type="button" className="m-icono-btn" onClick={() => q.pedir('ctl_bancos', [x], `Se quita la cuenta ${x.banco} ${x.numero}.`)} aria-label="Quitar" title="Quitar la cuenta (no tiene movimientos; se puede deshacer)"><Trash2 aria-hidden /></button>}
          </>
        )} />
      {c && con && (
        <>
          <section className="c-seccion-dev">
            <div className="c-ficha-cabeza">
              <h2 className="m-seccion-titulo">Movimientos de {c.banco} {c.numero}</h2>
              <span className="c-fila-botones">
                <button type="button" className="m-btn m-btn-secundario m-btn-sm" onClick={() => setTraer(true)} title="Traer cobros, gastos, aportaciones y pagos de deudas ya registrados"><Download size={14} aria-hidden /> Traer registrados ({candidatos.length})</button>
                <button type="button" className="m-btn m-btn-secundario m-btn-sm" onClick={() => setMov('nuevo')} title="Agregar un movimiento a mano"><Plus size={14} aria-hidden /> Movimiento</button>
              </span>
            </div>
            <Tabla filas={movsMes} clave={(x) => x.id} vacio="Sin movimientos en este mes."
              quitarVarias={(l) => q.pedir('ctl_banco_movimientos', l, `Se quitan ${l.length} movimientos de la cuenta. Lo registrado en Cobros y Gastos no cambia.`)}
              masa={[
                { texto: 'Marcar conciliadas', titulo: (n) => `Marca los ${n} movimientos como ya salidos en el estado de cuenta`, hacer: (l) => void Promise.all(l.map((x) => guardar('ctl_banco_movimientos', x.id, { conciliado: true }))) },
                { texto: 'Quitar conciliado', titulo: (n) => `Deja los ${n} movimientos como pendientes de salir en el banco`, hacer: (l) => void Promise.all(l.map((x) => guardar('ctl_banco_movimientos', x.id, { conciliado: false }))) },
              ]}
              columnas={[
                { titulo: 'Fecha', valor: (x) => fechaCorta(x.fecha), orden: (x) => x.fecha },
                { titulo: 'Descripción', principal: true, valor: (x) => <>{x.descripcion}{x.referencia && <small>Ref. {x.referencia}</small>}</> },
                { titulo: 'Origen', valor: (x) => ({ manual: 'A mano', pago: 'Cobro', gasto: 'Gasto', aporte: 'Aportación', dividendo: 'Dividendo', deuda: 'Deuda', traslado: 'Traslado desde cuenta personal', anticipo: 'Anticipo' } as Record<string, string>)[x.origen] ?? x.origen },
                { titulo: 'Entra', num: true, valor: (x) => (x.tipo === 'ingreso' ? quetzales(x.monto) : ''), orden: (x) => (x.tipo === 'ingreso' ? x.monto : 0) },
                { titulo: 'Sale', num: true, valor: (x) => (x.tipo === 'egreso' ? quetzales(x.monto) : ''), orden: (x) => (x.tipo === 'egreso' ? x.monto : 0) },
                { titulo: 'Conciliado', valor: (x) => <label className="c-casilla" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={x.conciliado} onChange={(e) => void guardar('ctl_banco_movimientos', x.id, { conciliado: e.target.checked })} title="Marca o quita si ya salió en el estado de cuenta" aria-label="Conciliado" /> {x.conciliado ? 'Sí' : 'No'}</label>, orden: (x) => (x.conciliado ? 1 : 0) },
              ]}
              acciones={(x) => (
                <>
                  <button type="button" className="m-icono-btn" onClick={() => setMov(x)} aria-label="Editar" title="Editar el movimiento"><Pencil aria-hidden /></button>
                  <button type="button" className="m-icono-btn" onClick={() => q.pedir('ctl_banco_movimientos', [x], `Se quita «${x.descripcion}» de la cuenta.`)} aria-label="Quitar" title="Quitar el movimiento de la cuenta (se puede deshacer)"><Trash2 aria-hidden /></button>
                </>
              )} />
          </section>
          <section className="m-tarjeta c-ficha">
            <h2 className="m-seccion-titulo">Conciliación de {nombreMes(...partes(`${periodo}-01`).slice(0, 2) as [number, number]).toLowerCase()}</h2>
            <div className="c-form">
              <div className="m-campo"><label htmlFor="bc-s">Saldo según el estado de cuenta</label><input id="bc-s" className="m-entrada m-num" inputMode="decimal" placeholder={guardada ? quetzales(guardada.saldo_banco) : 'Q 0.00'} value={saldoBanco} onChange={(e) => setSaldoBanco(e.target.value)} /></div>
              <div className="m-campo"><span className="m-ayuda">&nbsp;</span><button type="button" className="m-btn m-btn-secundario" disabled={!saldoBanco.trim() || leerMonto(saldoBanco) == null} onClick={() => void guardarConciliacion()} title="Guardar el saldo del estado de cuenta de este mes">Guardar saldo</button></div>
            </div>
            <dl className="c-datos">
              <div><dt>Saldo en libros al {fechaCorta(con.fin)}</dt><dd>{quetzales(con.libros)}</dd></div>
              <div><dt>Movimientos sin conciliar</dt><dd>{quetzales(con.transito)} · {con.sinConciliar.length}</dd></div>
              <div><dt>Saldo que debería dar el banco</dt><dd>{quetzales(con.ajustado)}</dd></div>
              <div><dt>Saldo del banco</dt><dd>{saldoB == null ? <span className="m-vacia">Sin anotar</span> : quetzales(saldoB)}</dd></div>
              <div><dt>Diferencia</dt><dd>{con.diferencia == null ? <span className="m-vacia">—</span> : con.diferencia === 0 ? <span className="m-estado aprobado">Cuadra</span> : <span className="m-estado error">{quetzales(con.diferencia)}</span>}</dd></div>
            </dl>
          </section>
        </>
      )}
      <FormRegistro abierta={cuenta != null} titulo={cu ? 'Editar cuenta' : 'Nueva cuenta bancaria'}
        campos={[
          { k: 'banco', etiqueta: 'Banco', tipo: 'texto', requerido: true, max: 80 },
          { k: 'numero', etiqueta: 'Número de cuenta', tipo: 'texto', requerido: true, max: 40 },
          { k: 'nombre', etiqueta: 'Nombre o uso', tipo: 'texto', max: 120 },
          { k: 'moneda', etiqueta: 'Moneda', tipo: 'select', requerido: true, opciones: [{ valor: 'GTQ', nombre: 'Quetzales' }, { valor: 'USD', nombre: 'Dólares' }] },
          { k: 'saldo_inicial', etiqueta: 'Saldo inicial', tipo: 'monto', requerido: true },
          { k: 'fecha_saldo', etiqueta: 'Fecha del saldo inicial', tipo: 'fecha', requerido: true },
          { k: 'activo', etiqueta: 'Activa', tipo: 'casilla' },
        ]}
        inicial={cu ? { ...cu, saldo_inicial: cu.saldo_inicial.toFixed(2) } : { moneda: 'GTQ', saldo_inicial: '0', fecha_saldo: inicio ?? hoy, activo: true }}
        onGuardar={async (x) => { const f = await guardar('ctl_bancos', cu?.id ?? null, x); setSel(f.id) }}
        onCerrar={() => setCuenta(null)} />
      <FormRegistro abierta={mov != null} titulo={mv ? 'Editar movimiento' : 'Nuevo movimiento'}
        campos={[
          { k: 'fecha', etiqueta: 'Fecha', tipo: 'fecha', requerido: true },
          { k: 'tipo', etiqueta: 'Tipo', tipo: 'select', requerido: true, opciones: [{ valor: 'ingreso', nombre: 'Entra (depósito, crédito)' }, { valor: 'egreso', nombre: 'Sale (cheque, débito, comisión)' }] },
          { k: 'monto', etiqueta: 'Monto', tipo: 'monto', requerido: true },
          { k: 'descripcion', etiqueta: 'Descripción', tipo: 'texto', requerido: true, max: 300, ancho: true },
          { k: 'referencia', etiqueta: 'Referencia', tipo: 'texto', max: 120 },
          { k: 'conciliado', etiqueta: 'Ya salió en el estado de cuenta', tipo: 'casilla' },
        ]}
        inicial={mv ? { ...mv, monto: mv.monto.toFixed(2) } : { fecha: hoy, tipo: 'egreso' }}
        onGuardar={async (x) => { if (c) await guardar('ctl_banco_movimientos', mv?.id ?? null, mv ? x : { ...x, cuenta_id: c.id, origen: 'manual' }) }}
        onCerrar={() => setMov(null)} />
      <Ventana abierta={traer} ancho="amplia" titulo="Traer movimientos registrados" subtitulo={c ? `A ${c.banco} ${c.numero}. Solo lo de los negocios de la sociedad desde su inicio. No se duplican.` : ''} onCerrar={() => setTraer(false)} pie={
        <>
          <button type="button" className="m-btn m-btn-fantasma" onClick={() => setTraer(false)} title="Cerrar sin traer nada">Cancelar</button>
          <button type="button" className="m-btn m-btn-primario" disabled={!marcados.size} onClick={() => void traerMarcados()} title="Agregar los marcados a la cuenta">Traer {marcados.size}</button>
        </>
      }>
        {!inicio ? <p>Pon la fecha de inicio de operaciones en la ficha de la sociedad.</p> : candidatos.length === 0 ? <p>No hay movimientos registrados por traer.</p> : (
          <>
            <label className="c-casilla"><input type="checkbox" checked={marcados.size === candidatos.length} onChange={(e) => setMarcados(e.target.checked ? new Set(candidatos.map((x) => `${x.origen}:${x.origen_id}`)) : new Set())} /> Marcar todos</label>
            <ul className="c-lista-saldos c-lista-pagar">
              {candidatos.map((x) => {
                const k = `${x.origen}:${x.origen_id}`
                return (
                  <li key={k}>
                    <label className="c-casilla"><input type="checkbox" checked={marcados.has(k)} onChange={(e) => setMarcados((s) => { const n = new Set(s); if (e.target.checked) n.add(k); else n.delete(k); return n })} /><span><b>{x.descripcion}</b><small> · {fechaCorta(x.fecha)}</small></span></label>
                    <b className={`m-cifra${x.tipo === 'egreso' ? ' m-negativo' : ''}`}>{x.tipo === 'egreso' ? '−' : ''}{quetzales(x.monto)}</b>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </Ventana>
      {q.ventana}
    </>
  )
}
