import type { Tabla } from './almacen'
import type { Cobro } from './cobros'
import { useDatos } from './datos'
import { useSesion } from './sesion'
import { nombreForma } from './pagosDestino'
import type { Aplicacion } from './anticipos'
import { hoyISO } from './fechas'
import { useModelo } from './modelo'
import { filasARenombrar, proyectoAWorld, proyectosDelCliente, type DatosProyecto } from './puente'
import type { FormaInscripcion, ParteInscripcion, Pago } from './tipos'
import { cleanAll, clientKey, conClienteCreado, conInfoCambiada, type ClientInfo, type WProject } from './world'
import { planBorrarCliente, type PlanBorrar } from './clientesBorrar'
import type { Fila } from './almacen'

export const TABLAS_CON_CLIENTE: Tabla[] = ['ctl_cobros', 'ctl_pagos', 'ctl_gastos', 'ctl_gastos_fijos', 'ctl_contratos', 'ctl_impuesto_modo', 'ctl_facturas']

export interface DatosPago { fecha: string; monto: number; forma: string; destino: string | null; referencia: string | null; nota: string | null; comprobantes?: string[]; anticipo_id?: string | null }

export interface CambiosPago { forma?: string | null; destino?: string | null; referencia?: string | null; comprobantes?: string[] }

export function useEscribir() {
  const d = useDatos()
  const m = useModelo()
  const { correo } = useSesion()

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

    async registrarPago(c: Pick<Cobro, 'clave' | 'cliente_id'>, p: DatosPago, recibo: number | null): Promise<() => Promise<void>> {
      const [tipo, pid, per] = c.clave.split(':')
      const forma = nombreForma(p.forma)
      const extra = { forma: p.forma, destino: p.destino, comprobantes: p.comprobantes ?? [], anticipo_id: p.anticipo_id ?? null, registrado_por: correo }
      const yaMensual = tipo === 'm' ? m.wPayments.find((x) => x.project_id === pid && x.kind === 'monthly' && x.period === per && x.paid_at) : undefined
      const choca = !!yaMensual && (!!p.anticipo_id || !!m.extraPagos.find((x) => x.payment_id === yaMensual.id)?.anticipo_id)
      const mundo = (tipo === 'i' || tipo === 'm' || tipo === 'a') && !choca
      if (!mundo) {
        const [hecho] = await d.insertar('ctl_pagos', [{ cliente_id: c.cliente_id || null, cobro_clave: c.clave, fecha: p.fecha, monto: p.monto, cuenta: forma.slice(0, 60), referencia: p.referencia, nota: p.nota, recibo_numero: recibo, ...extra }])
        return async () => { await d.borrar('ctl_pagos', [hecho.id]) }
      }
      const base = { paid_at: p.fecha, method: forma.slice(0, 60), note: p.nota ? p.nota.slice(0, 300) : null }
      let pagoId: string
      let deshacer: () => Promise<void>
      const existente = tipo === 'm' ? m.wPayments.find((x) => x.project_id === pid && x.kind === 'monthly' && x.period === per) : undefined
      const exExistente = existente ? m.extraPagos.find((x) => x.payment_id === existente.id) : undefined
      const juntar = existente && (!existente.paid_at || (!p.anticipo_id && !exExistente?.anticipo_id))
      if (existente && juntar) {
        const antes = { amount: existente.amount, paid_at: existente.paid_at, method: existente.method, note: existente.note }
        await d.guardar('payments', existente.id, { ...base, amount: existente.paid_at ? Math.round((existente.amount + p.monto) * 100) / 100 : p.monto })
        pagoId = existente.id
        deshacer = async () => { await d.guardar('payments', existente.id, antes) }
      } else {
        const [hecho] = await d.insertar('payments', [{ ...base, project_id: pid, amount: p.monto, due_date: null, kind: tipo === 'i' ? 'setup' : tipo === 'm' ? 'monthly' : 'other', period: tipo === 'm' ? per : null }])
        pagoId = hecho.id
        deshacer = async () => { await d.borrar('payments', [hecho.id]) }
      }
      const ex = m.extraPagos.find((x) => x.payment_id === pagoId)
      const datosEx = { ...extra, recibo_numero: recibo ?? ex?.recibo_numero ?? null, referencia: p.referencia ?? ex?.referencia ?? null, comprobantes: [...(ex?.comprobantes ?? []), ...(p.comprobantes ?? [])] }
      const [hecho] = ex ? [await d.guardar('ctl_pago_extra', ex.id, datosEx)] : await d.insertar('ctl_pago_extra', [{ payment_id: pagoId, ...datosEx }])
      const antes = deshacer
      const previoEx = ex ? { forma: ex.forma ?? null, destino: ex.destino ?? null, comprobantes: ex.comprobantes ?? [], anticipo_id: ex.anticipo_id ?? null, recibo_numero: ex.recibo_numero, referencia: ex.referencia } : null
      deshacer = async () => { if (previoEx && ex) await d.guardar('ctl_pago_extra', ex.id, previoEx); else await d.borrar('ctl_pago_extra', [hecho.id]); await antes() }
      return deshacer
    },

    async anotarCambios(tabla: 'payments' | 'ctl_pagos' | 'ctl_anticipos', id: string, lista: [string, unknown, unknown][]) {
      const filas = lista.filter(([, a, b]) => String(a ?? '') !== String(b ?? '')).map(([campo, a, b]) => ({ tabla, registro_id: id, campo, desde: hoyISO().slice(0, 7), antes: a == null ? null : String(a).slice(0, 500), despues: b == null ? null : String(b).slice(0, 500), motivo: null, por: correo }))
      if (filas.length) await d.insertar('ctl_historial', filas).catch(() => undefined)
    },

    async cambiarPagos(pagos: Pago[], cambios: CambiosPago): Promise<() => Promise<void>> {
      const atras: (() => Promise<void>)[] = []
      for (const p of pagos) {
        await this.anotarCambios(p.origen === 'world' ? 'payments' : 'ctl_pagos', p.id, [['forma', p.forma, cambios.forma === undefined ? p.forma : cambios.forma], ['destino', p.destino, cambios.destino === undefined ? p.destino : cambios.destino], ['referencia', p.referencia, cambios.referencia === undefined ? p.referencia : cambios.referencia], ['comprobantes', p.comprobantes.length, cambios.comprobantes === undefined ? p.comprobantes.length : cambios.comprobantes.length]])
        if (p.origen === 'world') {
          const ex = m.extraPagos.find((x) => x.payment_id === p.id)
          if (ex) {
            const previo = { forma: ex.forma ?? null, destino: ex.destino ?? null, referencia: ex.referencia, comprobantes: ex.comprobantes ?? [] }
            await d.guardar('ctl_pago_extra', ex.id, { ...cambios })
            atras.push(async () => { await d.guardar('ctl_pago_extra', ex.id, previo) })
          } else {
            const [h] = await d.insertar('ctl_pago_extra', [{ payment_id: p.id, recibo_numero: null, referencia: null, ...cambios }])
            atras.push(async () => { await d.borrar('ctl_pago_extra', [h.id]) })
          }
          if (cambios.forma) await d.guardar('payments', p.id, { method: nombreForma(cambios.forma).slice(0, 60) })
        } else {
          const previo = { forma: p.forma, destino: p.destino, referencia: p.referencia, comprobantes: p.comprobantes, cuenta: p.cuenta }
          await d.guardar('ctl_pagos', p.id, { ...cambios, ...(cambios.forma ? { cuenta: nombreForma(cambios.forma).slice(0, 60) } : {}) })
          atras.push(async () => { await d.guardar('ctl_pagos', p.id, { ...previo }) })
        }
      }
      return async () => { for (const f of atras.reverse()) await f() }
    },

    async aplicarAnticipos(plan: Aplicacion[], fecha: string): Promise<() => Promise<void>> {
      const atras: (() => Promise<void>)[] = []
      for (const ap of plan) {
        const c = { clave: ap.cobro_clave, cliente_id: m.anticipos.find((a) => a.id === ap.anticipo_id)?.cliente_id ?? '' }
        atras.push(await this.registrarPago(c, { fecha, monto: ap.monto, forma: 'anticipo', destino: null, referencia: null, nota: 'Aplicado del saldo a favor', anticipo_id: ap.anticipo_id }, null))
      }
      return async () => { for (const f of atras.reverse()) await f() }
    },

    planBorrar(key: string): PlanBorrar {
      return planBorrarCliente(key, {
        trabajos: proyectosDelCliente(m.wProjects, key).length,
        pagos: m.pagos.filter((p) => p.cliente_id === key).length,
        contratos: m.contratos, facturas: m.facturas, cobros: m.cobros, modos: m.modos, gastos: m.gastos, gastosFijos: m.gastosFijos,
        extra: m.extraClientes.filter((e) => e.client_key === key).map((e) => ({ id: e.id, cliente_id: key })),
      })
    },

    async archivarCliente(key: string, si: boolean) {
      const fila = m.extraClientes.find((e) => e.client_key === key)
      await d.guardar('ctl_cliente_extra', fila?.id ?? null, fila ? { archivado: si } : { client_key: key, archivado: si, activo: true })
    },

    async borrarClientes(keys: string[]): Promise<() => Promise<void>> {
      const planes = keys.map((k) => ({ k, plan: this.planBorrar(k) }))
      if (planes.some((x) => x.plan.modo !== 'borrar')) throw new Error('Uno de los clientes tiene movimientos: se archiva, no se borra.')
      const antesAjustes = d.ajustes.clientExtra
      const quitadas: { t: Tabla; filas: Fila[] }[] = planes.flatMap(({ plan }) => plan.borrar.map((b) => ({ t: b.t, filas: (d.tablas[b.t] as Fila[]).filter((f) => b.ids.includes(f.id)) })))
      const desligadas = planes.flatMap(({ k, plan }) => plan.desligar.flatMap((b) => b.ids.map((id) => ({ t: b.t, id, k }))))
      for (const x of desligadas) await d.guardar(x.t, x.id, { cliente_id: null })
      for (const q of quitadas) if (q.filas.length) await d.borrar(q.t, q.filas.map((f) => f.id))
      const extra = cleanAll(d.ajustes.clientExtra)
      for (const k of keys) delete extra[k]
      await d.guardarAjustes({ clientExtra: extra })
      return async () => {
        await d.guardarAjustes({ clientExtra: antesAjustes })
        for (const q of quitadas) if (q.filas.length) await d.insertar(q.t, q.filas.map((f) => ({ ...f })))
        for (const x of desligadas) await d.guardar(x.t, x.id, { cliente_id: x.k })
      }
    },

    async borrarCliente(key: string): Promise<() => Promise<void>> {
      return this.borrarClientes([key])
    },

    async quitarPago(p: Pago) {
      await (await this.eliminarPagos([p]))
    },

    async eliminarPagos(pagos: Pago[]): Promise<() => Promise<void>> {
      const atras: (() => Promise<void>)[] = []
      for (const p of pagos) {
        await this.anotarCambios(p.origen === 'world' ? 'payments' : 'ctl_pagos', p.id, [['eliminado', `${p.monto.toFixed(2)} · ${p.fecha} · ${p.cobro_clave}`, null]])
        if (p.origen === 'world') {
          const fila = (d.tablas.payments as Fila[]).find((x) => x.id === p.id)
          const ex = (d.tablas.ctl_pago_extra as Fila[]).find((x) => x.payment_id === p.id)
          if (ex) await d.borrar('ctl_pago_extra', [ex.id])
          await d.borrar('payments', [p.id])
          atras.push(async () => { if (fila) await d.insertar('payments', [{ ...fila }]); if (ex) await d.insertar('ctl_pago_extra', [{ ...ex }]) })
        } else {
          const fila = (d.tablas.ctl_pagos as Fila[]).find((x) => x.id === p.id)
          await d.borrar('ctl_pagos', [p.id])
          atras.push(async () => { if (fila) await d.insertar('ctl_pagos', [{ ...fila }]) })
        }
      }
      return async () => { for (const f of atras.reverse()) await f() }
    },

    async aplicarPagoA(p: Pago, clave: string, monto: number, fecha: string) {
      const [tipo, pid, per] = clave.split(':')
      const mundo = tipo === 'i' || tipo === 'm' || tipo === 'a'
      if (p.origen === 'world') {
        if (!mundo) throw new Error('Un pago de Monterroso World solo se puede aplicar a una inscripción, mensualidad o pago del trabajo.')
        if (tipo === 'm' && clave !== p.cobro_clave && m.wPayments.some((x) => x.id !== p.id && x.project_id === pid && x.kind === 'monthly' && x.period === per)) throw new Error('Ese mes ya tiene su pago en Monterroso World: edita ese pago o reparte este en otro cobro.')
        await d.guardar('payments', p.id, { project_id: pid, kind: tipo === 'i' ? 'setup' : tipo === 'm' ? 'monthly' : 'other', period: tipo === 'm' ? per : null, amount: monto, paid_at: fecha })
      } else await d.guardar('ctl_pagos', p.id, { cobro_clave: clave, monto, fecha })
    },
  }
}
