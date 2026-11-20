import { Copy } from 'lucide-react'
import { useAvisar } from './Avisos'

export default function Copiable({ valor, etiqueta, secreto, femenino }: { valor: string; etiqueta: string; secreto?: boolean; femenino?: boolean }) {
  const avisar = useAvisar()
  const copiar = async () => {
    try { await navigator.clipboard.writeText(valor); avisar(`${etiqueta} ${femenino ? 'copiada' : 'copiado'}.`) } catch { avisar('No se pudo copiar.', 'error') }
  }
  return (
    <button type="button" className="c-copiable" onClick={(e) => { e.stopPropagation(); void copiar() }} aria-label={`Copiar ${etiqueta.toLowerCase()}`} title={`Copia ${femenino ? 'la' : 'el'} ${etiqueta.toLowerCase()}${secreto ? ' sin mostrarla' : ''}`}>
      <span>{secreto ? '••••••••' : valor}</span><Copy size={14} aria-hidden />
    </button>
  )
}
