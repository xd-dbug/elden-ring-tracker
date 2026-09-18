import { API_URL, normalizeBosses } from '../lib/normalize.js'
import { readJSON, writeJSON } from '../lib/storage.js'
import snapshot from '../data/bosses.snapshot.json'

const CACHE_KEY = 'ertracker:bosses-cache'
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000

/** @returns {Promise<{ bosses: object[], source: 'cache' | 'api' | 'snapshot' }>} */
export async function loadBosses() {
  const cached = readJSON(CACHE_KEY)
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return { bosses: cached.bosses, source: 'cache' }
  }
  try {
    const res = await fetch(API_URL)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const { data } = await res.json()
    const bosses = normalizeBosses(data)
    writeJSON(CACHE_KEY, { fetchedAt: Date.now(), bosses })
    return { bosses, source: 'api' }
  } catch {
    return { bosses: cached?.bosses ?? snapshot, source: 'snapshot' }
  }
}
