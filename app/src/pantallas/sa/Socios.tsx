import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import FormRegistro, { type Campo } from '../../componentes/FormRegistro'
import Pestanas from '../../componentes/Pestanas'
import Tabla from '../../componentes/Tabla'
import { useDatos } from '../../lib/datos'
import { aCentavos, deCentavos, quetzales } from '../../lib/dinero'
import { fechaCorta } from '../../lib/fechas'
import { useQuitar } from '../../lib/quitar'
import { accionesPorSocio, capital, type Accion, type Aporte, type Socio, type Transmision } from '../../lib/sa'
import { useSA } from '../../lib/saModelo'
import { useHoy } from '../../lib/usos'

type Vista = 'socios' | 'acciones' | 'aportes' | 'transmisiones'

export default function SociosSA() {
  const { m, s } = useSA()
  const { guardar } = useDatos()
  const hoy = useHoy()
  const q = useQuitar()
  const [vista, setVista] = useState<Vista>('socios')
  const [socio, setSocio] = useState<Socio | 'nuevo' | null>(null)
  const [accion, setAccion] = useState<Accion | 'nuevo' | null>(null)
  const [aporte, setAporte] = useState<Aporte | 'nuevo' | null>(null)
  const [trans, setTrans] = useState<Transmision | 'nuevo' | null>(null)
  const porSocio = accionesPorSocio(m.acciones, m.transmisiones, hoy)
  const totalAcc = [...porSocio.values()].reduce((a, b) => a + b, 0)
  const cap = capital(m.acciones, m.aportes)
  const nombre = (id: string) => m.socios.find((x) => x.id === id)?.nombre ?? ''
  const opcSocios = m.socios.filter((x) => x.activo).map((x) => ({ valor: x.id, nombre: x.nombre }))
  const aportadoDe = (id: string) => deCentavos(m.aportes.filter((a) => a.socio_id === id).reduce((t, a) => t + aCentavos(a.pagado), 0))
  const usado = (id: string) => m.acciones.some((a) => a.socio_id === id) || m.aportes.some((a) => a.socio_id === id) || m.transmisiones.some((t) => t.de_socio_id === id || t.a_socio_id === id) || m.repartoSocios.some((r) => r.socio_id === id)
  const so = socio && socio !== 'nuevo' ? socio : null
  const ac = accion && accion !== 'nuevo' ? accion : null
  const ap = aporte && aporte !== 'nuevo' ? aporte : null
  const tr = trans && trans !== 'nuevo' ? trans : null
  const camposAccion: Campo[] = [
    { k: 'socio_id', etiqueta: 'Accionista', tipo: 'select', requerido: true, opciones: opcSocios },
    { k: 'fecha', etiqueta: 'Fecha de emisión', tipo: 'fecha', requerido: true },
    { k: 'serie', etiqueta: 'Serie', tipo: 'texto', max: 20 },
    { k: 'titulo', etiqueta: 'Título', tipo: 'texto', max: 60 },
    { k: 'numero_desde', etiqueta: 'Del número', tipo: 'numero', min: 1 },
    { k: 'numero_hasta', etiqueta: 'Al número', tipo: 'numero', min: 1 },
    { k: 'cantidad', etiqueta: 'Cantidad de acciones', tipo: 'numero', requerido: true, min: 1 },
    { k: 'valor_nominal', etiqueta: 'Valor nominal de cada una', tipo: 'monto', requerido: true },
    { k: 'estado', etiqueta: 'Estado', tipo: 'select', requerido: true, opciones: [{ valor: 'vigente', nombre: 'Vigente' }, { valor: 'transmitida', nombre: 'Transmitida' }, { valor: 'anulada', nombre: 'Anulada' }] },
    { k: 'nota', etiqueta: 'Nota', tipo: 'texto', max: 500, ancho: true },
  ]
  return (
    <>
      <div className="c-cabeza">
        <div><span className="m-etiqueta">Sociedad anónima</span><h1 className="erp-titulo">Socios y capital</h1></div>
        <div className="c-cabeza-acciones">
          {vista === 'socios' && <button type="button" className="m-btn m-btn-primario" onClick={() => setSocio('nuevo')} title="Agregar un socio"><Plus size={16} aria-hidden /> Socio</button>}
          {vista === 'acciones' && <button type="button" className="m-btn m-btn-primario" disabled={!opcSocios.length} onClick={() => setAccion('nuevo')} title={opcSocios.length ? 'Registrar acciones emitidas a un socio' : 'Primero agrega un socio'}><Plus size={16} aria-hidden /> Acciones</button>}
          {vista === 'aportes' && <button type="button" className="m-btn m-btn-primario" disabled={!opcSocios.length} onClick={() => setAporte('nuevo')} title={opcSocios.length ? 'Registrar una aportación' : 'Primero agrega un socio'}><Plus size={16} aria-hidden /> Aportación</button>}
          {vista === 'transmisiones' && <button type="button" className="m-btn m-btn-primario" disabled={opcSocios.length < 2} onClick={() => setTrans('nuevo')} title={opcSocios.length > 1 ? 'Registrar una transmisión de acciones' : 'Hacen falta dos socios'}><Plus size={16} aria-hidden /> Transmisión</button>}
        </div>
      </div>
      <div className="erp-kpis">
        <div className="erp-kpi"><span className="m-etiqueta">Capital autorizado</span><b>{quetzales(s?.capital_autorizado ?? 0)}</b><small>según la escritura</small></div>
        <div className="erp-kpi"><span className="m-etiqueta">Capital suscrito</span><b>{quetzales(cap.suscrito)}</b><small>{totalAcc} acciones vigentes</small></div>
        <div className="erp-kpi"><span className="m-etiqueta">Capital pagado</span><b>{quetzales(cap.pagado)}</b><small>aportaciones recibidas</small></div>
        <div className="erp-kpi"><span className="m-etiqueta">Por pagar</span><b>{quetzales(cap.porPagar)}</b><small>suscrito menos pagado</small></div>
      </div>
      {s && cap.suscrito > s.capital_autorizado && s.capital_autorizado > 0 && <p className="c-nota">El capital suscrito pasa el autorizado en la escritura.</p>}
      <Pestanas etiqueta="Ver" valor={vista} onCambio={setVista} opciones={[{ valor: 'socios', nombre: 'Socios', cuenta: m.socios.length }, { valor: 'acciones', nombre: 'Registro de accionistas', cuenta: m.acciones.length }, { valor: 'aportes', nombre: 'Aportaciones', cuenta: m.aportes.length }, { valor: 'transmisiones', nombre: 'Transmisiones', cuenta: m.transmisiones.length }]} />
      {vista === 'socios' && (
        <Tabla filas={m.socios} clave={(x) => x.id} vacio="Todavía no hay socios."
          columnas={[
            { titulo: 'Socio', principal: true, valor: (x) => <>{x.nombre}{(x.nit || x.dpi) && <small>{[x.nit && `NIT ${x.nit}`, x.dpi && `DPI ${x.dpi}`].filter(Boolean).join(' · ')}</small>}{!x.activo && <span className="m-estado bloqueado">Inactivo</span>}</> },
            { titulo: 'Acciones', num: true, valor: (x) => porSocio.get(x.id) ?? 0, orden: (x) => porSocio.get(x.id) ?? 0 },
            { titulo: 'Participación', num: true, valor: (x) => `${totalAcc ? (((porSocio.get(x.id) ?? 0) / totalAcc) * 100).toFixed(2) : '0.00'} %`, orden: (x) => porSocio.get(x.id) ?? 0 },
            { titulo: 'Aportado', num: true, valor: (x) => quetzales(aportadoDe(x.id)), orden: (x) => aportadoDe(x.id) },
          ]}
          acciones={(x) => (
            <>
              <button type="button" className="m-icono-btn" onClick={() => setSocio(x)} aria-label="Editar" title="Editar el socio"><Pencil aria-hidden /></button>
              {!usado(x.id) && <button type="button" className="m-icono-btn" onClick={() => q.pedir('ctl_sa_socios', [x], `Se quita a ${x.nombre}.`)} aria-label="Quitar" title="Quitar el socio (no tiene acciones ni aportaciones; se puede deshacer)"><Trash2 aria-hidden /></button>}
            </>
          )} />
      )}
      {vista === 'acciones' && (
        <Tabla filas={m.acciones} clave={(x) => x.id} vacio="Sin acciones registradas." quitarVarias={(l) => q.pedir('ctl_sa_acciones', l, `Se quitan ${l.length} registros de acciones.`)}
          columnas={[
            { titulo: 'Fecha', valor: (x) => fechaCorta(x.fecha), orden: (x) => x.fecha },
            { titulo: 'Accionista', principal: true, valor: (x) => <>{nombre(x.socio_id)}{x.titulo && <small>Título {x.titulo}</small>}</> },
            { titulo: 'Serie y números', valor: (x) => [x.serie && `Serie ${x.serie}`, x.numero_desde && `${x.numero_desde}–${x.numero_hasta ?? x.numero_desde}`].filter(Boolean).join(' · ') || <span className="m-vacia">—</span> },
            { titulo: 'Cantidad', num: true, valor: (x) => x.cantidad, orden: (x) => x.cantidad },
            { titulo: 'Valor nominal', num: true, valor: (x) => quetzales(x.valor_nominal), orden: (x) => x.valor_nominal },
            { titulo: 'Total', num: true, valor: (x) => quetzales(deCentavos(Math.round(x.cantidad * aCentavos(x.valor_nominal)))), orden: (x) => x.cantidad * x.valor_nominal },
            { titulo: 'Estado', valor: (x) => <span className={`m-estado ${x.estado === 'vigente' ? 'aprobado' : 'bloqueado'}`}>{x.estado === 'vigente' ? 'Vigente' : x.estado === 'transmitida' ? 'Transmitida' : 'Anulada'}</span> },
          ]}
          acciones={(x) => (
            <>
              <button type="button" className="m-icono-btn" onClick={() => setAccion(x)} aria-label="Editar" title="Editar el registro"><Pencil aria-hidden /></button>
              <button type="button" className="m-icono-btn" onClick={() => q.pedir('ctl_sa_acciones', [x], `Se quita el registro de ${x.cantidad} acciones de ${nombre(x.socio_id)}.`)} aria-label="Quitar" title="Quitar el registro (se puede deshacer)"><Trash2 aria-hidden /></button>
            </>
          )} />
      )}
      {vista === 'aportes' && (
        <Tabla filas={m.aportes} clave={(x) => x.id} vacio="Sin aportaciones." quitarVarias={(l) => q.pedir('ctl_sa_aportes', l, `Se quitan ${l.length} aportaciones.`)}
          columnas={[
            { titulo: 'Fecha', valor: (x) => fechaCorta(x.fecha), orden: (x) => x.fecha },
            { titulo: 'Socio', principal: true, valor: (x) => <>{nombre(x.socio_id)}{x.descripcion && <small>{x.descripcion}</small>}</> },
            { titulo: 'Forma', valor: (x) => (x.forma === 'efectivo' ? 'En efectivo' : 'En especie') },
            { titulo: 'Monto', num: true, valor: (x) => quetzales(x.monto), orden: (x) => x.monto },
            { titulo: 'Pagado', num: true, valor: (x) => quetzales(x.pagado), orden: (x) => x.pagado },
            { titulo: 'Estado', valor: (x) => (x.pagado >= x.monto ? <span className="m-estado aprobado">Pagada</span> : <span className="m-estado pendiente">Falta {quetzales(deCentavos(aCentavos(x.monto) - aCentavos(x.pagado)))}</span>) },
          ]}
          acciones={(x) => (
            <>
              <button type="button" className="m-icono-btn" onClick={() => setAporte(x)} aria-label="Editar" title="Editar la aportación"><Pencil aria-hidden /></button>
              <button type="button" className="m-icono-btn" onClick={() => q.pedir('ctl_sa_aportes', [x], `Se quita la aportación de ${quetzales(x.monto)} de ${nombre(x.socio_id)}.`)} aria-label="Quitar" title="Quitar la aportación (se puede deshacer)"><Trash2 aria-hidden /></button>
            </>
          )} />
      )}
      {vista === 'transmisiones' && (
        <Tabla filas={m.transmisiones} clave={(x) => x.id} vacio="Sin transmisiones de acciones."
          columnas={[
            { titulo: 'Fecha', valor: (x) => fechaCorta(x.fecha), orden: (x) => x.fecha },
            { titulo: 'De', principal: true, valor: (x) => nombre(x.de_socio_id) },
            { titulo: 'A', valor: (x) => nombre(x.a_socio_id) },
            { titulo: 'Acciones', num: true, valor: (x) => x.cantidad, orden: (x) => x.cantidad },
            { titulo: 'Precio', num: true, valor: (x) => (x.precio != null ? quetzales(x.precio) : <span className="m-vacia">—</span>), orden: (x) => x.precio ?? 0 },
          ]}
          acciones={(x) => (
            <>
              <button type="button" className="m-icono-btn" onClick={() => setTrans(x)} aria-label="Editar" title="Editar la transmisión"><Pencil aria-hidden /></button>
              <button type="button" className="m-icono-btn" onClick={() => q.pedir('ctl_sa_transmisiones', [x], 'Se quita la transmisión.')} aria-label="Quitar" title="Quitar la transmisión (se puede deshacer)"><Trash2 aria-hidden /></button>
            </>
          )} />
      )}
      <FormRegistro abierta={socio != null} titulo={so ? 'Editar socio' : 'Nuevo socio'}
        campos={[
          { k: 'nombre', etiqueta: 'Nombre completo', tipo: 'texto', requerido: true, max: 200, ancho: true },
          { k: 'nit', etiqueta: 'NIT', tipo: 'texto', max: 30 },
          { k: 'dpi', etiqueta: 'DPI', tipo: 'texto', max: 30 },
          { k: 'correo', etiqueta: 'Correo', tipo: 'texto', max: 120 },
          { k: 'telefono', etiqueta: 'Teléfono', tipo: 'texto', max: 30 },
          { k: 'activo', etiqueta: 'Activo', tipo: 'casilla' },
        ]}
        inicial={so ? (so as unknown as Record<string, unknown>) : { activo: true }}
        onGuardar={async (x) => { await guardar('ctl_sa_socios', so?.id ?? null, x) }}
        onCerrar={() => setSocio(null)} />
      <FormRegistro abierta={accion != null} titulo={ac ? 'Editar acciones' : 'Registrar acciones'} campos={camposAccion}
        inicial={ac ? { ...ac, valor_nominal: ac.valor_nominal.toFixed(2) } : { fecha: s?.escritura_fecha ?? hoy, estado: 'vigente' }}
        validar={(x) => (x.numero_desde && x.numero_hasta && Number(x.numero_hasta) < Number(x.numero_desde) ? 'El número final no puede ser menor que el inicial.' : null)}
        onGuardar={async (x) => { await guardar('ctl_sa_acciones', ac?.id ?? null, x) }}
        onCerrar={() => setAccion(null)} />
      <FormRegistro abierta={aporte != null} titulo={ap ? 'Editar aportación' : 'Nueva aportación'}
        campos={[
          { k: 'socio_id', etiqueta: 'Socio', tipo: 'select', requerido: true, opciones: opcSocios },
          { k: 'fecha', etiqueta: 'Fecha', tipo: 'fecha', requerido: true },
          { k: 'forma', etiqueta: 'Forma', tipo: 'select', requerido: true, opciones: [{ valor: 'efectivo', nombre: 'En efectivo' }, { valor: 'especie', nombre: 'En especie' }] },
          { k: 'monto', etiqueta: 'Monto comprometido', tipo: 'monto', requerido: true },
          { k: 'pagado', etiqueta: 'Monto ya pagado', tipo: 'monto', requerido: true },
          { k: 'descripcion', etiqueta: 'Descripción', tipo: 'texto', max: 500, ancho: true, ayuda: 'En especie: qué bien se aporta y su avalúo.' },
        ]}
        inicial={ap ? { ...ap, monto: ap.monto.toFixed(2), pagado: ap.pagado.toFixed(2) } : { fecha: hoy, forma: 'efectivo', pagado: '0' }}
        validar={(x) => (Number(String(x.pagado).replace(/[^\d.]/g, '')) > Number(String(x.monto).replace(/[^\d.]/g, '')) ? 'Lo pagado no puede pasar el monto.' : null)}
        onGuardar={async (x) => { await guardar('ctl_sa_aportes', ap?.id ?? null, x) }}
        onCerrar={() => setAporte(null)} />
      <FormRegistro abierta={trans != null} titulo={tr ? 'Editar transmisión' : 'Nueva transmisión de acciones'}
        campos={[
          { k: 'fecha', etiqueta: 'Fecha', tipo: 'fecha', requerido: true },
          { k: 'de_socio_id', etiqueta: 'Transmite', tipo: 'select', requerido: true, opciones: opcSocios },
          { k: 'a_socio_id', etiqueta: 'Recibe', tipo: 'select', requerido: true, opciones: opcSocios },
          { k: 'cantidad', etiqueta: 'Acciones', tipo: 'numero', requerido: true, min: 1 },
          { k: 'serie', etiqueta: 'Serie', tipo: 'texto', max: 20 },
          { k: 'precio', etiqueta: 'Precio', tipo: 'monto' },
          { k: 'nota', etiqueta: 'Nota', tipo: 'texto', max: 500, ancho: true },
        ]}
        inicial={tr ? (tr as unknown as Record<string, unknown>) : { fecha: hoy }}
        validar={(x) => {
          if (x.de_socio_id && x.de_socio_id === x.a_socio_id) return 'Quien transmite y quien recibe deben ser distintos.'
          const tiene = accionesPorSocio(m.acciones, m.transmisiones.filter((t) => t.id !== tr?.id), x.fecha || hoy).get(x.de_socio_id) ?? 0
          return x.de_socio_id && Number(x.cantidad) > tiene ? `A esa fecha solo tiene ${tiene} acciones.` : null
        }}
        onGuardar={async (x) => { await guardar('ctl_sa_transmisiones', tr?.id ?? null, x) }}
        onCerrar={() => setTrans(null)} />
      {q.ventana}
    </>
  )
}
