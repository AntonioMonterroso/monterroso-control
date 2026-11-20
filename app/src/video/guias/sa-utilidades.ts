import type { Escena, GuiaVideo, Pieza } from '../tipos'

const calcular: Pieza[] = [
  { k: 'subtitulo', g: 'calcular', t: 'Calcular el reparto' },
  { k: 'campos', g: 'periodo', l: [{ et: 'Desde', v: '01 ene 2027' }, { et: 'Hasta (cierre)', v: '31 dic 2027' }] },
  { k: 'campos', g: 'isr', l: [{ et: 'ISR de la sociedad del período', v: 'Q 2,500.00' }, { et: 'Monto a repartir', v: '' }, { et: 'Fecha del acuerdo de asamblea', v: '15 ene 2028' }] },
  { k: 'cifras', g: 'cascada', l: [
    { et: 'Utilidad del período', v: 'Q 25,000.00', g: 'cUtilidad' },
    { et: 'Menos ISR de la sociedad', v: 'Q 2,500.00' },
    { et: 'Menos reserva legal (5 %)', v: 'Q 1,125.00', g: 'cReserva' },
    { et: 'Disponible para repartir', v: 'Q 21,375.00', g: 'cDisponible' },
    { et: 'Menos ISR de dividendos (5 %)', v: 'Q 1,068.75' },
    { et: 'Neto a los socios', v: 'Q 20,306.25', g: 'cNeto' },
  ] },
]

const reparto: Pieza = {
  k: 'tabla',
  g: 'reparto',
  cab: ['Socio', 'Acciones', '%', 'Utilidad asignada', 'Reserva 5 %', 'ISR 5 %', 'Neto a pagar'],
  filas: [
    { c: ['Primer socio', '120', '60.00 %', 'Q 13,500.00', 'Q 675.00', 'Q 641.25', 'Q 12,183.75'], g: 'socio1' },
    { c: ['Segundo socio', '80', '40.00 %', 'Q 9,000.00', 'Q 450.00', 'Q 427.50', 'Q 8,122.50'] },
  ],
  pie: ['Total', '200', '100 %', 'Q 22,500.00', 'Q 1,125.00', 'Q 1,068.75', 'Q 20,306.25'],
}

const pantalla = (): Escena => ({
  etiqueta: 'Sociedad anónima',
  titulo: 'Utilidades por acciones',
  piezas: [...calcular, reparto, { k: 'botones', l: [{ t: 'Registrar el reparto', g: 'registrar', p: true }] }],
})

const registrados = (pagado: boolean): Pieza[] => [
  { k: 'subtitulo', g: 'registrados', t: 'Repartos registrados' },
  { k: 'tabla', g: 'repartoReg', cab: ['Socio', 'Acciones', '%', 'Utilidad asignada', 'Reserva 5 %', 'ISR', 'Neto', 'Pagado', 'Falta'], filas: [
    { c: ['Primer socio', '120', '60.00 %', 'Q 13,500.00', 'Q 675.00', 'Q 641.25', 'Q 12,183.75', pagado ? 'Q 12,183.75 · 20 nov 2026' : 'Q 0.00', pagado ? 'Pagado' : 'Q 12,183.75'], g: 'fila1', acc: pagado ? [] : [{ t: 'Pagado', g: 'pagado1' }] },
    { c: ['Segundo socio', '80', '40.00 %', 'Q 9,000.00', 'Q 450.00', 'Q 427.50', 'Q 8,122.50', 'Q 0.00', 'Q 8,122.50'], acc: [{ t: 'Pagado' }] },
  ], pie: ['Total', '200', '100 %', 'Q 22,500.00', 'Q 1,125.00', 'Q 1,068.75', 'Q 20,306.25', pagado ? 'Q 12,183.75' : 'Q 0.00', pagado ? 'Q 8,122.50' : 'Q 20,306.25'] },
  { k: 'botones', l: [{ t: 'ISR pagado hoy', g: 'isrPagado' }, ...(pagado ? [] : [{ t: 'Quitar reparto', g: 'quitar' }])] },
]

const guia: GuiaVideo = {
  ruta: '/sa/utilidades',
  menu: 'Utilidades',
  caps: [
    {
      t: '1 · Calcular el reparto',
      e0: pantalla(),
      tomas: [
        { t: 'En «Calcular el reparto» pon el período «Desde» y «Hasta (cierre)».', en: 'periodo' },
        { t: 'Escribe el ISR de la sociedad del período y, si quieres, el «Monto a repartir»; vacío reparte todo lo disponible.', en: 'isr', ms: 4600 },
        { t: 'La cascada parte de la utilidad del período y le resta el ISR de la sociedad y la reserva legal.', en: 'cReserva', ms: 5200 },
        { t: 'Queda lo «Disponible para repartir»; a eso se le resta el ISR de dividendos y queda el «Neto a los socios».', en: 'cNeto', ms: 5600 },
        { t: 'La tabla reparte por acciones: «%», «Utilidad asignada», «Reserva 5 %», «ISR 5 %» y «Neto a pagar» de cada socio.', en: 'socio1', ms: 5600 },
        { t: 'Toca «Registrar el reparto» para guardar lo que acordó la asamblea.', en: 'registrar', clic: true, luego: { piezas: [{ k: 'ok', g: 'listo', t: 'Reparto registrado: Q 21,375.00 entre 2 socios.' }, ...registrados(false)] } },
      ],
    },
    {
      t: '2 · Pagar a cada socio',
      e0: { etiqueta: 'Sociedad anónima', titulo: 'Utilidades por acciones', piezas: registrados(false) },
      tomas: [
        { t: 'En «Repartos registrados» cada socio suma «Pagado» y «Falta».', en: 'repartoReg' },
        { t: 'Toca «Pagado» cuando le entregues su dividendo.', en: 'pagado1', clic: true, luego: { hoja: { titulo: 'Pago del dividendo', piezas: [{ k: 'campos', g: 'pago', l: [{ et: 'Fecha del pago', v: '20 nov 2026' }, { et: 'Desde la cuenta', v: 'Banco Uno ···1290' }] }], pie: [{ t: 'Cancelar' }, { t: 'Guardar', g: 'guardar', p: true }] } } },
        { t: 'Pon la fecha del pago y la cuenta de donde salió; se anota como egreso en esa cuenta.', en: 'pago' },
        { t: 'Toca «Guardar».', en: 'guardar', clic: true, luego: { hoja: null, piezas: registrados(true) } },
        { t: 'Ya sale en «Pagado» y su «Falta» queda en cero.', en: 'fila1' },
        { t: 'Toca «ISR pagado hoy» cuando pagues a la SAT el ISR retenido.', en: 'isrPagado' },
      ],
    },
  ],
}

export default guia
