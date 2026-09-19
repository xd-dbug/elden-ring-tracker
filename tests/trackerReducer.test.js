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

  it('adds custom bosses with unique custom- slugs, optionally to the run', () => {
    let state = trackerReducer(initialState, {
      type: 'addCustomBoss',
      name: '  Messmer the Impaler ',
      region: 'Shadow Keep',
      addToRun: true,
    })
    state = trackerReducer(state, {
      type: 'addCustomBoss',
      name: 'Messmer the Impaler',
      region: '',
    })
    expect(state.customBosses).toEqual([
      { slug: 'custom-messmer-the-impaler', name: 'Messmer the Impaler', region: 'Shadow Keep' },
      { slug: 'custom-messmer-the-impaler-2', name: 'Messmer the Impaler' },
    ])
    expect(state.extras).toEqual(['custom-messmer-the-impaler'])
    expect(trackerReducer(state, { type: 'addCustomBoss', name: '   ' })).toBe(state)
  })

  it('removes a custom boss and every reference to it', () => {
    const state = {
      ...initialState,
      customBosses: [{ slug: 'custom-x', name: 'X' }],
      defeated: ['custom-x', 'fire-giant'],
      extras: ['custom-x'],
      favorites: ['custom-x'],
    }
    expect(trackerReducer(state, { type: 'removeCustomBoss', slug: 'custom-x' })).toEqual({
      ...initialState,
      defeated: ['fire-giant'],
    })
  })

  it('imports a saved state through loadState', () => {
    const next = trackerReducer(initialState, {
      type: 'import',
      saved: { selectedEnding: 'order', defeated: ['a', 'a'], version: 1 },
    })
    expect(next).toEqual({ ...initialState, selectedEnding: 'order', defeated: ['a'] })
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
        customBosses: [
          { slug: 'ok', name: 'Ok', image: 'https://example.com/x.png' },
          { slug: 'no-name' },
          null,
        ],
        unknownField: true,
      }),
    ).toEqual({
      ...initialState,
      defeated: ['a', 'b'],
      customBosses: [{ slug: 'ok', name: 'Ok' }],
    })
  })
})
