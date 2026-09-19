// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { STORAGE_KEY, TrackerProvider, useTracker } from '../src/state/TrackerContext.jsx'

function Probe() {
  const { state, dispatch } = useTracker()
  return (
    <>
      <button onClick={() => dispatch({ type: 'toggleDefeated', slug: 'godrick-the-grafted' })}>
        toggle
      </button>
      <output>{state.defeated.join(',')}</output>
    </>
  )
}

// Mounting a fresh provider over the same localStorage is what a page refresh does.
const mount = () =>
  render(
    <TrackerProvider>
      <Probe />
    </TrackerProvider>,
  )

afterEach(() => {
  cleanup()
  localStorage.clear()
})

describe('TrackerProvider persistence', () => {
  it('keeps a checked-off boss across a refresh', () => {
    mount()
    fireEvent.click(screen.getByText('toggle'))
    cleanup()

    mount()
    expect(screen.getByRole('status').textContent).toBe('godrick-the-grafted')
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).defeated).toEqual(['godrick-the-grafted'])
  })

  it('keeps an un-check across a refresh too', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ defeated: ['godrick-the-grafted'] }))
    mount()
    fireEvent.click(screen.getByText('toggle'))
    cleanup()

    mount()
    expect(screen.getByRole('status').textContent).toBe('')
  })

  it('starts cleanly from corrupt saved data', () => {
    localStorage.setItem(STORAGE_KEY, '{not json')
    mount()
    expect(screen.getByRole('status').textContent).toBe('')
  })
})
