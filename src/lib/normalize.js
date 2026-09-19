import { slugify } from './slug.js'

// The API caps `limit` at 100 no matter what you ask for, so results must be paged.
const API_BASE = 'https://eldenring.fanapis.com/api/bosses'
const PAGE_SIZE = 100
const MAX_PAGES = 10

/** Fetch every page of raw bosses from the API. Throws on any HTTP error. */
export async function fetchAllRawBosses(fetchImpl = fetch) {
  const all = []
  for (let page = 0; page < MAX_PAGES; page++) {
    const res = await fetchImpl(`${API_BASE}?limit=${PAGE_SIZE}&page=${page}`)
    if (!res.ok) throw new Error(`API returned HTTP ${res.status}`)
    const { data, total } = await res.json()
    all.push(...data)
    if (data.length < PAGE_SIZE || all.length >= total) break
  }
  return all
}

// Typos in the API's region values, so the region filter doesn't list them separately.
const REGION_FIXES = {
  'Liunia of the Lakes': 'Liurnia of the Lakes',
  'Mountaintop of the Giants': 'Mountaintops of the Giants',
}

const SMALL_WORDS = new Set(['a', 'and', 'in', 'of', 'the'])

/** The API title-cases every word: "Mohg, The Omen" -> "Mohg, the Omen", "(hoarah Loux)" -> "(Hoarah Loux)". */
export function tidyName(name) {
  return String(name)
    .trim()
    .split(/\s+/)
    .map((word, i) => {
      if (i > 0 && SMALL_WORDS.has(word.toLowerCase())) return word.toLowerCase()
      return word.replace(/^(\(?)(\p{Ll})/u, (_, paren, c) => paren + c.toUpperCase())
    })
    .join(' ')
}

/** Tidy names, add slugs, fix regions, and drop duplicate bosses (the API lists some twice). */
export function normalizeBosses(raw) {
  const bySlug = new Map()
  for (const boss of raw) {
    const name = tidyName(boss.name ?? '')
    const slug = slugify(name)
    if (!slug || bySlug.has(slug)) continue
    bySlug.set(slug, {
      slug,
      name,
      image: boss.image || null,
      region: REGION_FIXES[boss.region] ?? boss.region ?? null,
      location: boss.location ?? null,
      description: boss.description ?? '',
      drops: boss.drops ?? [],
    })
  }
  return [...bySlug.values()]
}

/** Add curated bosses the API is missing. API entries win when both exist. */
export function withCuratedBosses(bosses, curated) {
  const known = new Set(bosses.map((b) => b.slug))
  return [...bosses, ...curated.filter((b) => !known.has(b.slug))]
}
