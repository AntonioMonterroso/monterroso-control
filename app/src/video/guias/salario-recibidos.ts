import { guiaPagos } from './pagos'

const guia = guiaPagos({
  ruta: '/salario/recibidos',
  menu: 'Salario recibido',
  etiqueta: 'Salario',
  tipo: 'salario',
  filas: [
    ['30 sep 2026', 'Mi salario', 'Salario', 'Transferencia', 'Personal · Banco Uno ••4821', 'Q 3,000.00'],
    ['31 oct 2026', 'Mi salario', 'Salario', 'Transferencia', '—', 'Q 3,000.00'],
  ],
  total: 'Q 6,000.00',
})

export default guia
