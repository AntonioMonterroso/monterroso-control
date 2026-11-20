import type { Escena, GuiaVideo, Pieza } from '../tipos'

const deudas: Pieza = {
  k: 'tabla',
  g: 'tabla',
  cab: ['Deuda', 'Negocio', 'Día', 'Cuota', 'Saldo'],
  filas: [
    { c: ['Computadora a 12 cuotas', 'Monterroso Dev Studio', '15', 'Q 850.00', 'Q 6,800.00'], g: 'fila1', acc: [{ t: 'Pago', g: 'pago1' }, { t: 'Editar' }] },
    { c: ['Tarjeta del banco', 'Monterroso Dev Studio', '20', '', 'Q 1,350.00'], acc: [{ t: 'Pago' }, { t: 'Compra', g: 'compra2' }, { t: 'Editar' }] },
  ],
}

const pantalla = (conMovs = false): Escena => ({
  etiqueta: 'Empresa',
  titulo: 'Deudas y tarjeta',
  acciones: [{ t: 'Nueva deuda', g: 'nueva', p: true }],
  piezas: [
    { k: 'cifras', g: 'kpis', l: [{ et: 'Debes en total', v: 'Q 8,150.00', sub: '2 deudas activas' }, { et: 'Cuotas del mes', v: 'Q 850.00', sub: 'sin contar la tarjeta' }] },
    deudas,
    ...(conMovs ? [{ k: 'tabla', g: 'movs', cab: ['Fecha', 'Tipo', 'Nota', 'Monto'], filas: [{ c: ['15 nov 2026', 'Pago', 'Cuota 4 de 12', 'Q 850.00'], acc: [{ t: 'Editar', g: 'lapizMov' }, { t: 'Quitar', g: 'boteMov' }] }] } as Pieza] : []),
  ],
})

const guia: GuiaVideo = {
  ruta: '/deudas',
  menu: 'Deudas y tarjeta',
  caps: [
    {
      t: '1 · Tus deudas',
      e0: pantalla(),
      tomas: [
        { t: 'Toca «Nueva deuda» para agregar una compra a cuotas o una tarjeta de crédito.', en: 'nueva' },
        { t: 'Arriba ves cuánto debes en total y las cuotas del mes.', en: 'kpis' },
        { t: 'En cada deuda toca «Pago» para registrar un pago.', en: 'pago1', clic: true, luego: { hoja: { titulo: 'Pago de la deuda', piezas: [{ k: 'campos', l: [{ et: 'Fecha', v: '15 nov 2026' }, { et: 'Monto', v: 'Q 850.00' }, { et: 'Nota', v: 'Cuota 4 de 12' }] }], pie: [{ t: 'Cancelar' }, { t: 'Guardar', g: 'guardar', p: true }] } } },
        { t: 'Toca «Guardar»: el pago entra como gasto del negocio y cuenta en el presupuesto.', en: 'guardar', clic: true, luego: { hoja: null } },
        { t: 'Si es tarjeta, toca «Compra» para anotar lo que compraste con ella.', en: 'compra2' },
      ],
    },
    {
      t: '2 · Movimientos',
      e0: pantalla(),
      tomas: [
        { t: 'Toca una deuda para ver sus movimientos abajo.', en: 'fila1', clic: true, luego: pantalla(true) },
        { t: 'Cada movimiento se corrige con su lápiz.', en: 'lapizMov' },
        { t: 'O se quita con el basurero; quitar se puede deshacer.', en: 'boteMov' },
      ],
    },
  ],
}

export default guia
