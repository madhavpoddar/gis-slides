// Scaffolds a new deck from decks/_template: npm run new -- <deck> ["Title"]
import { cpSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { DECKS_DIR } from './decks.mjs'

const [name, title = name] = process.argv.slice(2)
if (!name || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) {
  console.error('Usage: npm run new -- <deck-name> ["Deck title"]\nDeck name must be kebab-case, e.g. vector-vs-raster')
  process.exit(1)
}
const dir = join(DECKS_DIR, name)
if (existsSync(dir)) {
  console.error(`decks/${name} already exists`)
  process.exit(1)
}

cpSync(join(DECKS_DIR, '_template'), dir, { recursive: true })
const slides = join(dir, 'slides.md')
writeFileSync(slides, readFileSync(slides, 'utf8').replaceAll('{{TITLE}}', title))
console.log(`Created decks/${name}\n  npm run dev -- ${name}`)
