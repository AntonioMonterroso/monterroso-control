import type { Escena, GuiaVideo, Pieza } from '../tipos'

const stepper = (hechos: number, enGastos: number): Pieza[] => [
  { k: 'cifras', g: 'stepper', l: [{ et: 'Avance', v: `${hechos} de 12`, sub: `pasos hechos o que no aplican · costo Q 6,850.00 · ${enGastos} ya en Gastos` }] },
  { k: 'texto', g: 'circulos', t: [...Array(12)].map((_, i) => (i < hechos ? '✓' : String(i + 1))).join('  ') },
]

const notario: Pieza[] = [
  { k: 'subtitulo', g: 'grNotario', t: 'Notario · 1 de 1' },
  { k: 'tabla', g: 'tNotario', cab: ['Paso', 'Estado', 'Fecha', 'Responsable', 'Costo'], filas: [
    { c: ['1. Escritura constitutiva ante notario', 'Hecho', '15 dic 2026', 'Notario', 'Q 3,500.00'], acc: [{ t: 'Ver', g: 'ojo1' }, { t: 'Editar', g: 'lapiz1' }, { t: 'Quitar' }] },
  ], pie: ['Total Notario', '', '', '', 'Q 3,500.00'] },
]

const registro = (marcadas: boolean, hechos: boolean): Pieza[] => [
  { k: 'subtitulo', g: 'grRegistro', t: `Registro Mercantil · ${hechos ? '4' : '2'} de 4` },
  { k: 'botones', g: 'masa', l: marcadas ? [{ t: 'Desmarcar todas' }, { t: 'Marcar hechos · 4', g: 'marcarHechos' }, { t: 'Quitar las marcadas · 4' }] : [{ t: 'Marcar todas · 4', g: 'marcarTodas' }] },
  { k: 'tabla', g: 'tRegistro', cab: ['Paso', 'Estado', 'Fecha', 'Responsable', 'Costo'], filas: [
    { c: [`${marcadas ? '☑ ' : ''}2. Inscripción provisional en el Registro Mercantil`, 'Hecho', '18 dic 2026', 'Notario', 'Q 650.00'] },
    { c: [`${marcadas ? '☑ ' : ''}5. Patente de comercio de sociedad`, 'Hecho', '20 ene 2027', 'Notario', 'Q 200.00'], acc: [{ t: 'A Gastos', g: 'aGastos' }, { t: 'Editar' }, { t: 'Quitar' }] },
    { c: [`${marcadas ? '☑ ' : ''}7. Nombramiento del representante legal inscrito`, hechos ? 'Hecho' : 'En proceso', hechos ? '20 nov 2026' : '—', 'Notario', 'Q 300.00'], acc: [{ t: 'Editar' }, { t: 'Quitar' }] },
    { c: [`${marcadas ? '☑ ' : ''}11. Libros de actas y de registro de accionistas`, hechos ? 'Hecho' : 'Pendiente', hechos ? '20 nov 2026' : '—', 'Notario', 'Q 400.00'], acc: [{ t: 'Editar' }, { t: 'Quitar' }] },
  ], pie: ['Total Registro Mercantil', '', '', '', 'Q 2,450.00'] },
]

const sat: Pieza[] = [
  { k: 'subtitulo', g: 'grSat', t: 'SAT · 1 de 3' },
  { k: 'tabla', cab: ['Paso', 'Estado', 'Fecha', 'Responsable', 'Costo'], filas: [
    { c: ['8. Inscripción en la SAT: NIT y RTU', 'Hecho', '05 feb 2027', 'Contador', 'Q 0.00'], acc: [{ t: 'Editar' }, { t: 'Quitar' }] },
  ], pie: ['Total SAT', '', '', '', 'Q 900.00'] },
]

const llena = (marcadas = false, hechos = false, ok: Pieza[] = []): Partial<Escena> => ({
  acciones: [{ t: 'Paso', g: 'paso', p: true }],
  piezas: [...ok, ...stepper(hechos ? 9 : 7, ok.length || hechos ? 3 : 2), ...notario, ...registro(marcadas, hechos), ...sat],
})

const vacia = (): Escena => ({
  etiqueta: 'Sociedad anónima',
  titulo: 'Trámites de constitución',
  acciones: [{ t: 'Agregar los pasos de Guatemala', g: 'base' }, { t: 'Paso', g: 'paso', p: true }],
  piezas: [{ k: 'texto', t: 'Sin pasos todavía. Toca «Agregar los pasos de Guatemala» o agrega uno propio con «Paso».' }],
})

const guia: GuiaVideo = {
  ruta: '/sa/tramites',
  menu: 'Trámites',
  caps: [
    {
      t: '1 · El avance',
      e0: vacia(),
      tomas: [
        { t: 'Si la lista está vacía, toca «Agregar los pasos de Guatemala» para cargar los pasos de constitución.', en: 'base', clic: true, luego: llena() },
        { t: 'Toca «Paso» para agregar un paso propio.', en: 'paso' },
        { t: 'Arriba dice cuántos pasos van, como «7 de 12», con el costo y cuántos ya están en Gastos.', en: 'stepper', ms: 5200 },
        { t: 'Cada círculo es un paso con su número; los hechos llevan un cheque.', en: 'circulos' },
      ],
    },
    {
      t: '2 · Por institución',
      e0: { ...vacia(), ...llena() },
      tomas: [
        { t: 'Los pasos se agrupan por institución: Notario, Registro Mercantil, SAT, Banco, IGSS y Otros.', en: 'grNotario', ms: 5200 },
        { t: 'Cada grupo dice cuántos lleva, como «2 de 4».', en: 'grRegistro' },
        { t: 'El ojito abre el documento del paso y el lápiz pone estado, fecha, responsable y costo.', en: 'lapiz1', ms: 4800 },
        { t: 'Si un paso tiene costo, toca «A Gastos» para registrarlo como gasto de constitución.', en: 'aGastos', clic: true, luego: llena(false, false, [{ k: 'ok', g: 'listo', t: 'Gasto de constitución registrado por Q 200.00.' }]) },
      ],
    },
    {
      t: '3 · Marcar varios',
      e0: { ...vacia(), ...llena() },
      tomas: [
        { t: 'En un grupo marca los pasos que ya terminaste, o toca «Marcar todas».', en: 'marcarTodas', clic: true, luego: llena(true) },
        { t: 'Toca «Marcar hechos»: quedan hechos con la fecha de hoy.', en: 'marcarHechos', clic: true, luego: llena(false, true) },
        { t: 'El grupo y el avance de arriba se actualizan solos.', en: 'stepper' },
      ],
    },
  ],
}

export default guia
