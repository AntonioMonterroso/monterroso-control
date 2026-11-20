import type { Escena, GuiaVideo, Pieza } from '../tipos'

const kpis: Pieza = { k: 'cifras', g: 'kpis', l: [{ et: 'Capital autorizado', v: 'Q 50,000.00', sub: 'según la escritura' }, { et: 'Capital suscrito', v: 'Q 20,000.00', sub: '200 acciones vigentes' }, { et: 'Capital pagado', v: 'Q 15,000.00', sub: 'aportaciones recibidas' }, { et: 'Por pagar', v: 'Q 5,000.00', sub: 'suscrito menos pagado' }] }

const pestanas = (on: number): Pieza => ({ k: 'pestanas', g: 'pestanas', l: [{ t: 'Socios' }, { t: 'Registro de accionistas', g: 'pAcciones' }, { t: 'Aportaciones' }, { t: 'Transmisiones', g: 'pTrans' }], on })

const socios = (): Escena => ({
  etiqueta: 'Sociedad anónima',
  titulo: 'Socios y capital',
  acciones: [{ t: 'Socio', g: 'boton', p: true }],
  piezas: [
    kpis,
    pestanas(0),
    { k: 'tabla', g: 'tabla', cab: ['Socio', 'Acciones', 'Participación', 'Aportado de lo suscrito'], filas: [
      { c: ['PS · Primer socio', '120 · A 1–120', '▰▰▰▰▰▰▱▱▱▱ 60.00 %', 'Q 9,000.00 de Q 12,000.00 · Falta Q 3,000.00'], g: 'fila1', acc: [{ t: 'Editar', g: 'lapiz1' }] },
      { c: ['SS · Segundo socio', '80 · A 121–200', '▰▰▰▰▱▱▱▱▱▱ 40.00 %', 'Q 6,000.00 de Q 8,000.00 · Falta Q 2,000.00'], g: 'fila2', acc: [{ t: 'Editar' }] },
      { c: ['SN · Socio nuevo', '0', '▱▱▱▱▱▱▱▱▱▱ 0.00 %', 'Q 0.00 de Q 0.00'], acc: [{ t: 'Editar' }, { t: 'Quitar', g: 'bote3' }] },
    ], pie: ['Total · 3 socios', '200', '100 %', 'Q 15,000.00 de Q 20,000.00'] },
  ],
})

const registro = (): Partial<Escena> => ({
  acciones: [{ t: 'Acciones', g: 'boton', p: true }],
  piezas: [
    kpis,
    pestanas(1),
    { k: 'tabla', g: 'tabla', cab: ['Título No.', 'Serie', 'Del – al', 'Accionista', 'Emisión', 'Cantidad', 'Estado'], filas: [
      { c: ['1', 'A', '1 – 120', 'PS · Primer socio', '15 dic 2026', '120', 'Vigente'], g: 'titulo1', acc: [{ t: 'Ver', g: 'ojo1' }, { t: 'Editar', g: 'lapizA' }, { t: 'Quitar' }] },
      { c: ['2', 'A', '121 – 200', 'SS · Segundo socio', '15 dic 2026', '80', 'Vigente'], acc: [{ t: 'Ver' }, { t: 'Editar' }, { t: 'Quitar' }] },
    ] },
  ],
})

const transmisiones = (): Partial<Escena> => ({
  acciones: [{ t: 'Transmisión', g: 'boton', p: true }],
  piezas: [
    kpis,
    pestanas(3),
    { k: 'tabla', g: 'tabla', cab: ['Fecha', 'De → a', 'Acciones', 'Precio'], filas: [
      { c: ['10 nov 2026', 'Primer socio → Socio nuevo', '20', 'Q 2,000.00'], g: 'trans1', acc: [{ t: 'Editar' }, { t: 'Quitar' }] },
    ] },
  ],
})

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
        { t: 'Cada socio sale con el círculo de sus iniciales, sus acciones y los números que le tocan.', en: 'fila1' },
        { t: 'La barra muestra su participación y «Aportado de lo suscrito» dice cuánto ha pagado y cuánto le falta.', en: 'fila2', ms: 5200 },
        { t: 'La fila de total suma acciones y aportado de todos los socios.', en: 'tabla' },
        { t: 'Toca «Socio» para agregar uno; cada fila se edita con su lápiz.', en: 'lapiz1' },
        { t: 'Un socio solo se puede quitar si no tiene acciones ni aportaciones; quitar pide confirmar y se puede deshacer.', en: 'bote3', ms: 4800 },
      ],
    },
    {
      t: '2 · Registro de accionistas',
      e0: socios(),
      tomas: [
        { t: 'Toca «Registro de accionistas».', en: 'pAcciones', clic: true, luego: registro() },
        { t: 'Es el libro de acciones: «Título No.», «Serie», «Del – al», accionista, «Emisión», cantidad y «Estado».', en: 'titulo1', ms: 5200 },
        { t: 'El ojito abre el título escaneado.', en: 'ojo1' },
        { t: 'El botón de arriba ahora dice «Acciones» para registrar las que se emiten.', en: 'boton' },
        { t: 'Con el lápiz corriges un registro; en «Título escaneado» subes el título firmado.', en: 'lapizA', clic: true, luego: { hoja: { titulo: 'Editar acciones', piezas: [{ k: 'campos', g: 'formAcc', l: [{ et: 'Título', v: '1' }, { et: 'Serie', v: 'A' }, { et: 'Título escaneado', v: 'titulo-1.pdf' }] }], pie: [{ t: 'Cancelar' }, { t: 'Guardar', g: 'guardar', p: true }] } } },
        { t: 'Toca «Guardar».', en: 'guardar', clic: true, luego: { hoja: null } },
      ],
    },
    {
      t: '3 · Transmisiones',
      e0: socios(),
      tomas: [
        { t: 'Toca «Transmisiones».', en: 'pTrans', clic: true, luego: transmisiones() },
        { t: 'Cada transmisión dice «De → a»: quién entrega las acciones y quién las recibe.', en: 'trans1' },
        { t: 'El botón de arriba cambia con la pestaña: «Socio», «Acciones», «Aportación» o «Transmisión».', en: 'boton', ms: 4200 },
      ],
    },
  ],
}

export default guia
