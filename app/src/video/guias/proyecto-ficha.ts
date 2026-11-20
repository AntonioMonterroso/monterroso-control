import type { Escena, GuiaVideo, Pieza } from '../tipos'

const pestanas = (on: number): Pieza => ({ k: 'pestanas', g: 'pestanas', l: [{ t: 'Resumen', g: 'resumen' }, { t: 'Desarrollo', g: 'desarrollo' }], on })

const resumen = (): Escena => ({
  etiqueta: 'Proyecto',
  titulo: 'Página de Panadería La Espiga',
  acciones: [{ t: 'Editar', g: 'editar' }, { t: 'Registrar pago', g: 'registrarPago', p: true }],
  piezas: [
    pestanas(0),
    { k: 'cifras', g: 'kpis', l: [{ et: 'Inscripción', v: 'Q 1,500.00', sub: 'al firmar' }, { et: 'Mensualidad', v: 'Q 350.00', sub: 'próximo cobro 05 dic 2026' }, { et: 'Ha pagado', v: 'Q 2,200.00', sub: 'falta Q 350.00' }, { et: 'Costo', v: 'Q 480.00', sub: 'gastos del proyecto' }] },
    { k: 'subtitulo', g: 'cobrosTitulo', t: 'Lo que debe de este proyecto' },
    { k: 'tabla', g: 'cobros', cab: ['Vence', 'Concepto', 'Estado', 'Monto', 'Falta'], filas: [{ c: ['05 nov 2026', 'Mensualidad de noviembre', 'Pagado', 'Q 350.00', 'Q 0.00'] }, { c: ['05 dic 2026', 'Mensualidad de diciembre', 'Por cobrar', 'Q 350.00', 'Q 350.00'] }] },
    { k: 'subtitulo', g: 'historial', t: 'Pagos que hizo' },
    { k: 'cifras', g: 'kpisHist', l: [{ et: 'Pagó este año', v: 'Q 2,200.00', sub: '5 pagos' }, { et: 'Pagó desde siempre', v: 'Q 2,200.00', sub: '5 pagos' }, { et: 'Saldo a favor', v: 'Q 0.00', sub: 'de anticipos sin aplicar' }] },
    { k: 'tabla', g: 'pagos', cab: ['Fecha', 'Concepto', 'Forma', 'Dónde cayó', 'Monto'], filas: [{ c: ['06 nov 2026', 'Mensualidad de noviembre', 'Transferencia', 'Personal · Banco Uno ••4821', 'Q 350.00'], acc: [{ t: 'Editar', g: 'lapizPago' }, { t: 'Eliminar pago' }] }] },
  ],
})

const desarrollo: Partial<Escena> = {
  piezas: [
    pestanas(1),
    { k: 'subtitulo', g: 'supabase', t: 'Supabase' },
    { k: 'tabla', cab: ['Supabase', 'Plan', 'Último uso'], filas: [{ c: ['espiga-web', 'Gratis', 'hace 3 d'] }] },
    { k: 'subtitulo', t: 'Repo, enlaces y estado' },
    { k: 'subtitulo', t: 'Dominios y servicios' },
    { k: 'subtitulo', t: 'Tokens y llaves' },
    { k: 'subtitulo', g: 'bitacora', t: 'Bitácora de cambios' },
    { k: 'botones', l: [{ t: 'Cambio', g: 'cambio' }] },
  ],
}

const guia: GuiaVideo = {
  ruta: '/proyectos/:id',
  menu: 'Proyectos',
  caps: [
    {
      t: '1 · Resumen del proyecto',
      e0: resumen(),
      tomas: [
        { t: 'Toca «Editar» para cambiar el proyecto, su inscripción y su mensualidad.', en: 'editar' },
        { t: 'Las pestañas «Resumen» y «Desarrollo» cambian lo que ves del proyecto.', en: 'pestanas' },
        { t: 'En «Resumen» ves la inscripción, la mensualidad, lo pagado y el costo del proyecto.', en: 'kpis', ms: 4200 },
        { t: '«Lo que debe de este proyecto» lista cada cobro con su vencimiento, estado y lo que falta.', en: 'cobros' },
        { t: '«Pagos que hizo» suma lo pagado este año, desde siempre y el saldo a favor.', en: 'kpisHist', ms: 4200 },
        { t: 'Cada pago dice su forma y dónde cayó; el lápiz lo corrige.', en: 'pagos' },
      ],
    },
    {
      t: '2 · Registrar pago',
      e0: resumen(),
      tomas: [
        { t: 'Toca «Registrar pago»: el cliente ya viene elegido y solo salen los cobros de este proyecto.', en: 'registrarPago', clic: true, luego: { hoja: { titulo: 'Registrar pago', piezas: [{ k: 'texto', t: 'Paso 1 de 2 · ¿Qué pagó?' }, { k: 'tabla', g: 'cobrosPago', cab: ['Cobro', 'Estado', 'Falta'], filas: [{ c: ['☑ Mensualidad de diciembre · 05 dic 2026', 'Por cobrar', 'Q 350.00'] }] }], pie: [{ t: 'Cancelar' }, { t: 'Siguiente · Q 350.00', g: 'siguiente', p: true }] } } },
        { t: 'Marca lo que pagó y toca «Siguiente».', en: 'siguiente', clic: true, luego: { hoja: { titulo: 'Registrar pago', piezas: [{ k: 'campos', g: 'datosPago', l: [{ et: 'Fecha del pago', v: '20 nov 2026' }, { et: 'Monto recibido', v: 'Q 350.00' }, { et: 'Forma de pago', v: 'Transferencia' }, { et: 'Dónde cayó', v: 'Personal · Banco Uno ••4821' }] }], pie: [{ t: 'Cancelar' }, { t: 'Registrar pago', g: 'okPago', p: true }] } } },
        { t: 'Pon la fecha, la forma de pago y dónde cayó.', en: 'datosPago' },
        { t: 'Toca «Registrar pago»: el cobro queda pagado con su recibo.', en: 'okPago', clic: true, luego: { hoja: null } },
      ],
    },
    {
      t: '3 · Desarrollo',
      e0: resumen(),
      tomas: [
        { t: 'Toca la pestaña «Desarrollo».', en: 'desarrollo', clic: true, luego: desarrollo },
        { t: 'Aquí anotas Supabase, enlaces, dominios y servicios, y tokens de este proyecto.', en: 'supabase' },
        { t: 'En «Bitácora de cambios» toca «Cambio» para anotar qué cambió y en qué versión.', en: 'cambio' },
      ],
    },
  ],
}

export default guia
