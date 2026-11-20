import type { Tabla } from './almacen'
import type { Cobro } from './cobros'
import { useDatos } from './datos'
import { hoyISO } from './fechas'
import { useModelo } from './modelo'
import { filasARenombrar, proyectoAWorld, proyectosDelCliente, type DatosProyecto } from './puente'
import type { FormaInscripcion, ParteInscripcion, Pago } from './tipos'
import { clientKey, conClienteCreado, conInfoCambiada, type ClientInfo, type WProject } from './world'

export const TABLAS_CON_CLIENTE: Tabla[] = ['ctl_cobros', 'ctl_pagos', 'ctl_gastos', 'ctl_gastos_fijos', 'ctl_contratos', 'ctl_impuesto_modo', 'ctl_facturas']

export interface DatosPago { fecha: string; monto: number; cuenta: string; referencia: string | null; nota: string | null }

export function useEscribir() {
  const d = useDatos()
  const m = useModelo()

  const extraCliente = async (key: string, x: { direccion: string | null; notas: string | null; activo: boolean }) => {
    const fila = m.extraClientes.find((e) => e.client_key === key)
    await d.guardar('ctl_cliente_extra', fila?.id ?? null, fila ? x : { client_key: key, ...x })
  }

  return {
    claveLibre(nombre: string, actual?: string) {
      const k = clientKey(nombre)
      return !k || k === actual || !m.clientes.some((c) => c.id === k || c.aka?.includes(k))
    },

    async crearCliente(info: ClientInfo, x: { direccion: string | null; notas: string | null; activo: boolean }) {
      const key = clientKey(info.name)
      await d.guardarAjustes({ clientExtra: conClienteCreado(d.ajustes.clientExtra, key, info) })
      if (x.direccion || x.notas || !x.activo) await extraCliente(key, x)
      return key
    },

    async editarCliente(viejo: string, info: ClientInfo, x: { direccion: string | null; notas: string | null; activo: boolean }) {
      const nuevo = clientKey(info.name)
      await d.guardarAjustes({ clientExtra: conInfoCambiada(d.ajustes.clientExtra, viejo, info, nuevo) })
      const nombreAntes = m.clientes.find((c) => c.id === viejo)?.nombre
      if (nuevo !== viejo || nombreAntes !== info.name.trim()) {
        for (const p of proyectosDelCliente(m.wProjects, viejo)) if (p.client !== info.name.trim()) await d.guardar('projects', p.id, { client: info.name.trim() })
      }
      if (nuevo !== viejo) {
        for (const t of TABLAS_CON_CLIENTE) {
          for (const id of filasARenombrar(d.tablas[t] as { id: string; cliente_id?: unknown }[], 'cliente_id', viejo)) await d.guardar(t, id, { cliente_id: nuevo })
        }
        const fila = m.extraClientes.find((e) => e.client_key === viejo)
        if (fila) {
          const ya = m.extraClientes.find((e) => e.client_key === nuevo)
          if (ya) await d.borrar('ctl_cliente_extra', [ya.id])
          await d.guardar('ctl_cliente_extra', fila.id, { client_key: nuevo, ...x })
          return nuevo
        }
      }
      await extraCliente(nuevo, x)
      return nuevo
    },

    async guardarProyecto(id: string | null, datos: DatosProyecto, extra: { inscripcion_forma: FormaInscripcion | null; partes: ParteInscripcion[]; fecha_firma: string | null }) {
      const previo = id ? m.wProjects.find((p) => p.id === id) ?? null : null
      const fila = proyectoAWorld(datos, previo, hoyISO().slice(0, 7))
      const w = (await d.guardar('projects', id, fila as Record<string, unknown>)) as unknown as WProject
      const ex = m.extraProyectos.find((e) => e.project_id === w.id)
      const datosExtra = { inscripcion_forma: datos.inscripcion_total > 0 ? extra.inscripcion_forma : null, partes: datos.inscripcion_total > 0 ? extra.partes.map((p, i) => ({ ...p, id: p.id ?? crypto.randomUUID(), orden: i + 1, fecha: p.momento === 'fecha' ? p.fecha : null })) : [], fecha_firma: extra.fecha_firma }
      await d.guardar('ctl_proyecto_extra', ex?.id ?? null, ex ? datosExtra : { project_id: w.id, ...datosExtra })
      return w
    },

    async guardarNotasTecnicas(projectId: string, notas: string | null) {
      const ex = m.extraProyectos.find((e) => e.project_id === projectId)
      await d.guardar('ctl_proyecto_extra', ex?.id ?? null, ex ? { notas_tecnicas: notas } : { project_id: projectId, notas_tecnicas: notas, partes: [] })
    },

    siguienteRecibo(extraUsados = 0) {
      return m.pagos.reduce((n, p) => Math.max(n, p.recibo_numero ?? 0), 0) + 1 + extraUsados
    },

    async registrarPago(c: Cobro, p: DatosPago, recibo: number | null): Promise<() => Promise<void>> {
      const [tipo, pid, per] = c.clave.split(':')
      const mundo = tipo === 'i' || tipo === 'm' || tipo === 'a'
      if (!mundo) {
        const [hecho] = await d.insertar('ctl_pagos', [{ cliente_id: c.cliente_id || null, cobro_clave: c.clave, fecha: p.fecha, monto: p.monto, cuenta: p.cuenta, referencia: p.referencia, nota: p.nota, recibo_numero: recibo }])
        return async () => { await d.borrar('ctl_pagos', [hecho.id]) }
      }
      const base = { paid_at: p.fecha, method: p.cuenta.slice(0, 60), note: p.nota ? p.nota.slice(0, 300) : null }
      let pagoId: string
      let deshacer: () => Promise<void>
      const existente = tipo === 'm' ? m.wPayments.find((x) => x.project_id === pid && x.kind === 'monthly' && x.period === per) : undefined
      if (existente) {
        const antes = { amount: existente.amount, paid_at: existente.paid_at, method: existente.method, note: existente.note }
        await d.guardar('payments', existente.id, { ...base, amount: existente.paid_at ? Math.round((existente.amount + p.monto) * 100) / 100 : p.monto })
        pagoId = existente.id
        deshacer = async () => { await d.guardar('payments', existente.id, antes) }
      } else {
        const [hecho] = await d.insertar('payments', [{ ...base, project_id: pid, amount: p.monto, due_date: null, kind: tipo === 'i' ? 'setup' : tipo === 'm' ? 'monthly' : 'other', period: tipo === 'm' ? per : null }])
        pagoId = hecho.id
        deshacer = async () => { await d.borrar('payments', [hecho.id]) }
      }
      if (recibo != null || p.referencia) {
        const ex = m.extraPagos.find((x) => x.payment_id === pagoId)
        const [hecho] = ex ? [await d.guardar('ctl_pago_extra', ex.id, { recibo_numero: recibo, referencia: p.referencia })] : await d.insertar('ctl_pago_extra', [{ payment_id: pagoId, recibo_numero: recibo, referencia: p.referencia }])
        const antes = deshacer
        deshacer = async () => { if (!ex) await d.borrar('ctl_pago_extra', [hecho.id]); await antes() }
      }
      return deshacer
    },

    async quitarPago(p: Pago) {
      if (p.origen === 'world') {
        const ex = m.extraPagos.filter((x) => x.payment_id === p.id).map((x) => x.id)
        if (ex.length) await d.borrar('ctl_pago_extra', ex)
        await d.borrar('payments', [p.id])
      } else await d.borrar('ctl_pagos', [p.id])
    },
  }
}
