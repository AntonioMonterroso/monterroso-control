import { useEffect, useState } from 'react'
import { useAvisar } from '../componentes/Avisos'
import Ventana from '../componentes/Ventana'
import { useEscribir } from '../lib/escribir'
import { clientKey } from '../lib/world'
import { useModelo } from '../lib/modelo'
import type { Cliente, Regimen } from '../lib/tipos'

const vacio = (s: string) => (s.trim() ? s.trim() : null)

export default function FormCliente({ abierta, cliente, onCerrar, onGuardado }: {
  abierta: boolean
  cliente: Cliente | null
  onCerrar: () => void
  onGuardado?: (c: Cliente) => void
}) {
  const esc = useEscribir()
  const { negocios, clientes } = useModelo()
  const avisar = useAvisar()
  const dev = negocios.find((n) => n.clave === 'dev')
  const [v, setV] = useState({ nombre: '', negocio_id: '', rubro: '', whatsapp: '', correo: '', nit: '', direccion: '', regimen: '' as Regimen | '', notas: '', activo: true })
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!abierta) return
    setError(''); setOcupado(false)
    setV(cliente
      ? { nombre: cliente.nombre, negocio_id: cliente.negocio_id, rubro: cliente.rubro ?? '', whatsapp: cliente.whatsapp ?? '', correo: cliente.correo ?? '', nit: cliente.nit ?? '', direccion: cliente.direccion ?? '', regimen: cliente.regimen ?? '', notas: cliente.notas ?? '', activo: cliente.activo }
      : { nombre: '', negocio_id: dev?.id ?? '', rubro: '', whatsapp: '', correo: '', nit: '', direccion: '', regimen: '', notas: '', activo: true })
  }, [abierta, cliente, dev?.id])

  const cambiar = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setV((x) => ({ ...x, [k]: e.target.value }))
  const repetido = v.nombre.trim() && !esc.claveLibre(v.nombre, cliente?.id) ? clientes.find((c) => c.id !== cliente?.id && (c.id === clientKey(v.nombre) || c.aka?.includes(clientKey(v.nombre)))) : undefined
  const listo = v.nombre.trim().length > 0 && !repetido

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!listo || ocupado) return
    setOcupado(true); setError('')
    const info = { name: v.nombre.trim(), rubro: v.rubro, phone: v.whatsapp, email: v.correo, nit: v.nit }
    const x = { direccion: vacio(v.direccion), notas: vacio(v.notas), activo: v.activo }
    try {
      const key = cliente ? await esc.editarCliente(cliente.id, info, x) : await esc.crearCliente(info, x)
      const c = { ...(cliente ?? {}), id: key, nombre: info.name } as Cliente
      avisar(cliente ? 'Cliente guardado.' : `Cliente «${c.nombre}» creado.`)
      onGuardado?.(c)
      onCerrar()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar.')
      setOcupado(false)
    }
  }

  return (
    <Ventana
      abierta={abierta}
      titulo={cliente ? 'Editar cliente' : 'Nuevo cliente'}
      subtitulo={cliente ? `${cliente.nombre} · se guarda también en Monterroso World` : 'Queda también en Monterroso World. Después le asignas sus proyectos.'}
      onCerrar={onCerrar}
      pie={
        <>
          <button type="button" className="m-btn m-btn-fantasma" onClick={onCerrar} title="Cerrar sin guardar">Cancelar</button>
          <button type="submit" form="form-cliente" className="m-btn m-btn-primario" disabled={!listo || ocupado} title={!v.nombre.trim() ? 'Escribe el nombre del cliente' : repetido ? 'Ese nombre ya lo tiene otro cliente' : 'Guardar los datos del cliente'}>{ocupado ? 'Guardando…' : cliente ? 'Guardar cambios' : 'Crear cliente'}</button>
        </>
      }
    >
      <form id="form-cliente" className="c-form" onSubmit={guardar}>
        <div className="m-campo c-ancho">
          <label htmlFor="cl-nombre">Nombre del cliente</label>
          <input id="cl-nombre" className="m-entrada" value={v.nombre} maxLength={200} onChange={cambiar('nombre')} autoFocus autoComplete="off" />
          {repetido && <span className="c-error" role="alert">Ya tienes un cliente llamado «{repetido.nombre}».</span>}
        </div>
        <div className="m-campo">
          <label htmlFor="cl-rubro">Rubro</label>
          <input id="cl-rubro" className="m-entrada" value={v.rubro} maxLength={80} onChange={cambiar('rubro')} autoComplete="off" />
        </div>
        <div className="m-campo">
          <label htmlFor="cl-wa">WhatsApp</label>
          <input id="cl-wa" className="m-entrada" inputMode="tel" value={v.whatsapp} maxLength={30} onChange={cambiar('whatsapp')} autoComplete="off" />
        </div>
        <div className="m-campo">
          <label htmlFor="cl-correo">Correo</label>
          <input id="cl-correo" className="m-entrada" type="email" value={v.correo} maxLength={120} onChange={cambiar('correo')} autoComplete="off" />
        </div>
        <div className="m-campo">
          <label htmlFor="cl-nit">NIT</label>
          <input id="cl-nit" className="m-entrada" value={v.nit} maxLength={30} onChange={cambiar('nit')} autoComplete="off" />
        </div>
        <div className="m-campo c-ancho">
          <label htmlFor="cl-dir">Dirección</label>
          <input id="cl-dir" className="m-entrada" value={v.direccion} maxLength={300} onChange={cambiar('direccion')} autoComplete="off" />
        </div>
        <div className="m-campo c-ancho">
          <label htmlFor="cl-notas">Notas</label>
          <textarea id="cl-notas" className="m-entrada" value={v.notas} maxLength={2000} onChange={cambiar('notas')} />
        </div>
        {cliente && (
          <label className="c-casilla c-ancho">
            <input type="checkbox" checked={v.activo} onChange={(e) => setV((x) => ({ ...x, activo: e.target.checked }))} />
            Cliente activo
          </label>
        )}
        {error && <p className="c-error c-ancho" role="alert">{error}</p>}
      </form>
    </Ventana>
  )
}
