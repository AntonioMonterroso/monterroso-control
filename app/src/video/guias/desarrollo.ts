import type { Escena, GuiaVideo, Pieza } from '../tipos'

const avisos: Pieza[] = [
  { k: 'subtitulo', g: 'avisos', t: 'Para no olvidar' },
  { k: 'tabla', cab: ['Aviso', 'Detalle'], filas: [{ c: ['Dominio por renovar', 'vence en 6 días'], acc: [{ t: 'Ver', g: 'ver1' }] }] },
]

const herramientas: Pieza[] = [
  { k: 'pestanas', g: 'pestanas', l: [{ t: 'Todo' }, { t: 'Supabase' }, { t: 'Tokens' }, { t: 'Servicios' }, { t: 'Enlaces' }], on: 0 },
  { k: 'busca', g: 'busca', t: 'Nombre, proveedor, dirección o últimos 4' },
  { k: 'campos', g: 'proyecto', l: [{ et: 'Proyecto', v: 'Todos' }] },
  { k: 'chips', g: 'chips', l: [{ t: 'Todos', on: true }, { t: 'Con aviso · 1', g: 'conAviso' }] },
]

const supabase: Pieza[] = [
  { k: 'subtitulo', t: 'Supabase' },
  { k: 'botones', l: [{ t: 'Supabase', g: 'nuevoSupa' }] },
  { k: 'tabla', g: 'tablaSupa', cab: ['Supabase', 'Para copiar', 'Plan', 'Último uso'], filas: [{ c: ['espiga-web', 'Dirección · Llave pública', 'Gratis', 'hace 5 d'], g: 'copiar', acc: [{ t: 'Mantener activo', g: 'mantener' }, { t: 'Editar', g: 'lapiz' }, { t: 'Quitar', g: 'bote' }] }] },
]

const enlaces: Pieza[] = [
  { k: 'subtitulo', t: 'Repo, enlaces y estado' },
  { k: 'botones', l: [{ t: 'Enlace', g: 'nuevoEnlace' }] },
  { k: 'tabla', cab: ['Enlace', 'Tipo', 'Estado'], filas: [{ c: ['Página de la panadería', 'Sitio', 'Responde'], acc: [{ t: 'Revisar', g: 'revisar' }, { t: 'Editar' }, { t: 'Quitar' }] }] },
]

const pantalla = (): Escena => ({ etiqueta: 'Dev Studio', titulo: 'Desarrollo', piezas: [...avisos, ...herramientas, ...supabase, ...enlaces] })

const guia: GuiaVideo = {
  ruta: '/desarrollo',
  menu: 'Desarrollo',
  caps: [
    {
      t: '1 · Ver lo que importa',
      e0: pantalla(),
      tomas: [
        { t: 'En «Para no olvidar» ves lo que vence pronto; toca «Ver» para ir a donde se arregla.', en: 'ver1' },
        { t: 'Las pestañas «Todo», «Supabase», «Tokens», «Servicios» y «Enlaces» muestran una sola parte.', en: 'pestanas', ms: 4200 },
        { t: 'Escribe en el buscador o elige un «Proyecto».', en: 'busca' },
        { t: 'Toca «Con aviso» para ver solo lo que necesita atención.', en: 'conAviso' },
      ],
    },
    {
      t: '2 · Supabase y enlaces',
      e0: pantalla(),
      tomas: [
        { t: 'Toca «Mantener activo» para hacer una consulta liviana y anotar la fecha.', en: 'mantener', clic: true, luego: { piezas: [...supabase, { k: 'ok', g: 'listo', t: 'Consulta hecha: último uso hoy.' }] } },
        { t: 'En «Para copiar» toca la dirección o la llave pública para copiarla; la llave se copia sin mostrarse.', en: 'copiar', ms: 4200, luego: { piezas: [...supabase, ...enlaces] } },
        { t: 'Toca «Supabase», «Token», «Servicio» o «Enlace» en cada sección para agregar uno nuevo.', en: 'nuevoEnlace' },
        { t: 'En «Enlaces» toca «Revisar» para ver si la dirección responde.', en: 'revisar' },
        { t: 'Cada fila se edita con su lápiz y se quita con el basurero; marca varias para quitarlas juntas.', en: 'bote' },
      ],
    },
  ],
}

export default guia
