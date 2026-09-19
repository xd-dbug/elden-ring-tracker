import { describe, expect, it } from 'vitest'
import { filterBosses, getRegions, sortByName } from '../src/lib/filterBosses.js'

const bosses = [
  {
    slug: 'godrick',
    name: 'Godrick the Grafted',
    region: 'Limgrave',
    location: 'Stormveil Castle',
  },
  { slug: 'radahn', name: 'Starscourge Radahn', region: 'Caelid', location: 'Redmane Castle' },
  { slug: 'fia', name: "Fia's Champions", region: 'Limgrave', location: 'Deeproot Depths' },
  { slug: 'agheel', name: 'Flying Dragon Agheel', region: 'Limgrave', location: 'Agheel Lake' },
  { slug: 'custom', name: 'Éclair Knight', region: null, location: null },
]

const sets = {
  required: new Set(['godrick', 'radahn']),
  extras: new Set(['agheel']),
  favorites: new Set(['radahn', 'agheel']),
  defeated: new Set(['godrick', 'agheel']),
}

const slugs = (filters) => filterBosses(bosses, filters, sets).map((b) => b.slug)

describe('filterBosses', () => {
  it('returns everything with no filters', () => {
    expect(slugs({})).toHaveLength(bosses.length)
  })

  it('searches name, region, and location, ignoring case, accents, and apostrophes', () => {
    expect(slugs({ q: 'RADAHN' })).toEqual(['radahn'])
    expect(slugs({ q: 'stormveil' })).toEqual(['godrick'])
    expect(slugs({ q: 'fias' })).toEqual(['fia'])
    expect(slugs({ q: 'eclair' })).toEqual(['custom'])
  })

  it('requires every search word to match', () => {
    expect(slugs({ q: 'limgrave dragon' })).toEqual(['agheel'])
    expect(slugs({ q: '  ' })).toHaveLength(bosses.length)
  })

  it('filters by region, required, extra, favorites, and status', () => {
    expect(slugs({ region: 'Caelid' })).toEqual(['radahn'])
    expect(slugs({ required: true })).toEqual(['godrick', 'radahn'])
    expect(slugs({ extra: true })).toEqual(['agheel'])
    expect(slugs({ favorites: true })).toEqual(['radahn', 'agheel'])
    expect(slugs({ status: 'defeated' })).toEqual(['godrick', 'agheel'])
    expect(slugs({ status: 'remaining' })).toEqual(['radahn', 'fia', 'custom'])
  })

  it('combines all filters with AND', () => {
    expect(slugs({ region: 'Limgrave', favorites: true, status: 'defeated' })).toEqual(['agheel'])
    expect(slugs({ required: true, status: 'remaining', q: 'star' })).toEqual(['radahn'])
    expect(slugs({ required: true, extra: true })).toEqual([])
  })
})

describe('sortByName / getRegions', () => {
  it('sorts by name without mutating the input', () => {
    const sorted = sortByName(bosses)
    expect(sorted[0].name).toBe('Éclair Knight')
    expect(bosses[0].slug).toBe('godrick')
  })

  it('lists unique, sorted, non-empty regions', () => {
    expect(getRegions(bosses)).toEqual(['Caelid', 'Limgrave'])
  })
})
