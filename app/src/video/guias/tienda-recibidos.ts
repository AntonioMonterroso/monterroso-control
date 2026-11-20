import { guiaPagos } from './pagos'

const guia = guiaPagos({
  ruta: '/tienda/recibidos',
  menu: 'Pagos que recibí',
  etiqueta: 'Hogar Canela',
  tipo: 'tienda',
  filas: [
    ['15 nov 2026', 'Hogar Canela', 'Pedido #1021', 'Tarjeta', 'Personal · Banco Uno ••4821', 'Q 325.00'],
    ['18 nov 2026', 'Hogar Canela', 'Pedido #1024', 'Efectivo', '—', 'Q 200.00'],
  ],
  total: 'Q 525.00',
})

export default guia
