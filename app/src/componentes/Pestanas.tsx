export default function Pestanas<T extends string>({ valor, opciones, onCambio, etiqueta }: { valor: T; opciones: { valor: T; nombre: string; cuenta?: number }[]; onCambio: (v: T) => void; etiqueta: string }) {
  return (
    <div className="c-pestanas" role="tablist" aria-label={etiqueta}>
      {opciones.map((o) => (
        <button key={o.valor} type="button" role="tab" aria-selected={valor === o.valor} className="c-pestana" onClick={() => onCambio(o.valor)} title={`Ver ${o.nombre.toLowerCase()}`}>
          {o.nombre}{o.cuenta != null && <span className="c-pestana-cuenta">{o.cuenta}</span>}
        </button>
      ))}
    </div>
  )
}
