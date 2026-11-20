import { htmlDocumento } from './documentos'
import { PLANTILLA_BASE } from './semillas'
import { documentoHtml } from './imprimir'
import { AREAS, COLORES_MARCA, iconoArea, svgIsotipo, svgLogo } from './marca'
import { fuenteBase64, portada, publicacion, tarjetaFrente, tarjetaReverso } from './marcaPiezas'

;(window as unknown as { __marca: unknown }).__marca = { PLANTILLA_BASE, documentoHtml, htmlDocumento, AREAS, COLORES_MARCA, iconoArea, svgIsotipo, svgLogo, fuenteBase64, portada, publicacion, tarjetaFrente, tarjetaReverso }
