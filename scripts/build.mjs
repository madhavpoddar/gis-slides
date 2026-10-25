// Builds every deck (or only the ones named on the command line) into
// dist/<deck>/ and writes dist/index.html listing all decks.
//
//   npm run build                     -> all decks
//   npm run build -- map-projections  -> one deck
//
// BASE_PATH must match the GitHub Pages path of the repo (default /gis-slides/).
import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { DECKS_DIR, ROOT, listDecks, readDeckMeta } from './decks.mjs'

const BASE = (process.env.BASE_PATH ?? '/gis-slides/').replace(/\/?$/, '/')
const DIST = join(ROOT, 'dist')

const all = listDecks()
const requested = process.argv.slice(2)
const unknown = requested.filter(d => !all.includes(d))
if (unknown.length) {
  console.error(`Unknown deck(s): ${unknown.join(', ')}\nAvailable: ${all.join(', ')}`)
  process.exit(1)
}
const decks = requested.length ? requested : all

for (const deck of decks) {
  console.log(`\n▶ Building ${deck} → ${BASE}${deck}/`)
  const { status } = spawnSync(
    'npx',
    ['slidev', 'build', join(DECKS_DIR, deck, 'slides.md'), '--base', `${BASE}${deck}/`, '--out', join(DIST, deck)],
    { stdio: 'inherit', shell: true, cwd: ROOT },
  )
  if (status !== 0) process.exit(status ?? 1)
}

const escape = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const links = all
  .map(readDeckMeta)
  .map(({ name, title, info }) =>
    `<a href="./${name}/"><span>▶ ${escape(title)}</span>${info ? `<small>${escape(info)}</small>` : ''}</a>`)
  .join('\n')

mkdirSync(DIST, { recursive: true })
writeFileSync(join(DIST, '.nojekyll'), '')
writeFileSync(join(DIST, 'index.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>GIS Course Slides</title><style>body{font-family:system-ui,sans-serif;max-width:640px;margin:4rem auto;padding:0 1.5rem;color:#1e293b}h1{font-weight:600}a{display:block;margin:.8rem 0;color:#2563eb;font-size:1.1rem;text-decoration:none}a:hover span{text-decoration:underline}small{display:block;color:#64748b;font-size:.85rem;margin-left:1.3rem}</style></head><body><h1>GIS — Slides</h1>
${links}
</body></html>
`)
console.log(`\n✔ Built ${decks.length} deck(s) into dist/`)
