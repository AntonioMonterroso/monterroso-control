import type { Escena, GuiaVideo } from '../tipos'

const pantalla = (traidos = false): Escena => ({
  etiqueta: 'Ajustes',
  titulo: 'Conexión con Monterroso World',
  piezas: [
    { k: 'subtitulo', g: 'areas', t: 'Áreas que cuentan como Empresa' },
    { k: 'texto', t: '☑ Oficina · ☐ Casa' },
    { k: 'campos', g: 'destino', l: [{ et: 'Entran al negocio', v: 'Monterroso Dev Studio' }, { et: 'Con la categoría', v: 'Otros gastos' }] },
    { k: 'botones', l: [{ t: traidos ? 'Traer 0 gastos' : 'Traer 2 gastos', g: 'traer', p: true }] },
    ...(traidos ? [{ k: 'ok' as const, g: 'listo', t: '2 gastos traídos de Monterroso World.' }] : []),
    { k: 'tabla', g: 'tabla', cab: ['Fecha', 'Descripción', 'Monto'], filas: traidos ? [] : [{ c: ['08 nov 2026', 'Papelería · Oficina', 'Q 85.00'] }, { c: ['16 nov 2026', 'Café para reuniones · Oficina', 'Q 120.00'] }] },
  ],
})

const guia: GuiaVideo = {
  ruta: '/mundo',
  menu: 'Monterroso World',
  caps: [
    {
      t: '1 · Traer gastos de Empresa',
      e0: pantalla(),
      tomas: [
        { t: 'En «Áreas que cuentan como Empresa» marca las áreas de Monterroso World que quieres traer.', en: 'areas' },
        { t: 'Elige en «Entran al negocio» y «Con la categoría» a dónde van esos gastos.', en: 'destino' },
        { t: 'Revisa la tabla «Gastos de Empresa por traer».', en: 'tabla' },
        { t: 'Toca «Traer» para copiarlos a Gastos, una sola vez y sin duplicar.', en: 'traer', clic: true, luego: pantalla(true) },
        { t: 'En modo de prueba esta conexión no está disponible.', en: 'titulo' },
      ],
    },
  ],
}

export default guia
