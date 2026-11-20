import type { Fila, Tabla } from './almacen'
import { NEGOCIOS_BASE } from './tipos'

export const CATEGORIAS_BASE: { nombre: string; tipo: 'gasto' | 'ingreso'; clave: string | null; orden: number }[] = [
  { nombre: 'Inscripciones', tipo: 'ingreso', clave: 'inscripcion', orden: 1 },
  { nombre: 'Mensualidades', tipo: 'ingreso', clave: 'mensualidad', orden: 2 },
  { nombre: 'Extras de clientes', tipo: 'ingreso', clave: 'extra', orden: 3 },
  { nombre: 'Ventas de la tienda', tipo: 'ingreso', clave: 'tienda', orden: 4 },
  { nombre: 'Salario', tipo: 'ingreso', clave: 'salario', orden: 5 },
  { nombre: 'Transporte', tipo: 'gasto', clave: null, orden: 10 },
  { nombre: 'Tokens de API', tipo: 'gasto', clave: null, orden: 11 },
  { nombre: 'Dominio y hosting', tipo: 'gasto', clave: null, orden: 12 },
  { nombre: 'Internet', tipo: 'gasto', clave: null, orden: 13 },
  { nombre: 'Software', tipo: 'gasto', clave: null, orden: 14 },
  { nombre: 'Equipo', tipo: 'gasto', clave: null, orden: 15 },
  { nombre: 'Publicidad', tipo: 'gasto', clave: null, orden: 16 },
  { nombre: 'Pago de deudas y tarjeta', tipo: 'gasto', clave: 'deudas', orden: 17 },
  { nombre: 'Costo de pedidos de la tienda', tipo: 'gasto', clave: 'costo_tienda', orden: 18 },
  { nombre: 'Otros gastos', tipo: 'gasto', clave: null, orden: 30 },
]

export const PLANTILLA_BASE = {
  nombre: 'Desarrollo web con mensualidad',
  encabezado: 'En {ciudad}, el {fecha}, comparecen por una parte {prestador}, en adelante «el prestador», y por la otra {cliente}, con NIT {nit}, en adelante «el cliente», quienes celebran el presente contrato de servicios.',
  clausulas: [
    { titulo: 'Objeto', texto: 'El prestador desarrollará para el cliente el proyecto «{proyecto}». {descripcion}', fija: true },
    { titulo: 'Inscripción', texto: 'El cliente pagará una inscripción de {inscripcion}, de la siguiente forma: {partes}.', fija: true },
    { titulo: 'Mensualidad', texto: 'A partir del {inicio}, el cliente pagará una mensualidad de {mensualidad} el día {dia_cobro} de cada mes{fin}.', fija: true },
    { titulo: 'Entrega', texto: 'La entrega se hará el {entrega}, o en la fecha que ambas partes acuerden por escrito.', fija: false },
    { titulo: 'Cambios fuera del alcance', texto: 'Los cambios que no estén descritos en el objeto se cotizarán aparte antes de hacerse.', fija: false },
    { titulo: 'Atraso en los pagos', texto: 'Si la mensualidad no se paga dentro de los diez días siguientes a su fecha, el prestador podrá pausar el servicio hasta que se ponga al día.', fija: false },
    { titulo: 'Propiedad', texto: 'Al completar los pagos de la inscripción, el contenido del cliente le pertenece. El código y las herramientas propias del prestador siguen siendo del prestador.', fija: false },
    { titulo: 'Terminación', texto: 'Cualquiera de las partes puede terminar la mensualidad avisando por escrito con treinta días de anticipación.', fija: false },
  ],
  cierre: 'Leído lo anterior, ambas partes lo aceptan y firman.',
}

export function semillas(t: Record<Tabla, Fila[]>): [Tabla, Record<string, unknown>[]][] {
  const r: [Tabla, Record<string, unknown>[]][] = []
  const neg = NEGOCIOS_BASE.filter((b) => !t.ctl_negocios.some((n) => n.clave === b.clave)).map((b) => ({ ...b, activo: true }))
  if (neg.length) r.push(['ctl_negocios', neg])
  if (t.ctl_categorias.length === 0) r.push(['ctl_categorias', CATEGORIAS_BASE.map((c) => ({ ...c, activo: true }))])
  else {
    const faltan = CATEGORIAS_BASE.filter((c) => c.clave && !t.ctl_categorias.some((x) => x.clave === c.clave)).map((c) => ({ ...c, activo: true }))
    if (faltan.length) r.push(['ctl_categorias', faltan])
  }
  if (t.ctl_plantillas_contrato.length === 0) r.push(['ctl_plantillas_contrato', [PLANTILLA_BASE]])
  return r
}
