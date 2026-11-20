import Ventana from './Ventana'

export default function Confirmar({ abierta, titulo, texto, boton, peligro, onSi, onNo }: { abierta: boolean; titulo: string; texto: string; boton: string; peligro?: boolean; onSi: () => void; onNo: () => void }) {
  return (
    <Ventana abierta={abierta} titulo={titulo} onCerrar={onNo} pie={
      <>
        <button type="button" className="m-btn m-btn-fantasma" onClick={onNo} title="No hacer nada">Cancelar</button>
        <button type="button" className={`m-btn ${peligro ? 'm-btn-peligro' : 'm-btn-primario'}`} onClick={onSi} title={boton}>{boton}</button>
      </>
    }>
      <p>{texto}</p>
    </Ventana>
  )
}
