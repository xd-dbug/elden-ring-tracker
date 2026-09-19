// Pulls bosses from the fan API, normalizes them, and writes the offline snapshot.
// Usage: npm run sync-data
import { writeFile } from 'node:fs/promises'
import { fetchAllRawBosses, normalizeBosses } from '../src/lib/normalize.js'

const raw = await fetchAllRawBosses()
const bosses = normalizeBosses(raw)

const out = new URL('../src/data/bosses.snapshot.json', import.meta.url)
await writeFile(out, JSON.stringify(bosses, null, 2) + '\n')
console.log(
  `Wrote ${bosses.length} bosses (from ${raw.length} raw) to src/data/bosses.snapshot.json`,
)
