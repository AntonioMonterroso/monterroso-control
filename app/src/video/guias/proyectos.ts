import type { Escena, GuiaVideo, Pieza } from '../tipos'

const herramientas: Pieza[] = [
  { k: 'busca', g: 'busca', t: 'Proyecto o cliente' },
  { k: 'chips', g: 'chips', l: [{ t: 'Abiertos', on: true }, { t: 'Propuesta' }, { t: 'En curso' }, { t: 'Entregado' }, { t: 'Cerrado' }, { t: 'Todos' }] },
]

const tabla: Pieza = {
  k: 'tabla',
  g: 'tabla',
  cab: ['Proyecto', 'Estado', 'Inscripción', 'Mensualidad', 'Próximo cobro'],
  filas: [
    { c: ['Página de Panadería La Espiga', 'En curso', 'Q 1,500.00', 'Q 350.00', '05 dic 2026'], g: 'fila1', acc: [{ t: 'Editar', g: 'lapiz1' }] },
    { c: ['Sistema de Taller El Pistón', 'Propuesta', 'Q 3,000.00', 'Q 700.00', '—'], g: 'fila2', acc: [{ t: 'Editar' }] },
  ],
}

const lista = (): Escena => ({
  etiqueta: 'Dev Studio',
  titulo: 'Proyectos',
  acciones: [{ t: 'Nuevo proyecto', g: 'nuevo', p: true }],
  piezas: [...herramientas, tabla],
})

const guia: GuiaVideo = {
  ruta: '/proyectos',
  menu: 'Proyectos',
  caps: [
    {
      t: '1 · Buscar y abrir',
      e0: lista(),
      tomas: [
        { t: 'Escribe en el buscador el nombre del proyecto o del cliente.', en: 'busca' },
        { t: 'Los chips «Abiertos», «Propuesta», «En curso», «Entregado», «Cerrado» o «Todos» filtran por estado.', en: 'chips', ms: 4200 },
        { t: 'Toca un proyecto para abrir su ficha.', en: 'fila1' },
        { t: 'La columna «Próximo cobro» te dice cuándo toca cobrar la siguiente mensualidad.', en: 'tabla' },
      ],
    },
    {
      t: '2 · Crear y editar',
      e0: lista(),
      tomas: [
        { t: 'Toca «Nuevo proyecto» para crear un proyecto.', en: 'nuevo', clic: true, luego: { hoja: { titulo: 'Nuevo proyecto', piezas: [{ k: 'campos', g: 'datos', l: [{ et: 'Cliente', v: 'Panadería La Espiga' }, { et: 'Nombre', v: 'Tienda en línea' }, { et: 'Mensualidad', v: 'Q 350.00' }] }, { k: 'botones', l: [{ t: 'Cliente nuevo', g: 'clienteNuevo' }] }], pie: [{ t: 'Cancelar', g: 'cancelar' }, { t: 'Guardar', p: true }] } } },
        { t: 'Si el cliente no existe, créalo ahí mismo con «Cliente nuevo».', en: 'clienteNuevo' },
        { t: '«Cancelar» cierra la ventana sin guardar.', en: 'cancelar', clic: true, luego: { hoja: null } },
        { t: 'El lápiz de la fila abre el proyecto para editarlo.', en: 'lapiz1', clic: true, luego: { hoja: { titulo: 'Editar proyecto', piezas: [{ k: 'campos', g: 'rige', l: [{ et: 'Mensualidad', v: 'Q 450.00' }, { et: 'Rige desde (mes)', v: 'diciembre 2026' }] }], pie: [{ t: 'Cancelar' }, { t: 'Guardar', p: true }] } } },
        { t: 'Si cambias la mensualidad, eliges «Rige desde (mes)»: los meses de antes siguen con el monto anterior y el cambio queda en su historia.', en: 'rige', ms: 5200 },
      ],
    },
  ],
}

export default guia
