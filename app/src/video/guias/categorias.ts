import type { Escena, GuiaVideo } from '../tipos'

const pantalla = (): Escena => ({
  etiqueta: 'Ajustes',
  titulo: 'Categorías',
  acciones: [{ t: 'Nueva categoría', g: 'nueva', p: true }],
  piezas: [
    { k: 'tabla', g: 'gastos', cab: ['Nombre', 'Estado'], filas: [
      { c: ['Hosting y dominios', 'Activa'], acc: [{ t: 'Editar', g: 'lapiz1' }] },
      { c: ['Material de oficina', 'Activa'], acc: [{ t: 'Editar' }, { t: 'Quitar', g: 'bote2' }] },
    ] },
    { k: 'tabla', g: 'ingresos', cab: ['Nombre', 'Estado'], filas: [{ c: ['Mensualidades · Se llena sola', 'Activa'], acc: [{ t: 'Editar' }] }] },
  ],
})

const guia: GuiaVideo = {
  ruta: '/categorias',
  menu: 'Categorías',
  caps: [
    {
      t: '1 · Tus categorías',
      e0: pantalla(),
      tomas: [
        { t: 'Toca «Nueva categoría» para agregar una categoría de gasto.', en: 'nueva' },
        { t: 'La tabla «Gastos» se puede agregar, renombrar y apagar.', en: 'gastos' },
        { t: 'La de «Ingresos» se llena sola.', en: 'ingresos' },
        { t: 'Toca el lápiz para renombrar o apagar una categoría; apagada deja de salir en los formularios.', en: 'lapiz1', ms: 4200 },
        { t: 'Solo se puede quitar una categoría que no tiene nada registrado.', en: 'bote2' },
      ],
    },
  ],
}

export default guia
