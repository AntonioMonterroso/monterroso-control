import { pendientes, totalSaldo, type Cobro } from '../../lib/cobros'
import { quetzales } from '../../lib/dinero'
import { fechaCorta, fechaLarga } from '../../lib/fechas'
import { esc, imprimir, SELLO } from '../../lib/imprimir'
import type { Cliente, Pago } from '../../lib/tipos'

export function imprimirRecibo(p: Pago, c: Cliente | undefined, concepto: string) {
  const n = String(p.recibo_numero ?? '').padStart(5, '0')
  imprimir(`Recibo ${n}`, `
    <h1>Recibo de pago</h1>
    <p class="sub">No. ${esc(n)}</p>
    <dl>
      <dt>Recibí de</dt><dd>${esc(c?.nombre)}</dd>
      ${c?.nit ? `<dt>NIT</dt><dd>${esc(c.nit)}</dd>` : ''}
      <dt>Fecha</dt><dd>${esc(fechaLarga(p.fecha))}</dd>
      <dt>Concepto</dt><dd>${esc(concepto)}</dd>
      <dt>Forma de pago</dt><dd>${esc(p.cuenta)}${p.referencia ? `, ref. ${esc(p.referencia)}` : ''}</dd>
      <dt>Monto</dt><dd>${esc(quetzales(p.monto))}</dd>
    </dl>
    ${p.nota ? `<p>${esc(p.nota)}</p>` : ''}
    ${SELLO}
    <p class="pie">Gracias por su pago.</p>`, `Recibo No. ${esc(n)}`)
}

export function imprimirEstadoCuenta(c: Cliente, cobros: Cobro[], hoy: string, nombreProyecto: (id: string | null) => string) {
  const lista = pendientes(cobros)
  const filas = lista.map((x) => `<tr><td>${esc(x.concepto)}<br><small>${esc(nombreProyecto(x.proyecto_id))}</small></td><td>${esc(x.vence ? fechaCorta(x.vence) : 'Sin fecha')}</td><td>${x.estado === 'vencido' ? 'Vencido' : 'Por cobrar'}</td><td class="n">${esc(quetzales(x.saldo))}</td></tr>`).join('')
  imprimir(`Estado de cuenta ${c.nombre}`, `
    <h1>Estado de cuenta</h1>
    <p class="sub">${esc(c.nombre)}${c.nit ? `, NIT ${esc(c.nit)}` : ''} · al ${esc(fechaLarga(hoy))}</p>
    ${lista.length ? `<table><thead><tr><th>Concepto</th><th>Vence</th><th>Estado</th><th class="n">Pendiente</th></tr></thead><tbody>${filas}</tbody><tfoot><tr><td colspan="3">Total pendiente</td><td class="n">${esc(quetzales(totalSaldo(lista)))}</td></tr></tfoot></table>` : '<p>Está al día: no tiene saldos pendientes.</p>'}
    ${SELLO}`, esc(fechaCorta(hoy)))
}
