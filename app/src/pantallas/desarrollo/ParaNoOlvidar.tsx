import { ArrowRightLeft, Bell, BellRing, Building, CalendarClock, CheckCircle2, Database, Globe, KeyRound, Link2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { AvisoDev } from '../../lib/desarrollo'
import { useModelo } from '../../lib/modelo'
import { pedirPermiso, permisoNotificaciones } from '../../lib/notificar'
import { useAvisosDev } from '../../lib/usos'

const ICONO: Record<AvisoDev['tipo'], typeof Database> = { supabase: Database, token: KeyRound, servicio: Globe, enlace: Link2, recordatorio: CalendarClock, sociedad: Building, traslado: ArrowRightLeft, aceptado: CheckCircle2 }

export function rutaAviso(a: AvisoDev): string {
  if (a.tipo === 'recordatorio') return '/sa/recordatorios'
  if (a.tipo === 'sociedad') return '/sa'
  if (a.tipo === 'traslado') return '/cuentas'
  if (a.tipo === 'aceptado') return '/documentos'
  return a.proyecto_id ? `/proyectos/${a.proyecto_id}?ver=desarrollo` : `/desarrollo?ver=${a.tipo}`
}

export function BotonNotificaciones() {
  const [p, setP] = useState(permisoNotificaciones)
  if (p === 'no') return null
  if (p === 'granted') return <span className="m-estado aprobado"><BellRing size={13} aria-hidden /> Notificaciones activas</span>
  if (p === 'denied') return <span className="m-estado bloqueado" title="Se activan desde la configuración del navegador">Notificaciones bloqueadas</span>
  return <button type="button" className="m-btn m-btn-secundario m-btn-sm" onClick={async () => setP(await pedirPermiso())} title="Pedir permiso para avisarte aunque estés en otra pestaña"><Bell size={14} aria-hidden /> Activar notificaciones</button>
}

export default function ParaNoOlvidar({ limite, proyectoId, ocultarVacio }: { limite?: number; proyectoId?: string; ocultarVacio?: boolean }) {
  const { proyectos } = useModelo()
  const todos = useAvisosDev().filter((a) => !proyectoId || a.proyecto_id === proyectoId)
  const lista = limite ? todos.slice(0, limite) : todos
  if (ocultarVacio && todos.length === 0) return null
  const nombre = (id: string | null) => (id ? proyectos.find((p) => p.id === id)?.nombre : null)
  return (
    <section className="c-seccion-dev">
      <div className="c-ficha-cabeza">
        <h2 className="m-seccion-titulo">Para no olvidar</h2>
        <BotonNotificaciones />
      </div>
      {lista.length === 0 ? (
        <div className="m-vacio c-vacio-chico"><b>Nada pendiente</b><span>Supabase, tokens, dominios, enlaces y recordatorios están al día.</span></div>
      ) : (
        <ul className="c-lista-saldos c-lista-avisos">
          {lista.map((a) => {
            const I = ICONO[a.tipo]
            const p = nombre(a.proyecto_id)
            return (
              <li key={a.id} className={`c-av-${a.nivel}`}>
                <span className="c-av-ico"><I size={16} aria-hidden /></span>
                <span><b>{a.titulo}</b><small> · {a.detalle}</small>{p && <small> · {p}</small>}</span>
                <Link className="m-btn m-btn-secundario m-btn-sm" to={rutaAviso(a)} title="Ir a donde se arregla">Ver</Link>
              </li>
            )
          })}
          {limite && todos.length > limite && <li className="c-lista-pie"><Link to="/desarrollo" className="c-enlace">Ver los {todos.length} avisos</Link></li>}
        </ul>
      )}
    </section>
  )
}
