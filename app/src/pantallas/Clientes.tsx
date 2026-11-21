import Avatar from '../componentes/Avatar'
import MenuMas from '../componentes/MenuMas'
import RegistrarPago from './pagos/RegistrarPago'
import { VentanaEstadoCuenta } from './cobros/Ventanas'
import { numeroWhatsApp, pendientes, totalSaldo } from '../lib/cobros'
import { saldoAFavor } from '../lib/anticipos'
import { useCobros, useHoy } from '../lib/usos'
import { diasEntre, fechaCorta } from '../lib/fechas'

interface EstadoCliente { debe: number; vencido: number; meses: number; favor: number }

export function ChipCliente({ e }: { e: EstadoCliente }) {
  if (e.vencido > 0) return <span className="m-estado error" title={`Tiene ${quetzales(e.vencido)} vencido desde hace ${e.meses} ${e.meses === 1 ? 'mes' : 'meses'}`}>Vencido · {e.meses} {e.meses === 1 ? 'mes' : 'meses'}</span>
  if (e.debe > 0) return <span className="m-estado pendiente" title={`Debe ${quetzales(e.debe)} que todavía no vence`}>Por vencer</span>
  if (e.favor > 0) return <span className="m-estado en-proceso" title={`Pagó por adelantado: le quedan ${quetzales(e.favor)} a favor`}>Saldo a favor</span>
  return <span className="m-estado aprobado" title="No debe nada">Al día</span>
}

import { ExternalLink, FileText, MessageCircle, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useAvisar } from '../componentes/Avisos'
import { useEscribir } from '../lib/escribir'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Tabla from '../componentes/Tabla'
import Buscador, { coincide } from '../componentes/Buscador'
import { useModelo } from '../lib/modelo'
import { quetzales } from '../lib/dinero'
import { cobraMensualidad } from '../lib/mensualidad'
import type { Cliente } from '../lib/tipos'
import FormCliente from './FormCliente'
import Pasos from '../componentes/Pasos'
import { useBorrarOArchivar } from './clientes/BorrarOArchivar'

type Filtro = 'activos' | 'todos' | 'inactivos' | 'archivados'

export default function Clientes() {
  const { clientes, proyectos, negocios } = useModelo()
  const ir = useNavigate()
  const esc = useEscribir()
  const avisar = useAvisar()
  const reactivar = async (l: Cliente[]) => {
    for (const c of l) await esc.archivarCliente(c.id, false)
    avisar(l.length === 1 ? `${l[0].nombre} vuelve a estar activo.` : `${l.length} clientes vuelven a estar activos.`, 'bien', { texto: 'Deshacer', hacer: async () => { for (const c of l) await esc.archivarCliente(c.id, true) } })
  }
  const bo = useBorrarOArchivar()
  const [q, setQ] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('activos')
  const [editar, setEditar] = useState<Cliente | null>(null)
  const [nuevo, setNuevo] = useState(false)
  const [estadoCuenta, setEstadoCuenta] = useState<Cliente | null>(null)
  const cobros = useCobros()
  const m = useModelo()
  const hoy = useHoy()
  const estados = useMemo(() => {
    const r = new Map<string, EstadoCliente>()
    for (const c of clientes) {
      const p = pendientes(cobros.filter((x) => x.cliente_id === c.id))
      const venc = p.filter((x) => x.estado === 'vencido')
      const masViejo = venc.reduce<string | null>((a, x) => (x.vence && (!a || x.vence < a) ? x.vence : a), null)
      r.set(c.id, { debe: totalSaldo(p), vencido: totalSaldo(venc), meses: masViejo ? Math.max(1, Math.round(diasEntre(masViejo, hoy) / 30)) : 0, favor: saldoAFavor(c.id, m.anticipos, m.pagos) })
    }
    return r
  }, [clientes, cobros, m.anticipos, m.pagos, hoy])
  const estadoDe = (id: string) => estados.get(id) ?? { debe: 0, vencido: 0, meses: 0, favor: 0 }
  const ultimoPago = (id: string) => m.pagos.filter((p) => p.cliente_id === id).reduce<string | null>((a, p) => (!a || p.fecha > a ? p.fecha : a), null)

  const lista = clientes
    .filter((c) => (filtro === 'archivados' ? c.archivado : !c.archivado && (filtro === 'todos' ? true : filtro === 'activos' ? c.activo : !c.activo)))
    .filter((c) => coincide(q, c.nombre, c.nit, c.whatsapp, c.correo, c.rubro))
  const deCliente = (id: string) => proyectos.filter((p) => p.cliente_id === id)
  const mensual = (id: string) => deCliente(id).filter(cobraMensualidad).reduce((s, p) => s + Math.round(p.mensualidad * 100), 0) / 100
  const negocio = (id: string) => negocios.find((n) => n.id === id)?.nombre ?? ''

  return (
    <>
      <div className="c-cabeza">
        <div>
          <span className="m-etiqueta">Dev Studio</span>
          <h1 className="erp-titulo">Clientes</h1><Pasos />
        </div>
        <button type="button" className="m-btn m-btn-primario" onClick={() => setNuevo(true)} title="Abre la ventana para crear un cliente nuevo"><Plus size={16} aria-hidden /> Nuevo cliente</button>
      </div>

      <div className="c-herramientas">
        <Buscador valor={q} onCambio={setQ} ayuda="Nombre, NIT, teléfono o correo" />
        <div className="c-chips" role="group" aria-label="Filtrar clientes">
          {(['activos', 'todos', 'inactivos', 'archivados'] as Filtro[]).map((f) => (
            <button key={f} type="button" className="m-chip" aria-pressed={filtro === f} onClick={() => setFiltro(f)} title={`Muestra ${f === 'todos' ? 'todos los clientes menos los archivados' : `solo los clientes ${f}`}`}>{f[0].toUpperCase() + f.slice(1)}</button>
          ))}
        </div>
      </div>

      {clientes.length === 0 ? (
        <div className="m-vacio m-tarjeta">
          <b>Todavía no hay clientes</b>
          <span>Crea el primero con «Nuevo cliente».</span>
        </div>
      ) : (
        <Tabla
          buscador={false}
          titulo={`${lista.length} ${lista.length === 1 ? 'cliente' : 'clientes'}`}
          nota="Toca un cliente para ver su ficha; clic derecho o mantener presionado para más"
          filas={lista}
          clave={(c) => c.id}
          vacio="Ningún cliente coincide con la búsqueda."
          onFila={(c) => ir(`/clientes/${encodeURIComponent(c.id ?? "")}`)}
          llave="clientes"
          resumen={(l) => { const mes = l.reduce((t, c) => t + Math.round(mensual(c.id) * 100), 0) / 100; const conDeuda = l.filter((c) => estadoDe(c.id).debe > 0).length; return <><span>Recurrente <b>{quetzales(mes)}</b> al mes · <b>{quetzales(mes * 12)}</b> al año</span><span><b>{l.length - conDeuda}</b> al día · <b>{conDeuda}</b> con deuda</span></> }}
          claseFila={(c) => (estadoDe(c.id).vencido > 0 ? 'c-fila-vencida' : undefined)}
          totalMarcadas={(l) => `debe ${quetzales(l.reduce((t, c) => t + Math.round(estadoDe(c.id).debe * 100), 0) / 100)}`}
          columnas={[
            { titulo: 'Cliente', principal: true, valor: (c) => <span className="c-con-avatar"><Avatar nombre={c.nombre} /><span><Link to={`/clientes/${encodeURIComponent(c.id ?? "")}`} className="c-enlace c-nombre-2" title={c.nombre} onClick={(e) => e.stopPropagation()}>{c.nombre}</Link>{c.rubro && <small>{c.rubro}</small>}{!c.activo && <span className="m-estado bloqueado">Inactivo</span>}</span></span>, orden: (c) => c.nombre.toLowerCase() },
            { titulo: 'Estado', cabecera: true, valor: (c) => <ChipCliente e={estadoDe(c.id)} />, orden: (c) => -estadoDe(c.id).vencido * 1e6 - estadoDe(c.id).debe },
            { titulo: 'Negocio', valor: (c) => negocio(c.negocio_id) },
            { titulo: 'WhatsApp', valor: (c) => c.whatsapp ?? <span className="m-vacia">Sin anotar</span> },
            { titulo: 'NIT', baja: true, valor: (c) => c.nit ?? <span className="m-vacia">Sin anotar</span> },
            { titulo: 'Debe', num: true, valor: (c) => (estadoDe(c.id).debe > 0 ? quetzales(estadoDe(c.id).debe) : <span className="m-vacia">—</span>), orden: (c) => estadoDe(c.id).debe },
            { titulo: 'Último pago', baja: true, valor: (c) => (ultimoPago(c.id) ? fechaCorta(ultimoPago(c.id)!) : <span className="m-vacia">Sin anotar</span>), orden: (c) => ultimoPago(c.id) ?? '' },
            { titulo: 'Proyectos', baja: true, num: true, valor: (c) => deCliente(c.id).length, orden: (c) => deCliente(c.id).length },
            { titulo: 'Mensualidad', num: true, destacado: true, valor: (c) => (mensual(c.id) > 0 ? quetzales(mensual(c.id)) : <span className="m-vacia">—</span>), orden: (c) => mensual(c.id) },
          ]}
          masa={filtro === 'archivados'
            ? [{ texto: 'Reactivar las marcadas', titulo: (n) => `Vuelve a mostrar los ${n} clientes marcados en listas y selectores`, hacer: (l) => void reactivar(l) }]
            : [{ texto: 'Borrar o archivar las marcadas', titulo: (n) => `Muestra cuáles de los ${n} se borran y cuáles se archivan antes de hacerlo`, hacer: (l) => bo.pedir(l), peligro: true }]}
          menu={(c) => [
            { texto: 'Abrir', titulo: 'Abre la ficha del cliente', icono: <ExternalLink size={16} aria-hidden />, hacer: () => ir(`/clientes/${encodeURIComponent(c.id)}`) },
            { texto: 'Editar', titulo: 'Abre sus datos para corregirlos', icono: <Pencil size={16} aria-hidden />, hacer: () => setEditar(c) },
            c.archivado
              ? { texto: 'Reactivar', titulo: 'Vuelve a mostrarlo en listas y selectores', icono: <RotateCcw size={16} aria-hidden />, hacer: () => void reactivar([c]) }
              : { texto: 'Borrar o archivar', titulo: bo.titulo(c), icono: <Trash2 size={16} aria-hidden />, hacer: () => bo.pedir([c]), peligro: true },
          ]}
          acciones={(c) => (
            <>
              {c.whatsapp && <a className="m-icono-btn c-salida" href={`https://wa.me/${numeroWhatsApp(c.whatsapp)}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} aria-label={`WhatsApp de ${c.nombre}`} title={`Abre WhatsApp con ${c.nombre}`}><MessageCircle aria-hidden /></a>}
              {!c.archivado && estadoDe(c.id).debe > 0 && <RegistrarPago clienteFijo={c.id} icono />}
              <button type="button" className="m-icono-btn c-salida" onClick={() => setEstadoCuenta(c)} aria-label={`Estado de cuenta de ${c.nombre}`} title="Abre su estado de cuenta para mandarlo por WhatsApp, en PDF o en la web"><FileText aria-hidden /></button>
              <button type="button" className="m-icono-btn" onClick={() => setEditar(c)} aria-label={`Editar ${c.nombre}`} title="Abre sus datos para corregirlos"><Pencil aria-hidden /></button>
              <MenuMas icono items={[
                { texto: 'Abrir ficha', titulo: 'Abre la ficha del cliente', hacer: () => ir(`/clientes/${encodeURIComponent(c.id)}`) },
                c.archivado ? { texto: 'Reactivar', titulo: 'Vuelve a mostrarlo en listas y selectores', hacer: () => void reactivar([c]) } : { texto: 'Borrar o archivar', titulo: bo.titulo(c), hacer: () => bo.pedir([c]), peligro: true },
              ]} />
            </>
          )}
        />
      )}

      <FormCliente abierta={nuevo} cliente={null} onCerrar={() => setNuevo(false)} onGuardado={(c) => ir(`/clientes/${encodeURIComponent(c.id ?? "")}`)} />
      <FormCliente abierta={editar != null} cliente={editar} onCerrar={() => setEditar(null)} />
      {bo.ventana}
      <VentanaEstadoCuenta cliente={estadoCuenta} cobros={cobros} onCerrar={() => setEstadoCuenta(null)} />
    </>
  )
}
