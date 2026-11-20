import type { Escena, GuiaVideo, Pieza } from '../tipos'

const pestanas = (on: number): Pieza => ({ k: 'pestanas', g: 'pestanas', l: [{ t: 'Del mes', g: 'pMes' }, { t: 'Del año', g: 'pAnio' }], on })

const resultados: Pieza = { k: 'tabla', g: 'resultados', cab: ['Estado de resultados', 'Monto'], filas: [{ c: ['Mensualidades', 'Q 4,200.00'] }, { c: ['Total ingresos', 'Q 4,200.00'] }, { c: ['Hosting y dominios', 'Q 450.00'] }, { c: ['Total gastos', 'Q 450.00'] }, { c: ['Utilidad del período', 'Q 3,750.00'] }] }

const balance: Pieza = {
  k: 'tabla',
  g: 'balance',
  cab: ['Balance general', 'Monto'],
  filas: [
    { c: ['Bancos', 'Q 7,350.00'] },
    { c: ['Cuentas por cobrar', 'Q 1,050.00'] },
    { c: ['Cuenta por cobrar al socio o administrador', 'Q 1,350.00'], g: 'socio' },
    { c: ['Total activo', 'Q 9,750.00'] },
    { c: ['Total pasivo', 'Q 0.00'] },
    { c: ['Total patrimonio', 'Q 9,750.00'] },
  ],
}

const pantalla = (on = 0): Escena => ({
  etiqueta: 'Sociedad anónima',
  titulo: 'Estados financieros',
  acciones: [{ t: 'Excel', g: 'excel' }, { t: 'PDF', g: 'pdf' }],
  piezas: [{ k: 'campos', g: 'mes', l: [{ et: 'Mes', v: 'noviembre 2026' }] }, pestanas(on), resultados, balance],
})

const guia: GuiaVideo = {
  ruta: '/sa/estados',
  menu: 'Estados financieros',
  caps: [
    {
      t: '1 · Estados de la sociedad',
      e0: pantalla(),
      tomas: [
        { t: 'Elige el mes con las flechas del selector de mes.', en: 'mes' },
        { t: '«Del mes» o «Del año» cambian el período.', en: 'pAnio', clic: true, luego: pantalla(1) },
        { t: 'El «Estado de resultados» muestra ingresos, gastos y la utilidad.', en: 'resultados' },
        { t: 'El «Balance general» muestra bancos, lo que te deben, deudas y patrimonio.', en: 'balance' },
        { t: '«Cuenta por cobrar al socio o administrador» es lo de la S.A. que cayó en tu cuenta personal y aún no trasladas.', en: 'socio', ms: 5200 },
        { t: 'Se arregla en «Dónde está mi dinero» con «Registrar traslado a la S.A.».', en: 'socio' },
        { t: '«Excel» los baja y «PDF» los abre con el formato de la firma.', en: 'pdf' },
      ],
    },
  ],
}

export default guia
