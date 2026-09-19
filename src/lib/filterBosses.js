// Pure search/filter helpers for the Boss List.

/** Lowercase and strip accents and apostrophes, so "godricks" finds "Godrick's". */
const fold = (s) =>
  String(s ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’]/g, '')
    .toLowerCase()

export function sortByName(bosses) {
  return [...bosses].sort((a, b) => a.name.localeCompare(b.name))
}

export function getRegions(bosses) {
  return [...new Set(bosses.map((b) => b.region).filter(Boolean))].sort()
}

/**
 * Every active filter must match (they combine with AND).
 * @param {{ q?: string, region?: string, required?: boolean, extra?: boolean, favorites?: boolean, status?: 'all' | 'remaining' | 'defeated' }} filters
 * @param {{ required: Set<string>, extras: Set<string>, favorites: Set<string>, defeated: Set<string> }} sets
 */
export function filterBosses(bosses, filters, sets) {
  const words = fold(filters.q).split(/\s+/).filter(Boolean)
  return bosses.filter((b) => {
    if (words.length) {
      const text = fold([b.name, b.region, b.location].filter(Boolean).join(' '))
      if (!words.every((w) => text.includes(w))) return false
    }
    if (filters.region && b.region !== filters.region) return false
    if (filters.required && !sets.required.has(b.slug)) return false
    if (filters.extra && !sets.extras.has(b.slug)) return false
    if (filters.favorites && !sets.favorites.has(b.slug)) return false
    if (filters.status === 'defeated' && !sets.defeated.has(b.slug)) return false
    if (filters.status === 'remaining' && sets.defeated.has(b.slug)) return false
    return true
  })
}
