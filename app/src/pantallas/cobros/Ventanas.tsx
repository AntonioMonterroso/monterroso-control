import { Check, Copy, FileDown, MessageCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import FormRegistro, { type Campo } from '../../componentes/FormRegistro'
import Ventana from '../../componentes/Ventana'
import { numeroWhatsApp, pendientes, textoEstadoCuenta, totalSaldo, type Cobro } from '../../lib/cobros'
import { useDatos } from '../../lib/datos'
import { useEscribir } from '../../lib/escribir'
import { quetzales } from '../../lib/dinero'
import { fechaCorta } from '../../lib/fechas'
import { useModelo } from '../../lib/modelo'
import { useHoy } from '../../lib/usos'
import { CUENTAS, type Cliente } from '../../lib/tipos'
import { imprimirEstadoCuenta } from './documentos'

export function VentanaPago({ cobro, onCerrar }: { cobro: Cobro | null; onCerrar: () => void }) {
  const esc = useEscribir()
  const { clientes } = useModelo()
  const hoy = useHoy()
  const campos: Campo[] = [
    { k: 'fecha', etiqueta: 'Fecha del pago', tipo: 'fecha', requerido: true },
    { k: 'monto', etiqueta: 'Monto recibido', tipo: 'monto', requerido: true },
    { k: 'cuenta', etiqueta: 'Dónde cayó', tipo: 'select', requerido: true, opciones: CUENTAS.map((c) => ({ valor: c, nombre: c })) },
    { k: 'referencia', etiqueta: 'Referencia o número de boleta', tipo: 'texto', max: 120 },
    { k: 'nota', etiqueta: 'Nota', tipo: 'area', max: 500 },
  ]
  const nombre = cobro?.tipo === 'salario' ? 'Mi salario' : clientes.find((c) => c.id === cobro?.cliente_id)?.nombre
  return (
    <FormRegistro
      abierta={cobro != null}
      titulo={cobro?.tipo === 'salario' ? 'Marcar salario recibido' : 'Registrar pago'}
      subtitulo={cobro ? `${nombre} · ${cobro.concepto} · pendiente ${quetzales(cobro.saldo)}` : ''}
      campos={campos}
      inicial={{ fecha: hoy, monto: cobro?.saldo.toFixed(2), cuenta: 'Banco' }}
      textoGuardar="Registrar pago"
      validar={(v) => (cobro && Number(v.monto.replace(/[^\d.]/g, '')) > cobro.saldo + 0.001 ? `El monto pasa lo pendiente (${quetzales(cobro.saldo)}).` : null)}
      onGuardar={async (d) => { if (cobro) await esc.registrarPago(cobro, { fecha: String(d.fecha), monto: Number(d.monto), cuenta: String(d.cuenta), referencia: (d.referencia as string | null) ?? null, nota: (d.nota as string | null) ?? null }, cobro.tipo === 'salario' ? null : esc.siguienteRecibo()) }}
      onCerrar={onCerrar}
    />
  )
}

export function VentanaExtra({ abierta, clienteFijo, onCerrar }: { abierta: boolean; clienteFijo?: string; onCerrar: () => void }) {
  const { insertar } = useDatos()
  const { clientes, proyectos } = useModelo()
  const hoy = useHoy()
  const campos: Campo[] = [
    { k: 'cliente_id', etiqueta: 'Cliente', tipo: 'select', requerido: true, opciones: clientes.filter((c) => (c.activo && !c.archivado) || c.id === clienteFijo).map((c) => ({ valor: c.id, nombre: c.nombre })) },
    { k: 'proyecto_id', etiqueta: 'Proyecto', tipo: 'select', opciones: proyectos.map((p) => ({ valor: p.id, nombre: p.nombre })) },
    { k: 'concepto', etiqueta: 'Concepto', tipo: 'texto', requerido: true, max: 200, ancho: true },
    { k: 'monto', etiqueta: 'Monto', tipo: 'monto', requerido: true },
    { k: 'vence', etiqueta: 'Vence', tipo: 'fecha' },
  ]
  return (
    <FormRegistro
      abierta={abierta}
      titulo="Cobro extra"
      subtitulo="Por ejemplo un dominio, un cambio fuera del alcance o una hora de soporte."
      campos={campos}
      inicial={{ cliente_id: clienteFijo, vence: hoy }}
      validar={(v) => (v.proyecto_id && proyectos.find((p) => p.id === v.proyecto_id)?.cliente_id !== v.cliente_id ? 'Ese proyecto es de otro cliente.' : null)}
      onGuardar={async (d) => { await insertar('ctl_cobros', [{ ...d, clave: `x:${crypto.randomUUID()}`, tipo: 'extra', saldado: false }]) }}
      onCerrar={onCerrar}
    />
  )
}

export function VentanaSaldar({ cobro, onCerrar }: { cobro: Cobro | null; onCerrar: () => void }) {
  const { guardar } = useDatos()
  const campos: Campo[] = [{ k: 'nota', etiqueta: 'Por qué se da por saldado', tipo: 'area', requerido: true, max: 500 }]
  return (
    <FormRegistro
      abierta={cobro != null}
      titulo="Dar por saldado"
      subtitulo={cobro ? `${cobro.concepto}: deja de contar ${quetzales(cobro.saldo)} como pendiente. Se puede deshacer.` : ''}
      campos={campos}
      inicial={{ nota: cobro?.guardado?.nota ?? '' }}
      textoGuardar="Dar por saldado"
      onGuardar={async (d) => {
        if (!cobro) return
        await guardar('ctl_cobros', cobro.guardado?.id ?? null, cobro.guardado ? { saldado: true, nota: d.nota } : { clave: cobro.clave, cliente_id: cobro.cliente_id || null, proyecto_id: cobro.proyecto_id, tipo: cobro.tipo, saldado: true, nota: d.nota })
      }}
      onCerrar={onCerrar}
    />
  )
}

export function VentanaEstadoCuenta({ cliente, cobros, onCerrar }: { cliente: Cliente | null; cobros: Cobro[]; onCerrar: () => void }) {
  const hoy = useHoy()
  const { proyectos } = useModelo()
  const propios = useMemo(() => cobros.filter((c) => c.cliente_id === cliente?.id), [cobros, cliente])
  const lista = pendientes(propios)
  const [texto, setTexto] = useState('')
  const [copiado, setCopiado] = useState(false)
  useEffect(() => { if (cliente) { setTexto(textoEstadoCuenta(cliente.nombre, propios, hoy)); setCopiado(false) } }, [cliente, propios, hoy])
  const nombreProyecto = (id: string | null) => proyectos.find((p) => p.id === id)?.nombre ?? ''
  const url = `https://wa.me/${numeroWhatsApp(cliente?.whatsapp ?? null)}?text=${encodeURIComponent(texto)}`
  return (
    <Ventana abierta={cliente != null} titulo="Estado de cuenta" subtitulo={cliente?.nombre} onCerrar={onCerrar} pie={cliente && (
      <>
        <button type="button" className="m-btn m-btn-salida" onClick={() => imprimirEstadoCuenta(cliente, propios, hoy, nombreProyecto)} title="Abrir el estado de cuenta listo para guardar en PDF o imprimir"><FileDown size={16} aria-hidden /> PDF</button>
        <button type="button" className="m-btn m-btn-secundario" onClick={async () => { try { await navigator.clipboard.writeText(texto); setCopiado(true); setTimeout(() => setCopiado(false), 1800) } catch { setCopiado(false) } }} title="Copiar el mensaje">{copiado ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />} {copiado ? 'Copiado' : 'Copiar'}</button>
        <a className="m-btn m-btn-primario" href={url} target="_blank" rel="noreferrer" title="Abrir WhatsApp con el mensaje listo"><MessageCircle size={16} aria-hidden /> Enviar por WhatsApp</a>
      </>
    )}>
      {lista.length > 0 ? (
        <ul className="c-lista-saldos">
          {lista.map((c) => <li key={c.clave}><span>{c.concepto}{c.vence && <small> · {fechaCorta(c.vence)}</small>}{c.estado === 'vencido' && <span className="m-estado error">Vencido</span>}</span><b className="m-cifra">{quetzales(c.saldo)}</b></li>)}
          <li className="c-lista-total"><span>Total pendiente</span><b className="m-cifra">{quetzales(totalSaldo(lista))}</b></li>
        </ul>
      ) : <p>Está al día: no tiene nada pendiente.</p>}
      <div className="m-campo">
        <label htmlFor="ec-texto">Mensaje (puedes cambiarlo antes de enviarlo)</label>
        <textarea id="ec-texto" className="m-entrada" rows={8} value={texto} maxLength={3000} onChange={(e) => setTexto(e.target.value)} />
        {!cliente?.whatsapp && <span className="m-ayuda">No tiene WhatsApp guardado: al abrirlo eliges el contacto.</span>}
      </div>
    </Ventana>
  )
}

export function VentanaRecordatorios({ abierta, cobros, onCerrar }: { abierta: boolean; cobros: Cobro[]; onCerrar: () => void }) {
  const { clientes } = useModelo()
  const hoy = useHoy()
  const [enviados, setEnviados] = useState<string[]>([])
  useEffect(() => { if (abierta) setEnviados([]) }, [abierta])
  const deudores = clientes.map((c) => ({ c, propios: cobros.filter((x) => x.cliente_id === c.id) })).filter((x) => pendientes(x.propios).length > 0)
  return (
    <Ventana abierta={abierta} titulo="Recordatorios por WhatsApp" subtitulo={`${deudores.length} ${deudores.length === 1 ? 'cliente debe' : 'clientes deben'}. Abre cada uno; se marca al enviarlo.`} onCerrar={onCerrar}>
      {deudores.length === 0 ? <p>Nadie debe nada. Todo está al día.</p> : (
        <ul className="c-lista-saldos">
          {deudores.map(({ c, propios }) => {
            const url = `https://wa.me/${numeroWhatsApp(c.whatsapp)}?text=${encodeURIComponent(textoEstadoCuenta(c.nombre, propios, hoy))}`
            const listo = enviados.includes(c.id)
            return (
              <li key={c.id}>
                <span><b>{c.nombre}</b><small> · {quetzales(totalSaldo(propios))}</small>{!c.whatsapp && <small> · sin WhatsApp</small>}</span>
                <a className={`m-btn m-btn-sm ${listo ? 'm-btn-secundario' : 'm-btn-primario'}`} href={url} target="_blank" rel="noreferrer" onClick={() => setEnviados((l) => [...l, c.id])} title={`Abrir WhatsApp con el estado de cuenta de ${c.nombre}`}>{listo ? <><Check size={14} aria-hidden /> Abierto</> : <><MessageCircle size={14} aria-hidden /> Enviar</>}</a>
              </li>
            )
          })}
        </ul>
      )}
    </Ventana>
  )
}

export function VentanaEditarPago({ pago, onCerrar }: { pago: import('../../lib/tipos').Pago | null; onCerrar: () => void }) {
  const { guardar, insertar } = useDatos()
  const m = useModelo()
  const campos: Campo[] = [
    { k: 'fecha', etiqueta: 'Fecha del pago', tipo: 'fecha', requerido: true },
    { k: 'monto', etiqueta: 'Monto', tipo: 'monto', requerido: true },
    { k: 'cuenta', etiqueta: 'Dónde cayó', tipo: 'select', requerido: true, opciones: [...new Set([...CUENTAS, pago?.cuenta ?? 'Banco'])].map((c) => ({ valor: c, nombre: c })) },
    { k: 'referencia', etiqueta: 'Referencia o número de boleta', tipo: 'texto', max: 120 },
    { k: 'nota', etiqueta: 'Nota', tipo: 'area', max: 300 },
  ]
  return (
    <FormRegistro
      abierta={pago != null}
      titulo="Editar pago"
      subtitulo={pago?.origen === 'world' ? 'Se corrige también en Monterroso World.' : undefined}
      campos={campos}
      inicial={pago ? { ...pago, monto: pago.monto.toFixed(2) } : {}}
      onGuardar={async (d) => {
        if (!pago) return
        if (pago.origen === 'world') {
          await guardar('payments', pago.id, { paid_at: d.fecha, amount: d.monto, method: String(d.cuenta).slice(0, 60), note: d.nota ? String(d.nota).slice(0, 300) : null })
          const ex = m.extraPagos.find((x) => x.payment_id === pago.id)
          if (ex) await guardar('ctl_pago_extra', ex.id, { referencia: d.referencia })
          else if (d.referencia) await insertar('ctl_pago_extra', [{ payment_id: pago.id, referencia: d.referencia, recibo_numero: null }])
        } else await guardar('ctl_pagos', pago.id, d)
      }}
      onCerrar={onCerrar}
    />
  )
}

export function VentanaEditarExtra({ cobro, onCerrar }: { cobro: Cobro | null; onCerrar: () => void }) {
  const { guardar } = useDatos()
  return (
    <FormRegistro
      abierta={cobro != null}
      titulo="Editar cobro extra"
      campos={[
        { k: 'concepto', etiqueta: 'Concepto', tipo: 'texto', requerido: true, max: 200, ancho: true },
        { k: 'monto', etiqueta: 'Monto', tipo: 'monto', requerido: true },
        { k: 'vence', etiqueta: 'Vence', tipo: 'fecha' },
      ]}
      inicial={cobro ? { concepto: cobro.concepto, monto: cobro.monto.toFixed(2), vence: cobro.vence } : {}}
      validar={(v) => (cobro && Number(String(v.monto).replace(/[^\d.]/g, '')) < cobro.pagado ? `No puede ser menos de lo ya pagado (${quetzales(cobro.pagado)}).` : null)}
      onGuardar={async (d) => { if (cobro?.guardado) await guardar('ctl_cobros', cobro.guardado.id, d) }}
      onCerrar={onCerrar}
    />
  )
}
