import { CreditCard, HandCoins, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useQuitar } from '../lib/quitar'
import FormRegistro, { type Campo } from '../componentes/FormRegistro'
import Tabla from '../componentes/Tabla'
import { useDatos } from '../lib/datos'
import { aCentavos, deCentavos, quetzales } from '../lib/dinero'
import { fechaCorta } from '../lib/fechas'
import { cuotasPagadas, saldoDeuda } from '../lib/finanzas'
import { useModelo } from '../lib/modelo'
import { useHoy } from '../lib/usos'
import type { Deuda, MovimientoDeuda } from '../lib/tipos'
import { opcCategorias, opcNegocios } from './gastos/campos'

export default function Deudas() {
  const m = useModelo()
  const { guardar, insertar } = useDatos()
  const hoy = useHoy()
  const [editar, setEditar] = useState<Deuda | 'nuevo' | null>(null)
  const [mov, setMov] = useState<{ deuda: Deuda; tipo: 'pago' | 'cargo' } | null>(null)
  const [ver, setVer] = useState<string | null>(null)
  const q = useQuitar()
  const [editarMov, setEditarMov] = useState<MovimientoDeuda | null>(null)
  const catDeudas = m.categorias.find((c) => c.clave === 'deudas')
  const d = editar && editar !== 'nuevo' ? editar : null
  const totalSaldo = deCentavos(m.deudas.filter((x) => x.activo).reduce((s, x) => s + aCentavos(saldoDeuda(x, m.movimientos)), 0))
  const cuotaMes = deCentavos(m.deudas.filter((x) => x.activo && x.tipo === 'cuotas' && saldoDeuda(x, m.movimientos) > 0).reduce((s, x) => s + aCentavos(x.cuota ?? 0), 0))
  const campos: Campo[] = [
    { k: 'nombre', etiqueta: 'Nombre', tipo: 'texto', requerido: true, max: 120, ancho: true, ayuda: 'Por ejemplo «Computadora a 12 cuotas» o «Tarjeta del banco».' },
    { k: 'tipo', etiqueta: 'Tipo', tipo: 'select', requerido: true, opciones: [{ valor: 'cuotas', nombre: 'Compra a cuotas' }, { valor: 'tarjeta', nombre: 'Tarjeta de crédito' }] },
    { k: 'inicio', etiqueta: 'Desde', tipo: 'fecha', requerido: true },
    { k: 'negocio_id', etiqueta: 'Negocio que la usa', tipo: 'select', requerido: true, opciones: opcNegocios(m) },
    { k: 'categoria_id', etiqueta: 'Categoría del presupuesto', tipo: 'select', requerido: true, opciones: opcCategorias(m) },
    { k: 'total', etiqueta: 'Total de la compra', tipo: 'monto', requerido: true, visible: (v) => v.tipo === 'cuotas' },
    { k: 'cuotas', etiqueta: 'Número de cuotas', tipo: 'numero', requerido: true, min: 1, max: 360, visible: (v) => v.tipo === 'cuotas' },
    { k: 'cuota', etiqueta: 'Cuota mensual', tipo: 'monto', requerido: true, visible: (v) => v.tipo === 'cuotas' },
    { k: 'saldo_inicial', etiqueta: 'Saldo que debes hoy', tipo: 'monto', requerido: true, visible: (v) => v.tipo === 'tarjeta' },
    { k: 'limite', etiqueta: 'Límite de crédito', tipo: 'monto', visible: (v) => v.tipo === 'tarjeta' },
    { k: 'dia_pago', etiqueta: 'Día de pago', tipo: 'numero', min: 1, max: 31 },
    { k: 'nota', etiqueta: 'Nota', tipo: 'area', max: 500 },
    { k: 'activo', etiqueta: 'Activa', tipo: 'casilla' },
  ]
  const movsDe = (id: string) => m.movimientos.filter((x) => x.deuda_id === id)
  const deudaVer = m.deudas.find((x) => x.id === ver)
  return (
    <>
      <div className="c-cabeza">
        <div><span className="m-etiqueta">Empresa</span><h1 className="erp-titulo">Deudas y tarjeta</h1></div>
        <button type="button" className="m-btn m-btn-primario" onClick={() => setEditar('nuevo')} title="Agregar una compra a cuotas o una tarjeta"><Plus size={16} aria-hidden /> Nueva deuda</button>
      </div>
      <p className="m-texto-suave c-intro">Cada pago entra como gasto del negocio y de la categoría que elijas, así cuenta en el presupuesto del mes.</p>
      <div className="erp-kpis">
        <div className="erp-kpi peligro"><span className="m-etiqueta">Debes en total</span><b>{quetzales(totalSaldo)}</b><small>{m.deudas.filter((x) => x.activo).length} deudas activas</small></div>
        <div className="erp-kpi aviso"><span className="m-etiqueta">Cuotas del mes</span><b>{quetzales(cuotaMes)}</b><small>sin contar la tarjeta</small></div>
      </div>
      <Tabla
        titulo={`${m.deudas.length} deudas`}
        filas={m.deudas}
        clave={(x) => x.id}
        vacio="No tienes deudas registradas."
        onFila={(x) => setVer(x.id)}
        columnas={[
          { titulo: 'Deuda', principal: true, valor: (x) => <><span className="c-enlace">{x.nombre}</span><small>{x.tipo === 'cuotas' ? `Cuotas · ${cuotasPagadas(x, m.movimientos)} de ${x.cuotas} pagadas` : `Tarjeta${x.limite ? ` · límite ${quetzales(x.limite)}` : ''}`}</small>{!x.activo && <span className="m-estado bloqueado">Cerrada</span>}</> },
          { titulo: 'Negocio', valor: (x) => m.negocios.find((n) => n.id === x.negocio_id)?.nombre ?? '' },
          { titulo: 'Día', num: true, valor: (x) => x.dia_pago ?? '' },
          { titulo: 'Cuota', num: true, valor: (x) => (x.cuota ? quetzales(x.cuota) : '') },
          { titulo: 'Saldo', num: true, valor: (x) => quetzales(saldoDeuda(x, m.movimientos)) },
        ]}
        acciones={(x) => (
          <>
            <button type="button" className="m-btn m-btn-primario m-btn-sm" onClick={() => setMov({ deuda: x, tipo: 'pago' })} title="Registrar un pago a esta deuda"><HandCoins size={14} aria-hidden /> Pago</button>
            {x.tipo === 'tarjeta' && <button type="button" className="m-btn m-btn-secundario m-btn-sm" onClick={() => setMov({ deuda: x, tipo: 'cargo' })} title="Registrar una compra con la tarjeta"><CreditCard size={14} aria-hidden /> Compra</button>}
            <button type="button" className="m-icono-btn" onClick={() => setEditar(x)} aria-label="Editar" title="Editar la deuda"><Pencil aria-hidden /></button>
            {movsDe(x.id).length === 0 && <button type="button" className="m-icono-btn" onClick={() => q.pedir('ctl_deudas', [x], `Se quita la deuda «${x.nombre}».`)} aria-label="Quitar" title="Quitar la deuda (no tiene movimientos; se puede deshacer)"><Trash2 aria-hidden /></button>}
          </>
        )}
      />
      {deudaVer && (
        <Tabla
          titulo={`Movimientos de ${deudaVer.nombre}`}
          filas={movsDe(deudaVer.id)}
          clave={(x) => x.id}
          vacio="Sin pagos ni compras todavía."
          columnas={[
            { titulo: 'Fecha', valor: (x) => fechaCorta(x.fecha) },
            { titulo: 'Tipo', valor: (x) => (x.tipo === 'pago' ? <span className="m-estado aprobado">Pago</span> : <span className="m-estado pendiente">Compra</span>) },
            { titulo: 'Nota', principal: true, valor: (x) => x.nota ?? '' },
            { titulo: 'Monto', num: true, valor: (x) => quetzales(x.monto) },
          ]}
          quitarVarias={(l) => q.pedir('ctl_deuda_movimientos', l, `Se quitan ${l.length} movimientos.`)}
          acciones={(x) => (
            <>
              <button type="button" className="m-icono-btn" onClick={() => setEditarMov(x)} aria-label="Editar" title="Corregir el movimiento"><Pencil aria-hidden /></button>
              <button type="button" className="m-icono-btn" onClick={() => q.pedir('ctl_deuda_movimientos', [x], `Se quita el movimiento de ${quetzales(x.monto)} del ${fechaCorta(x.fecha)}.`)} aria-label="Quitar" title="Quitar este movimiento (se puede deshacer)"><Trash2 aria-hidden /></button>
            </>
          )}
        />
      )}
      <FormRegistro abierta={editar != null} titulo={d ? 'Editar deuda' : 'Nueva deuda'} campos={campos}
        inicial={d ? (d as unknown as Record<string, unknown>) : { tipo: 'cuotas', inicio: hoy, negocio_id: m.negocios.find((n) => n.clave === 'dev')?.id, categoria_id: catDeudas?.id, activo: true }}
        onGuardar={async (x) => { await guardar('ctl_deudas', d?.id ?? null, { ...x, total: x.total ?? 0, saldo_inicial: x.saldo_inicial ?? 0 }) }}
        onCerrar={() => setEditar(null)} />
      <FormRegistro abierta={mov != null} titulo={mov?.tipo === 'cargo' ? 'Compra con la tarjeta' : 'Pago de la deuda'} subtitulo={mov ? `${mov.deuda.nombre} · saldo ${quetzales(saldoDeuda(mov.deuda, m.movimientos))}` : ''}
        campos={[
          { k: 'fecha', etiqueta: 'Fecha', tipo: 'fecha', requerido: true },
          { k: 'monto', etiqueta: 'Monto', tipo: 'monto', requerido: true },
          { k: 'nota', etiqueta: 'Nota', tipo: 'texto', max: 300, ancho: true },
        ]}
        inicial={{ fecha: hoy, monto: mov?.tipo === 'pago' && mov.deuda.cuota ? mov.deuda.cuota.toFixed(2) : '' }}
        onGuardar={async (x) => { if (mov) await insertar('ctl_deuda_movimientos', [{ ...x, deuda_id: mov.deuda.id, tipo: mov.tipo }]) }}
        onCerrar={() => setMov(null)} />
      <FormRegistro abierta={editarMov != null} titulo="Editar movimiento"
        campos={[
          { k: 'tipo', etiqueta: 'Tipo', tipo: 'select', requerido: true, opciones: [{ valor: 'pago', nombre: 'Pago' }, { valor: 'cargo', nombre: 'Compra con la tarjeta' }] },
          { k: 'fecha', etiqueta: 'Fecha', tipo: 'fecha', requerido: true },
          { k: 'monto', etiqueta: 'Monto', tipo: 'monto', requerido: true },
          { k: 'nota', etiqueta: 'Nota', tipo: 'texto', max: 300, ancho: true },
        ]}
        inicial={editarMov ? { ...editarMov, monto: editarMov.monto.toFixed(2) } : {}}
        onGuardar={async (x) => { if (editarMov) await guardar('ctl_deuda_movimientos', editarMov.id, x) }}
        onCerrar={() => setEditarMov(null)} />
      {q.ventana}
    </>
  )
}
