import type { Escena, GuiaVideo, Pieza } from '../tipos'

const tablas = (monto: string): Pieza[] => [
  { k: 'tabla', g: 'ingresos', cab: ['Categoría', 'Presupuesto', 'Real', 'Diferencia'], filas: [{ c: ['Salario', 'Q 3,000.00', 'Q 3,000.00', 'Q 0.00'], acc: [{ t: 'Editar' }] }] },
  { k: 'tabla', g: 'gastos', cab: ['Categoría', 'Presupuesto', 'Real', 'Diferencia'], filas: [
    { c: ['Transporte', monto, 'Q 350.00', 'Q 50.00'], acc: [{ t: 'Editar', g: 'lapiz1' }] },
    { c: ['Internet de la casa', 'Q 250.00', 'Q 250.00', 'Q 0.00'], acc: [{ t: 'Editar' }] },
  ] },
]

const pantalla = (monto = 'Q 400.00', ok = false): Escena => ({
  etiqueta: 'Salario',
  titulo: 'Presupuesto',
  acciones: [{ t: 'Copiar mes anterior', g: 'copiar' }],
  piezas: [
    { k: 'campos', g: 'mes', l: [{ et: 'Mes', v: 'noviembre 2026' }] },
    ...(ok ? [{ k: 'ok', g: 'listo', t: 'Se copiaron 3 montos del mes anterior.' } as Pieza] : []),
    { k: 'cifras', g: 'kpis', l: [{ et: 'Ingresos', v: 'Q 3,000.00', sub: 'de Q 3,000.00 planeados' }, { et: 'Gastos', v: 'Q 600.00', sub: 'de Q 650.00 planeados' }, { et: 'Utilidad real', v: 'Q 2,400.00', sub: 'planeada Q 2,350.00' }] },
    ...tablas(monto),
  ],
})

const guia: GuiaVideo = {
  ruta: '/salario/presupuesto',
  menu: 'Presupuesto',
  caps: [
    {
      t: '1 · Planeado contra real',
      e0: pantalla(),
      tomas: [
        { t: 'Elige el mes con las flechas del selector de mes.', en: 'mes' },
        { t: 'Arriba ves lo real contra lo planeado del salario.', en: 'kpis', ms: 4200 },
        { t: 'Toca el lápiz de una categoría para poner su monto presupuestado.', en: 'lapiz1', clic: true, luego: { hoja: { titulo: 'Monto presupuestado', piezas: [{ k: 'campos', g: 'monto', l: [{ et: 'Monto del mes', v: 'Q 450.00' }] }], pie: [{ t: 'Cancelar' }, { t: 'Guardar', g: 'guardar', p: true }] } } },
        { t: 'Escribe el monto y toca «Guardar»; con 0 se quita.', en: 'guardar', clic: true, luego: { ...pantalla('Q 450.00'), hoja: null } },
        { t: 'Toca «Copiar mes anterior» para traer los montos del mes pasado sin tocar los que ya pusiste.', en: 'copiar', clic: true, luego: pantalla('Q 450.00', true) },
      ],
    },
  ],
}

export default guia
