import { mkdirSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs'
const html = readFileSync('dist/index.html', 'utf8')
copyFileSync('dist/index.html', 'dist/404.html')
const doc = html
  .replace('<title>Monterroso Control</title>', '<title>Documento · Studio Monterroso</title>')
  .replace('content="Studio Monterroso" />\n    <meta property="og:description" content="Desarrollo web, sistemas, música y diseño." />', 'content="Documento de Studio Monterroso" />\n    <meta property="og:description" content="Ábralo para ver su cotización, propuesta, estado de cuenta o recibo." />')
  .replace('</head>', '    <meta name="robots" content="noindex, nofollow" />\n  </head>')
  .replace('<meta property="og:type" content="website" />', '<meta property="og:type" content="website" />\n    <meta property="og:url" content="https://control.studiomonterroso.com/d/" />')
mkdirSync('dist/d', { recursive: true })
writeFileSync('dist/d/index.html', doc)
