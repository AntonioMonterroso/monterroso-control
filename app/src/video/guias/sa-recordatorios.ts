import type { Escena, GuiaVideo, Pieza } from '../tipos'

const cab = ['Recordatorio', 'Próxima', 'Se repite', 'Estado']

const fila = (c: string[], g?: string, marcada = false) => ({ c: marcada ? [`☑ ${c[0]}`, ...c.slice(1)] : c, g, acc: [{ t: 'Hecho', g: g ? `hecho-${g}` : undefined }, { t: 'Editar', g: g ? `lapiz-${g}` : undefined }, { t: 'Quitar' }] })

const vencidos = (marcadas = false): Pieza[] => [
  { k: 'subtitulo', g: 'secVencidos', t: 'Vencidos · 2' },
  { k: 'botones', g: 'masa', l: marcadas ? [{ t: 'Desmarcar todas' }, { t: 'Marcar hechos · 2', g: 'marcarHechos' }, { t: 'Quitar las marcadas · 2' }] : [{ t: 'Marcar todas · 2', g: 'marcarTodas' }] },
  { k: 'tabla', g: 'tVencidos', cab, filas: [
    fila(['Declaración mensual de ISR', '15 nov 2026', 'Cada mes', 'Venció hace 5 días'], 'v1', marcadas),
    fila(['Libro de compras al día', '18 nov 2026', 'Cada mes', 'Venció hace 2 días'], undefined, marcadas),
  ] },
]

const pronto: Pieza[] = [
  { k: 'subtitulo', g: 'secSemana', t: 'Esta semana · 1' },
  { k: 'tabla', cab, filas: [fila(['Planilla del IGSS', '25 nov 2026', 'Cada mes', 'En 5 días'])] },
  { k: 'subtitulo', t: 'Este mes · 1' },
  { k: 'tabla', cab, filas: [fila(['Revisar el libro de actas', '30 nov 2026', 'Cada mes', 'En 10 días'])] },
]

const enero: Pieza[] = [
  { k: 'subtitulo', g: 'secEnero', t: 'Enero 2027 · 1' },
  { k: 'tabla', cab, filas: [fila(['Actualizar el RTU', '15 ene 2027', 'Cada año', 'En 56 días'], 'e1')] },
]

const chips = (conVencidos: boolean): Pieza => ({ k: 'chips', g: 'urgencia', l: [...(conVencidos ? [{ t: 'Vencidos · 2', g: 'chVencidos' }] : []), { t: 'Esta semana · 1', g: 'chSemana' }, { t: 'Este mes · 1' }] })

const pantalla = (marcadas = false): Escena => ({
  etiqueta: 'Sociedad anónima',
  titulo: 'Recordatorios y vencimientos',
  acciones: [{ t: 'Obligaciones comunes', g: 'comunes' }, { t: 'Recordatorio', g: 'nuevo', p: true }],
  piezas: [chips(true), ...vencidos(marcadas), ...pronto, ...enero],
})

const despues = (ok: string, quedan: Pieza[], dic: string[][]): Partial<Escena> => ({
  piezas: [{ k: 'ok', g: 'listo', t: ok }, chips(quedan.length > 0), ...quedan, ...pronto, { k: 'subtitulo', g: 'secDic', t: `Diciembre 2026 · ${dic.length}` }, { k: 'tabla', cab, filas: dic.map((c) => fila(c)) }, ...enero],
})

const dic1 = ['Declaración mensual de ISR', '15 dic 2026', 'Cada mes', 'En 25 días']
const dic2 = ['Libro de compras al día', '18 dic 2026', 'Cada mes', 'En 28 días']

const guia: GuiaVideo = {
  ruta: '/sa/recordatorios',
  menu: 'Recordatorios',
  caps: [
    {
      t: '1 · Lo urgente primero',
      e0: pantalla(),
      tomas: [
        { t: 'Toca «Obligaciones comunes» para agregar las que se repiten según el régimen; revisa sus fechas.', en: 'comunes' },
        { t: 'Toca «Recordatorio» para agregar uno propio.', en: 'nuevo' },
        { t: 'Arriba, los chips «Vencidos», «Esta semana» y «Este mes» dicen cuántos hay en cada uno.', en: 'urgencia', ms: 4800 },
        { t: 'Toca un chip para bajar a su parte.', en: 'chVencidos', clic: true },
        { t: 'Cada parte lista sus recordatorios con la próxima fecha, cada cuánto se repite y su estado.', en: 'secVencidos' },
        { t: 'Lo que viene después se agrupa por mes, como «Enero 2027».', en: 'secEnero' },
      ],
    },
    {
      t: '2 · Cumplir',
      e0: pantalla(),
      tomas: [
        { t: 'Toca «Hecho» cuando lo cumplas; si se repite, se programa solo la siguiente fecha.', en: 'hecho-v1', clic: true, luego: despues('Hecho. Siguiente: 15 dic 2026. Deshacer', [{ k: 'subtitulo', g: 'secVencidos', t: 'Vencidos · 1' }, { k: 'tabla', cab, filas: [fila(['Libro de compras al día', '18 nov 2026', 'Cada mes', 'Venció hace 2 días'])] }], [dic1]) },
        { t: 'El aviso trae «Deshacer» por si fue sin querer.', en: 'listo' },
        { t: 'Cada recordatorio se edita con su lápiz y se quita con el basurero.', en: 'lapiz-e1' },
      ],
    },
    {
      t: '3 · Marcar varios',
      e0: pantalla(),
      tomas: [
        { t: 'En una parte marca los que ya cumpliste, o toca «Marcar todas».', en: 'marcarTodas', clic: true, luego: pantalla(true) },
        { t: 'Toca «Marcar hechos»: se marcan juntos y los que se repiten pasan a su siguiente fecha.', en: 'marcarHechos', clic: true, luego: despues('Hecho. Siguiente: 18 dic 2026. Deshacer', [], [dic1, dic2]) },
        { t: 'Ya no hay vencidos; los dos pasaron a «Diciembre 2026».', en: 'secDic' },
      ],
    },
  ],
}

export default guia
