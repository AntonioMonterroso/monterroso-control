import type { Escena, GuiaVideo } from '../tipos'

const pantalla = (copiado = false): Escena => ({
  etiqueta: 'Dev Studio y Hogar Canela',
  titulo: 'Precios y tarifas',
  acciones: [{ t: copiado ? 'Copiado' : 'Copiar compartidos (2)', g: 'copiar' }, { t: 'Extra', g: 'extra' }, { t: 'Paquete', g: 'paquete', p: true }],
  piezas: [
    { k: 'subtitulo', t: 'Paquetes' },
    { k: 'tabla', g: 'paquetes', cab: ['Nombre', 'Inscripción', 'Mensualidad', 'Página'], filas: [
      { c: ['Página básica', 'Q 1,500.00', 'Q 350.00', 'Compartido'], acc: [{ t: 'Editar', g: 'lapiz1' }, { t: 'Quitar', g: 'bote1' }] },
      { c: ['Sistema a la medida', 'Q 3,000.00', 'Q 700.00', 'No'], acc: [{ t: 'Editar' }, { t: 'Quitar' }] },
    ] },
    { k: 'subtitulo', t: 'Extras' },
    { k: 'tabla', g: 'extras', cab: ['Nombre', 'Precio', 'Página'], filas: [{ c: ['Dominio anual', 'Q 150.00', 'Compartido'], acc: [{ t: 'Editar' }, { t: 'Quitar' }] }] },
  ],
})

const guia: GuiaVideo = {
  ruta: '/precios',
  menu: 'Precios y tarifas',
  caps: [
    {
      t: '1 · Tus tarifas',
      e0: pantalla(),
      tomas: [
        { t: 'Toca «Paquete» para agregar uno con inscripción y mensualidad.', en: 'paquete' },
        { t: 'Toca «Extra» para agregar un extra con precio único.', en: 'extra' },
        { t: 'Edita una tarifa con su lápiz; ahí marcas «Compartir con la página».', en: 'lapiz1', clic: true, luego: { hoja: { titulo: 'Editar tarifa', piezas: [{ k: 'campos', g: 'form', l: [{ et: 'Nombre', v: 'Página básica' }, { et: 'Inscripción', v: 'Q 1,500.00' }, { et: 'Mensualidad', v: 'Q 350.00' }, { et: 'Compartir con la página', v: 'Sí' }] }], pie: [{ t: 'Cancelar' }, { t: 'Guardar', g: 'guardar', p: true }] } } },
        { t: 'Toca «Guardar»; si cambiaste un precio, el anterior queda en su historia.', en: 'guardar', clic: true, luego: { hoja: null } },
        { t: 'Toca «Copiar compartidos» para copiar los precios marcados, listos para la página.', en: 'copiar', clic: true, luego: pantalla(true) },
        { t: 'Quitar una tarifa se puede deshacer y no cambia los proyectos que ya la usaron.', en: 'bote1' },
      ],
    },
  ],
}

export default guia
