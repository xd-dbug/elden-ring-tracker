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

/** Trim names, add slugs, and drop duplicate bosses (the API lists some twice). */
export function normalizeBosses(raw) {
  const bySlug = new Map()
  for (const boss of raw) {
    const name = String(boss.name ?? '').trim()
    const slug = slugify(name)
    if (!slug || bySlug.has(slug)) continue
    bySlug.set(slug, {
      slug,
      name,
      image: boss.image || null,
      region: boss.region ?? null,
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
