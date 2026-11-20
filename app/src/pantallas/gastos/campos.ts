import type { Campo } from '../../componentes/FormRegistro'
import type { Modelo } from '../../lib/modelo'
import { CUENTAS } from '../../lib/tipos'
import { opcionesDestino } from '../../lib/pagosDestino'

export const opcNegocios = (m: Modelo) => m.negocios.filter((n) => n.activo).map((n) => ({ valor: n.id, nombre: n.nombre }))
export const opcCategorias = (m: Modelo, tipo: 'gasto' | 'ingreso' = 'gasto', incluir?: string) => m.categorias.filter((c) => c.tipo === tipo && (c.activo || c.id === incluir)).map((c) => ({ valor: c.id, nombre: c.nombre }))
export const opcClientes = (m: Modelo) => m.clientes.filter((c) => c.activo && !c.archivado).map((c) => ({ valor: c.id, nombre: c.nombre }))

export function camposGasto(m: Modelo, incluirCat?: string): Campo[] {
  return [
    { k: 'fecha', etiqueta: 'Fecha', tipo: 'fecha', requerido: true },
    { k: 'monto', etiqueta: 'Monto', tipo: 'monto', requerido: true },
    { k: 'descripcion', etiqueta: 'Descripción', tipo: 'texto', requerido: true, max: 300, ancho: true },
    { k: 'negocio_id', etiqueta: 'Negocio', tipo: 'select', requerido: true, opciones: opcNegocios(m) },
    { k: 'categoria_id', etiqueta: 'Categoría', tipo: 'select', requerido: true, opciones: opcCategorias(m, 'gasto', incluirCat) },
    { k: 'cliente_id', etiqueta: 'Gasto de un cliente', tipo: 'select', opciones: opcClientes(m), ayuda: 'Si lo pagaste por un cliente, cuenta en su costo.' },
    { k: 'cuenta', etiqueta: 'Forma de pago', tipo: 'select', opciones: CUENTAS.map((c) => ({ valor: c, nombre: c })) },
    { k: 'destino', etiqueta: 'De dónde salió el dinero', tipo: 'select', opciones: opcionesDestino(m.cuentas, m.bancos.map((b) => ({ id: b.id, banco: b.banco, numero: b.numero, nombre: b.nombre, activo: b.activo })), null, m.cuentasWorld), ayuda: 'Cuenta personal, caja de efectivo, cuenta de la S.A. u otro.' },
    { k: 'proveedor', etiqueta: 'Proveedor', tipo: 'texto', max: 200 },
    { k: 'proveedor_nit', etiqueta: 'NIT del proveedor', tipo: 'texto', max: 30 },
    { k: 'factura_serie', etiqueta: 'Serie de la factura', tipo: 'texto', max: 40 },
    { k: 'factura_numero', etiqueta: 'Número de la factura', tipo: 'texto', max: 40 },
    { k: 'archivo', etiqueta: 'Factura o comprobante', tipo: 'archivo', ancho: true },
  ]
}

export function camposFijo(m: Modelo): Campo[] {
  return [
    { k: 'nombre', etiqueta: 'Nombre', tipo: 'texto', requerido: true, max: 120, ancho: true },
    { k: 'monto', etiqueta: 'Monto mensual', tipo: 'monto', requerido: true },
    { k: 'dia', etiqueta: 'Día del mes', tipo: 'numero', requerido: true, min: 1, max: 31 },
    { k: 'negocio_id', etiqueta: 'Negocio', tipo: 'select', requerido: true, opciones: opcNegocios(m) },
    { k: 'categoria_id', etiqueta: 'Categoría', tipo: 'select', requerido: true, opciones: opcCategorias(m) },
    { k: 'cliente_id', etiqueta: 'De un cliente', tipo: 'select', opciones: opcClientes(m) },
    { k: 'inicio', etiqueta: 'Desde', tipo: 'fecha', requerido: true },
    { k: 'fin', etiqueta: 'Hasta', tipo: 'fecha' },
    { k: 'activo', etiqueta: 'Activo', tipo: 'casilla' },
  ]
}
