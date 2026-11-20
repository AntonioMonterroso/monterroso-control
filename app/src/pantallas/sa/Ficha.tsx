import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import FormRegistro, { type Campo } from '../../componentes/FormRegistro'
import Ojito from '../../componentes/Ojito'
import Tabla from '../../componentes/Tabla'
import { useDatos } from '../../lib/datos'
import { quetzales } from '../../lib/dinero'
import { fechaCorta, fechaLarga } from '../../lib/fechas'
import { useQuitar } from '../../lib/quitar'
import { NEGOCIOS_SA } from '../../lib/tipos'
import { useSA } from '../../lib/saModelo'

const REGIMEN: Record<string, string> = { pequeno: 'Pequeño contribuyente', general: 'Régimen general (opcional simplificado sobre ingresos)', utilidades: 'Régimen sobre las utilidades de actividades lucrativas' }
const ORGANO: Record<string, string> = { administrador_unico: 'Administrador único', consejo: 'Consejo de administración' }

export const camposSociedad: Campo[] = [
  { k: 'denominacion', etiqueta: 'Denominación social', tipo: 'texto', max: 200, ancho: true, ayuda: 'Por ejemplo «… Sociedad Anónima».' },
  { k: 'nombre_comercial', etiqueta: 'Nombre comercial', tipo: 'texto', max: 200 },
  { k: 'nit', etiqueta: 'NIT', tipo: 'texto', max: 30 },
  { k: 'escritura_numero', etiqueta: 'Número de escritura constitutiva', tipo: 'texto', max: 40 },
  { k: 'escritura_fecha', etiqueta: 'Fecha de la escritura', tipo: 'fecha' },
  { k: 'notario', etiqueta: 'Notario autorizante', tipo: 'texto', max: 200, ancho: true },
  { k: 'rm_numero', etiqueta: 'Registro Mercantil: número', tipo: 'texto', max: 40 },
  { k: 'rm_folio', etiqueta: 'Folio', tipo: 'texto', max: 40 },
  { k: 'rm_libro', etiqueta: 'Libro', tipo: 'texto', max: 40 },
  { k: 'patente_sociedad', etiqueta: 'Patente de comercio de sociedad', tipo: 'texto', max: 80 },
  { k: 'patente_empresa', etiqueta: 'Patente de comercio de empresa', tipo: 'texto', max: 80 },
  { k: 'organo_administracion', etiqueta: 'Órgano de administración', tipo: 'select', opciones: Object.entries(ORGANO).map(([valor, nombre]) => ({ valor, nombre })) },
  { k: 'representante', etiqueta: 'Representante legal', tipo: 'texto', max: 200 },
  { k: 'representante_cargo', etiqueta: 'Cargo', tipo: 'texto', max: 120 },
  { k: 'nombramiento_fecha', etiqueta: 'Fecha del nombramiento', tipo: 'fecha' },
  { k: 'nombramiento_vence', etiqueta: 'Vencimiento del nombramiento', tipo: 'fecha' },
  { k: 'nombramiento_registro', etiqueta: 'Inscripción del nombramiento', tipo: 'texto', max: 120, ayuda: 'Número, folio y libro del Registro Mercantil.' },
  { k: 'domicilio', etiqueta: 'Domicilio fiscal', tipo: 'texto', max: 300, ancho: true },
  { k: 'regimen', etiqueta: 'Régimen del ISR', tipo: 'select', opciones: Object.entries(REGIMEN).map(([valor, nombre]) => ({ valor, nombre })) },
  { k: 'inicio_operaciones', etiqueta: 'Inicio de operaciones', tipo: 'fecha', ayuda: 'Desde esta fecha, Dev Studio, Música y Diseño cuentan para la sociedad.' },
  { k: 'cierre_mes', etiqueta: 'Mes de cierre del ejercicio', tipo: 'numero', min: 1, max: 12 },
  { k: 'capital_autorizado', etiqueta: 'Capital autorizado', tipo: 'monto', requerido: true },
]

export default function FichaSA() {
  const { m, s } = useSA()
  const { guardar } = useDatos()
  const q = useQuitar()
  const [editar, setEditar] = useState(false)
  const [doc, setDoc] = useState<(typeof m.saDocumentos)[number] | 'nuevo' | null>(null)
  const d = doc && doc !== 'nuevo' ? doc : null
  const v = (x: string | null | undefined) => x || <span className="m-vacia">Sin anotar</span>
  const f = (x: string | null | undefined) => (x ? fechaLarga(x) : <span className="m-vacia">Sin anotar</span>)
  const bloques: [string, [string, React.ReactNode][]][] = [
    ['Identificación', [['Denominación', v(s?.denominacion)], ['Nombre comercial', v(s?.nombre_comercial)], ['NIT', v(s?.nit)], ['Domicilio', v(s?.domicilio)], ['Régimen', v(s?.regimen ? REGIMEN[s.regimen] : null)], ['Inicio de operaciones', f(s?.inicio_operaciones)], ['Cierre del ejercicio', s ? `Mes ${s.cierre_mes}` : v(null)]]],
    ['Escritura e inscripciones', [['Escritura', s?.escritura_numero ? `No. ${s.escritura_numero}` : v(null)], ['Fecha', f(s?.escritura_fecha)], ['Notario', v(s?.notario)], ['Registro Mercantil', s?.rm_numero ? `No. ${s.rm_numero}, folio ${s.rm_folio ?? '—'}, libro ${s.rm_libro ?? '—'}` : v(null)], ['Patente de sociedad', v(s?.patente_sociedad)], ['Patente de empresa', v(s?.patente_empresa)]]],
    ['Administración', [['Órgano', v(s?.organo_administracion ? ORGANO[s.organo_administracion] : null)], ['Representante legal', v(s?.representante)], ['Cargo', v(s?.representante_cargo)], ['Nombramiento', f(s?.nombramiento_fecha)], ['Vence', f(s?.nombramiento_vence)], ['Inscripción', v(s?.nombramiento_registro)]]],
  ]
  const negociosSA = m.negocios.filter((n) => NEGOCIOS_SA.includes(n.clave))
  return (
    <>
      <div className="c-cabeza">
        <div><span className="m-etiqueta">Sociedad anónima</span><h1 className="erp-titulo">{s?.denominacion || 'Ficha de la sociedad'}</h1></div>
        <div className="c-cabeza-acciones">
          <button type="button" className="m-btn m-btn-primario" onClick={() => setEditar(true)} title="Editar los datos de la sociedad"><Pencil size={16} aria-hidden /> {s ? 'Editar' : 'Llenar la ficha'}</button>
        </div>
      </div>
      {!s && <div className="m-vacio m-tarjeta"><b>La ficha está vacía</b><span>Llénala cuando tengas la escritura. Mientras no haya fecha de inicio de operaciones, todo sigue a tu nombre.</span></div>}
      {s && bloques.map(([t, filas]) => (
        <section key={t} className="m-tarjeta c-ficha">
          <h2 className="m-seccion-titulo">{t}</h2>
          <dl className="c-datos">{filas.map(([k, val]) => <div key={k}><dt>{k}</dt><dd>{val}</dd></div>)}</dl>
        </section>
      ))}
      <section className="m-tarjeta c-ficha">
        <h2 className="m-seccion-titulo">Negocios de la sociedad</h2>
        <p className="m-texto-suave c-intro">{s?.inicio_operaciones ? `Desde el ${fechaLarga(s.inicio_operaciones)}, lo de estos negocios cuenta para la sociedad; antes, a tu nombre. Hogar Canela y el salario quedan fuera.` : 'Cuando pongas la fecha de inicio de operaciones, lo de estos negocios contará para la sociedad desde ese día. Hogar Canela y el salario quedan fuera.'}</p>
        <div className="c-chips">{negociosSA.map((n) => <span key={n.id} className="m-estado en-proceso">{n.nombre}</span>)}</div>
        {s && <p className="m-texto-suave">Capital autorizado: <b>{quetzales(s.capital_autorizado)}</b></p>}
      </section>
      <section className="c-seccion-dev">
        <div className="c-ficha-cabeza">
          <h2 className="m-seccion-titulo">Documentos</h2>
          <button type="button" className="m-btn m-btn-secundario m-btn-sm" onClick={() => setDoc('nuevo')} title="Agregar la escritura, patentes, nombramiento u otro documento"><Plus size={14} aria-hidden /> Documento</button>
        </div>
        <Tabla filas={m.saDocumentos} clave={(x) => x.id} vacio="Sin documentos. Agrega la escritura, las patentes y el nombramiento cuando los tengas."
          quitarVarias={(l) => q.pedir('ctl_sa_documentos', l, `Se quitan ${l.length} documentos de la lista.`)}
          columnas={[
            { titulo: 'Documento', principal: true, valor: (x) => <>{x.nombre}{x.nota && <small>{x.nota}</small>}</> },
            { titulo: 'Tipo', valor: (x) => x.tipo ?? <span className="m-vacia">—</span> },
            { titulo: 'Fecha', valor: (x) => (x.fecha ? fechaCorta(x.fecha) : <span className="m-vacia">—</span>), orden: (x) => x.fecha ?? '' },
          ]}
          acciones={(x) => (
            <>
              <Ojito ruta={x.archivo} titulo={x.nombre} />
              <button type="button" className="m-icono-btn" onClick={() => setDoc(x)} aria-label="Editar" title="Editar el documento"><Pencil aria-hidden /></button>
              <button type="button" className="m-icono-btn" onClick={() => q.pedir('ctl_sa_documentos', [x], `Se quita «${x.nombre}» de la lista.`)} aria-label="Quitar" title="Quitar el documento (se puede deshacer)"><Trash2 aria-hidden /></button>
            </>
          )} />
      </section>
      <FormRegistro abierta={editar} titulo="Ficha de la sociedad" campos={camposSociedad}
        inicial={s ? (s as unknown as Record<string, unknown>) : { cierre_mes: 12, capital_autorizado: '0' }}
        validar={(x) => (x.nombramiento_fecha && x.nombramiento_vence && x.nombramiento_vence < x.nombramiento_fecha ? 'El vencimiento no puede ser antes del nombramiento.' : null)}
        onGuardar={async (x) => { await guardar('ctl_sa', s?.id ?? null, { ...x, cierre_mes: x.cierre_mes ?? 12 }) }}
        onCerrar={() => setEditar(false)} />
      <FormRegistro abierta={doc != null} titulo={d ? 'Editar documento' : 'Nuevo documento'} carpeta="sociedad"
        campos={[
          { k: 'nombre', etiqueta: 'Nombre', tipo: 'texto', requerido: true, max: 200, ancho: true },
          { k: 'tipo', etiqueta: 'Tipo', tipo: 'select', opciones: ['Escritura', 'Patente', 'Nombramiento', 'RTU', 'Acta', 'Libro', 'Otro'].map((t) => ({ valor: t, nombre: t })) },
          { k: 'fecha', etiqueta: 'Fecha', tipo: 'fecha' },
          { k: 'archivo', etiqueta: 'Archivo (PDF o foto)', tipo: 'archivo', ancho: true },
          { k: 'nota', etiqueta: 'Nota', tipo: 'texto', max: 500, ancho: true },
        ]}
        inicial={d ? (d as unknown as Record<string, unknown>) : {}}
        onGuardar={async (x) => { await guardar('ctl_sa_documentos', d?.id ?? null, x) }}
        onCerrar={() => setDoc(null)} />
      {q.ventana}
    </>
  )
}
