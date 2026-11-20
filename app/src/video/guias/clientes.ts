import type { Escena, GuiaVideo, Pieza } from '../tipos'

const herramientas: Pieza[] = [
  { k: 'busca', g: 'busca', t: 'Nombre, NIT, teléfono o correo' },
  { k: 'chips', g: 'chips', l: [{ t: 'Activos', on: true }, { t: 'Todos' }, { t: 'Inactivos' }, { t: 'Archivados', g: 'archivados' }] },
]

const tabla = (marcadas: boolean): Pieza => ({
  k: 'tabla',
  g: 'tabla',
  cab: ['Cliente', 'Negocio', 'WhatsApp', 'Proyectos', 'Mensualidad'],
  filas: [
    { c: [`${marcadas ? '☑ ' : ''}Panadería La Espiga`, 'Monterroso Dev Studio', '5555 0101', '2', 'Q 700.00'], g: 'fila1', acc: [{ t: 'Editar', g: 'lapiz1' }, { t: 'Borrar o archivar', g: 'bote1' }] },
    { c: [`${marcadas ? '☑ ' : ''}Taller El Pistón`, 'Monterroso Dev Studio', '5555 0202', '1', 'Q 350.00'], g: 'fila2', acc: [{ t: 'Editar' }, { t: 'Borrar o archivar', g: 'bote2' }] },
    { c: [`${marcadas ? '☑ ' : ''}Cliente sin movimientos`, 'Monterroso Dev Studio', 'Sin anotar', '0', 'Q 0.00'], g: 'fila3', acc: [{ t: 'Editar' }, { t: 'Borrar o archivar', g: 'bote3' }] },
  ],
})

const lista = (marcadas = false): Escena => ({
  etiqueta: 'Dev Studio',
  titulo: 'Clientes',
  acciones: [{ t: 'Nuevo cliente', g: 'nuevo', p: true }],
  piezas: [
    ...herramientas,
    { k: 'botones', g: 'masa', l: marcadas ? [{ t: 'Desmarcar todas' }, { t: 'Borrar o archivar las marcadas · 3', g: 'masaBorrar' }] : [{ t: 'Marcar todas · 3', g: 'marcarTodas' }] },
    tabla(marcadas),
  ],
})

const guia: GuiaVideo = {
  ruta: '/clientes',
  menu: 'Clientes',
  caps: [
    {
      t: '1 · Buscar y abrir',
      e0: lista(),
      tomas: [
        { t: 'Toca «Nuevo cliente» para crear uno; al guardarlo se abre su ficha.', en: 'nuevo' },
        { t: 'Escribe un nombre, NIT, teléfono o correo para encontrarlo.', en: 'busca' },
        { t: '«Activos», «Todos», «Inactivos» y «Archivados» cambian qué clientes se ven.', en: 'chips' },
        { t: 'Toca un cliente para abrir su ficha. Con clic derecho o dejándolo presionado salen «Abrir», «Editar» y «Borrar o archivar».', en: 'fila1', clic: true, luego: { piezas: [...herramientas, tabla(false), { k: 'menu', g: 'menuFila', l: [{ t: 'Abrir' }, { t: 'Editar' }, { t: 'Borrar o archivar' }] }] } },
        { t: 'El lápiz de la fila abre sus datos para corregirlos.', en: 'lapiz1' },
      ],
    },
    {
      t: '2 · Borrar o archivar',
      e0: lista(),
      tomas: [
        { t: 'Al pasar sobre el bote dice qué pasará: «Lo borra; no tiene movimientos».', en: 'bote3', ms: 4200 },
        { t: 'Si tiene trabajos o pagos, dice «Lo archiva porque tiene…»: no se pierde su historia.', en: 'bote1', ms: 4200 },
        { t: 'Para varios: «Marcar todas · 3».', en: 'marcarTodas', clic: true, luego: lista(true) },
        { t: 'Toca «Borrar o archivar las marcadas · 3».', en: 'masaBorrar', clic: true, luego: { hoja: { titulo: 'Borrar o archivar 3 clientes', piezas: [{ k: 'subtitulo', g: 'seBorran', t: 'Se borra · 1' }, { k: 'texto', t: 'Cliente sin movimientos' }, { k: 'subtitulo', g: 'seArchivan', t: 'Se archivan · 2' }, { k: 'texto', t: 'Panadería La Espiga — tiene 2 trabajos y 5 pagos' }, { k: 'texto', t: 'Taller El Pistón — tiene 1 trabajo y 2 pagos' }], pie: [{ t: 'Cancelar' }, { t: 'Borrar y archivar', g: 'confirmar', p: true }] } } },
        { t: 'Antes de hacerlo muestra cuáles se borran y cuáles se archivan.', en: 'seArchivan', ms: 4200 },
        { t: '«Borrar y archivar»: después sale «Deshacer» por si fue sin querer.', en: 'confirmar', clic: true, luego: { hoja: null, piezas: [...herramientas, { k: 'ok', g: 'listo', t: 'Listo: se borró 1 y se archivaron 2. Deshacer' }] } },
        { t: 'Los archivados se ven en «Archivados» y vuelven con «Reactivar».', en: 'archivados' },
      ],
    },
  ],
}

export default guia
