import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAvisar } from '../../componentes/Avisos'
import Comprobantes, { SIN_COMPROBANTES, subirComprobantes, type ValorComprobantes } from '../../componentes/Comprobantes'
import SelectBuscable from '../../componentes/SelectBuscable'
import Ventana from '../../componentes/Ventana'
import { useDatos } from '../../lib/datos'
import type { EntradaDinero } from '../../lib/entradas'
import { useOpcionesDestino } from '../cobros/Ventanas'

export function VentanaTiendaDestino({ entrada, onCerrar }: { entrada: EntradaDinero | null; onCerrar: () => void }) {
  const { guardar, almacen } = useDatos()
  const avisar = useAvisar()
  const destinos = useOpcionesDestino(entrada?.destino)
  const [destino, setDestino] = useState('')
  const [comp, setComp] = useState<ValorComprobantes>(SIN_COMPROBANTES)
  useEffect(() => { if (entrada) { setDestino(entrada.destino ?? ''); setComp({ existentes: entrada.comprobantes, nuevos: [] }) } }, [entrada])
  return (
    <Ventana abierta={entrada != null} titulo="Pago de la tienda" subtitulo="La fecha, el medio y los pedidos se corrigen en Pagos de pedidos." onCerrar={onCerrar} pie={
      <>
        <button type="button" className="m-btn m-btn-secundario" onClick={onCerrar} title="Cierra sin guardar">Cancelar</button>
        <button type="button" className="m-btn m-btn-primario c-btn-principal" onClick={async () => {
          if (!entrada?.tienda) return
          const comprobantes = await subirComprobantes(almacen, 'tienda', comp)
          await guardar('ctl_tienda_pagos', entrada.tienda.id, { destino: destino || null, comprobantes })
          avisar('Guardado.')
          onCerrar()
        }} title="Guarda dónde cayó y los comprobantes">Guardar</button>
      </>
    }>
      <div className="c-form">
        <div className="m-campo"><label htmlFor="td-destino">Dónde cayó</label><SelectBuscable id="td-destino" valor={destino} onCambio={setDestino} vacio="Sin indicar" opciones={destinos} /></div>
        <div className="m-campo c-ancho"><label htmlFor="td-comp">Comprobante <span className="c-opcional">(opcional)</span></label><Comprobantes id="td-comp" valor={comp} onCambio={setComp} /></div>
        <p className="c-ancho"><Link to="/tienda/pagos" className="c-enlace" onClick={onCerrar}>Ir a Pagos de pedidos</Link></p>
      </div>
    </Ventana>
  )
}
