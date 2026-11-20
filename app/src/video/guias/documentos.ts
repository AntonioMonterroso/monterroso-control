import type { Escena, GuiaVideo, Pieza } from '../tipos'

const herramientas: Pieza[] = [
  { k: 'busca', g: 'busca', t: 'Título, cliente o número' },
  { k: 'chips', g: 'chips', l: [{ t: 'Todos', on: true }, { t: 'Cotización' }, { t: 'Propuesta' }, { t: 'Hoja membretada' }] },
]

const tabla = (marcadas: boolean): Pieza => ({
  k: 'tabla',
  g: 'tabla',
  cab: ['Fecha', 'Documento', 'Cliente', 'Total', 'Estado'],
  filas: [
    { c: [`${marcadas ? '☑ ' : ''}12 nov 2026`, 'Cotización de página web', 'Panadería La Espiga', 'Q 1,350.00', 'Enviado · Visto 2 veces'], g: 'fila1', acc: [{ t: 'Ver', g: 'ojito' }, { t: 'Compartir', g: 'compartir' }, { t: 'PDF', g: 'pdf' }, { t: 'Editar', g: 'lapiz' }, { t: 'Quitar', g: 'bote' }] },
    { c: [`${marcadas ? '☑ ' : ''}03 nov 2026`, 'Propuesta de sistema', 'Taller El Pistón', 'Q 3,000.00', 'Borrador · Sin abrir'], g: 'fila2', acc: [{ t: 'Ver' }, { t: 'Compartir' }, { t: 'PDF' }, { t: 'Editar' }, { t: 'Quitar' }] },
  ],
})

const lista = (marcadas = false): Escena => ({
  etiqueta: 'Dev Studio, Música y Diseño',
  titulo: 'Documentos',
  acciones: [{ t: 'Acuerdo de servicios', g: 'acuerdo' }, { t: 'Propuesta', g: 'propuesta' }, { t: 'Hoja membretada', g: 'membretada' }, { t: 'Cotización', g: 'cotizacion', p: true }],
  piezas: [...herramientas, { k: 'botones', l: marcadas ? [{ t: 'Desmarcar todas' }, { t: 'Quitar las marcadas · 2', g: 'quitarMarcadas' }] : [{ t: 'Marcar todas · 2', g: 'marcarTodas' }] }, tabla(marcadas)],
})

const guia: GuiaVideo = {
  ruta: '/documentos',
  menu: 'Documentos',
  caps: [
    {
      t: '1 · Armar un documento',
      e0: lista(),
      tomas: [
        { t: 'Toca «Cotización», «Propuesta» u «Hoja membretada» para armar un documento nuevo.', en: 'cotizacion', clic: true, luego: { hoja: { titulo: 'Nuevo documento', piezas: [{ k: 'campos', l: [{ et: 'Cliente', v: 'Panadería La Espiga' }, { et: 'Título', v: 'Cotización de página web' }] }, { k: 'botones', l: [{ t: 'Renglón', g: 'renglon' }] }], pie: [{ t: 'Cancelar' }, { t: 'Guardar' }, { t: 'Guardar y PDF', g: 'guardarPdf', p: true }] } } },
        { t: 'Agrega cada cosa con «Renglón».', en: 'renglon' },
        { t: '«Guardar y PDF» lo guarda y abre el PDF listo para enviar.', en: 'guardarPdf', clic: true, luego: { hoja: null } },
        { t: 'Toca «Acuerdo de servicios» para armar el contrato con la plantilla; se guarda en Contratos.', en: 'acuerdo' },
      ],
    },
    {
      t: '2 · Buscar y revisar',
      e0: lista(),
      tomas: [
        { t: 'Escribe un título, cliente o número en el buscador, o toca un chip de tipo para filtrar.', en: 'busca' },
        { t: 'Toca el ojito para ver el documento encima, sin salir de esta pantalla.', en: 'ojito' },
        { t: 'Abre el PDF listo para enviar desde su fila.', en: 'pdf' },
        { t: 'El estado («Borrador», «Enviado», «Aceptado» o «Rechazado») se cambia con el lápiz.', en: 'lapiz' },
        { t: 'Para quitar varios, toca «Marcar todas · 2».', en: 'marcarTodas', clic: true, luego: lista(true) },
        { t: 'Luego «Quitar las marcadas»; quitar se puede deshacer.', en: 'quitarMarcadas' },
      ],
    },
    {
      t: '3 · Compartir en la web',
      e0: lista(),
      tomas: [
        { t: 'Las cotizaciones y propuestas tienen el ícono de compartir; los contratos nunca van a la web.', en: 'compartir', clic: true, luego: { hoja: { titulo: 'Compartir en la web', piezas: [{ k: 'botones', g: 'web', l: [{ t: 'Copiar link', g: 'copiar' }, { t: 'Enviar por WhatsApp', g: 'whats' }, { t: 'Ver como el cliente', g: 'verCliente' }, { t: 'Bajar PDF' }] }, { k: 'botones', g: 'link', l: [{ t: 'Retirar link', g: 'retirar' }, { t: 'Crear link nuevo', g: 'nuevoLink' }] }, { k: 'texto', g: 'vistas', t: 'Visto 2 veces; la primera el 13 nov 2026.' }] } } },
        { t: '«Copiar link» copia la dirección para mandarla al cliente.', en: 'copiar' },
        { t: '«Enviar por WhatsApp» abre su chat con el link listo.', en: 'whats' },
        { t: '«Ver como el cliente» abre la página tal como la verá.', en: 'verCliente' },
        { t: 'Aquí dice cuántas veces lo abrió y si lo aceptó.', en: 'vistas', ms: 4200 },
        { t: '«Retirar link» hace que ya no se abra; «Crear link nuevo» cambia la dirección.', en: 'retirar', clic: true, luego: { hoja: null } },
        { t: 'En la lista el estado dice «Sin abrir», «Visto 2 veces» o «Aceptado».', en: 'fila2' },
      ],
    },
  ],
}

export default guia
