import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { loadBosses } from '../src/api/bosses.js'
import { fetchAllRawBosses, withCuratedBosses } from '../src/lib/normalize.js'
import snapshot from '../src/data/bosses.snapshot.json'

const CACHE_KEY = 'ertracker:bosses-cache:v3'

function memoryStorage() {
  const store = new Map()
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  }
}

// Fake API: `total` bosses served 100 per page, like the real one.
function fakeApi(total) {
  const all = Array.from({ length: total }, (_, i) => ({ name: `Boss ${i}` }))
  return vi.fn(async (url) => {
    const page = Number(new URL(url).searchParams.get('page'))
    return {
      ok: true,
      json: async () => ({ total, data: all.slice(page * 100, page * 100 + 100) }),
    }
  })
}

const failingApi = vi.fn(async () => ({ ok: false, status: 503 }))

beforeEach(() => vi.stubGlobal('localStorage', memoryStorage()))
afterEach(() => vi.unstubAllGlobals())

describe('fetchAllRawBosses', () => {
  it('follows pages past the 100-item API cap', async () => {
    const api = fakeApi(106)
    expect(await fetchAllRawBosses(api)).toHaveLength(106)
    expect(api).toHaveBeenCalledTimes(2)
  })
})

describe('withCuratedBosses', () => {
  it('only adds curated bosses the API lacks', () => {
    const out = withCuratedBosses(
      [{ slug: 'a', name: 'API A' }],
      [
        { slug: 'a', name: 'Curated A' },
        { slug: 'b', name: 'Curated B' },
      ],
    )
    expect(out.map((b) => b.name)).toEqual(['API A', 'Curated B'])
  })
})

describe('loadBosses', () => {
  it('fetches, normalizes, caches, and adds curated bosses', async () => {
    const { bosses, source } = await loadBosses(fakeApi(3))
    expect(source).toBe('api')
    expect(bosses.map((b) => b.slug)).toContain('boss-2')
    expect(bosses.map((b) => b.slug)).toContain('morgott-the-omen-king')
    expect(JSON.parse(localStorage.getItem(CACHE_KEY)).bosses).toHaveLength(3)
  })

  it('uses a fresh cache without fetching', async () => {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ fetchedAt: Date.now(), bosses: [{ slug: 'c' }] }),
    )
    const api = fakeApi(3)
    const { source } = await loadBosses(api)
    expect(source).toBe('cache')
    expect(api).not.toHaveBeenCalled()
  })

  it('falls back to a stale cache when the API is down', async () => {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ fetchedAt: 0, bosses: [{ slug: 'c' }] }))
    const { bosses, source } = await loadBosses(failingApi)
    expect(source).toBe('stale-cache')
    expect(bosses[0].slug).toBe('c')
  })

  it('falls back to the snapshot when the API is down and nothing is cached', async () => {
    const { bosses, source } = await loadBosses(failingApi)
    expect(source).toBe('snapshot')
    expect(bosses.length).toBeGreaterThan(snapshot.length) // snapshot + curated
  })

  it('still works when localStorage throws', async () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('denied')
      },
      setItem: () => {
        throw new Error('denied')
      },
    })
    expect((await loadBosses(fakeApi(3))).source).toBe('api')
  })
})
