import { useEffect, useMemo, useRef } from 'react'
import { useAvisar } from '../../componentes/Avisos'
import { autoAplicables } from '../../lib/anticipos'
import { pendientes } from '../../lib/cobros'
import { quetzales } from '../../lib/dinero'
import { useEscribir } from '../../lib/escribir'
import { useModelo } from '../../lib/modelo'
import { useCobros, useHoy } from '../../lib/usos'

export default function AplicarSolo() {
  const m = useModelo()
  const cobros = useCobros()
  const esc = useEscribir()
  const escRef = useRef(esc)
  escRef.current = esc
  const avisar = useAvisar()
  const hoy = useHoy()
  const hechos = useRef(new Set<string>())
  const corriendo = useRef(false)
  const plan = useMemo(() => autoAplicables(hoy, m.anticipos, m.pagos, pendientes(cobros)), [hoy, m.anticipos, m.pagos, cobros])
  useEffect(() => {
    const nuevos = plan.filter((p) => !hechos.current.has(`${p.anticipo_id}:${p.cobro_clave}`))
    if (!nuevos.length || corriendo.current) return
    corriendo.current = true
    nuevos.forEach((p) => hechos.current.add(`${p.anticipo_id}:${p.cobro_clave}`))
    const total = nuevos.reduce((t, p) => t + p.monto, 0)
    const quien = [...new Set(nuevos.map((p) => m.clientes.find((c) => c.id === m.anticipos.find((a) => a.id === p.anticipo_id)?.cliente_id)?.nombre).filter(Boolean))].join(', ')
    void escRef.current.aplicarAnticipos(nuevos, hoy)
      .then((deshacer) => avisar(`Se aplicaron solos ${quetzales(total)} del saldo a favor${quien ? ` de ${quien}` : ''} a ${nuevos.length === 1 ? 'su cobro vencido' : `${nuevos.length} cobros vencidos`}.`, 'bien', { texto: 'Deshacer', hacer: async () => { await deshacer(); avisar('Se deshizo: quedan otra vez a favor.') } }))
      .catch((e: unknown) => avisar(e instanceof Error ? e.message : 'No se pudo aplicar el saldo a favor.', 'error'))
      .finally(() => { corriendo.current = false })
  }, [plan])
  return null
}
