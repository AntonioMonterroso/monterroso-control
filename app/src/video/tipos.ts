export interface Boton { t: string; g?: string; p?: boolean }
export interface Celda { t: string; g?: string }

export type Pieza =
  | { k: 'cifras'; g?: string; l: { et: string; v: string; sub?: string; g?: string }[] }
  | { k: 'botones'; g?: string; l: Boton[] }
  | { k: 'chips'; g?: string; l: { t: string; on?: boolean; g?: string }[] }
  | { k: 'pestanas'; g?: string; l: { t: string; g?: string }[]; on: number }
  | { k: 'busca'; g?: string; t: string }
  | { k: 'tabla'; g?: string; cab: string[]; filas: { c: string[]; g?: string; acc?: Boton[] }[]; pie?: string[] }
  | { k: 'campos'; g?: string; l: { et: string; v: string; g?: string }[] }
  | { k: 'subtitulo'; g?: string; t: string }
  | { k: 'texto'; g?: string; t: string }
  | { k: 'aviso'; g?: string; t: string }
  | { k: 'ok'; g?: string; t: string }
  | { k: 'menu'; g?: string; l: Boton[] }

export interface Hoja { titulo: string; piezas: Pieza[]; pie?: Boton[] }

export interface Escena {
  etiqueta?: string
  titulo: string
  acciones?: Boton[]
  piezas: Pieza[]
  hoja?: Hoja | null
}

export interface Toma { t: string; en?: string; clic?: boolean; ms?: number; luego?: Partial<Escena> }

export interface Capitulo { t: string; e0: Escena; tomas: Toma[] }

export interface GuiaVideo { ruta: string; menu: string; caps: Capitulo[] }
