import type { Escena, GuiaVideo } from '../tipos'

const pantalla = (): Escena => ({
  etiqueta: 'Ajustes',
  titulo: 'Negocios',
  piezas: [
    { k: 'texto', t: 'Los tres negocios vienen listos. Puedes cambiarles el nombre o apagar uno que no uses; lo registrado se conserva.' },
    { k: 'tabla', g: 'tabla', cab: ['Negocio', 'Clientes', 'Estado'], filas: [
      { c: ['Monterroso Dev Studio', '2', 'Activo'], acc: [{ t: 'Editar', g: 'lapiz1' }] },
      { c: ['Hogar Canela', '0', 'Activo'], acc: [{ t: 'Editar' }] },
      { c: ['Salario', '0', 'Activo'], acc: [{ t: 'Editar' }] },
    ] },
  ],
})

const guia: GuiaVideo = {
  ruta: '/negocios',
  menu: 'Negocios',
  caps: [
    {
      t: '1 · Tus negocios',
      e0: pantalla(),
      tomas: [
        { t: 'Aquí ves tus negocios con cuántos clientes tiene cada uno y si está activo.', en: 'tabla' },
        { t: 'Toca el lápiz de un negocio para cambiarle el nombre o apagarlo.', en: 'lapiz1', clic: true, luego: { hoja: { titulo: 'Editar negocio', piezas: [{ k: 'campos', g: 'form', l: [{ et: 'Nombre', v: 'Monterroso Dev Studio' }, { et: 'Descripción', v: 'Páginas y sistemas' }, { et: 'Activo', v: 'Sí' }] }], pie: [{ t: 'Cancelar' }, { t: 'Guardar', g: 'guardar', p: true }] } } },
        { t: 'Apagar un negocio no borra lo que ya está registrado.', en: 'form' },
        { t: 'Toca «Guardar».', en: 'guardar', clic: true, luego: { hoja: null } },
      ],
    },
  ],
}

export default guia
