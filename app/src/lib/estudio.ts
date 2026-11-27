export type ClaveEstudio = 'dev' | 'musica' | 'diseno'

export const CLAVES_ESTUDIO: ClaveEstudio[] = ['dev', 'musica', 'diseno']

export const esEstudio = (c: string | null | undefined): c is ClaveEstudio => c === 'dev' || c === 'musica' || c === 'diseno'
