import type { Escena, GuiaVideo } from '../tipos'

const pantalla = (): Escena => ({
  etiqueta: 'Ajustes',
  titulo: 'Mi marca',
  acciones: [{ t: 'Editar datos', g: 'editar', p: true }],
  piezas: [
    { k: 'subtitulo', t: 'Datos para tarjetas y documentos' },
    { k: 'campos', g: 'datos', l: [{ et: 'Nombre', v: 'Sin anotar' }, { et: 'Cargo', v: 'Sin anotar' }, { et: 'Sitio', v: 'studiomonterroso.com' }] },
    { k: 'campos', g: 'areas', l: [{ et: 'Área', v: 'Desarrollo Web' }, { et: 'Color', v: 'Oficial', g: 'color' }] },
    { k: 'subtitulo', t: 'Tarjeta de presentación · 9 × 5 cm con sangrado' },
    { k: 'botones', g: 'tarjeta', l: [{ t: 'PDF para imprimir', g: 'pdf' }, { t: 'Frente PNG', g: 'frente' }, { t: 'Reverso PNG' }] },
    { k: 'subtitulo', t: 'Redes' },
    { k: 'botones', g: 'redes', l: [{ t: 'Portada 1500 × 500' }, { t: 'Portada 1640 × 624' }, { t: 'Publicación 1080 × 1080' }, { t: 'Publicación 1080 × 1350' }] },
  ],
})

const guia: GuiaVideo = {
  ruta: '/marca',
  menu: 'Mi marca',
  caps: [
    {
      t: '1 · Tus datos',
      e0: pantalla(),
      tomas: [
        { t: 'Toca «Editar datos» para poner tu nombre, cargo, correo, teléfono, sitio y redes.', en: 'editar', clic: true, luego: { hoja: { titulo: 'Mis datos de marca', piezas: [{ k: 'campos', g: 'form', l: [{ et: 'Nombre', v: '' }, { et: 'Cargo', v: '' }, { et: 'Correo', v: '' }, { et: 'Sitio', v: 'studiomonterroso.com' }] }], pie: [{ t: 'Cancelar' }, { t: 'Guardar', g: 'guardar', p: true }] } } },
        { t: 'Solo salen los datos que llenes; lo que dejes vacío no aparece.', en: 'form' },
        { t: 'Toca «Guardar».', en: 'guardar', clic: true, luego: { hoja: null } },
      ],
    },
    {
      t: '2 · Bajar las piezas',
      e0: pantalla(),
      tomas: [
        { t: 'Elige el área: «Corporativo», «Desarrollo Web», «Música» o «Diseño».', en: 'areas' },
        { t: 'Elige el «Color» de las piezas.', en: 'color' },
        { t: 'En la tarjeta de presentación toca «PDF para imprimir», «Frente PNG» o «Reverso PNG».', en: 'tarjeta' },
        { t: 'En «Redes» toca el tamaño de portada o publicación que quieras bajar en PNG.', en: 'redes' },
      ],
    },
  ],
}

export default guia
