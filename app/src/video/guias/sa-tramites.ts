import type { Escena, GuiaVideo, Pieza } from '../tipos'

const tabla: Pieza = {
  k: 'tabla',
  g: 'tabla',
  cab: ['Paso', 'Estado', 'Fecha', 'Responsable', 'Costo'],
  filas: [
    { c: ['Escritura constitutiva', 'Hecho', '15 dic 2026', 'Notario', 'Q 3,500.00'], acc: [{ t: 'Gasto', g: 'gasto1' }, { t: 'Editar', g: 'lapiz1' }, { t: 'Quitar' }] },
    { c: ['Inscripción en el Registro Mercantil', 'En proceso', '—', 'Notario', 'Q 0.00'], acc: [{ t: 'Editar' }, { t: 'Quitar' }] },
  ],
  pie: ['Total', '', '', '', 'Q 3,500.00'],
}

const vacia = (): Escena => ({
  etiqueta: 'Sociedad anónima',
  titulo: 'Trámites de constitución',
  acciones: [{ t: 'Agregar los pasos de Guatemala', g: 'base' }, { t: 'Paso', g: 'paso', p: true }],
  piezas: [{ k: 'texto', t: 'Sin pasos. Agrega los pasos de Guatemala o uno propio.' }],
})

const llena: Partial<Escena> = {
  acciones: [{ t: 'Paso', g: 'paso', p: true }],
  piezas: [
    { k: 'cifras', g: 'kpis', l: [{ et: 'Avance', v: '1 de 2', sub: 'pasos hechos o que no aplican' }, { et: 'Costo de constitución', v: 'Q 3,500.00', sub: '0 ya registrados en Gastos' }] },
    tabla,
  ],
}

const guia: GuiaVideo = {
  ruta: '/sa/tramites',
  menu: 'Trámites',
  caps: [
    {
      t: '1 · Los pasos',
      e0: vacia(),
      tomas: [
        { t: 'Si la lista está vacía, toca «Agregar los pasos de Guatemala» para cargar los pasos de constitución.', en: 'base', clic: true, luego: llena },
        { t: 'Toca «Paso» para agregar un paso propio.', en: 'paso' },
        { t: 'Arriba ves el avance y el costo de la constitución.', en: 'kpis' },
        { t: 'En cada paso edita con el lápiz para poner estado, fecha, responsable y costo.', en: 'lapiz1' },
        { t: 'Si un paso tiene costo, toca «Gasto» para registrarlo en Gastos.', en: 'gasto1', clic: true, luego: { piezas: [{ k: 'ok', g: 'listo', t: 'Gasto de constitución registrado por Q 3,500.00.' }, tabla] } },
      ],
    },
  ],
}

export default guia
