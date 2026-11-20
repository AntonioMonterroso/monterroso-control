import type { Escena, GuiaVideo, Pieza } from '../tipos'

const pestanas = (on: number): Pieza => ({ k: 'pestanas', g: 'pestanas', l: [{ t: 'Contratos' }, { t: 'Plantillas', g: 'pPlantillas' }], on })

const contratos = (): Escena => ({
  etiqueta: 'Dev Studio',
  titulo: 'Contratos',
  acciones: [{ t: 'Armar contrato', g: 'armar', p: true }],
  piezas: [
    pestanas(0),
    { k: 'busca', g: 'busca', t: 'Cliente o título' },
    { k: 'tabla', g: 'tabla', cab: ['Fecha', 'Contrato', 'Estado'], filas: [
      { c: ['10 nov 2026', 'Acuerdo de servicios · Panadería La Espiga', 'Firmado 12 nov 2026'], acc: [{ t: 'Ver', g: 'ver1' }, { t: 'PDF', g: 'pdf1' }, { t: 'Editar', g: 'lapiz1' }, { t: 'Quitar', g: 'bote1' }] },
      { c: ['18 nov 2026', 'Acuerdo de servicios · Taller El Pistón', 'Sin firmar'], acc: [{ t: 'Ver' }, { t: 'PDF' }, { t: 'Editar' }, { t: 'Quitar' }] },
    ] },
  ],
})

const plantillas: Partial<Escena> = {
  acciones: [{ t: 'Nueva plantilla', g: 'nuevaPlantilla', p: true }],
  piezas: [
    pestanas(1),
    { k: 'tabla', g: 'tablaPlantillas', cab: ['Nombre', 'Cláusulas'], filas: [{ c: ['Acuerdo de servicios', '12'], acc: [{ t: 'Editar', g: 'lapizPlantilla' }] }] },
  ],
}

const guia: GuiaVideo = {
  ruta: '/contratos',
  menu: 'Contratos',
  caps: [
    {
      t: '1 · Armar y revisar',
      e0: contratos(),
      tomas: [
        { t: 'Toca «Armar contrato» para hacer un contrato con los datos de un cliente.', en: 'armar', clic: true, luego: { hoja: { titulo: 'Armar contrato', piezas: [{ k: 'campos', g: 'datos', l: [{ et: 'Cliente', v: 'Panadería La Espiga' }, { et: 'Proyecto', v: 'Página de Panadería La Espiga' }, { et: 'Plantilla', v: 'Acuerdo de servicios' }] }], pie: [{ t: 'Cancelar' }, { t: 'Guardar' }, { t: 'Guardar y PDF', g: 'guardarPdf', p: true }] } } },
        { t: 'Los datos del cliente y del proyecto se llenan solos; toca «Guardar y PDF» para imprimirlo y firmarlo.', en: 'guardarPdf', clic: true, luego: { hoja: null } },
        { t: 'Escribe el cliente o el título en el buscador para encontrar un contrato.', en: 'busca' },
        { t: 'En cada contrato puedes verlo, abrir su PDF, editar la firma o el texto, o quitarlo; quitar se puede deshacer.', en: 'lapiz1', ms: 4600 },
      ],
    },
    {
      t: '2 · Plantillas',
      e0: contratos(),
      tomas: [
        { t: 'Toca la pestaña «Plantillas».', en: 'pPlantillas', clic: true, luego: plantillas },
        { t: 'El lápiz de una plantilla abre sus cláusulas para cambiarlas.', en: 'lapizPlantilla' },
        { t: 'Toca «Nueva plantilla» para hacer una desde cero.', en: 'nuevaPlantilla', clic: true, luego: { hoja: { titulo: 'Nueva plantilla', piezas: [{ k: 'campos', l: [{ et: 'Nombre', v: 'Mantenimiento mensual' }, { et: 'Encabezado', v: '' }] }, { k: 'botones', l: [{ t: 'Agregar cláusula', g: 'clausula' }] }], pie: [{ t: 'Cancelar' }, { t: 'Guardar plantilla', g: 'guardarPlantilla', p: true }] } } },
        { t: 'Agrega cada cláusula con «Agregar cláusula».', en: 'clausula' },
        { t: 'Toca «Guardar plantilla»; los contratos ya hechos no cambian.', en: 'guardarPlantilla', clic: true, luego: { hoja: null } },
      ],
    },
  ],
}

export default guia
