import { fetchAllRawBosses, normalizeBosses, withCuratedBosses } from '../lib/normalize.js'
import { readJSON, writeJSON } from '../lib/storage.js'
import snapshot from '../data/bosses.snapshot.json'
import curated from '../data/bosses.curated.json'

// Bumped to v2 when paging was added: v1 caches only hold the first 100 bosses.
const CACHE_KEY = 'ertracker:bosses-cache:v2'
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000

/** @returns {Promise<{ bosses: object[], source: 'cache' | 'api' | 'stale-cache' | 'snapshot' }>} */
export async function loadBosses(fetchImpl = fetch) {
  const { bosses, source } = await loadApiBosses(fetchImpl)
  return { bosses: withCuratedBosses(bosses, curated), source }
}

async function loadApiBosses(fetchImpl) {
  const cached = readJSON(CACHE_KEY)
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return { bosses: cached.bosses, source: 'cache' }
  }
  try {
    const bosses = normalizeBosses(await fetchAllRawBosses(fetchImpl))
    writeJSON(CACHE_KEY, { fetchedAt: Date.now(), bosses })
    return { bosses, source: 'api' }
  } catch {
    if (cached) return { bosses: cached.bosses, source: 'stale-cache' }
    return { bosses: snapshot, source: 'snapshot' }
  }
}
