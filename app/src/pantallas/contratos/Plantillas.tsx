import { Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAvisar } from '../../componentes/Avisos'
import Ventana from '../../componentes/Ventana'
import { useDatos } from '../../lib/datos'
import type { Clausula, PlantillaContrato } from '../../lib/tipos'

export const MARCAS = '{cliente} {nit} {direccion} {proyecto} {descripcion} {inscripcion} {partes} {mensualidad} {dia_cobro} {inicio} {fin} {entrega} {fecha} {ciudad} {prestador}'

export default function EditorPlantilla({ plantilla, onCerrar }: { plantilla: PlantillaContrato | 'nueva' | null; onCerrar: () => void }) {
  const { guardar } = useDatos()
  const avisar = useAvisar()
  const [nombre, setNombre] = useState('')
  const [encabezado, setEncabezado] = useState('')
  const [cierre, setCierre] = useState('')
  const [clausulas, setClausulas] = useState<Clausula[]>([])
  const p = plantilla && plantilla !== 'nueva' ? plantilla : null
  useEffect(() => {
    if (!plantilla) return
    setNombre(p?.nombre ?? ''); setEncabezado(p?.encabezado ?? ''); setCierre(p?.cierre ?? ''); setClausulas(p?.clausulas ?? [{ titulo: '', texto: '', fija: false }])
  }, [plantilla])
  const listo = nombre.trim() && encabezado.trim() && clausulas.every((c) => c.titulo.trim() && c.texto.trim())
  const cambiar = (i: number, k: keyof Clausula, v: string | boolean) => setClausulas((l) => l.map((c, j) => (j === i ? { ...c, [k]: v } : c)))
  const enviar = async () => {
    try {
      await guardar('ctl_plantillas_contrato', p?.id ?? null, { nombre: nombre.trim(), encabezado, cierre, clausulas })
      avisar('Plantilla guardada.')
      onCerrar()
    } catch (e) { avisar(e instanceof Error ? e.message : 'No se pudo guardar.', 'error') }
  }
  return (
    <Ventana abierta={plantilla != null} ancho="amplia" titulo={p ? 'Editar plantilla' : 'Nueva plantilla'} subtitulo={`Marcas que se llenan solas: ${MARCAS}`} onCerrar={onCerrar} pie={
      <>
        <button type="button" className="m-btn m-btn-fantasma" onClick={onCerrar} title="Cerrar sin guardar">Cancelar</button>
        <button type="button" className="m-btn m-btn-primario" disabled={!listo} onClick={() => void enviar()} title={listo ? 'Guardar la plantilla' : 'Completa el nombre, el encabezado y cada cláusula'}>Guardar plantilla</button>
      </>
    }>
      <div className="c-form">
        <div className="m-campo c-ancho"><label htmlFor="pl-n">Nombre</label><input id="pl-n" className="m-entrada" value={nombre} maxLength={120} onChange={(e) => setNombre(e.target.value)} /></div>
        <div className="m-campo c-ancho"><label htmlFor="pl-e">Encabezado</label><textarea id="pl-e" className="m-entrada" value={encabezado} maxLength={4000} onChange={(e) => setEncabezado(e.target.value)} /></div>
        {clausulas.map((c, i) => (
          <fieldset key={i} className="c-bloque c-ancho">
            <legend>Cláusula {i + 1}</legend>
            <div className="c-form c-form-interno">
              <div className="m-campo"><label htmlFor={`cl-t-${i}`}>Título</label><input id={`cl-t-${i}`} className="m-entrada" value={c.titulo} maxLength={120} onChange={(e) => cambiar(i, 'titulo', e.target.value)} /></div>
              <label className="c-casilla"><input type="checkbox" checked={c.fija} onChange={(e) => cambiar(i, 'fija', e.target.checked)} />Siempre va</label>
              <div className="m-campo c-ancho"><label htmlFor={`cl-x-${i}`}>Texto</label><textarea id={`cl-x-${i}`} className="m-entrada" value={c.texto} maxLength={4000} onChange={(e) => cambiar(i, 'texto', e.target.value)} /></div>
            </div>
            {clausulas.length > 1 && <button type="button" className="m-btn m-btn-fantasma m-btn-sm" onClick={() => setClausulas((l) => l.filter((_, j) => j !== i))} title="Quitar esta cláusula"><Trash2 size={14} aria-hidden /> Quitar</button>}
          </fieldset>
        ))}
        <div className="c-ancho"><button type="button" className="m-btn m-btn-secundario m-btn-sm" onClick={() => setClausulas((l) => [...l, { titulo: '', texto: '', fija: false }])} title="Agregar otra cláusula"><Plus size={14} aria-hidden /> Agregar cláusula</button></div>
        <div className="m-campo c-ancho"><label htmlFor="pl-c">Cierre</label><textarea id="pl-c" className="m-entrada" value={cierre} maxLength={2000} onChange={(e) => setCierre(e.target.value)} /></div>
      </div>
    </Ventana>
  )
}
