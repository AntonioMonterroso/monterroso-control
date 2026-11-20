import Pasos from '../../componentes/Pasos'
import { CheckCircle2, ListPlus, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useAvisar } from '../../componentes/Avisos'
import FormRegistro from '../../componentes/FormRegistro'
import Tabla from '../../componentes/Tabla'
import { useDatos } from '../../lib/datos'
import { fechaCorta } from '../../lib/fechas'
import { useQuitar } from '../../lib/quitar'
import { diasPara, obligacionesComunes, siguienteFecha, type Recordatorio } from '../../lib/sa'
import { useSA } from '../../lib/saModelo'
import { useHoy } from '../../lib/usos'

const CADA: Record<Recordatorio['cada'], string> = { mensual: 'Cada mes', trimestral: 'Cada trimestre', anual: 'Cada año', unico: 'Una vez' }

export default function RecordatoriosSA() {
  const { m, s } = useSA()
  const { guardar, insertar } = useDatos()
  const avisar = useAvisar()
  const hoy = useHoy()
  const q = useQuitar()
  const [editar, setEditar] = useState<Recordatorio | 'nuevo' | null>(null)
  const r = editar && editar !== 'nuevo' ? editar : null
  const hecho = async (x: Recordatorio) => {
    const antes = { proxima: x.proxima, hecho_el: x.hecho_el, activo: x.activo }
    await guardar('ctl_recordatorios', x.id, x.cada === 'unico' ? { hecho_el: hoy, activo: false } : { hecho_el: hoy, proxima: siguienteFecha(x.proxima, x.cada) })
    avisar(x.cada === 'unico' ? 'Marcado como hecho.' : `Hecho. Siguiente: ${fechaCorta(siguienteFecha(x.proxima, x.cada))}.`, 'bien', { texto: 'Deshacer', hacer: async () => { await guardar('ctl_recordatorios', x.id, antes) } })
  }
  const estado = (x: Recordatorio) => {
    if (!x.activo) return <span className="m-estado bloqueado">{x.hecho_el ? `Hecho ${fechaCorta(x.hecho_el)}` : 'Apagado'}</span>
    const d = diasPara(x.proxima, hoy)
    if (d < 0) return <span className="m-estado error">Venció hace {-d} {d === -1 ? 'día' : 'días'}</span>
    if (d <= x.dias_aviso) return <span className="m-estado pendiente">{d === 0 ? 'Hoy' : `En ${d} ${d === 1 ? 'día' : 'días'}`}</span>
    return <span className="m-estado aprobado">En {d} días</span>
  }
  return (
    <>
      <div className="c-cabeza">
        <div><span className="m-etiqueta">Sociedad anónima</span><h1 className="erp-titulo">Recordatorios y vencimientos</h1><Pasos /></div>
        <div className="c-cabeza-acciones">
          <button type="button" className="m-btn m-btn-secundario" disabled={!s?.regimen} onClick={async () => { await insertar('ctl_recordatorios', obligacionesComunes({ regimen: s!.regimen, cierre_mes: s!.cierre_mes }, hoy)); avisar('Se agregaron las obligaciones comunes. Revisa sus fechas.') }} title={s?.regimen ? 'Agregar las obligaciones que se repiten según el régimen (revisa sus fechas)' : 'Pon el régimen en la ficha de la sociedad'}><ListPlus size={16} aria-hidden /> Obligaciones comunes</button>
          <button type="button" className="m-btn m-btn-primario" onClick={() => setEditar('nuevo')} title="Agregar un recordatorio propio"><Plus size={16} aria-hidden /> Recordatorio</button>
        </div>
      </div>
      <p className="m-texto-suave c-intro">Los que están por vencer salen en «Para no olvidar» de Inicio y en las notificaciones. El vencimiento del nombramiento del representante legal se toma de la ficha.</p>
      <Tabla filas={m.recordatorios} clave={(x) => x.id} vacio="Sin recordatorios. Agrega las obligaciones comunes o uno propio."
        quitarVarias={(l) => q.pedir('ctl_recordatorios', l, `Se quitan ${l.length} recordatorios.`)}
        columnas={[
          { titulo: 'Recordatorio', principal: true, valor: (x) => <>{x.titulo}{x.detalle && <small>{x.detalle}</small>}</> },
          { titulo: 'Se repite', valor: (x) => CADA[x.cada] },
          { titulo: 'Próxima', valor: (x) => fechaCorta(x.proxima), orden: (x) => x.proxima },
          { titulo: 'Aviso', num: true, valor: (x) => `${x.dias_aviso} días antes`, orden: (x) => x.dias_aviso },
          { titulo: 'Estado', valor: estado, orden: (x) => (x.activo ? diasPara(x.proxima, hoy) : 9999) },
        ]}
        acciones={(x) => (
          <>
            {x.activo && <button type="button" className="m-btn m-btn-primario m-btn-sm" onClick={() => void hecho(x)} title={x.cada === 'unico' ? 'Marcar como hecho' : 'Marcar como hecho y pasar a la siguiente fecha'}><CheckCircle2 size={14} aria-hidden /> Hecho</button>}
            <button type="button" className="m-icono-btn" onClick={() => setEditar(x)} aria-label="Editar" title="Editar el recordatorio"><Pencil aria-hidden /></button>
            <button type="button" className="m-icono-btn" onClick={() => q.pedir('ctl_recordatorios', [x], `Se quita «${x.titulo}».`)} aria-label="Quitar" title="Quitar el recordatorio (se puede deshacer)"><Trash2 aria-hidden /></button>
          </>
        )} />
      <FormRegistro abierta={editar != null} titulo={r ? 'Editar recordatorio' : 'Nuevo recordatorio'}
        campos={[
          { k: 'titulo', etiqueta: 'Qué hay que hacer', tipo: 'texto', requerido: true, max: 200, ancho: true },
          { k: 'proxima', etiqueta: 'Próxima fecha', tipo: 'fecha', requerido: true },
          { k: 'cada', etiqueta: 'Se repite', tipo: 'select', requerido: true, opciones: Object.entries(CADA).map(([valor, nombre]) => ({ valor, nombre })) },
          { k: 'dias_aviso', etiqueta: 'Avisar con días de anticipación', tipo: 'numero', requerido: true, min: 0, max: 120 },
          { k: 'detalle', etiqueta: 'Detalle', tipo: 'area', max: 1000 },
          { k: 'activo', etiqueta: 'Activo', tipo: 'casilla' },
        ]}
        inicial={r ? (r as unknown as Record<string, unknown>) : { cada: 'anual', dias_aviso: 7, activo: true, proxima: hoy }}
        onGuardar={async (x) => { await guardar('ctl_recordatorios', r?.id ?? null, x) }}
        onCerrar={() => setEditar(null)} />
      {q.ventana}
    </>
  )
}
