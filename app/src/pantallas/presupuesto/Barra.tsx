export default function Barra({ avance, tipo }: { avance: number; tipo: 'gasto' | 'ingreso' }) {
  const pasado = tipo === 'gasto' ? avance > 1 : false
  const bien = tipo === 'ingreso' ? avance >= 1 : avance <= 0.9
  return (
    <span className={`c-barra ${pasado ? 'c-barra-mal' : bien ? 'c-barra-bien' : 'c-barra-cerca'}`} role="img" aria-label={`${Math.round(avance * 100)} %`}>
      <span style={{ transform: `scaleX(${Math.min(1, avance)})` }} />
    </span>
  )
}
