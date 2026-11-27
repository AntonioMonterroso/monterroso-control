import type { GuiaVideo } from '../tipos'
import base from './pagos'

const guia: GuiaVideo = { ...base, ruta: '/dev/pagos', menu: 'Pagos que recibí' }

export default guia
