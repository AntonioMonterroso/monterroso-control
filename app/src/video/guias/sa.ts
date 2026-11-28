import { capsResumen } from '../resumen'
import type { Escena, GuiaVideo } from '../tipos'

const ficha = (): Escena => ({
  etiqueta: 'Sociedad anónima',
  titulo: 'Ficha de la sociedad',
  acciones: [{ t: 'Editar', g: 'editar', p: true }],
  piezas: [
    { k: 'subtitulo', g: 'identificacion', t: 'Identificación' },
    { k: 'campos', l: [{ et: 'Denominación', v: 'Ejemplo, Sociedad Anónima' }, { et: 'NIT', v: 'Sin anotar' }, { et: 'Inicio de operaciones', v: '1 de enero de 2027' }] },
    { k: 'subtitulo', g: 'escritura', t: 'Escritura e inscripciones' },
    { k: 'subtitulo', g: 'administracion', t: 'Administración' },
    { k: 'subtitulo', g: 'negocios', t: 'Negocios de la sociedad' },
    { k: 'texto', t: 'Monterroso Dev Studio · Música · Diseño' },
    { k: 'subtitulo', t: 'Documentos' },
    { k: 'botones', l: [{ t: 'Documento', g: 'documento' }] },
    { k: 'tabla', g: 'docs', cab: ['Documento', 'Tipo', 'Fecha'], filas: [{ c: ['Escritura constitutiva', 'Escritura', '15 dic 2026'], acc: [{ t: 'Ver', g: 'ojito' }, { t: 'Editar', g: 'lapiz' }, { t: 'Quitar', g: 'bote' }] }] },
  ],
})

const guia: GuiaVideo = {
  ruta: '/sa',
  menu: 'Resumen',
  caps: [
    ...capsResumen('Sociedad anónima', 'Dev Studio, Música, Diseño y los gastos generales'),
    {
      t: '4 · La ficha',
      e0: ficha(),
      tomas: [
        { t: 'Toca «Llenar la ficha» o «Editar» para poner los datos de la escritura, el registro y el representante.', en: 'editar', clic: true, luego: { hoja: { titulo: 'Ficha de la sociedad', piezas: [{ k: 'campos', g: 'form', l: [{ et: 'Denominación social', v: 'Ejemplo, Sociedad Anónima' }, { et: 'Número de escritura constitutiva', v: '25' }, { et: 'Representante legal', v: '' }] }], pie: [{ t: 'Cancelar' }, { t: 'Guardar', g: 'guardar', p: true }] } } },
        { t: 'Llena lo que tengas y toca «Guardar».', en: 'guardar', clic: true, luego: { hoja: null } },
        { t: 'Revisa los bloques «Identificación», «Escritura e inscripciones» y «Administración».', en: 'identificacion' },
        { t: 'En «Negocios de la sociedad» ves qué negocios cuentan para la sociedad desde el inicio de operaciones.', en: 'negocios' },
      ],
    },
    {
      t: '5 · Documentos',
      e0: ficha(),
      tomas: [
        { t: 'En «Documentos» toca «Documento» para agregar la escritura, patentes o nombramiento con su archivo.', en: 'documento' },
        { t: 'Cada documento se ve con el ojito.', en: 'ojito' },
        { t: 'Se edita con el lápiz y se quita con el basurero.', en: 'bote' },
      ],
    },
  ],
}

export default guia
