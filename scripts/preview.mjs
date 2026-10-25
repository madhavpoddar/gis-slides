// Serves dist/ under BASE_PATH so built decks work exactly as on GitHub Pages.
import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize } from 'node:path'
import { ROOT } from './decks.mjs'

const BASE = (process.env.BASE_PATH ?? '/gis-slides/').replace(/\/?$/, '/')
const DIST = join(ROOT, 'dist')
const PORT = Number(process.env.PORT ?? 3000)
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.woff2': 'font/woff2', '.geojson': 'application/geo+json' }

createServer((req, res) => {
  const url = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  if (!url.startsWith(BASE)) {
    res.writeHead(302, { Location: BASE }).end()
    return
  }
  let file = join(DIST, normalize(url.slice(BASE.length)).replace(/^(\.\.[/\\])+/, ''))
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html')
  if (!existsSync(file)) {
    res.writeHead(404).end('Not found')
    return
  }
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' })
  createReadStream(file).pipe(res)
}).listen(PORT, () => console.log(`Serving dist/ at http://localhost:${PORT}${BASE}`))
