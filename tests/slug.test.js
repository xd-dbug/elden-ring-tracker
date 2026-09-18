import { describe, expect, it } from 'vitest'
import { slugify } from '../src/lib/slug.js'
import { normalizeBosses } from '../src/lib/normalize.js'

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Starscourge Radahn')).toBe('starscourge-radahn')
  })

  it('makes API duplicates collide', () => {
    expect(slugify('Alecto, Black Knife Ringleader')).toBe(slugify('Alecto Black Knife Ringleader'))
  })
})

describe('normalizeBosses', () => {
  it('removes duplicates by slug and trims names', () => {
    const out = normalizeBosses([
      { name: ' Alecto, Black Knife Ringleader ', image: null },
      { name: 'Alecto Black Knife Ringleader' },
    ])
    expect(out).toHaveLength(1)
    expect(out[0].name).toBe('Alecto, Black Knife Ringleader')
  })
})
