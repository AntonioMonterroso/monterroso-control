import { Activity, Ban, Copy, Download, ExternalLink, FileCode2, Pencil, Plus, Receipt, Trash2, Wifi } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAvisar } from '../../componentes/Avisos'
import { coincide } from '../../componentes/Buscador'
import { useQuitar } from '../../lib/quitar'
import FormRegistro, { type Campo } from '../../componentes/FormRegistro'
import Tabla from '../../componentes/Tabla'
import Ventana from '../../componentes/Ventana'
import { descargar } from '../../lib/csv'
import { useDatos } from '../../lib/datos'
import { useEscribir } from '../../lib/escribir'
import { panelSupabase, revisarLlavePublica, soloUltimos4, sumarPeriodo, TIPOS_ENLACE, TIPOS_SERVICIO, TIPOS_TOKEN, urlSupabase, workflowSupabase, type AvisoDev, type DevEnlace, type DevServicio, type DevSupabase, type DevToken } from '../../lib/desarrollo'
import { quetzales } from '../../lib/dinero'
import { diasEntre, fechaCorta, hoyISO } from '../../lib/fechas'
import { useModelo } from '../../lib/modelo'
import { useAvisosDev, useHoy } from '../../lib/usos'
import type { Tabla as NombreTabla } from '../../lib/almacen'

export interface Filtro { proyectoId?: string; q?: string; soloAvisos?: boolean }

function useComun(f: Filtro) {
  const m = useModelo()
  const avisos = useAvisosDev()
  const conAviso = (id: string) => avisos.find((a) => a.registro_id === id)
  const nombreProyecto = (id: string | null) => (id ? m.proyectos.find((p) => p.id === id)?.nombre ?? '' : 'General')
  const opcProyectos = m.proyectos.map((p) => ({ valor: p.id, nombre: `${p.nombre} · ${m.clientes.find((c) => c.id === p.cliente_id)?.nombre ?? ''}` }))
  const pasa = <T extends { id: string; proyecto_id: string | null }>(x: T, ...campos: (string | null | undefined)[]) =>
    (!f.proyectoId || x.proyecto_id === f.proyectoId) && (!f.soloAvisos || !!conAviso(x.id)) && coincide(f.q ?? '', nombreProyecto(x.proyecto_id), ...campos)
  return { m, avisos, conAviso, nombreProyecto, opcProyectos, pasa }
}

export function EstadoAviso({ a }: { a?: AvisoDev }) {
  if (!a) return <span className="m-estado aprobado">Al día</span>
  return <span className={`m-estado ${a.nivel === 'peligro' ? 'error' : 'pendiente'}`}>{a.detalle.replace(/\.$/, '')}</span>
}

function ProyectoCol({ id, nombre }: { id: string | null; nombre: string }) {
  return id ? <Link to={`/proyectos/${id}`} className="c-enlace" onClick={(e) => e.stopPropagation()}>{nombre}</Link> : <span className="m-vacia">General</span>
}

function useBorrar(t: NombreTabla) {
  const { tablas } = useDatos()
  const q = useQuitar()
  const setQuitar = (x: { id: string; nombre: string }) => q.pedir(t, tablas[t].filter((f) => f.id === x.id), `Se quita «${x.nombre}».`)
  return { setQuitar, ventana: q.ventana }
}

export function SeccionSupabase({ f }: { f: Filtro }) {
  const { m, conAviso, nombreProyecto, opcProyectos, pasa } = useComun(f)
  const { guardar } = useDatos()
  const avisar = useAvisar()
  const [editar, setEditar] = useState<DevSupabase | 'nuevo' | null>(null)
  const [yml, setYml] = useState<DevSupabase | null>(null)
  const [ocupado, setOcupado] = useState('')
  const { setQuitar, ventana } = useBorrar('ctl_dev_supabase')
  const lista = m.devSupabase.filter((s) => pasa(s, s.nombre, s.ref))
  const s = editar && editar !== 'nuevo' ? editar : null

  const mantener = async (x: DevSupabase) => {
    if (!x.anon_key) { avisar('Falta la llave pública (anon) para hacer la consulta. Agrégala con el lápiz.', 'error'); return }
    setOcupado(x.id)
    try {
      const c = new AbortController()
      const t = setTimeout(() => c.abort(), 10000)
      const r = await fetch(`${urlSupabase(x.ref)}/rest/v1/`, { headers: { apikey: x.anon_key, Authorization: `Bearer ${x.anon_key}` }, signal: c.signal })
      clearTimeout(t)
      if (r.status >= 500) throw new Error(String(r.status))
      await guardar('ctl_dev_supabase', x.id, { ultimo_uso: new Date().toISOString() })
      avisar(`«${x.nombre}» respondió. Quedó anotado el uso de hoy.`)
    } catch {
      avisar(`«${x.nombre}» no respondió. Puede estar en pausa: revísalo en su panel.`, 'error')
    }
    setOcupado('')
  }

  const campos: Campo[] = [
    { k: 'nombre', etiqueta: 'Nombre', tipo: 'texto', requerido: true, max: 120 },
    { k: 'plan', etiqueta: 'Plan', tipo: 'select', requerido: true, opciones: [{ valor: 'gratis', nombre: 'Gratis (se pausa a los 7 días)' }, { valor: 'pro', nombre: 'Pro' }] },
    { k: 'ref', etiqueta: 'Referencia o URL del proyecto', tipo: 'texto', requerido: true, max: 200, ancho: true, ayuda: 'Por ejemplo abcdxyz o https://abcdxyz.supabase.co' },
    { k: 'proyecto_id', etiqueta: 'Proyecto', tipo: 'select', opciones: opcProyectos },
    { k: 'ultimo_uso', etiqueta: 'Último uso', tipo: 'fecha' },
    { k: 'anon_key', etiqueta: 'Llave pública (anon o publishable)', tipo: 'texto', max: 1000, ancho: true, secreto: true, limpiar: revisarLlavePublica, ayuda: 'Es pública por diseño. Nunca pongas la service_role ni un token sbp_: no se guardan.' },
  ]
  return (
    <section className="c-seccion-dev">
      <div className="c-ficha-cabeza">
        <h2 className="m-seccion-titulo">Supabase</h2>
        <button type="button" className="m-btn m-btn-secundario m-btn-sm" onClick={() => setEditar('nuevo')} title="Agregar un proyecto de Supabase"><Plus size={14} aria-hidden /> Supabase</button>
      </div>
      <Tabla
        buscador={f.q === undefined}
        filas={lista}
        clave={(x) => x.id}
        vacio="Sin proyectos de Supabase."
        columnas={[
          { titulo: 'Supabase', principal: true, valor: (x) => <>{x.nombre}<small>{x.ref}</small></> },
          { titulo: 'Proyecto', valor: (x) => <ProyectoCol id={x.proyecto_id} nombre={nombreProyecto(x.proyecto_id)} /> },
          { titulo: 'Plan', valor: (x) => (x.plan === 'pro' ? 'Pro' : 'Gratis') },
          { titulo: 'Último uso', valor: (x) => (x.ultimo_uso ? `${fechaCorta(x.ultimo_uso)} · hace ${Math.max(0, diasEntre(x.ultimo_uso.slice(0, 10), hoyISO()))} d` : <span className="m-vacia">Sin anotar</span>) },
          { titulo: 'Estado', valor: (x) => (x.plan === 'pro' ? <span className="m-estado en-proceso">No se pausa</span> : <EstadoAviso a={conAviso(x.id)} />) },
        ]}
        acciones={(x) => (
          <>
            <button type="button" className="m-btn m-btn-primario m-btn-sm" disabled={ocupado === x.id} onClick={() => void mantener(x)} title="Hacer una consulta liviana a su API y anotar la fecha"><Activity size={14} aria-hidden /> {ocupado === x.id ? 'Consultando…' : 'Mantener activo'}</button>
            <button type="button" className="m-icono-btn c-salida" onClick={() => setYml(x)} aria-label="Workflow" title="El archivo de GitHub Actions que lo mantiene activo solo"><FileCode2 aria-hidden /></button>
            <a className="m-icono-btn c-salida" href={panelSupabase(x.ref)} target="_blank" rel="noreferrer" aria-label="Panel" title="Abrir su panel en Supabase"><ExternalLink aria-hidden /></a>
            <button type="button" className="m-icono-btn" onClick={() => setEditar(x)} aria-label="Editar" title="Editar"><Pencil aria-hidden /></button>
            <button type="button" className="m-icono-btn" onClick={() => setQuitar({ id: x.id, nombre: x.nombre })} aria-label="Quitar" title="Quitar"><Trash2 aria-hidden /></button>
          </>
        )}
      />
      <FormRegistro abierta={editar != null} titulo={s ? 'Editar Supabase' : 'Nuevo Supabase'} campos={campos}
        inicial={s ? { ...(s as unknown as Record<string, unknown>), ultimo_uso: s.ultimo_uso?.slice(0, 10) } : { plan: 'gratis', proyecto_id: f.proyectoId, ultimo_uso: hoyISO() }}
        onGuardar={async (d) => { await guardar('ctl_dev_supabase', s?.id ?? null, { ...d, ultimo_uso: d.ultimo_uso ? `${d.ultimo_uso}T12:00:00` : null }) }}
        onCerrar={() => setEditar(null)} />
      <VentanaWorkflow s={yml} onCerrar={() => setYml(null)} />
      {ventana}
    </section>
  )
}

function VentanaWorkflow({ s, onCerrar }: { s: DevSupabase | null; onCerrar: () => void }) {
  const [copiado, setCopiado] = useState(false)
  const texto = s ? workflowSupabase(s.nombre) : ''
  return (
    <Ventana abierta={s != null} ancho="amplia" titulo="Mantenerlo activo con GitHub Actions" subtitulo={s ? `${s.nombre} · ${urlSupabase(s.ref)}` : ''} onCerrar={onCerrar} pie={
      <>
        <button type="button" className="m-btn m-btn-salida" onClick={async () => { try { await navigator.clipboard.writeText(texto); setCopiado(true); setTimeout(() => setCopiado(false), 1800) } catch { setCopiado(false) } }} title="Copiar el archivo"><Copy size={16} aria-hidden /> {copiado ? 'Copiado' : 'Copiar'}</button>
        <button type="button" className="m-btn m-btn-primario" onClick={() => descargar('mantener-supabase.yml', texto, 'text/yaml;charset=utf-8')} title="Bajar el archivo .yml"><Download size={16} aria-hidden /> Bajar el archivo</button>
      </>
    }>
      <ol className="c-pasos">
        <li>En el repositorio, crea el archivo <code>.github/workflows/mantener-supabase.yml</code> con este contenido.</li>
        <li>En GitHub › Settings › Secrets and variables › Actions agrega dos secretos: <code>SUPABASE_URL</code> = <code>{s ? urlSupabase(s.ref) : ''}</code> y <code>SUPABASE_ANON_KEY</code> = la llave pública (anon).</li>
        <li>En la pestaña Actions corre «Mantener Supabase activo» una vez a mano para probarlo. Después corre solo cada 3 días.</li>
        <li>GitHub apaga los programados si el repositorio pasa 60 días sin cambios: si eso pasa, vuelve a activarlo en Actions.</li>
      </ol>
      <pre className="c-codigo">{texto}</pre>
    </Ventana>
  )
}

export function SeccionTokens({ f }: { f: Filtro }) {
  const { m, conAviso, nombreProyecto, opcProyectos, pasa } = useComun(f)
  const { guardar } = useDatos()
  const avisar = useAvisar()
  const hoy = useHoy()
  const [editar, setEditar] = useState<DevToken | 'nuevo' | null>(null)
  const { setQuitar, ventana } = useBorrar('ctl_dev_tokens')
  const lista = m.devTokens.filter((t) => pasa(t, t.nombre, t.donde, t.ultimos4, t.tipo))
  const t = editar && editar !== 'nuevo' ? editar : null
  const nombreTipo = (k: string) => TIPOS_TOKEN.find((x) => x.valor === k)?.nombre ?? k
  const campos: Campo[] = [
    { k: 'nombre', etiqueta: 'Nombre', tipo: 'texto', requerido: true, max: 120 },
    { k: 'tipo', etiqueta: 'Tipo', tipo: 'select', requerido: true, opciones: TIPOS_TOKEN },
    { k: 'ultimos4', etiqueta: 'Últimos 4 caracteres', tipo: 'texto', max: 200, secreto: true, limpiar: soloUltimos4, ayuda: 'El valor del token nunca se guarda.' },
    { k: 'proyecto_id', etiqueta: 'Proyecto', tipo: 'select', opciones: opcProyectos, ayuda: 'Vacío = general.' },
    { k: 'donde', etiqueta: 'Dónde se usa', tipo: 'texto', max: 300, ancho: true },
    { k: 'creado_el', etiqueta: 'Creado el', tipo: 'fecha' },
    { k: 'vence', etiqueta: 'Vence', tipo: 'fecha' },
    { k: 'revocar_el', etiqueta: 'Revocar el', tipo: 'fecha' },
  ]
  const revocar = async (x: DevToken) => {
    await guardar('ctl_dev_tokens', x.id, { revocado: !x.revocado, revocado_el: x.revocado ? null : hoy })
    avisar(x.revocado ? 'Vuelve a contar como activo.' : 'Marcado como revocado.')
  }
  return (
    <section className="c-seccion-dev">
      <div className="c-ficha-cabeza">
        <h2 className="m-seccion-titulo">Tokens y llaves</h2>
        <button type="button" className="m-btn m-btn-secundario m-btn-sm" onClick={() => setEditar('nuevo')} title="Anotar un token (sin su valor)"><Plus size={14} aria-hidden /> Token</button>
      </div>
      <Tabla
        buscador={f.q === undefined}
        filas={lista}
        clave={(x) => x.id}
        vacio="Sin tokens anotados."
        columnas={[
          { titulo: 'Token', principal: true, valor: (x) => <>{x.nombre}{x.ultimos4 && <small>···{x.ultimos4}</small>}</> },
          { titulo: 'Tipo', valor: (x) => nombreTipo(x.tipo) },
          { titulo: 'Proyecto', valor: (x) => <ProyectoCol id={x.proyecto_id} nombre={nombreProyecto(x.proyecto_id)} /> },
          { titulo: 'Dónde', valor: (x) => x.donde ?? <span className="m-vacia">Sin anotar</span> },
          { titulo: 'Vence / revocar', valor: (x) => [x.vence && `Vence ${fechaCorta(x.vence)}`, x.revocar_el && `Revocar ${fechaCorta(x.revocar_el)}`].filter(Boolean).join(' · ') || <span className="m-vacia">Sin fecha</span> },
          { titulo: 'Estado', valor: (x) => (x.revocado ? <span className="m-estado bloqueado">Revocado{x.revocado_el ? ` ${fechaCorta(x.revocado_el)}` : ''}</span> : <EstadoAviso a={conAviso(x.id)} />) },
        ]}
        acciones={(x) => (
          <>
            <button type="button" className="m-btn m-btn-secundario m-btn-sm" onClick={() => void revocar(x)} title={x.revocado ? 'Quitar la marca de revocado' : 'Marcar que ya lo revocaste'}><Ban size={14} aria-hidden /> {x.revocado ? 'Deshacer' : 'Revocado'}</button>
            <button type="button" className="m-icono-btn" onClick={() => setEditar(x)} aria-label="Editar" title="Editar"><Pencil aria-hidden /></button>
            <button type="button" className="m-icono-btn" onClick={() => setQuitar({ id: x.id, nombre: x.nombre })} aria-label="Quitar" title="Quitar"><Trash2 aria-hidden /></button>
          </>
        )}
      />
      <FormRegistro abierta={editar != null} titulo={t ? 'Editar token' : 'Nuevo token'} subtitulo="Solo se anotan los datos: el valor del token nunca se guarda." campos={campos}
        inicial={t ? (t as unknown as Record<string, unknown>) : { tipo: 'github', proyecto_id: f.proyectoId, creado_el: hoy }}
        validar={(v) => ((v.ultimos4 ?? '').length > 4 ? 'Solo van los últimos 4 caracteres.' : null)}
        onGuardar={async (d) => { await guardar('ctl_dev_tokens', t?.id ?? null, t ? d : { ...d, revocado: false }) }}
        onCerrar={() => setEditar(null)} />
      {ventana}
    </section>
  )
}

export function SeccionServicios({ f }: { f: Filtro }) {
  const { m, conAviso, nombreProyecto, opcProyectos, pasa } = useComun(f)
  const { guardar, insertar } = useDatos()
  const avisar = useAvisar()
  const [editar, setEditar] = useState<DevServicio | 'nuevo' | null>(null)
  const { setQuitar, ventana } = useBorrar('ctl_dev_servicios')
  const lista = m.devServicios.filter((s) => pasa(s, s.nombre, s.proveedor, s.tipo))
  const s = editar && editar !== 'nuevo' ? editar : null
  const nombreTipo = (k: string) => TIPOS_SERVICIO.find((x) => x.valor === k)?.nombre ?? k
  const dev = m.negocios.find((n) => n.clave === 'dev')
  const catDef = m.categorias.find((c) => c.tipo === 'gasto' && c.nombre === 'Dominio y hosting') ?? m.categorias.find((c) => c.tipo === 'gasto')
  const clienteDe = (pid: string | null) => m.proyectos.find((p) => p.id === pid)?.cliente_id ?? null
  const yaRegistrado = (x: DevServicio) => !!x.renovacion && (m.gastos.some((g) => g.dev_servicio_id === x.id && g.periodo === x.renovacion!.slice(0, 7)) || m.cobros.some((c) => c.clave === `d:${x.id}:${x.renovacion!.slice(0, 7)}`))

  const registrar = async (x: DevServicio) => {
    if (!x.renovacion) { avisar('Pon la fecha de renovación primero.', 'error'); return }
    const per = x.renovacion.slice(0, 7)
    const cli = clienteDe(x.proyecto_id)
    try {
      if (x.paga === 'yo') {
        if (!dev || !(x.categoria_id ?? catDef?.id)) throw new Error('Falta el negocio o la categoría.')
        await insertar('ctl_gastos', [{ fecha: x.renovacion, negocio_id: dev.id, categoria_id: x.categoria_id ?? catDef!.id, cliente_id: cli, proyecto_id: x.proyecto_id, descripcion: `${nombreTipo(x.tipo)} ${x.nombre}${x.proveedor ? ` (${x.proveedor})` : ''}`.slice(0, 300), monto: x.costo, dev_servicio_id: x.id, periodo: per }])
      } else {
        if (!cli) throw new Error('Para cobrarlo al cliente, liga el servicio a un proyecto.')
        await insertar('ctl_cobros', [{ clave: `d:${x.id}:${per}`, cliente_id: cli, proyecto_id: x.proyecto_id, tipo: 'extra', concepto: `${nombreTipo(x.tipo)} ${x.nombre}`.slice(0, 200), vence: x.renovacion, monto: x.costo, saldado: false }])
      }
      if (x.periodo !== 'unico') await guardar('ctl_dev_servicios', x.id, { renovacion: sumarPeriodo(x.renovacion, x.periodo) })
      avisar(x.paga === 'yo' ? `Gasto registrado. Siguiente renovación: ${fechaCorta(sumarPeriodo(x.renovacion, x.periodo))}.` : 'Quedó como cobro extra del cliente.')
    } catch (e) { avisar(e instanceof Error && /repetido/.test(e.message) ? 'Ese período ya estaba registrado: no se duplica.' : e instanceof Error ? e.message : 'No se pudo.', 'error') }
  }

  const campos: Campo[] = [
    { k: 'nombre', etiqueta: 'Nombre', tipo: 'texto', requerido: true, max: 200, ayuda: 'Por ejemplo misitio.com o Hosting de la página.' },
    { k: 'tipo', etiqueta: 'Tipo', tipo: 'select', requerido: true, opciones: TIPOS_SERVICIO },
    { k: 'proveedor', etiqueta: 'Proveedor', tipo: 'texto', max: 120 },
    { k: 'proyecto_id', etiqueta: 'Proyecto', tipo: 'select', opciones: opcProyectos },
    { k: 'renovacion', etiqueta: 'Próxima renovación', tipo: 'fecha' },
    { k: 'periodo', etiqueta: 'Se renueva', tipo: 'select', requerido: true, opciones: [{ valor: 'mensual', nombre: 'Cada mes' }, { valor: 'anual', nombre: 'Cada año' }, { valor: 'unico', nombre: 'Una sola vez' }] },
    { k: 'costo', etiqueta: 'Costo', tipo: 'monto', requerido: true },
    { k: 'paga', etiqueta: 'Lo paga', tipo: 'select', requerido: true, opciones: [{ valor: 'yo', nombre: 'Yo (es gasto)' }, { valor: 'cliente', nombre: 'El cliente (se le cobra)' }] },
    { k: 'categoria_id', etiqueta: 'Categoría del gasto', tipo: 'select', opciones: m.categorias.filter((c) => c.tipo === 'gasto' && c.activo).map((c) => ({ valor: c.id, nombre: c.nombre })), visible: (v) => v.paga === 'yo' },
    { k: 'nota', etiqueta: 'Nota', tipo: 'area', max: 1000 },
    { k: 'activo', etiqueta: 'Activo', tipo: 'casilla' },
  ]
  return (
    <section className="c-seccion-dev">
      <div className="c-ficha-cabeza">
        <h2 className="m-seccion-titulo">Dominios y servicios</h2>
        <button type="button" className="m-btn m-btn-secundario m-btn-sm" onClick={() => setEditar('nuevo')} title="Agregar un dominio, hosting o suscripción"><Plus size={14} aria-hidden /> Servicio</button>
      </div>
      <Tabla
        buscador={f.q === undefined}
        filas={lista}
        clave={(x) => x.id}
        vacio="Sin dominios ni servicios."
        columnas={[
          { titulo: 'Servicio', principal: true, valor: (x) => <>{x.nombre}<small>{nombreTipo(x.tipo)}{x.proveedor ? ` · ${x.proveedor}` : ''}</small>{!x.activo && <span className="m-estado bloqueado">Apagado</span>}</> },
          { titulo: 'Proyecto', valor: (x) => <ProyectoCol id={x.proyecto_id} nombre={nombreProyecto(x.proyecto_id)} /> },
          { titulo: 'Renovación', valor: (x) => (x.renovacion ? fechaCorta(x.renovacion) : <span className="m-vacia">Sin fecha</span>) },
          { titulo: 'Lo paga', valor: (x) => (x.paga === 'yo' ? 'Yo' : 'El cliente') },
          { titulo: 'Costo', num: true, valor: (x) => quetzales(x.costo) },
          { titulo: 'Estado', valor: (x) => (yaRegistrado(x) ? <span className="m-estado aprobado">Registrado</span> : <EstadoAviso a={conAviso(x.id)} />) },
        ]}
        acciones={(x) => (
          <>
            <button type="button" className="m-btn m-btn-primario m-btn-sm" disabled={!x.renovacion || yaRegistrado(x)} onClick={() => void registrar(x)} title={x.paga === 'yo' ? 'Registrarlo como gasto del cliente y pasar a la siguiente renovación' : 'Agregarlo como cobro extra al cliente'}><Receipt size={14} aria-hidden /> {x.paga === 'yo' ? 'Gasto' : 'Cobrar'}</button>
            <button type="button" className="m-icono-btn" onClick={() => setEditar(x)} aria-label="Editar" title="Editar"><Pencil aria-hidden /></button>
            <button type="button" className="m-icono-btn" onClick={() => setQuitar({ id: x.id, nombre: x.nombre })} aria-label="Quitar" title="Quitar"><Trash2 aria-hidden /></button>
          </>
        )}
      />
      <FormRegistro abierta={editar != null} titulo={s ? 'Editar servicio' : 'Nuevo servicio'} campos={campos}
        inicial={s ? (s as unknown as Record<string, unknown>) : { tipo: 'dominio', periodo: 'anual', paga: 'yo', proyecto_id: f.proyectoId, activo: true, categoria_id: catDef?.id }}
        onGuardar={async (d) => { await guardar('ctl_dev_servicios', s?.id ?? null, { ...d, categoria_id: d.paga === 'yo' ? d.categoria_id : null }) }}
        onCerrar={() => setEditar(null)} />
      {ventana}
    </section>
  )
}

export function SeccionEnlaces({ f }: { f: Filtro }) {
  const { m, nombreProyecto, opcProyectos, pasa } = useComun(f)
  const { guardar } = useDatos()
  const avisar = useAvisar()
  const [editar, setEditar] = useState<DevEnlace | 'nuevo' | null>(null)
  const [revisando, setRevisando] = useState('')
  const { setQuitar, ventana } = useBorrar('ctl_dev_enlaces')
  const lista = m.devEnlaces.filter((e) => pasa(e, e.nombre, e.url, e.tipo))
  const e = editar && editar !== 'nuevo' ? editar : null
  const nombreTipo = (k: string) => TIPOS_ENLACE.find((x) => x.valor === k)?.nombre ?? k

  const revisar = async (x: DevEnlace) => {
    setRevisando(x.id)
    let ok = false
    try {
      const c = new AbortController()
      const t = setTimeout(() => c.abort(), 8000)
      await fetch(x.url, { mode: 'no-cors', cache: 'no-store', signal: c.signal })
      clearTimeout(t)
      ok = true
    } catch { ok = false }
    await guardar('ctl_dev_enlaces', x.id, { responde: ok, revisado_en: new Date().toISOString() })
    avisar(ok ? `${x.nombre} responde.` : `${x.nombre} no responde.`, ok ? 'bien' : 'error')
    setRevisando('')
  }
  return (
    <section className="c-seccion-dev">
      <div className="c-ficha-cabeza">
        <h2 className="m-seccion-titulo">Repo, enlaces y estado</h2>
        <button type="button" className="m-btn m-btn-secundario m-btn-sm" onClick={() => setEditar('nuevo')} title="Agregar un enlace"><Plus size={14} aria-hidden /> Enlace</button>
      </div>
      <Tabla
        buscador={f.q === undefined}
        filas={lista}
        clave={(x) => x.id}
        vacio="Sin enlaces."
        columnas={[
          { titulo: 'Enlace', principal: true, valor: (x) => <><a className="c-enlace" href={x.url} target="_blank" rel="noreferrer" onClick={(ev) => ev.stopPropagation()}>{x.nombre}</a><small className="c-url">{x.url.replace(/^https?:\/\//, '')}</small></> },
          { titulo: 'Tipo', valor: (x) => nombreTipo(x.tipo) },
          { titulo: 'Proyecto', valor: (x) => <ProyectoCol id={x.proyecto_id} nombre={nombreProyecto(x.proyecto_id)} /> },
          { titulo: 'Estado', valor: (x) => (x.responde == null ? <span className="m-vacia">Sin revisar</span> : <span className={`m-estado ${x.responde ? 'aprobado' : 'error'}`}>{x.responde ? 'Responde' : 'No responde'}{x.revisado_en ? ` · ${fechaCorta(x.revisado_en)}` : ''}</span>) },
        ]}
        acciones={(x) => (
          <>
            <button type="button" className="m-btn m-btn-secundario m-btn-sm" disabled={revisando === x.id} onClick={() => void revisar(x)} title="Ver si la dirección responde (8 segundos como máximo)"><Wifi size={14} aria-hidden /> {revisando === x.id ? 'Revisando…' : 'Revisar'}</button>
            <a className="m-icono-btn c-salida" href={x.url} target="_blank" rel="noreferrer" aria-label="Abrir" title="Abrir en otra pestaña"><ExternalLink aria-hidden /></a>
            <button type="button" className="m-icono-btn" onClick={() => setEditar(x)} aria-label="Editar" title="Editar"><Pencil aria-hidden /></button>
            <button type="button" className="m-icono-btn" onClick={() => setQuitar({ id: x.id, nombre: x.nombre })} aria-label="Quitar" title="Quitar"><Trash2 aria-hidden /></button>
          </>
        )}
      />
      <FormRegistro abierta={editar != null} titulo={e ? 'Editar enlace' : 'Nuevo enlace'}
        campos={[
          { k: 'nombre', etiqueta: 'Nombre', tipo: 'texto', requerido: true, max: 120 },
          { k: 'tipo', etiqueta: 'Tipo', tipo: 'select', requerido: true, opciones: TIPOS_ENLACE },
          { k: 'url', etiqueta: 'Dirección', tipo: 'texto', requerido: true, max: 500, ancho: true },
          { k: 'proyecto_id', etiqueta: 'Proyecto', tipo: 'select', opciones: opcProyectos },
        ]}
        inicial={e ? (e as unknown as Record<string, unknown>) : { tipo: 'repo', proyecto_id: f.proyectoId }}
        validar={(v) => (v.url && !/^https?:\/\/\S+\.\S+/.test(v.url.trim()) ? 'La dirección debe empezar con https://' : null)}
        onGuardar={async (d) => { await guardar('ctl_dev_enlaces', e?.id ?? null, { ...d, url: String(d.url).trim(), ...(e && e.url !== String(d.url).trim() ? { responde: null, revisado_en: null } : {}) }) }}
        onCerrar={() => setEditar(null)} />
      {ventana}
    </section>
  )
}

export function SeccionBitacora({ proyectoId }: { proyectoId: string }) {
  const m = useModelo()
  const esc = useEscribir()
  const { guardar } = useDatos()
  const hoy = useHoy()
  const [editar, setEditar] = useState<{ id?: string } | null>(null)
  const [notas, setNotas] = useState(false)
  const { setQuitar, ventana } = useBorrar('ctl_dev_bitacora')
  const p = m.proyectos.find((x) => x.id === proyectoId)
  const lista = m.devBitacora.filter((b) => b.proyecto_id === proyectoId)
  const b = editar?.id ? lista.find((x) => x.id === editar.id) : undefined
  return (
    <>
      <section className="m-tarjeta c-ficha">
        <div className="c-ficha-cabeza">
          <h2 className="m-seccion-titulo">Notas técnicas</h2>
          <button type="button" className="m-icono-btn" onClick={() => setNotas(true)} aria-label="Editar notas técnicas" title="Editar las notas técnicas"><Pencil aria-hidden /></button>
        </div>
        {p?.notas_tecnicas ? <p className="c-notas c-notas-tec">{p.notas_tecnicas}</p> : <p className="m-texto-suave">Sin notas: stack, variables, cómo se publica, dónde está cada cosa…</p>}
      </section>
      <section className="c-seccion-dev">
        <div className="c-ficha-cabeza">
          <h2 className="m-seccion-titulo">Bitácora de cambios</h2>
          <button type="button" className="m-btn m-btn-secundario m-btn-sm" onClick={() => setEditar({})} title="Anotar un cambio"><Plus size={14} aria-hidden /> Cambio</button>
        </div>
        <Tabla filas={lista} clave={(x) => x.id} vacio="Sin cambios anotados."
          columnas={[
            { titulo: 'Fecha', valor: (x) => fechaCorta(x.fecha) },
            { titulo: 'Qué cambió', principal: true, valor: (x) => <span className="c-texto-largo">{x.cambio}</span> },
            { titulo: 'Versión', valor: (x) => x.version ?? <span className="m-vacia">—</span> },
          ]}
          acciones={(x) => (
            <>
              <button type="button" className="m-icono-btn" onClick={() => setEditar({ id: x.id })} aria-label="Editar" title="Editar"><Pencil aria-hidden /></button>
              <button type="button" className="m-icono-btn" onClick={() => setQuitar({ id: x.id, nombre: x.cambio.slice(0, 40) })} aria-label="Quitar" title="Quitar"><Trash2 aria-hidden /></button>
            </>
          )} />
      </section>
      <FormRegistro abierta={editar != null} titulo={b ? 'Editar cambio' : 'Anotar cambio'}
        campos={[
          { k: 'fecha', etiqueta: 'Fecha', tipo: 'fecha', requerido: true },
          { k: 'version', etiqueta: 'Versión', tipo: 'texto', max: 40 },
          { k: 'cambio', etiqueta: 'Qué cambió', tipo: 'area', requerido: true, max: 2000 },
        ]}
        inicial={b ? (b as unknown as Record<string, unknown>) : { fecha: hoy }}
        onGuardar={async (d) => { await guardar('ctl_dev_bitacora', b?.id ?? null, b ? d : { ...d, proyecto_id: proyectoId }) }}
        onCerrar={() => setEditar(null)} />
      <FormRegistro abierta={notas} titulo="Notas técnicas" subtitulo={p?.nombre}
        campos={[{ k: 'notas_tecnicas', etiqueta: 'Notas', tipo: 'area', max: 10000, ayuda: 'No pongas contraseñas ni tokens aquí.' }]}
        inicial={{ notas_tecnicas: p?.notas_tecnicas ?? '' }}
        onGuardar={async (d) => { await esc.guardarNotasTecnicas(proyectoId, (d.notas_tecnicas as string | null) ?? null) }}
        onCerrar={() => setNotas(false)} />
      {ventana}
    </>
  )
}
