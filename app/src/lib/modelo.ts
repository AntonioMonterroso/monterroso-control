import { useMemo } from 'react'
import type { PagoTienda, PartePagoTienda } from './tiendaPagos'
import type { DevBitacora, DevEnlace, DevServicio, DevSupabase, DevToken } from './desarrollo'
import { useDatos } from './datos'
import { clientesDeWorld, pagoDeWorld, proyectoDeWorld, type ExtraCliente, type ExtraPago, type ExtraProyecto } from './puente'
import type { WPayment, WProject } from './world'
import type {
  AumentoSalario, Categoria, Cliente, CobroGuardado, Contrato, Deuda, Factura, Gasto, GastoFijo, ModoImpuesto, MovimientoDeuda,
  Negocio, Pago, PlantillaContrato, Presupuesto, Producto, Proyecto, Tarifa, VentaTienda,
} from './tipos'

export interface Modelo {
  negocios: Negocio[]
  clientes: Cliente[]
  proyectos: Proyecto[]
  cobros: CobroGuardado[]
  pagos: Pago[]
  categorias: Categoria[]
  gastos: Gasto[]
  gastosFijos: GastoFijo[]
  presupuestos: Presupuesto[]
  productos: Producto[]
  ventas: VentaTienda[]
  aumentos: AumentoSalario[]
  deudas: Deuda[]
  movimientos: MovimientoDeuda[]
  modos: ModoImpuesto[]
  facturas: Factura[]
  tarifas: Tarifa[]
  plantillas: PlantillaContrato[]
  contratos: Contrato[]
  mwAreas: string[]
  devSupabase: DevSupabase[]
  devTokens: DevToken[]
  devServicios: DevServicio[]
  devEnlaces: DevEnlace[]
  devBitacora: DevBitacora[]
  pagosTienda: PagoTienda[]
  wProjects: WProject[]
  wPayments: WPayment[]
  extraProyectos: ExtraProyecto[]
  extraClientes: ExtraCliente[]
  extraPagos: ExtraPago[]
  clientExtraRaw: unknown
  partesTienda: PartePagoTienda[]
}

export function useModelo(): Modelo {
  const { tablas: t, ajustes } = useDatos()
  return useMemo(() => {
    const wProjects = (t.projects as unknown as WProject[]).map((w) => ({ ...w, amount: Number(w.amount ?? 0), setup_fee: Number(w.setup_fee ?? 0), monthly_fee: Number(w.monthly_fee ?? 0) }))
    const wPayments = (t.payments as unknown as WPayment[]).map((w) => ({ ...w, amount: Number(w.amount) }))
    const extraProyectos = t.ctl_proyecto_extra as unknown as ExtraProyecto[]
    const extraClientes = t.ctl_cliente_extra as unknown as ExtraCliente[]
    const extraPagos = t.ctl_pago_extra as unknown as ExtraPago[]
    const proyectos = wProjects.map((w) => proyectoDeWorld(w, extraProyectos.find((x) => x.project_id === w.id))).sort((a, b) => b.creado.localeCompare(a.creado))
    const porId = new Map(wProjects.map((w) => [w.id, w]))
    const pagosWorld = wPayments.map((p) => pagoDeWorld(p, porId, extraPagos.find((x) => x.payment_id === p.id))).filter((p): p is Pago => p != null)
    const negocios = [...(t.ctl_negocios as unknown as Negocio[])].sort((a, b) => a.orden - b.orden)
    const devId = negocios.find((n) => n.clave === 'dev')?.id ?? ''
    const porNombre = <T extends { nombre: string }>(l: T[]) => [...l].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
    return {
      negocios,
      clientes: clientesDeWorld(wProjects, ajustes.clientExtra, extraClientes, devId),
      proyectos,
      cobros: t.ctl_cobros as unknown as CobroGuardado[],
      pagos: [...pagosWorld, ...(t.ctl_pagos as unknown as Pago[]).map((p) => ({ ...p, origen: 'ctl' as const }))].sort((a, b) => b.fecha.localeCompare(a.fecha)),
      categorias: [...(t.ctl_categorias as unknown as Categoria[])].sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre, 'es')),
      gastos: [...(t.ctl_gastos as unknown as Gasto[])].sort((a, b) => b.fecha.localeCompare(a.fecha)),
      gastosFijos: porNombre(t.ctl_gastos_fijos as unknown as GastoFijo[]),
      presupuestos: t.ctl_presupuestos as unknown as Presupuesto[],
      productos: porNombre(t.ctl_productos as unknown as Producto[]),
      ventas: [...(t.ctl_ventas_tienda as unknown as VentaTienda[])].sort((a, b) => b.fecha.localeCompare(a.fecha)),
      aumentos: [...(t.ctl_salario_aumentos as unknown as AumentoSalario[])].sort((a, b) => a.desde.localeCompare(b.desde)),
      deudas: porNombre(t.ctl_deudas as unknown as Deuda[]),
      movimientos: [...(t.ctl_deuda_movimientos as unknown as MovimientoDeuda[])].sort((a, b) => b.fecha.localeCompare(a.fecha)),
      modos: [...(t.ctl_impuesto_modo as unknown as ModoImpuesto[])].sort((a, b) => a.desde.localeCompare(b.desde)),
      facturas: [...(t.ctl_facturas as unknown as Factura[])].sort((a, b) => b.fecha.localeCompare(a.fecha)),
      tarifas: [...(t.ctl_tarifas as unknown as Tarifa[])].sort((a, b) => a.orden - b.orden),
      plantillas: t.ctl_plantillas_contrato as unknown as PlantillaContrato[],
      contratos: [...(t.ctl_contratos as unknown as Contrato[])].sort((a, b) => b.fecha.localeCompare(a.fecha)),
      mwAreas: (t.ctl_mw_areas as unknown as { area: string }[]).map((x) => x.area),
      devSupabase: porNombre(t.ctl_dev_supabase as unknown as DevSupabase[]),
      devTokens: porNombre(t.ctl_dev_tokens as unknown as DevToken[]),
      devServicios: [...(t.ctl_dev_servicios as unknown as DevServicio[])].sort((a, b) => (a.renovacion ?? '9').localeCompare(b.renovacion ?? '9')),
      devEnlaces: porNombre(t.ctl_dev_enlaces as unknown as DevEnlace[]),
      wProjects, wPayments, extraProyectos, extraClientes, extraPagos, clientExtraRaw: ajustes.clientExtra,
      pagosTienda: [...(t.ctl_tienda_pagos as unknown as PagoTienda[])].sort((a, b) => b.fecha.localeCompare(a.fecha)),
      partesTienda: t.ctl_tienda_pago_partes as unknown as PartePagoTienda[],
      devBitacora: [...(t.ctl_dev_bitacora as unknown as DevBitacora[])].sort((a, b) => b.fecha.localeCompare(a.fecha)),
    }
  }, [t, ajustes])
}
