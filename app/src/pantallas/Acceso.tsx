import { Eye, EyeOff, FlaskConical } from 'lucide-react'
import { useState } from 'react'
import { useSesion } from '../lib/sesion'
import { configurado } from '../lib/supabase'

export default function Acceso() {
  const { entrar, entrarPrueba } = useSesion()
  const [correo, setCorreo] = useState('')
  const [clave, setClave] = useState('')
  const [ver, setVer] = useState(false)
  const [error, setError] = useState('')
  const [ocupado, setOcupado] = useState(false)

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (ocupado) return
    setOcupado(true); setError('')
    const r = await entrar(correo, clave)
    if (r) { setError(r); setOcupado(false) }
  }

  return (
    <div className="m-acceso c-acceso">
      <div className="m-acceso-marca" aria-hidden="true">
        <div className="c-acceso-sello">
          <p className="c-acceso-nombre">MONTERROSO</p>
          <p>Control de negocios</p>
        </div>
        <p className="c-acceso-linea">Dev Studio · Hogar Canela · Salario</p>
      </div>
      <div className="m-acceso-forma">
        <form className="m-tarjeta" onSubmit={enviar} noValidate>
          <span className="logo-completo c-logo-am"><img src="/marca/logo-am.png" alt="Monterroso" /></span>
          <div><div className="m-etiqueta">Control de negocios</div><h1 className="m-titulo-3">Bienvenido de nuevo</h1></div>
          <div className="m-campo">
            <label htmlFor="aCorreo">Correo</label>
            <input className="m-entrada" id="aCorreo" type="email" autoComplete="username" required value={correo} onChange={(e) => setCorreo(e.target.value)} />
          </div>
          <div className="m-campo">
            <label htmlFor="aClave">Contraseña</label>
            <div className="m-clave">
              <input className="m-entrada" id="aClave" type={ver ? 'text' : 'password'} autoComplete="current-password" required value={clave} onChange={(e) => setClave(e.target.value)} />
              <button type="button" onClick={() => setVer(!ver)} aria-label={ver ? 'Ocultar la contraseña' : 'Mostrar la contraseña'} title={ver ? 'Ocultar la contraseña' : 'Mostrar la contraseña'}>{ver ? <EyeOff aria-hidden /> : <Eye aria-hidden />}</button>
            </div>
          </div>
          {error && <p className="erp-error" role="alert">{error}</p>}
          {!configurado && <p className="erp-error" role="alert">Falta configurar la conexión con la base.</p>}
          <button className="m-btn m-btn-primario" type="submit" disabled={ocupado || !configurado} title="Entrar con tu correo y contraseña">{ocupado ? 'Entrando…' : 'Entrar'}</button>
          {import.meta.env.DEV && (
            <button type="button" className="m-btn m-btn-secundario" onClick={entrarPrueba} title="Solo en este equipo de desarrollo: datos guardados en el navegador">
              <FlaskConical size={16} aria-hidden /> Entrar en modo de prueba
            </button>
          )}
          <p className="m-acceso-pie">Misma cuenta de Monterroso World</p>
        </form>
      </div>
    </div>
  )
}
