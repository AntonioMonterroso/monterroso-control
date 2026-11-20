export type ClaveNegocio = 'dev' | 'canela' | 'salario' | 'musica' | 'diseno' | 'sa'
export type Regimen = 'sin_iva' | 'pequeno' | 'general'
export type EstadoProyecto = 'propuesta' | 'en_curso' | 'entregado' | 'cerrado'
export type FormaInscripcion = 'completa' | 'mitad' | 'personalizada'
export type Momento = 'firma' | 'entrega' | 'fecha'

export interface Negocio {
  id: string
  clave: ClaveNegocio
  nombre: string
  descripcion: string | null
  activo: boolean
  orden: number
  en_sa?: boolean
}

export interface Cliente {
  id: string
  negocio_id: string
  nombre: string
  rubro: string | null
  whatsapp: string | null
  correo: string | null
  nit: string | null
  direccion: string | null
  regimen: Regimen | null
  notas: string | null
  activo: boolean
  creado: string
  aka?: string[]
  archivado?: boolean
}

export interface ParteInscripcion {
  id?: string
  orden: number
  concepto: string
  momento: Momento
  fecha: string | null
  monto: number
}

export interface Proyecto {
  id: string
  cliente_id: string
  nombre: string
  descripcion: string | null
  estado: EstadoProyecto
  fecha_firma: string | null
  fecha_entrega: string | null
  inscripcion_total: number
  inscripcion_forma: FormaInscripcion | null
  mensualidad: number
  dia_cobro: number | null
  mensualidad_inicio: string | null
  mensualidad_fin: string | null
  notas_tecnicas?: string | null
  creado: string
  partes: ParteInscripcion[]
  monto_unico?: number
  mes?: string
  sitio?: string | null
  world_status?: string
}

export type NuevoCliente = Omit<Cliente, 'id' | 'creado'>
export type NuevoProyecto = Omit<Proyecto, 'id' | 'creado'>

export const ESTADOS: { valor: EstadoProyecto; nombre: string; clase: string }[] = [
  { valor: 'propuesta', nombre: 'Propuesta', clase: 'pendiente' },
  { valor: 'en_curso', nombre: 'En curso', clase: 'en-proceso' },
  { valor: 'entregado', nombre: 'Entregado', clase: 'aprobado' },
  { valor: 'cerrado', nombre: 'Cerrado', clase: 'bloqueado' },
]

export const REGIMENES: { valor: Regimen; nombre: string }[] = [
  { valor: 'sin_iva', nombre: 'Sin IVA' },
  { valor: 'pequeno', nombre: 'Pequeño contribuyente (5 %)' },
  { valor: 'general', nombre: 'Régimen general (12 %)' },
]

export const NEGOCIOS_BASE: { clave: ClaveNegocio; nombre: string; descripcion: string; orden: number }[] = [
  { clave: 'dev', nombre: 'Monterroso Dev Studio', descripcion: 'Páginas y sistemas: inscripción y mensualidad por cliente.', orden: 1 },
  { clave: 'canela', nombre: 'Hogar Canela', descripcion: 'Tienda en Shopify con Dropi.', orden: 2 },
  { clave: 'salario', nombre: 'Salario', descripcion: 'Sueldo fijo mensual y sus gastos.', orden: 3 },
  { clave: 'musica', nombre: 'Música', descripcion: 'Parte de la sociedad anónima.', orden: 4 },
  { clave: 'diseno', nombre: 'Diseño', descripcion: 'Parte de la sociedad anónima.', orden: 5 },
  { clave: 'sa', nombre: 'Sociedad anónima (generales)', descripcion: 'Gastos e ingresos de la sociedad que no son de un negocio: constitución, contador, banco.', orden: 6 },
]

export const NEGOCIOS_SA: ClaveNegocio[] = ['dev', 'musica', 'diseno', 'sa']

export type TipoCobro = 'inscripcion' | 'mensualidad' | 'extra' | 'salario'
export type EstadoCobro = 'pagado' | 'por_cobrar' | 'vencido' | 'saldado'

export interface CobroGuardado {
  id: string
  clave: string
  cliente_id: string | null
  proyecto_id: string | null
  tipo: TipoCobro
  concepto: string | null
  vence: string | null
  monto: number | null
  saldado: boolean
  nota: string | null
}

export interface Pago {
  id: string
  cliente_id: string | null
  cobro_clave: string
  fecha: string
  monto: number
  cuenta: string
  referencia: string | null
  nota: string | null
  recibo_numero: number | null
  creado: string
  origen?: 'world' | 'ctl'
}

export type TipoCategoria = 'gasto' | 'ingreso'

export interface Categoria {
  id: string
  nombre: string
  tipo: TipoCategoria
  clave: string | null
  activo: boolean
  orden: number
}

export interface Gasto {
  id: string
  fecha: string
  negocio_id: string
  categoria_id: string
  cliente_id: string | null
  proyecto_id: string | null
  descripcion: string
  monto: number
  cuenta: string | null
  proveedor: string | null
  proveedor_nit: string | null
  factura_serie: string | null
  factura_numero: string | null
  archivo: string | null
  gasto_fijo_id: string | null
  periodo: string | null
  origen_mw_id: string | null
  dev_servicio_id?: string | null
  creado: string
}

export interface GastoFijo {
  id: string
  nombre: string
  negocio_id: string
  categoria_id: string
  cliente_id: string | null
  monto: number
  dia: number
  inicio: string
  fin: string | null
  activo: boolean
}

export interface Presupuesto {
  id: string
  periodo: string
  negocio_id: string
  categoria_id: string
  monto: number
}

export interface Producto {
  id: string
  sku: string | null
  nombre: string
  costo: number
  precio: number
  envio_estimado: number
  activo: boolean
  compartir: boolean
}

export type EstadoVenta = 'pendiente' | 'entregado' | 'devuelto'

export interface VentaTienda {
  id: string
  pedido: string
  fecha: string
  cliente_nombre: string | null
  descripcion: string
  cantidad: number
  precio_venta: number
  costo_producto: number
  envio: number
  comision: number
  otros: number
  estado: EstadoVenta
  origen: 'manual' | 'csv'
}

export interface AumentoSalario {
  id: string
  desde: string
  bruto: number
  descuentos: number
  dia_pago: number
  nota: string | null
}

export type TipoDeuda = 'cuotas' | 'tarjeta'

export interface Deuda {
  id: string
  nombre: string
  tipo: TipoDeuda
  negocio_id: string
  categoria_id: string
  total: number
  cuotas: number | null
  cuota: number | null
  dia_pago: number | null
  inicio: string
  limite: number | null
  saldo_inicial: number
  activo: boolean
  nota: string | null
}

export interface MovimientoDeuda {
  id: string
  deuda_id: string
  tipo: 'pago' | 'cargo'
  fecha: string
  monto: number
  nota: string | null
}

export interface ModoImpuesto {
  id: string
  ambito: 'negocio' | 'cliente'
  negocio_id: string | null
  cliente_id: string | null
  regimen: Regimen
  desde: string
}

export interface Factura {
  id: string
  tipo: 'emitida' | 'recibida'
  fecha: string
  serie: string | null
  numero: string
  nit: string | null
  nombre: string
  total: number
  negocio_id: string
  cliente_id: string | null
  pago_id: string | null
  gasto_id: string | null
  archivo: string | null
  anulada: boolean
}

export interface Tarifa {
  id: string
  nombre: string
  tipo: 'paquete' | 'extra'
  inscripcion: number
  mensualidad: number
  precio: number
  descripcion: string | null
  incluye: string | null
  compartir: boolean
  activo: boolean
  orden: number
}

export interface Clausula {
  titulo: string
  texto: string
  fija: boolean
}

export interface PlantillaContrato {
  id: string
  nombre: string
  encabezado: string
  clausulas: Clausula[]
  cierre: string
}

export interface Contrato {
  id: string
  cliente_id: string
  proyecto_id: string | null
  plantilla_id: string | null
  titulo: string
  contenido: string
  fecha: string
  fecha_firma: string | null
  creado: string
}

export const CUENTAS = ['Banco', 'Efectivo', 'Transferencia', 'Tarjeta', 'Depósito']
