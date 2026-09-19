import { describe, expect, it } from 'vitest'
import { initialState, loadState, trackerReducer } from '../src/state/trackerReducer.js'

describe('trackerReducer', () => {
  it('toggles defeated, extras, and favorites on and off', () => {
    for (const [type, key] of [
      ['toggleDefeated', 'defeated'],
      ['toggleExtra', 'extras'],
      ['toggleFavorite', 'favorites'],
    ]) {
      const on = trackerReducer(initialState, { type, slug: 'godrick-the-grafted' })
      expect(on[key]).toEqual(['godrick-the-grafted'])
      expect(trackerReducer(on, { type, slug: 'godrick-the-grafted' })[key]).toEqual([])
    }
  })

  it('keeps defeats when switching endings', () => {
    const state = { ...initialState, selectedEnding: 'stars', defeated: ['starscourge-radahn'] }
    const next = trackerReducer(state, { type: 'selectEnding', endingId: 'frenzy' })
    expect(next).toMatchObject({ selectedEnding: 'frenzy', defeated: ['starscourge-radahn'] })
  })

  it('resets to the initial state', () => {
    const state = { ...initialState, defeated: ['a'], favorites: ['b'] }
    expect(trackerReducer(state, { type: 'reset' })).toEqual(initialState)
  })

  it('ignores unknown actions', () => {
    expect(trackerReducer(initialState, { type: 'nope' })).toBe(initialState)
  })
})

describe('loadState', () => {
  it('round-trips a saved state through JSON', () => {
    const state = {
      selectedEnding: 'stars',
      defeated: ['godrick-the-grafted'],
      extras: ['mohg-lord-of-blood'],
      favorites: ['malenia-blade-of-miquella'],
      customBosses: [{ slug: 'custom-x', name: 'X', region: 'Limgrave' }],
      version: 1,
    }
    expect(loadState(JSON.parse(JSON.stringify(state)))).toEqual(state)
  })

  it.each([null, undefined, 'oops', 42, ['a']])(
    'falls back to the initial state for %j',
    (saved) => {
      expect(loadState(saved)).toEqual(initialState)
    },
  )

  it('fills missing fields and drops bad values', () => {
    expect(
      loadState({
        selectedEnding: 7,
        defeated: ['a', 'a', null, 3, 'b'],
        extras: 'mohg',
        customBosses: [{ slug: 'ok', name: 'Ok' }, { slug: 'no-name' }, null],
        unknownField: true,
      }),
    ).toEqual({
      ...initialState,
      defeated: ['a', 'b'],
      customBosses: [{ slug: 'ok', name: 'Ok' }],
    })
  })
})
