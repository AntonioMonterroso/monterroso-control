import type { Escena, GuiaVideo, Pieza } from '../tipos'

const tabla = (hecho: boolean): Pieza => ({
  k: 'tabla',
  g: 'tabla',
  cab: ['Recordatorio', 'Se repite', 'Próxima', 'Aviso', 'Estado'],
  filas: [
    { c: ['Declaración mensual', 'Cada mes', hecho ? '31 dic 2026' : '30 nov 2026', '7 días antes', hecho ? 'En 41 días' : 'En 10 días'], acc: [{ t: 'Hecho', g: 'hecho1' }, { t: 'Editar', g: 'lapiz1' }, { t: 'Quitar', g: 'bote1' }] },
    { c: ['Renovar nombramiento', 'Una vez', '15 dic 2028', '30 días antes', 'En 756 días'], acc: [{ t: 'Hecho' }, { t: 'Editar' }, { t: 'Quitar' }] },
  ],
})

const pantalla = (hecho = false): Escena => ({
  etiqueta: 'Sociedad anónima',
  titulo: 'Recordatorios y vencimientos',
  acciones: [{ t: 'Obligaciones comunes', g: 'comunes' }, { t: 'Recordatorio', g: 'nuevo', p: true }],
  piezas: [...(hecho ? [{ k: 'ok', g: 'listo', t: 'Hecho. Siguiente: 31 dic 2026. Deshacer' } as Pieza] : []), tabla(hecho)],
})

const guia: GuiaVideo = {
  ruta: '/sa/recordatorios',
  menu: 'Recordatorios',
  caps: [
    {
      t: '1 · Agregar y cumplir',
      e0: pantalla(),
      tomas: [
        { t: 'Toca «Obligaciones comunes» para agregar las que se repiten según el régimen; revisa sus fechas.', en: 'comunes' },
        { t: 'Toca «Recordatorio» para agregar uno propio.', en: 'nuevo' },
        { t: 'La tabla muestra cada recordatorio con su próxima fecha y cuántos días antes avisa.', en: 'tabla' },
        { t: 'Toca «Hecho» cuando lo cumplas; si se repite pasa solo a la siguiente fecha.', en: 'hecho1', clic: true, luego: pantalla(true) },
        { t: 'Cada recordatorio se edita con su lápiz y se quita con el basurero.', en: 'bote1' },
      ],
    },
  ],
}

export default guia
