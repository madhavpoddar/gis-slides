// Starts the Slidev dev server for one deck: npm run dev -- <deck>
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { DECKS_DIR, ROOT, listDecks } from './decks.mjs'

const decks = listDecks()
const [deck, ...rest] = process.argv.slice(2)
if (!deck || !decks.includes(deck)) {
  console.error(`Usage: npm run dev -- <deck>\nAvailable: ${decks.join(', ')}`)
  process.exit(1)
}

const { status } = spawnSync('npx', ['slidev', join(DECKS_DIR, deck, 'slides.md'), '--open', ...rest], {
  stdio: 'inherit',
  shell: true,
  cwd: ROOT,
})
process.exit(status ?? 0)
