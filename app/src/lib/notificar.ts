import { avisosPorNotificar, type AvisoDev } from './desarrollo'
import { hoyISO } from './fechas'

const LLAVE = 'mc_notificados'

export function permisoNotificaciones(): NotificationPermission | 'no' {
  return typeof Notification === 'undefined' ? 'no' : Notification.permission
}

export async function pedirPermiso(): Promise<NotificationPermission | 'no'> {
  if (typeof Notification === 'undefined') return 'no'
  return Notification.requestPermission()
}

function leer(): { dia: string; ids: string[] } {
  try { const v = JSON.parse(localStorage.getItem(LLAVE) ?? '') as { dia: string; ids: string[] }; return v.dia === hoyISO() ? v : { dia: hoyISO(), ids: [] } } catch { return { dia: hoyISO(), ids: [] } }
}

export function notificar(avisos: AvisoDev[], abrir: (a: AvisoDev) => void) {
  if (permisoNotificaciones() !== 'granted') return
  const r = leer()
  const nuevos = avisosPorNotificar(avisos, r.ids)
  if (!nuevos.length) return
  for (const a of nuevos.slice(0, 5)) {
    try {
      const n = new Notification(a.titulo, { body: a.detalle, tag: a.clave, icon: '/marca/studio-icono-192.png' })
      n.onclick = () => { window.focus(); abrir(a); n.close() }
    } catch { return }
  }
  if (nuevos.length > 5) {
    try { new Notification('Monterroso Control', { body: `Y ${nuevos.length - 5} avisos más en «Para no olvidar».`, tag: 'mc-resto', icon: '/marca/studio-icono-192.png' }) } catch { return }
  }
  try { localStorage.setItem(LLAVE, JSON.stringify({ dia: r.dia, ids: [...r.ids, ...nuevos.map((a) => a.id)] })) } catch { return }
}
