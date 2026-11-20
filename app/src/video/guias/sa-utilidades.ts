import type { Escena, GuiaVideo, Pieza } from '../tipos'

const calcular: Pieza[] = [
  { k: 'subtitulo', g: 'calcular', t: 'Calcular el reparto' },
  { k: 'campos', g: 'periodo', l: [{ et: 'Desde', v: '01 ene 2027' }, { et: 'Hasta (cierre)', v: '31 dic 2027' }] },
  { k: 'campos', g: 'isr', l: [{ et: 'ISR de la sociedad del período', v: 'Q 2,500.00' }, { et: 'Monto a repartir', v: '' }] },
  { k: 'cifras', g: 'cifras', l: [{ et: 'Utilidad neta', v: 'Q 22,500.00' }, { et: 'Reserva legal', v: 'Q 1,125.00' }, { et: 'Distribuible', v: 'Q 21,375.00' }] },
]

const reparto: Pieza = {
  k: 'tabla',
  g: 'reparto',
  cab: ['Socio', 'Participación', 'Dividendo', 'ISR', 'Neto a pagar'],
  filas: [
    { c: ['Primer socio', '60.00 %', 'Q 12,825.00', 'Q 641.25', 'Q 12,183.75'] },
    { c: ['Segundo socio', '40.00 %', 'Q 8,550.00', 'Q 427.50', 'Q 8,122.50'] },
  ],
}

const pantalla = (): Escena => ({
  etiqueta: 'Sociedad anónima',
  titulo: 'Utilidades por acciones',
  piezas: [...calcular, reparto, { k: 'botones', l: [{ t: 'Registrar el reparto', g: 'registrar', p: true }] }],
})

const registrados: Pieza[] = [
  { k: 'subtitulo', g: 'registrados', t: 'Repartos registrados' },
  { k: 'tabla', cab: ['Socio', 'Dividendo', 'ISR', 'Neto', 'Estado'], filas: [
    { c: ['Primer socio', 'Q 12,825.00', 'Q 641.25', 'Q 12,183.75', 'Por pagar'], acc: [{ t: 'Pagado', g: 'pagado1' }] },
    { c: ['Segundo socio', 'Q 8,550.00', 'Q 427.50', 'Q 8,122.50', 'Por pagar'], acc: [{ t: 'Pagado' }] },
  ] },
  { k: 'botones', l: [{ t: 'ISR pagado hoy', g: 'isrPagado' }, { t: 'Quitar reparto' }] },
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
        { t: 'Escribe el ISR de la sociedad del período y, si quieres, el «Monto a repartir»; vacío reparte todo lo distribuible.', en: 'isr', ms: 4600 },
        { t: 'La tabla del reparto muestra a cada socio con su dividendo, el ISR y el neto a pagar.', en: 'reparto' },
        { t: 'Toca «Registrar el reparto» para guardar lo que acordó la asamblea.', en: 'registrar', clic: true, luego: { piezas: [{ k: 'ok', g: 'listo', t: 'Reparto registrado: Q 21,375.00 entre 2 socios.' }, ...registrados] } },
      ],
    },
    {
      t: '2 · Pagar a cada socio',
      e0: { etiqueta: 'Sociedad anónima', titulo: 'Utilidades por acciones', piezas: registrados },
      tomas: [
        { t: 'En «Repartos registrados» toca «Pagado» por cada socio.', en: 'pagado1', clic: true, luego: { hoja: { titulo: 'Pago del dividendo', piezas: [{ k: 'campos', g: 'pago', l: [{ et: 'Fecha del pago', v: '20 nov 2026' }, { et: 'Desde la cuenta', v: 'Banco Ejemplo' }] }], pie: [{ t: 'Cancelar' }, { t: 'Guardar', g: 'guardar', p: true }] } } },
        { t: 'Pon la fecha del pago y la cuenta de donde salió.', en: 'pago' },
        { t: 'Toca «Guardar».', en: 'guardar', clic: true, luego: { hoja: null } },
        { t: 'Toca «ISR pagado hoy» cuando lo pagues a la SAT.', en: 'isrPagado' },
      ],
    },
  ],
}

export default guia
