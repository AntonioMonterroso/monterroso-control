import type { Escena, GuiaVideo, Pieza } from '../tipos'

const pestanas = (on: number): Pieza => ({ k: 'pestanas', g: 'pestanas', l: [{ t: 'Del mes', g: 'pMes' }, { t: 'Del año', g: 'pAnio' }], on })

const cols = (on: number) => (on ? ['2026', '2025'] : ['Noviembre 2026', 'Octubre 2026'])

const cabeza = (on: number): Pieza => ({ k: 'texto', g: 'cabeza', t: `Ejemplo, Sociedad Anónima · Estado de resultados · ${on ? 'Del 1 de enero al 31 de diciembre de 2026' : 'Del 1 de noviembre de 2026 al 30 de noviembre de 2026'} · Cifras expresadas en quetzales` })

const resultados = (on: number): Pieza => ({
  k: 'tabla',
  g: 'resultados',
  cab: ['Concepto', 'Notas', ...cols(on)],
  filas: [
    { c: ['Ingresos', '', '', ''] },
    { c: ['Mensualidades', '', on ? '46,200.00' : '4,200.00', on ? '38,400.00' : '3,850.00'] },
    { c: ['Total ingresos', '', on ? '46,200.00' : '4,200.00', on ? '38,400.00' : '3,850.00'], g: 'subtotal' },
    { c: ['Gastos', '', '', ''] },
    { c: ['Hosting y dominios', '', on ? '(4,950.00)' : '(450.00)', on ? '(4,200.00)' : '(450.00)'], g: 'negativo' },
    { c: ['Total gastos', '', on ? '(4,950.00)' : '(450.00)', on ? '(4,200.00)' : '(450.00)'] },
    { c: ['Utilidad (pérdida) del período', '', on ? '41,250.00' : '3,750.00', on ? '34,200.00' : '3,400.00'], g: 'total' },
  ],
})

const balance: Pieza = {
  k: 'tabla',
  g: 'balance',
  cab: ['Concepto', 'Notas', 'Al 30 de noviembre de 2026', 'Al 31 de octubre de 2026'],
  filas: [
    { c: ['Activo', '', '', ''] },
    { c: ['Activo corriente', '', '', ''], g: 'grupos' },
    { c: ['Bancos', '', '7,350.00', '6,100.00'] },
    { c: ['Cuenta por cobrar al socio o administrador', '1', '1,350.00', '—'], g: 'socio' },
    { c: ['Movimientos por pasar a Bancos', '2', '350.00', '—'], g: 'porPasar' },
    { c: ['Total activo corriente', '', '9,050.00', '6,100.00'] },
    { c: ['Activo no corriente', '', '', ''] },
    { c: ['Bienes y servicios comprados a crédito', '3', '1,200.00', '1,200.00'], g: 'credito' },
    { c: ['Total activo no corriente', '', '1,200.00', '1,200.00'] },
    { c: ['Total activo', '', '10,250.00', '7,300.00'] },
    { c: ['Pasivo', '', '', ''] },
    { c: ['Pasivo corriente', '', '', ''] },
    { c: ['Cuenta por pagar al socio o administrador', '4', '450.00', '—'], g: 'cxp' },
    { c: ['Anticipos de clientes', '', '1,000.00', '—'] },
    { c: ['Total pasivo corriente', '', '1,450.00', '—'] },
    { c: ['Pasivo no corriente', '', '', ''] },
    { c: ['Deudas de la S.A.', '', '1,200.00', '1,200.00'] },
    { c: ['Total pasivo no corriente', '', '1,200.00', '1,200.00'] },
    { c: ['Total pasivo', '', '2,650.00', '1,200.00'] },
    { c: ['Patrimonio', '', '', ''] },
    { c: ['Capital suscrito', '', '10,000.00', '10,000.00'] },
    { c: ['Capital suscrito no pagado', '', '(6,150.00)', '(7,750.00)'], g: 'noPagado' },
    { c: ['Utilidades acumuladas', '', '3,750.00', '3,850.00'] },
    { c: ['Total patrimonio', '', '7,600.00', '6,100.00'] },
    { c: ['Total pasivo y patrimonio', '', '10,250.00', '7,300.00'] },
  ],
}

const cuadra: Pieza = { k: 'ok', g: 'cuadra', t: 'Total activo = Total pasivo y patrimonio · Cuadra' }

const notas: Pieza = { k: 'texto', g: 'notas', t: '1. Cobros de la S.A. que cayeron en cuentas o efectivo del socio y no se han trasladado. 2. Cobros, aportaciones y pagos de la S.A. que todavía no se registran en sus cuentas de banco. 3. Lo que se compró a crédito para la S.A. y falta pagar. 4. Gastos de la S.A. que pagó el socio con su dinero.' }

const pantalla = (on = 0, fin: Pieza[] = [cuadra, notas]): Escena => ({
  etiqueta: 'Sociedad anónima',
  titulo: 'Estados financieros',
  acciones: [{ t: 'Excel', g: 'excel' }, { t: 'PDF', g: 'pdf' }],
  piezas: [{ k: 'campos', g: 'mes', l: [{ et: 'Mes', v: 'noviembre 2026' }] }, pestanas(on), cabeza(on), resultados(on), balance, ...fin],
})

const noCuadra: Pieza[] = [
  { k: 'aviso', g: 'descuadre', t: 'Total activo = Total pasivo y patrimonio · No cuadra por Q 150.00' },
  { k: 'texto', g: 'explica', t: 'Hay un movimiento de banco sin su cobro o gasto registrado; revisa los movimientos «A mano» del mes.' },
  notas,
]

const guia: GuiaVideo = {
  ruta: '/sa/estados',
  menu: 'Estados financieros',
  caps: [
    {
      t: '1 · Cómo se leen',
      e0: pantalla(),
      tomas: [
        { t: 'Elige el mes con las flechas del selector de mes.', en: 'mes' },
        { t: '«Del mes» compara el mes con el anterior; «Del año» compara el año con el año pasado.', en: 'pAnio', clic: true, luego: pantalla(1) },
        { t: 'Arriba de cada estado van la sociedad, el nombre del estado, el período y «Cifras expresadas en quetzales».', en: 'cabeza', ms: 5200 },
        { t: 'Las columnas son Concepto, Notas y los dos períodos; las cifras van sin Q y lo negativo entre paréntesis.', en: 'negativo', ms: 5200 },
        { t: 'Los subtotales llevan una línea y los totales, como la utilidad del período, llevan doble línea.', en: 'total' },
        { t: 'Vuelve a «Del mes» para ver noviembre contra octubre.', en: 'pMes', clic: true, luego: pantalla(0) },
      ],
    },
    {
      t: '2 · El balance general',
      e0: pantalla(),
      tomas: [
        { t: 'El balance se agrupa en Activo corriente y no corriente, Pasivo corriente y no corriente, y Patrimonio.', en: 'grupos', ms: 5200 },
        { t: '«Cuenta por cobrar al socio o administrador» es lo de la S.A. que cayó en tu cuenta personal; se quita con «Registrar traslado a la S.A.» en «Dónde está mi dinero».', en: 'socio', ms: 6200 },
        { t: '«Movimientos por pasar a Bancos» son cobros, aportaciones y pagos de la S.A. que todavía no están en sus cuentas de banco.', en: 'porPasar', ms: 5200 },
        { t: '«Bienes y servicios comprados a crédito» va en el activo y su contrapartida está en «Deudas de la S.A.».', en: 'credito', ms: 5200 },
        { t: 'En el pasivo corriente están «Cuenta por pagar al socio o administrador» y «Anticipos de clientes».', en: 'cxp', ms: 5200 },
        { t: '«Capital suscrito no pagado» resta del capital lo que los socios todavía no aportan.', en: 'noPagado' },
      ],
    },
    {
      t: '3 · Cuadre, notas y salida',
      e0: pantalla(),
      tomas: [
        { t: 'Al final, «Total activo = Total pasivo y patrimonio» dice «Cuadra» cuando los dos totales son iguales.', en: 'cuadra', ms: 5200 },
        { t: 'Si no, dice «No cuadra por» con la diferencia y explica de dónde puede venir.', en: 'titulo', luego: pantalla(0, noCuadra) },
        { t: 'Lee la explicación y corrige el movimiento que falta.', en: 'explica' },
        { t: 'Las notas numeradas explican las líneas que llevan número en la columna Notas.', en: 'notas', luego: pantalla() },
        { t: '«Excel» baja los dos estados a Descargas.', en: 'excel' },
        { t: '«PDF» los abre con el formato de la firma para guardarlos o imprimirlos.', en: 'pdf' },
      ],
    },
  ],
}

export default guia
