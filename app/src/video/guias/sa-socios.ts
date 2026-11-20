import type { Escena, GuiaVideo, Pieza } from '../tipos'

const kpis: Pieza = { k: 'cifras', g: 'kpis', l: [{ et: 'Capital autorizado', v: 'Q 50,000.00', sub: 'según la escritura' }, { et: 'Capital suscrito', v: 'Q 20,000.00', sub: '200 acciones vigentes' }, { et: 'Capital pagado', v: 'Q 15,000.00', sub: 'aportaciones recibidas' }, { et: 'Por pagar', v: 'Q 5,000.00', sub: 'suscrito menos pagado' }] }

const pestanas = (on: number): Pieza => ({ k: 'pestanas', g: 'pestanas', l: [{ t: 'Socios' }, { t: 'Registro de accionistas', g: 'pAcciones' }, { t: 'Aportaciones' }, { t: 'Transmisiones' }], on })

const socios = (): Escena => ({
  etiqueta: 'Sociedad anónima',
  titulo: 'Socios y capital',
  acciones: [{ t: 'Socio', g: 'boton', p: true }],
  piezas: [
    kpis,
    pestanas(0),
    { k: 'tabla', g: 'tabla', cab: ['Socio', 'Acciones', 'Participación', 'Aportado'], filas: [
      { c: ['Primer socio', '120', '60.00 %', 'Q 9,000.00'], acc: [{ t: 'Editar', g: 'lapiz1' }] },
      { c: ['Segundo socio', '80', '40.00 %', 'Q 6,000.00'], acc: [{ t: 'Editar' }] },
      { c: ['Socio nuevo', '0', '0.00 %', 'Q 0.00'], acc: [{ t: 'Editar' }, { t: 'Quitar', g: 'bote3' }] },
    ] },
  ],
})

const acciones: Partial<Escena> = {
  acciones: [{ t: 'Acciones', g: 'boton', p: true }],
  piezas: [
    kpis,
    pestanas(1),
    { k: 'tabla', g: 'tabla', cab: ['Fecha', 'Accionista', 'Serie y números', 'Cantidad', 'Estado'], filas: [{ c: ['15 dic 2026', 'Primer socio', 'Serie A · 1–120', '120', 'Vigente'], acc: [{ t: 'Editar' }, { t: 'Quitar' }] }] },
  ],
}

const guia: GuiaVideo = {
  ruta: '/sa/socios',
  menu: 'Socios y capital',
  caps: [
    {
      t: '1 · Capital y socios',
      e0: socios(),
      tomas: [
        { t: 'Arriba ves el capital autorizado, suscrito, pagado y lo que falta por pagar.', en: 'kpis', ms: 4200 },
        { t: 'Usa las pestañas «Socios», «Registro de accionistas», «Aportaciones» y «Transmisiones».', en: 'pestanas' },
        { t: 'Toca «Socio» para agregar uno.', en: 'boton' },
        { t: 'Cada fila se edita con su lápiz.', en: 'lapiz1' },
        { t: 'Un socio solo se puede quitar si no tiene acciones ni aportaciones; quitar pide confirmar y se puede deshacer.', en: 'bote3', ms: 4200 },
      ],
    },
    {
      t: '2 · El botón cambia con la pestaña',
      e0: socios(),
      tomas: [
        { t: 'Toca «Registro de accionistas».', en: 'pAcciones', clic: true, luego: acciones },
        { t: 'El botón de arriba cambia con la pestaña: «Socio», «Acciones», «Aportación» o «Transmisión».', en: 'boton', ms: 4200 },
        { t: 'Aquí ves cada registro de acciones con su serie, números y estado.', en: 'tabla' },
      ],
    },
  ],
}

export default guia
