import type { Escena, GuiaVideo, Pieza } from '../tipos'

const historial: Pieza = {
  k: 'tabla',
  g: 'historial',
  cab: ['Desde', 'Bruto', 'Descuentos', 'Neto'],
  filas: [
    { c: ['Julio 2026', 'Q 6,000.00', 'Q 650.00', 'Q 5,350.00'], acc: [{ t: 'Editar', g: 'lapiz1' }, { t: 'Quitar', g: 'bote1' }] },
    { c: ['Enero 2026', 'Q 5,500.00', 'Q 600.00', 'Q 4,900.00'], acc: [{ t: 'Editar' }, { t: 'Quitar' }] },
  ],
}

const meses = (recibido: boolean): Pieza => ({
  k: 'tabla',
  g: 'meses',
  cab: ['Mes', 'Fecha de pago', 'Neto', 'Estado'],
  filas: [
    { c: ['Noviembre 2026', '30 nov 2026', 'Q 5,350.00', recibido ? 'Pagado' : 'Por cobrar'], acc: recibido ? [] : [{ t: 'Recibido', g: 'recibido1' }] },
    { c: ['Octubre 2026', '30 oct 2026', 'Q 5,350.00', 'Pagado'] },
  ],
})

const pantalla = (recibido = false): Escena => ({
  etiqueta: 'Salario',
  titulo: 'Mi salario',
  acciones: [{ t: 'Registrar aumento', g: 'aumento', p: true }],
  piezas: [
    { k: 'cifras', g: 'kpis', l: [{ et: 'Neto mensual', v: 'Q 5,350.00', sub: 'bruto Q 6,000.00 menos Q 650.00' }, { et: 'Día de pago', v: '30', sub: 'de cada mes' }, { et: 'Recibido en 2026', v: recibido ? 'Q 58,150.00' : 'Q 52,800.00', sub: 'lo marcado como recibido' }] },
    { k: 'subtitulo', t: 'Historial de aumentos' },
    historial,
    { k: 'subtitulo', g: 'ultimos', t: 'Últimos 12 meses' },
    meses(recibido),
  ],
})

const guia: GuiaVideo = {
  ruta: '/salario',
  menu: 'Mi salario',
  caps: [
    {
      t: '1 · Tu salario',
      e0: pantalla(),
      tomas: [
        { t: 'Toca «Poner salario» la primera vez; después el botón dice «Registrar aumento» para un aumento desde un mes.', en: 'aumento', clic: true, luego: { hoja: { titulo: 'Registrar aumento', piezas: [{ k: 'campos', g: 'form', l: [{ et: 'Desde el mes de', v: '01 dic 2026' }, { et: 'Día de pago', v: '30' }, { et: 'Salario bruto', v: 'Q 6,500.00' }, { et: 'Descuentos (IGSS, ISR, otros)', v: 'Q 700.00' }] }], pie: [{ t: 'Cancelar', g: 'cancelar' }, { t: 'Guardar', p: true }] } } },
        { t: 'El salario se repite solo cada mes y sale en «Lo que me deben» como por recibir.', en: 'form', ms: 4200 },
        { t: 'Toca «Cancelar» para salir sin guardar.', en: 'cancelar', clic: true, luego: { hoja: null } },
        { t: 'En «Historial de aumentos» corrige un monto con el lápiz o quítalo con el basurero.', en: 'bote1' },
      ],
    },
    {
      t: '2 · Marcar recibido',
      e0: pantalla(),
      tomas: [
        { t: 'En «Últimos 12 meses» ves cada mes con su fecha de pago y estado.', en: 'meses' },
        { t: 'Toca «Recibido» cuando te paguen el mes.', en: 'recibido1', clic: true, luego: { hoja: { titulo: 'Marcar salario recibido', piezas: [{ k: 'campos', l: [{ et: 'Fecha', v: '30 nov 2026' }, { et: 'Monto', v: 'Q 5,350.00' }] }], pie: [{ t: 'Cancelar' }, { t: 'Guardar', g: 'guardar', p: true }] } } },
        { t: 'Al guardarlo entra a los ingresos del mes.', en: 'guardar', clic: true, luego: { ...pantalla(true), hoja: null } },
      ],
    },
  ],
}

export default guia
