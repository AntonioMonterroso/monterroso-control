import LogoStudio from '../componentes/Logo'
import { Eye, EyeOff, FlaskConical, LoaderCircle, LockKeyhole } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useSesion } from '../lib/sesion'
import { configurado } from '../lib/supabase'

const CLAVE_CORREO = 'mc_correo'

function leerCorreo(): string {
  try { return localStorage.getItem(CLAVE_CORREO) ?? '' } catch { return '' }
}

export default function Acceso() {
  const { entrar, entrarPrueba } = useSesion()
  const guardado = leerCorreo()
  const [correo, setCorreo] = useState(guardado)
  const [clave, setClave] = useState('')
  const [recordar, setRecordar] = useState(guardado !== '')
  const [ver, setVer] = useState(false)
  const [mayus, setMayus] = useState(false)
  const [error, setError] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const rCorreo = useRef<HTMLInputElement>(null)
  const rClave = useRef<HTMLInputElement>(null)

  useEffect(() => { (guardado ? rClave : rCorreo).current?.focus() }, [guardado])

  const revisarMayus = (e: React.KeyboardEvent<HTMLInputElement>) => setMayus(e.getModifierState('CapsLock'))

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (ocupado) return
    if (!correo.trim()) { setError('Escribe tu correo.'); rCorreo.current?.focus(); return }
    if (!clave) { setError('Escribe tu contraseña.'); rClave.current?.focus(); return }
    setOcupado(true); setError('')
    try { if (recordar) localStorage.setItem(CLAVE_CORREO, correo.trim()); else localStorage.removeItem(CLAVE_CORREO) } catch { void 0 }
    const r = await entrar(correo.trim(), clave)
    if (r) { setError(r); setOcupado(false); rClave.current?.select() }
  }

  return (
    <div className="m-acceso c-acceso">
      <div className="m-acceso-marca" aria-hidden="true">
        <span className="c-acceso-linea">Dev Studio · Hogar Canela · Salario</span>
      </div>
      <div className="m-acceso-forma">
        <form className="m-tarjeta c-acceso-tarjeta" onSubmit={enviar} noValidate>
          <LogoStudio className="c-acceso-logo" />
          <div><div className="m-etiqueta">Control de negocios</div><h1 className="m-titulo-3">Bienvenido de nuevo</h1></div>
          <div className="m-campo">
            <label htmlFor="aCorreo">Correo</label>
            <input ref={rCorreo} className="m-entrada" id="aCorreo" type="email" inputMode="email" autoComplete="username" required value={correo} onChange={(e) => { setCorreo(e.target.value); setError('') }} />
          </div>
          <div className="m-campo">
            <label htmlFor="aClave">Contraseña</label>
            <div className="m-clave">
              <input ref={rClave} className="m-entrada" id="aClave" type={ver ? 'text' : 'password'} autoComplete="current-password" required value={clave} onKeyDown={revisarMayus} onKeyUp={revisarMayus} onBlur={() => setMayus(false)} onChange={(e) => { setClave(e.target.value); setError('') }} aria-describedby={mayus ? 'aMayus' : undefined} />
              <button type="button" onClick={() => setVer(!ver)} aria-label={ver ? 'Ocultar la contraseña' : 'Mostrar la contraseña'} title={ver ? 'Ocultar la contraseña' : 'Mostrar la contraseña'}>{ver ? <EyeOff aria-hidden /> : <Eye aria-hidden />}</button>
            </div>
            {mayus && <span className="c-acceso-mayus" id="aMayus">Las mayúsculas están activadas</span>}
          </div>
          <label className="c-acceso-recordar" title="Guarda solo tu correo en este equipo, nunca la contraseña">
            <input type="checkbox" checked={recordar} onChange={(e) => setRecordar(e.target.checked)} /> Recordar mi correo en este equipo
          </label>
          {error && <p className="erp-error" role="alert">{error}</p>}
          {!configurado && <p className="erp-error" role="alert">Falta configurar la conexión con la base.</p>}
          <button className="m-btn m-btn-primario" type="submit" disabled={ocupado || !configurado} aria-busy={ocupado} title="Entrar con tu correo y contraseña">
            {ocupado ? <><LoaderCircle className="c-girando" size={16} aria-hidden /> Entrando…</> : 'Entrar'}
          </button>
          {import.meta.env.DEV && (
            <button type="button" className="m-btn m-btn-secundario" onClick={entrarPrueba} title="Solo en este equipo de desarrollo: datos guardados en el navegador">
              <FlaskConical size={16} aria-hidden /> Entrar en modo de prueba
            </button>
          )}
          <p className="m-acceso-pie"><LockKeyhole size={12} aria-hidden /> Misma cuenta de Monterroso World</p>
        </form>
      </div>
    </div>
  )
}
