import { useMemo } from 'react'
import { svgLogo, type Area } from '../lib/marca'

export default function LogoStudio({ area = 'corporativo', className, alt = 'Studio Monterroso' }: { area?: Area; className?: string; alt?: string }) {
  const html = useMemo(() => svgLogo({ area, m: 'var(--logo-m, var(--primary))', texto: 'var(--logo-texto, var(--text))' }), [area])
  return <span className={`c-logo-svg ${className ?? ''}`} role="img" aria-label={alt} dangerouslySetInnerHTML={{ __html: html }} />
}
