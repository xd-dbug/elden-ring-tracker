import { describe, expect, it } from 'vitest'
import {
  getBossRoles,
  getGroupStatus,
  getProgress,
  getRequiredForEnding,
  getRunList,
} from '../src/lib/progress.js'
import endings from '../src/data/endings.json'
import snapshot from '../src/data/bosses.snapshot.json'
import curated from '../src/data/bosses.curated.json'

const data = {
  commonRequired: ['a', 'b'],
  groups: [{ id: 'runes', pick: 2, options: ['r1', 'r2', 'r3'] }],
  endings: [
    { id: 'plain', extraRequired: [] },
    { id: 'quest', extraRequired: ['q', 'r1', 'a'] },
  ],
}

const run = (overrides) => ({ selectedEnding: 'plain', defeated: [], extras: [], ...overrides })

describe('getRequiredForEnding', () => {
  it('combines commonRequired, extraRequired, and groups without duplicates', () => {
    expect(getRequiredForEnding('quest', data)).toEqual({
      fixed: ['a', 'b', 'q', 'r1'],
      groups: data.groups,
    })
  })

  it('returns nothing for an unknown or unselected ending', () => {
    expect(getRequiredForEnding(null, data)).toEqual({ fixed: [], groups: [] })
  })
})

describe('getGroupStatus', () => {
  const group = data.groups[0]

  it('is satisfied when done >= pick', () => {
    expect(getGroupStatus(group, ['r1'])).toEqual({ done: 1, satisfied: false, remaining: 1 })
    expect(getGroupStatus(group, ['r1', 'r3', 'x'])).toEqual({
      done: 2,
      satisfied: true,
      remaining: 0,
    })
  })

  it('never reports negative remaining', () => {
    expect(getGroupStatus(group, ['r1', 'r2', 'r3']).remaining).toBe(0)
  })
})

describe('getRunList', () => {
  it('lists each boss once with all of its sources', () => {
    const list = getRunList(
      run({ selectedEnding: 'quest', extras: ['b', 'x'], defeated: ['r1'] }),
      data,
    )
    expect(list.map((e) => e.slug)).toEqual(['a', 'b', 'q', 'r1', 'r2', 'r3', 'x'])
    expect(list.find((e) => e.slug === 'r1')).toEqual({
      slug: 'r1',
      sources: ['required', 'group:runes'],
      defeated: true,
    })
    expect(list.find((e) => e.slug === 'b').sources).toEqual(['required', 'extra'])
  })
})

describe('getProgress', () => {
  it('counts group bosses only up to pick', () => {
    const p = getProgress(run({ defeated: ['a', 'r1', 'r2', 'r3'] }), data)
    expect(p).toMatchObject({ requiredDone: 3, requiredTotal: 4 })
  })

  it('counts a boss that is both required and an extra once', () => {
    const p = getProgress(run({ extras: ['a', 'r2', 'x'], defeated: ['a', 'x'] }), data)
    expect(p).toEqual({
      requiredDone: 1,
      requiredTotal: 4,
      extrasDone: 1,
      extrasTotal: 1,
      percent: 40,
    })
  })

  it('counts a fixed boss that is also a group option toward both', () => {
    const p = getProgress(run({ selectedEnding: 'quest', defeated: ['r1'] }), data)
    // fixed a, b, q, r1 (1 done) + runes pick 2 (r1 counts: 1 done)
    expect(p).toMatchObject({ requiredDone: 2, requiredTotal: 6 })
  })

  it('keeps defeats when switching endings', () => {
    const state = run({ defeated: ['a', 'q'] })
    expect(getProgress(state, data).requiredDone).toBe(1)
    expect(getProgress({ ...state, selectedEnding: 'quest' }, data).requiredDone).toBe(2)
  })

  it('handles no ending selected', () => {
    expect(getProgress(run({ selectedEnding: null }), data)).toEqual({
      requiredDone: 0,
      requiredTotal: 0,
      extrasDone: 0,
      extrasTotal: 0,
      percent: 0,
    })
  })
})

describe('endings.json', () => {
  const known = new Set([...snapshot, ...curated].map((b) => b.slug))
  const slugs = [
    ...endings.commonRequired,
    ...endings.groups.flatMap((g) => g.options),
    ...endings.endings.flatMap((e) => e.extraRequired),
  ]

  it.each(slugs)('%s exists in the boss snapshot or curated list', (slug) => {
    expect(known.has(slug)).toBe(true)
  })

  it('has the six base-game endings', () => {
    expect(endings.endings.map((e) => e.id)).toEqual([
      'fracture',
      'stars',
      'frenzy',
      'order',
      'duskborn',
      'despair',
    ])
  })

  it('keeps Morgott out of the Great Rune group, since his rune comes after the Leyndell gate', () => {
    expect(endings.commonRequired).toContain('morgott-the-omen-king')
    expect(endings.groups[0].options).not.toContain('morgott-the-omen-king')
  })
})

describe('getBossRoles', () => {
  it('marks fixed bosses and group options, including bosses that are both', () => {
    const roles = getBossRoles('quest', data)
    expect(roles.get('a')).toEqual({ fixed: true, groups: [] })
    expect(roles.get('r2')).toEqual({ fixed: false, groups: [data.groups[0]] })
    expect(roles.get('r1')).toEqual({ fixed: true, groups: [data.groups[0]] })
    expect(roles.has('x')).toBe(false)
  })
})
