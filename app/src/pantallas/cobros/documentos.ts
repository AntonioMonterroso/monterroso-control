import { pendientes, totalSaldo, type Cobro } from '../../lib/cobros'
import { quetzales } from '../../lib/dinero'
import { fechaCorta, fechaLarga } from '../../lib/fechas'
import { esc, imprimir, SELLO } from '../../lib/imprimir'
import { nombreForma } from '../../lib/pagosDestino'
import type { Cliente, Pago } from '../../lib/tipos'

export interface DocArmado { titulo: string; cuerpo: string; dato: string }

export function htmlRecibo(p: Pago, c: Cliente | undefined, concepto: string): DocArmado {
  const n = String(p.recibo_numero ?? '').padStart(5, '0')
  const forma = nombreForma(p.forma)
  return {
    titulo: `Recibo ${n}`,
    dato: `Recibo No. ${esc(n)}`,
    cuerpo: `
    <h1>Recibo de pago</h1>
    <p class="sub">No. ${esc(n)}</p>
    <dl>
      <dt>Recibí de</dt><dd>${esc(c?.nombre)}</dd>
      ${c?.nit ? `<dt>NIT</dt><dd>${esc(c.nit)}</dd>` : ''}
      <dt>Fecha</dt><dd>${esc(fechaLarga(p.fecha))}</dd>
      <dt>Concepto</dt><dd>${esc(concepto)}</dd>
      <dt>Forma de pago</dt><dd>${esc(forma === 'Sin indicar' ? p.cuenta : forma)}${p.referencia ? `, ref. ${esc(p.referencia)}` : ''}</dd>
      <dt>Monto</dt><dd>${esc(quetzales(p.monto))}</dd>
    </dl>
    ${p.nota ? `<p>${esc(p.nota)}</p>` : ''}
    ${SELLO}
    <p class="pie">Gracias por su pago.</p>`,
  }
}

export function imprimirRecibo(p: Pago, c: Cliente | undefined, concepto: string) {
  const d = htmlRecibo(p, c, concepto)
  imprimir(d.titulo, d.cuerpo, d.dato)
}

export interface SaldoFavor { saldo: number; aplicado: { fecha: string; concepto: string; monto: number }[] }

export function htmlEstadoCuenta(c: Cliente, cobros: Cobro[], hoy: string, nombreProyecto: (id: string | null) => string, favor?: SaldoFavor): DocArmado {
  const lista = pendientes(cobros)
  const filas = lista.map((x) => `<tr><td>${esc(x.concepto)}<br><small>${esc(nombreProyecto(x.proyecto_id))}</small></td><td>${esc(x.vence ? fechaCorta(x.vence) : 'Sin fecha')}</td><td>${x.estado === 'vencido' ? 'Vencido' : 'Por cobrar'}</td><td class="n">${esc(quetzales(x.saldo))}</td></tr>`).join('')
  const favorHtml = favor && (favor.saldo > 0 || favor.aplicado.length)
    ? `<h2>Saldo a favor</h2><p>Saldo a favor disponible: <b>${esc(quetzales(favor.saldo))}</b>.</p>${favor.aplicado.length ? `<table><thead><tr><th>Fecha</th><th>Aplicado a</th><th class="n">Monto</th></tr></thead><tbody>${favor.aplicado.map((a) => `<tr><td>${esc(fechaCorta(a.fecha))}</td><td>${esc(a.concepto)}</td><td class="n">${esc(quetzales(a.monto))}</td></tr>`).join('')}</tbody></table>` : ''}`
    : ''
  return {
    titulo: `Estado de cuenta ${c.nombre}`,
    dato: esc(fechaCorta(hoy)),
    cuerpo: `
    <h1>Estado de cuenta</h1>
    <p class="sub">${esc(c.nombre)}${c.nit ? `, NIT ${esc(c.nit)}` : ''} · al ${esc(fechaLarga(hoy))}</p>
    ${lista.length ? `<table><thead><tr><th>Concepto</th><th>Vence</th><th>Estado</th><th class="n">Pendiente</th></tr></thead><tbody>${filas}</tbody><tfoot><tr><td colspan="3">Total pendiente</td><td class="n">${esc(quetzales(totalSaldo(lista)))}</td></tr></tfoot></table>` : '<p>Está al día: no tiene saldos pendientes.</p>'}
    ${favorHtml}
    ${SELLO}`,
  }
}

export function imprimirEstadoCuenta(c: Cliente, cobros: Cobro[], hoy: string, nombreProyecto: (id: string | null) => string, favor?: SaldoFavor) {
  const d = htmlEstadoCuenta(c, cobros, hoy, nombreProyecto, favor)
  imprimir(d.titulo, d.cuerpo, d.dato)
}
