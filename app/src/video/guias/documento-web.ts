import type { Escena, GuiaVideo } from '../tipos'

const pagina = (): Escena => ({
  etiqueta: 'Cotización',
  titulo: 'Cotización de página web',
  acciones: [{ t: 'Bajar PDF', g: 'pdf' }, { t: 'Tengo una pregunta', g: 'pregunta' }],
  piezas: [
    { k: 'texto', g: 'vigencia', t: 'Vigente hasta el 30 de noviembre de 2026.' },
    { k: 'tabla', g: 'hoja', cab: ['Concepto', 'Monto'], filas: [{ c: ['Diseño y armado de la página', 'Q 1,350.00'] }] },
    { k: 'subtitulo', g: 'acuerdo', t: '¿Estás de acuerdo?' },
    { k: 'campos', g: 'nombre', l: [{ et: 'Tu nombre', v: 'Ana Pérez' }] },
    { k: 'botones', l: [{ t: 'Aceptar', g: 'aceptar', p: true }] },
  ],
})

const guia: GuiaVideo = {
  ruta: '/d/:codigo',
  menu: 'Documento en la web',
  caps: [
    {
      t: '1 · Lo que ve el cliente',
      e0: pagina(),
      tomas: [
        { t: 'Así ve el cliente la cotización o propuesta que le mandaste por link.', en: 'hoja', ms: 4200 },
        { t: 'Arriba dice hasta cuándo está vigente.', en: 'vigencia' },
        { t: '«Bajar PDF» le da el documento para guardarlo.', en: 'pdf' },
        { t: '«Tengo una pregunta» abre WhatsApp para escribirte.', en: 'pregunta' },
        { t: 'Para aceptarlo escribe su nombre y toca «Aceptar»; te llega el aviso.', en: 'aceptar', clic: true, luego: { piezas: [{ k: 'ok', g: 'aceptado', t: 'Aceptado por Ana Pérez el 20 nov 2026.' }] } },
        { t: 'En Documentos su estado cambia a «Aceptado».', en: 'aceptado' },
      ],
    },
  ],
}

export default guia
