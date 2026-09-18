import { slugify } from './slug.js'

export const API_URL = 'https://eldenring.fanapis.com/api/bosses?limit=200'

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
