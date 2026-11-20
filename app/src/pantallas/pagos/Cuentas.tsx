import { ArrowRightLeft, Pencil, Trash2 } from 'lucide-react'
import MenuMas from '../../componentes/MenuMas'
import SelectBuscable from '../../componentes/SelectBuscable'
import { leerMonto } from '../../lib/dinero'
import { saldoDe, type Traspaso } from '../../lib/saldos'
import { useOpcionesDestino } from '../cobros/Ventanas'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAvisar } from '../../componentes/Avisos'
import FormRegistro from '../../componentes/FormRegistro'
import Pasos from '../../componentes/Pasos'
import SelectorMes from '../../componentes/SelectorMes'
import Tabla from '../../componentes/Tabla'
import Ventana from '../../componentes/Ventana'
import { useDatos } from '../../lib/datos'
import { quetzales } from '../../lib/dinero'
import { entraDinero, type EntradaDinero } from '../../lib/entradas'
import { fechaCorta, nombreMes, partes } from '../../lib/fechas'
import { useModelo } from '../../lib/modelo'
import { enmascarar, grupoDestino, GRUPOS_DESTINO, type CuentaPersonal } from '../../lib/pagosDestino'
import { pendientesSA } from '../../lib/saModelo'
import { totalPendiente, type Entrada, type Traslado } from '../../lib/traslados'
import { useEntradas, useHoy, usePeriodo } from '../../lib/usos'
import { useNombres } from './TablaEntradas'

const GRUPOS = GRUPOS_DESTINO

export function ResumenDinero({ periodo }: { periodo: string }) {
  const entradas = useEntradas()
  const n = useNombres()
  const delMes = entradas.filter((e) => e.fecha.slice(0, 7) === periodo && entraDinero(e))
  const porDestino = [...delMes.reduce((g, e) => g.set(e.destino ?? '', [...(g.get(e.destino ?? '') ?? []), e]), new Map<string, EntradaDinero[]>()).entries()]
  const suma = (l: EntradaDinero[]) => l.reduce((t, e) => t + Math.round(e.monto * 100), 0) / 100
  const filas = porDestino.map(([d, l]) => ({ d, l, grupo: grupoDestino(d || null) })).sort((a, b) => GRUPOS.findIndex((g) => g[0] === a.grupo) - GRUPOS.findIndex((g) => g[0] === b.grupo) || suma(b.l) - suma(a.l))
  return (
    <Tabla
      titulo="Lo que entró en el mes, por cuenta"
      nota={`Lo que entró en ${(() => { const [a, m] = partes(`${periodo}-01`); return nombreMes(a, m).toLowerCase() })()}, por cuenta de destino`}
      filas={filas}
      clave={(x) => x.d || 'sin'}
      vacio="No entró dinero en este mes."
      columnas={[
        { titulo: 'Grupo', valor: (x) => GRUPOS.find((g) => g[0] === x.grupo)?.[1] ?? '' },
        { titulo: 'Cuenta', principal: true, valor: (x) => (x.d ? n.destino(x.d) : <span className="m-estado pendiente">Sin indicar</span>) },
        { titulo: 'Pagos', num: true, valor: (x) => x.l.length, orden: (x) => x.l.length },
        { titulo: 'Monto', num: true, valor: (x) => quetzales(suma(x.l)), orden: (x) => suma(x.l) },
      ]}
      pie={<tr><td colSpan={2}>Total del mes</td><td className="m-num">{delMes.length}</td><td className="m-num">{quetzales(suma(delMes))}</td></tr>}
    />
  )
}

function VentanaTraslado({ entradas, onCerrar }: { entradas: Entrada[]; onCerrar: () => void }) {
  const m = useModelo()
  const { insertar, borrar } = useDatos()
  const avisar = useAvisar()
  const hoy = useHoy()
  const [fecha, setFecha] = useState(hoy)
  const [banco, setBanco] = useState('')
  const [nota, setNota] = useState('')
  useEffect(() => { if (entradas.length) { setFecha(hoy); setBanco(m.bancos.find((b) => b.activo)?.id ?? ''); setNota('') } }, [entradas])
  const total = totalPendiente(entradas)
  const de = [...new Set(entradas.map((e) => e.destino ?? ''))]
  const problema = !m.bancos.length ? 'Primero agrega la cuenta de la S.A. en S.A. › Bancos.' : !banco ? 'Elige la cuenta de la S.A.' : de.length > 1 ? 'Marca pagos de una sola cuenta personal a la vez.' : null
  const nombres = useNombres()
  const nombreCuenta = (d: string) => nombres.destino(d)
  return (
    <Ventana abierta={entradas.length > 0} titulo="Registrar traslado a la S.A." subtitulo={`${entradas.length} ${entradas.length === 1 ? 'pago' : 'pagos'} · ${quetzales(total)} desde ${nombreCuenta(de[0] ?? '')}`} onCerrar={onCerrar} pie={
      <>
        <button type="button" className="m-btn m-btn-secundario" onClick={onCerrar} title="Cierra sin registrar">Cancelar</button>
        <button type="button" className="m-btn m-btn-primario c-btn-principal" disabled={!!problema} title={problema ? `Apagado: ${problema}` : 'Anota la salida de tu cuenta y la entrada en el banco de la S.A.; se puede deshacer'} onClick={async () => {
          const b = m.bancos.find((x) => x.id === banco)!
          const [t] = await insertar('ctl_traslados', [{ fecha, monto: total, de_destino: de[0], banco_id: banco, pagos: entradas.map((e) => e.id), nota: nota.trim() || null }])
          const [mov] = await insertar('ctl_banco_movimientos', [{ cuenta_id: banco, fecha, tipo: 'ingreso', monto: total, descripcion: `Traslado desde ${nombreCuenta(de[0])} (${entradas.length} ${entradas.length === 1 ? 'cobro' : 'cobros'})`.slice(0, 300), origen: 'traslado', origen_id: t.id, conciliado: false }])
          onCerrar()
          avisar(`Traslado de ${quetzales(total)} a ${b.banco} registrado.`, 'bien', { texto: 'Deshacer', hacer: async () => { await borrar('ctl_banco_movimientos', [mov.id]); await borrar('ctl_traslados', [t.id]); avisar('Se deshizo.') } })
        }}>Registrar traslado</button>
      </>
    }>
      <div className="c-form">
        <div className="m-campo"><label htmlFor="tr-fecha">Fecha del traslado</label><input id="tr-fecha" type="date" className="m-entrada" value={fecha} onChange={(e) => setFecha(e.target.value)} /></div>
        <div className="m-campo"><label htmlFor="tr-banco">Entra a la cuenta de la S.A.</label><select id="tr-banco" className="m-entrada" value={banco} onChange={(e) => setBanco(e.target.value)}><option value="">Elige…</option>{m.bancos.map((b) => <option key={b.id} value={b.id}>{b.banco} {enmascarar(b.numero)}</option>)}</select>{!m.bancos.length && <span className="m-ayuda"><Link to="/sa/bancos" className="c-enlace">Agregar la cuenta en S.A. › Bancos</Link></span>}</div>
        <div className="m-campo c-ancho"><label htmlFor="tr-nota">Nota <span className="c-opcional">(opcional)</span></label><input id="tr-nota" className="m-entrada" maxLength={500} value={nota} onChange={(e) => setNota(e.target.value)} /></div>
        <ul className="c-lista-saldos c-ancho">{entradas.map((e) => <li key={e.id}><span>{e.texto}<small> · {fechaCorta(e.fecha)}</small></span><b className="m-cifra">{quetzales(e.monto)}</b></li>)}</ul>
      </div>
    </Ventana>
  )
}

function VentanaTraspaso({ abierta, onCerrar }: { abierta: boolean; onCerrar: () => void }) {
  const { insertar, borrar } = useDatos()
  const avisar = useAvisar()
  const hoy = useHoy()
  const destinos = useOpcionesDestino().filter((o) => o.valor !== 'otro')
  const [v, setV] = useState({ fecha: hoy, de: '', a: '', monto: '', nota: '' })
  useEffect(() => { if (abierta) setV({ fecha: hoy, de: '', a: '', monto: '', nota: '' }) }, [abierta])
  const monto = leerMonto(v.monto)
  const problema = !v.de ? 'Elige de dónde sale.' : !v.a ? 'Elige a dónde va.' : v.de === v.a ? 'Sale y entra en el mismo lugar.' : monto == null || monto <= 0 ? 'Escribe el monto.' : !v.fecha ? 'Pon la fecha.' : null
  return (
    <Ventana abierta={abierta} titulo="Registrar traspaso" subtitulo="Dinero que pasa de una caja o cuenta a otra; por ejemplo «Papá me entregó Q 500.00» o un depósito de efectivo al banco." onCerrar={onCerrar} pie={
      <>
        <button type="button" className="m-btn m-btn-secundario" onClick={onCerrar} title="Cierra sin registrar">Cancelar</button>
        <button type="button" className="m-btn m-btn-primario c-btn-principal" disabled={!!problema} title={problema ? `Apagado: ${problema}` : 'Registra el traspaso; se puede deshacer'} onClick={async () => {
          const [h] = await insertar('ctl_traspasos', [{ fecha: v.fecha, de: v.de, a: v.a, monto, nota: v.nota.trim() || null }])
          onCerrar()
          avisar(`Traspaso de ${quetzales(monto ?? 0)} registrado.`, 'bien', { texto: 'Deshacer', hacer: async () => { await borrar('ctl_traspasos', [h.id]); avisar('Se deshizo.') } })
        }}>Registrar traspaso</button>
      </>
    }>
      <div className="c-form">
        <div className="m-campo"><label htmlFor="ts-de">Sale de</label><SelectBuscable id="ts-de" valor={v.de} onCambio={(x) => setV((y) => ({ ...y, de: x }))} vacio="Elige…" opciones={destinos} /></div>
        <div className="m-campo"><label htmlFor="ts-a">Entra a</label><SelectBuscable id="ts-a" valor={v.a} onCambio={(x) => setV((y) => ({ ...y, a: x }))} vacio="Elige…" opciones={destinos} /></div>
        <div className="m-campo"><label htmlFor="ts-monto">Monto</label><input id="ts-monto" className="m-entrada m-num" inputMode="decimal" placeholder="Q 0.00" value={v.monto} onChange={(e) => setV((x) => ({ ...x, monto: e.target.value }))} /></div>
        <div className="m-campo"><label htmlFor="ts-fecha">Fecha</label><input id="ts-fecha" type="date" className="m-entrada" value={v.fecha} onChange={(e) => setV((x) => ({ ...x, fecha: e.target.value }))} /></div>
        <div className="m-campo c-ancho"><label htmlFor="ts-nota">Nota <span className="c-opcional">(opcional)</span></label><input id="ts-nota" className="m-entrada" maxLength={500} placeholder="Papá me entregó…" value={v.nota} onChange={(e) => setV((x) => ({ ...x, nota: e.target.value }))} /></div>
      </div>
    </Ventana>
  )
}

export default function Cuentas() {
  const m = useModelo()
  const { guardar, borrar, tablas, insertar } = useDatos()
  const avisar = useAvisar()
  const hoy = useHoy()
  const entradas = useEntradas()
  const n = useNombres()
  const [periodo, setPeriodo] = usePeriodo()
  const [editar, setEditar] = useState<CuentaPersonal | 'banco' | 'efectivo' | null>(null)
  const [trasladar, setTrasladar] = useState<Entrada[]>([])
  const [traspaso, setTraspaso] = useState(false)
  const pendientes = pendientesSA(m)
  const c = editar && typeof editar !== 'string' ? editar : null
  const tipoNuevo = c?.tipo ?? (editar === 'efectivo' ? 'efectivo' : 'banco')
  const dinero = entradas.filter(entraDinero).map((e) => ({ destino: e.destino, monto: e.monto, fecha: e.fecha }))
  const salidas = [...m.gastos.map((g) => ({ destino: g.destino ?? null, monto: g.monto, fecha: g.fecha })), ...m.traslados.map((t) => ({ destino: t.de_destino, monto: t.monto, fecha: t.fecha }))]
  const lugares = [
    ...m.cuentas.map((x) => ({ d: `${x.tipo === 'efectivo' ? 'e' : 'p'}:${x.id}`, cuenta: x as CuentaPersonal | null, inicial: x.saldo_inicial ?? 0 })),
    ...m.cuentasWorld.map((w) => ({ d: `w:${w.id}`, cuenta: null, inicial: 0 })),
  ].map((x) => ({ ...x, s: saldoDe(x.d, x.inicial, dinero, salidas, m.traspasos, hoy) }))
  const deAntonio = lugares.reduce((t, x) => t + Math.round(x.s.saldo * 100), 0) / 100
  const entroMes = dinero.filter((x) => x.fecha.slice(0, 7) === periodo).reduce((t, x) => t + Math.round(x.monto * 100), 0) / 100
  const quitarTraslado = async (t: Traslado) => {
    const movs = tablas.ctl_banco_movimientos.filter((x) => x.origen === 'traslado' && x.origen_id === t.id)
    await borrar('ctl_banco_movimientos', movs.map((x) => x.id)); await borrar('ctl_traslados', [t.id])
    avisar('Traslado quitado: esos pagos vuelven a estar pendientes.', 'bien', { texto: 'Deshacer', hacer: async () => { await insertar('ctl_traslados', [{ ...t }]); if (movs.length) await insertar('ctl_banco_movimientos', movs.map((x) => ({ ...x }))); avisar('Se deshizo.') } })
  }
  const quitarTraspaso = async (t: Traspaso) => {
    await borrar('ctl_traspasos', [t.id])
    avisar('Traspaso quitado.', 'bien', { texto: 'Deshacer', hacer: async () => { await insertar('ctl_traspasos', [{ ...t }]); avisar('Se deshizo.') } })
  }
  const usada = (x: CuentaPersonal) => { const d = `${x.tipo === 'efectivo' ? 'e' : 'p'}:${x.id}`; return m.pagos.some((p) => p.destino === d) || m.anticipos.some((a) => a.destino === d) || m.traspasos.some((t) => t.de === d || t.a === d) || m.gastos.some((g) => g.destino === d) }
  return (
    <>
      <div className="c-cabeza">
        <div><span className="m-etiqueta">Dinero</span><h1 className="erp-titulo">Dónde está mi dinero</h1><Pasos /><p className="c-subtitulo">El saldo de cada cuenta y caja de efectivo, lo que entró en el mes y lo que falta pasar a la S.A.</p></div>
        <div className="c-cabeza-acciones">
          <SelectorMes periodo={periodo} onCambio={setPeriodo} />
          <MenuMas items={[
            { texto: 'Agregar cuenta personal', titulo: 'Agrega una cuenta de banco tuya para elegirla al registrar pagos', hacer: () => setEditar('banco') },
            { texto: 'Agregar caja de efectivo', titulo: 'Agrega otra caja de efectivo, por ejemplo «Efectivo Papá»', hacer: () => setEditar('efectivo') },
          ]} />
          <button type="button" className="m-btn m-btn-primario c-btn-principal" onClick={() => setTraspaso(true)} title="Registra dinero que pasa de una caja o cuenta a otra"><ArrowRightLeft size={16} aria-hidden /> Registrar traspaso</button>
        </div>
      </div>

      <div className="erp-kpis">
        <div className="erp-kpi exito"><span className="m-etiqueta">Tengo hoy (cuentas y efectivo)</span><b>{quetzales(deAntonio)}</b><small>{lugares.length} {lugares.length === 1 ? 'lugar' : 'lugares'}</small></div>
        <div className="erp-kpi"><span className="m-etiqueta">Entró este mes</span><b>{quetzales(entroMes)}</b><small>pagos y anticipos</small></div>
        <div className={`erp-kpi${pendientes.length ? ' aviso' : ''}`}><span className="m-etiqueta">Falta pasar a la S.A.</span><b>{quetzales(totalPendiente(pendientes))}</b><small>{pendientes.length} {pendientes.length === 1 ? 'pago' : 'pagos'}</small></div>
      </div>

      {pendientes.length > 0 && (
        <section>
          <h2 className="m-seccion-titulo">Falta pasar a la S.A.</h2>
          <p className="c-alerta-txt">Son cobros de la S.A. que cayeron en tu cuenta o en tu efectivo. Mientras no se trasladen, en los estados de la S.A. salen como cuenta por cobrar al socio o administrador.</p>
          <Tabla filas={pendientes} clave={(e) => e.id} vacio=""
            masa={[{ texto: 'Registrar traslado a la S.A.', titulo: (k) => `Anota que los ${k} pagos marcados pasaron de tu cuenta al banco de la S.A.`, hacer: (l) => setTrasladar(l) }]}
            columnas={[
              { titulo: 'Fecha', valor: (e) => fechaCorta(e.fecha), orden: (e) => e.fecha },
              { titulo: 'Pago', principal: true, valor: (e) => e.texto },
              { titulo: 'Cayó en', valor: (e) => n.destino(e.destino) },
              { titulo: 'Monto', num: true, valor: (e) => quetzales(e.monto), orden: (e) => e.monto },
            ]}
            acciones={(e) => <button type="button" className="m-btn m-btn-secundario m-btn-sm" onClick={() => setTrasladar(pendientes.filter((x) => x.destino === e.destino))} title="Registra el traslado de los pagos de esa cuenta al banco de la S.A."><ArrowRightLeft size={14} aria-hidden /> Registrar traslado a la S.A.</button>}
            pie={<tr><td colSpan={3}>Total</td><td className="m-num">{quetzales(totalPendiente(pendientes))}</td><td /></tr>} />
        </section>
      )}

      <section>
        <h2 className="m-seccion-titulo">Saldo de cada cuenta y caja</h2>
        <Tabla filas={lugares} clave={(x) => x.d} vacio="Todavía no hay cuentas ni cajas. Agrégalas en «Más»."
          marcable={(x) => !!x.cuenta && !usada(x.cuenta)}
          quitarVarias={async (l) => { const ids = l.map((x) => x.cuenta!.id); const filas = m.cuentas.filter((x) => ids.includes(x.id)); await borrar('ctl_cuentas', ids); avisar(`Se quitaron ${ids.length}.`, 'bien', { texto: 'Deshacer', hacer: async () => { await insertar('ctl_cuentas', filas.map((x) => ({ ...x }))) } }) }}
          columnas={[
            { titulo: 'Grupo', valor: (x) => (x.d.startsWith('e:') ? 'Efectivo' : 'Cuenta personal') },
            { titulo: 'Dónde', principal: true, valor: (x) => <>{n.destino(x.d).replace(/^(Personal|Efectivo) · /, '')}{x.cuenta && !x.cuenta.activo && <span className="m-estado bloqueado">Apagada</span>}{x.d.startsWith('w:') && <small>Viene de Monterroso World</small>}</> },
            { titulo: 'Entró', num: true, valor: (x) => quetzales(x.s.entro), orden: (x) => x.s.entro },
            { titulo: 'Salió', num: true, valor: (x) => quetzales(x.s.salio), orden: (x) => x.s.salio },
            { titulo: 'Traspasos', num: true, valor: (x) => quetzales(x.s.traspasos), orden: (x) => x.s.traspasos },
            { titulo: 'Saldo hoy', num: true, valor: (x) => <b className={x.s.saldo < 0 ? 'm-negativo' : undefined}>{quetzales(x.s.saldo)}</b>, orden: (x) => x.s.saldo },
          ]}
          acciones={(x) => (x.cuenta ? <button type="button" className="m-icono-btn" onClick={() => setEditar(x.cuenta!)} aria-label={`Editar ${n.destino(x.d)}`} title="Abre para renombrar, poner su saldo inicial o apagarla"><Pencil aria-hidden /></button> : null)}
          pie={<tr><td colSpan={5}>Total</td><td className="m-num">{quetzales(deAntonio)}</td><td /></tr>} />
      </section>

      <ResumenDinero periodo={periodo} />

      <section>
        <h2 className="m-seccion-titulo">Traspasos entre cuentas y cajas</h2>
        <Tabla filas={m.traspasos} clave={(t) => t.id} vacio="Sin traspasos. Regístralos con «Registrar traspaso»."
          quitarVarias={async (l) => { await borrar('ctl_traspasos', l.map((x) => x.id)); avisar(`Se quitaron ${l.length} traspasos.`, 'bien', { texto: 'Deshacer', hacer: async () => { await insertar('ctl_traspasos', l.map((x) => ({ ...x }))) } }) }}
          columnas={[
            { titulo: 'Fecha', valor: (t) => fechaCorta(t.fecha), orden: (t) => t.fecha },
            { titulo: 'De', principal: true, valor: (t) => n.destino(t.de) },
            { titulo: 'A', valor: (t) => n.destino(t.a) },
            { titulo: 'Nota', valor: (t) => t.nota ?? <span className="m-vacia">—</span> },
            { titulo: 'Monto', num: true, valor: (t) => quetzales(t.monto), orden: (t) => t.monto },
          ]}
          acciones={(t) => <button type="button" className="m-icono-btn" onClick={() => void quitarTraspaso(t)} aria-label="Quitar traspaso" title="Quita el traspaso; se puede deshacer"><Trash2 aria-hidden /></button>} />
      </section>

      {m.traslados.length > 0 && (
        <section>
          <h2 className="m-seccion-titulo">Traslados hechos a la S.A.</h2>
          <Tabla filas={m.traslados} clave={(t) => t.id} vacio=""
            columnas={[
              { titulo: 'Fecha', valor: (t) => fechaCorta(t.fecha), orden: (t) => t.fecha },
              { titulo: 'Desde', principal: true, valor: (t) => n.destino(t.de_destino) },
              { titulo: 'A la cuenta', valor: (t) => { const b = m.bancos.find((x) => x.id === t.banco_id); return b ? `${b.banco} ${enmascarar(b.numero)}` : '' } },
              { titulo: 'Monto', num: true, valor: (t) => quetzales(t.monto), orden: (t) => t.monto },
            ]}
            acciones={(t) => <button type="button" className="m-icono-btn" onClick={() => void quitarTraslado(t)} aria-label="Quitar traslado" title="Quita el traslado y su entrada en el banco; los pagos vuelven a quedar pendientes. Se puede deshacer"><Trash2 aria-hidden /></button>} />
        </section>
      )}

      <FormRegistro abierta={editar != null} titulo={c ? (tipoNuevo === 'efectivo' ? 'Editar caja de efectivo' : 'Editar cuenta personal') : tipoNuevo === 'efectivo' ? 'Nueva caja de efectivo' : 'Nueva cuenta personal'} subtitulo={tipoNuevo === 'efectivo' ? 'Por ejemplo «Efectivo billetera» o «Efectivo Papá».' : 'Del número solo se guardan los últimos 4.'}
        campos={tipoNuevo === 'efectivo' ? [
          { k: 'nombre', etiqueta: 'Nombre de la caja', tipo: 'texto', requerido: true, max: 80, ancho: true },
          { k: 'saldo_inicial', etiqueta: 'Saldo con el que empieza', tipo: 'monto' },
          { k: 'activo', etiqueta: 'Se puede elegir al registrar pagos', tipo: 'casilla' },
        ] : [
          { k: 'banco', etiqueta: 'Banco', tipo: 'texto', requerido: true, max: 80 },
          { k: 'nombre', etiqueta: 'Nombre corto', tipo: 'texto', max: 80, ayuda: 'Por ejemplo «Monetaria» o «Ahorro».' },
          { k: 'ultimos4', etiqueta: 'Últimos 4 del número', tipo: 'texto', max: 40, limpiar: (v) => { const d = v.replace(/[^0-9A-Za-z]/g, ''); return { valor: d.slice(-4), aviso: d.length > 4 ? 'Solo se guardan los últimos 4.' : null } } },
          { k: 'moneda', etiqueta: 'Moneda', tipo: 'select', requerido: true, opciones: [{ valor: 'GTQ', nombre: 'Quetzales (Q)' }, { valor: 'USD', nombre: 'Dólares (US$)' }] },
          { k: 'saldo_inicial', etiqueta: 'Saldo con el que empieza', tipo: 'monto' },
          { k: 'activo', etiqueta: 'Se puede elegir al registrar pagos', tipo: 'casilla' },
        ]}
        inicial={c ? (c as unknown as Record<string, unknown>) : { moneda: 'GTQ', activo: true, saldo_inicial: '0' }}
        onGuardar={async (d) => { await guardar('ctl_cuentas', c?.id ?? null, { ...d, ...(tipoNuevo === 'efectivo' ? { banco: 'Efectivo', moneda: 'GTQ' } : {}), tipo: tipoNuevo, saldo_inicial: d.saldo_inicial ?? 0, orden: c?.orden ?? 50 }) }}
        onCerrar={() => setEditar(null)} />
      <VentanaTraslado entradas={trasladar} onCerrar={() => setTrasladar([])} />
      <VentanaTraspaso abierta={traspaso} onCerrar={() => setTraspaso(false)} />
    </>
  )
}
