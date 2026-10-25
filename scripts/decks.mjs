import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

export const ROOT = resolve(import.meta.dirname, '..')
export const DECKS_DIR = join(ROOT, 'decks')

// A deck is any folder in decks/ that contains a slides.md.
// Folders starting with "_" or "." are ignored (drafts, templates).
export function listDecks() {
  return readdirSync(DECKS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory() && !/^[_.]/.test(d.name))
    .filter(d => existsSync(join(DECKS_DIR, d.name, 'slides.md')))
    .map(d => d.name)
    .sort()
}

// Reads `title:` and `info:` from the deck's headmatter for the index page.
export function readDeckMeta(name) {
  const src = readFileSync(join(DECKS_DIR, name, 'slides.md'), 'utf8')
  const head = src.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? ''
  const field = (key) => {
    // Handles `key: value` as well as block scalars (`key: |` + indented lines)
    const m = head.match(new RegExp(`^${key}:[ \\t]*(.*)((?:\\r?\\n[ \\t]+.*)*)`, 'm'))
    if (!m) return undefined
    const value = /^[|>][-+]?$/.test(m[1].trim()) ? m[2] : m[1]
    return value.split(/\r?\n/).map(l => l.trim()).filter(Boolean).join(' ').replace(/^['"]|['"]$/g, '') || undefined
  }
  return { name, title: field('title') ?? name, info: field('info') }
}
