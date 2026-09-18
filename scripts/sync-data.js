// Pulls bosses from the fan API, normalizes them, and writes the offline snapshot.
// Usage: npm run sync-data
import { writeFile } from 'node:fs/promises'
import { API_URL, normalizeBosses } from '../src/lib/normalize.js'

const res = await fetch(API_URL)
if (!res.ok) throw new Error(`API returned HTTP ${res.status}`)
const { data } = await res.json()
const bosses = normalizeBosses(data)

const out = new URL('../src/data/bosses.snapshot.json', import.meta.url)
await writeFile(out, JSON.stringify(bosses, null, 2) + '\n')
console.log(
  `Wrote ${bosses.length} bosses (from ${data.length} raw) to src/data/bosses.snapshot.json`,
)
