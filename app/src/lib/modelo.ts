import { useMemo } from 'react'
import type { PagoTienda, PartePagoTienda } from './tiendaPagos'
import type { Documento } from './documentos'
import { cambiosDe, type Cambio } from './historial'
import type { Anticipo } from './anticipos'
import type { Traslado } from './traslados'
import { cajaPorDefecto, formaDeTexto, type CuentaPersonal } from './pagosDestino'
import type { LinkPublico } from './links'
import type { Accion, Aporte, Conciliacion, CuentaBanco, MovBanco, Recordatorio, Reparto, RepartoSocio, Sociedad, Socio, Tramite, Transmision } from './sa'
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
  sociedad: Sociedad | null
  saDocumentos: { id: string; nombre: string; tipo: string | null; fecha: string | null; archivo: string | null; nota: string | null }[]
  socios: Socio[]
  acciones: Accion[]
  aportes: Aporte[]
  transmisiones: Transmision[]
  repartos: Reparto[]
  repartoSocios: RepartoSocio[]
  bancos: CuentaBanco[]
  movBancos: MovBanco[]
  conciliaciones: Conciliacion[]
  tramites: Tramite[]
  recordatorios: Recordatorio[]
  documentos: Documento[]
  historial: Cambio[]
  cuentas: CuentaPersonal[]
  anticipos: Anticipo[]
  traslados: Traslado[]
  links: LinkPublico[]
  cuentasWorld: import('./pagosDestino').CuentaWorld[]
  traspasos: import('./saldos').Traspaso[]
  marca: { id: string; nombre: string | null; cargo: string | null; correo: string | null; telefono: string | null; sitio: string | null; redes: Record<string, string>; color: string | null } | null
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
    const historial = t.ctl_historial as unknown as Cambio[]
    const cuentas = [...(t.ctl_cuentas as unknown as CuentaPersonal[])].map((c) => ({ ...c, tipo: c.tipo ?? 'banco', saldo_inicial: Number(c.saldo_inicial ?? 0) })).sort((a, b) => a.orden - b.orden || a.banco.localeCompare(b.banco, 'es'))
    const caja = cajaPorDefecto(cuentas)
    const fd = (d: string | null | undefined) => (d === 'efectivo' && caja ? `e:${caja.id}` : d ?? null)
    const proyectos = wProjects.map((w) => ({ ...proyectoDeWorld(w, extraProyectos.find((x) => x.project_id === w.id)), cambiosMensualidad: cambiosDe(historial, 'projects', w.id, 'mensualidad') })).sort((a, b) => b.creado.localeCompare(a.creado))
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
      pagos: [...pagosWorld.map((p) => ({ ...p, destino: fd(p.destino ?? (p.forma === 'efectivo' ? 'efectivo' : null)) })), ...(t.ctl_pagos as unknown as Pago[]).map((p) => ({ ...p, origen: 'ctl' as const, forma: p.forma ?? formaDeTexto(p.cuenta), destino: fd(p.destino ?? (formaDeTexto(p.cuenta) === 'efectivo' ? 'efectivo' : null)), comprobantes: Array.isArray(p.comprobantes) ? p.comprobantes : [], anticipo_id: p.anticipo_id ?? null, registrado_por: p.registrado_por ?? null, proyecto_id: (t.ctl_cobros as unknown as CobroGuardado[]).find((c) => c.clave === p.cobro_clave)?.proyecto_id ?? null }))].sort((a, b) => b.fecha.localeCompare(a.fecha)),
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
      sociedad: ((t.ctl_sa as unknown as Sociedad[])[0] ?? null),
      saDocumentos: [...(t.ctl_sa_documentos as unknown as Modelo['saDocumentos'])].sort((a, b) => (b.fecha ?? '').localeCompare(a.fecha ?? '')),
      socios: porNombre(t.ctl_sa_socios as unknown as Socio[]),
      acciones: [...(t.ctl_sa_acciones as unknown as Accion[])].sort((a, b) => a.fecha.localeCompare(b.fecha)),
      aportes: [...(t.ctl_sa_aportes as unknown as Aporte[])].sort((a, b) => a.fecha.localeCompare(b.fecha)),
      transmisiones: [...(t.ctl_sa_transmisiones as unknown as Transmision[])].sort((a, b) => a.fecha.localeCompare(b.fecha)),
      repartos: [...(t.ctl_sa_repartos as unknown as Reparto[])].sort((a, b) => b.hasta.localeCompare(a.hasta)),
      repartoSocios: t.ctl_sa_reparto_socios as unknown as RepartoSocio[],
      bancos: [...(t.ctl_bancos as unknown as CuentaBanco[])].sort((a, b) => a.banco.localeCompare(b.banco, 'es')),
      movBancos: [...(t.ctl_banco_movimientos as unknown as MovBanco[])].sort((a, b) => b.fecha.localeCompare(a.fecha)),
      conciliaciones: t.ctl_banco_conciliaciones as unknown as Conciliacion[],
      tramites: [...(t.ctl_sa_tramites as unknown as Tramite[])].sort((a, b) => a.orden - b.orden),
      recordatorios: [...(t.ctl_recordatorios as unknown as Recordatorio[])].sort((a, b) => a.proxima.localeCompare(b.proxima)),
      historial,
      cuentas,
      anticipos: [...(t.ctl_anticipos as unknown as Anticipo[])].map((a) => ({ ...a, destino: fd(a.destino), comprobantes: Array.isArray(a.comprobantes) ? a.comprobantes : [] })).sort((a, b) => b.fecha.localeCompare(a.fecha)),
      traslados: [...(t.ctl_traslados as unknown as Traslado[])].map((x) => ({ ...x, pagos: Array.isArray(x.pagos) ? x.pagos : [] })).sort((a, b) => b.fecha.localeCompare(a.fecha)),
      links: t.ctl_links as unknown as LinkPublico[],
      traspasos: [...(t.ctl_traspasos as unknown as import('./saldos').Traspaso[])].sort((a, b) => b.fecha.localeCompare(a.fecha)),
      cuentasWorld: (t.fin_accounts as unknown as import('./pagosDestino').CuentaWorld[]) ?? [],
      documentos: [...(t.ctl_documentos as unknown as Documento[])].sort((a, b) => b.fecha.localeCompare(a.fecha) || (b.numero ?? 0) - (a.numero ?? 0)),
      marca: ((t.ctl_marca as unknown as Modelo['marca'][])[0] ?? null),
      wProjects, wPayments, extraProyectos, extraClientes, extraPagos, clientExtraRaw: ajustes.clientExtra,
      pagosTienda: [...(t.ctl_tienda_pagos as unknown as PagoTienda[])].map((x) => ({ ...x, destino: fd(x.destino) })).sort((a, b) => b.fecha.localeCompare(a.fecha)),
      partesTienda: t.ctl_tienda_pago_partes as unknown as PartePagoTienda[],
      devBitacora: [...(t.ctl_dev_bitacora as unknown as DevBitacora[])].sort((a, b) => b.fecha.localeCompare(a.fecha)),
    }
  }, [t, ajustes])
}
