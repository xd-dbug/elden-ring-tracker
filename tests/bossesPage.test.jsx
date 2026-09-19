// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { STORAGE_KEY, TrackerProvider } from '../src/state/TrackerContext.jsx'
import Bosses from '../src/pages/Bosses.jsx'
import BossDetail from '../src/pages/BossDetail.jsx'

const BOSSES = [
  { slug: 'godrick-the-grafted', name: 'Godrick the Grafted', region: 'Limgrave', image: null },
  { slug: 'starscourge-radahn', name: 'Starscourge Radahn', region: 'Caelid', image: null },
  { slug: 'fire-giant', name: 'Fire Giant', region: 'Mountaintops of the Giants', image: null },
  { slug: 'tree-sentinel', name: 'Tree Sentinel', region: 'Limgrave', image: null },
]

vi.mock('../src/hooks/useBosses.js', () => ({
  useBosses: () => ({ bosses: BOSSES, source: 'api', loading: false }),
}))

function mount(url = '/bosses', saved) {
  if (saved) localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
  return render(
    <TrackerProvider>
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route path="/bosses" element={<Bosses />} />
          <Route path="/bosses/:slug" element={<BossDetail />} />
        </Routes>
      </MemoryRouter>
    </TrackerProvider>,
  )
}

const names = () =>
  within(screen.getByRole('list'))
    .queryAllByRole('link')
    .map((a) => a.querySelector('.boss-name').textContent)

beforeEach(() => localStorage.clear())
afterEach(cleanup)

describe('Boss List page', () => {
  it('lists bosses sorted by name, with required tags for the chosen ending', () => {
    mount('/bosses', { selectedEnding: 'fracture' })
    expect(names()).toEqual([
      'Fire Giant',
      'Godrick the Grafted',
      'Starscourge Radahn',
      'Tree Sentinel',
    ])
    const fireGiant = screen.getByRole('link', { name: /Fire Giant/ })
    expect(within(fireGiant).getByText('Required')).toBeTruthy()
    expect(
      within(screen.getByRole('link', { name: /Godrick/ })).getByText('Great Rune'),
    ).toBeTruthy()
    // Fixed-required bosses are always in the run, so they have no "+" button.
    expect(screen.queryByLabelText('Add Fire Giant to run')).toBeNull()
    expect(screen.getByLabelText('Add Tree Sentinel to run')).toBeTruthy()
  })

  it('debounces search', async () => {
    mount()
    fireEvent.change(screen.getByLabelText('Search bosses'), { target: { value: 'radahn' } })
    expect(names()).toHaveLength(4)
    await waitFor(() => expect(names()).toEqual(['Starscourge Radahn']))
  })

  it('combines region, chips, and status filters', () => {
    mount('/bosses', { defeated: ['godrick-the-grafted'], favorites: ['godrick-the-grafted'] })
    fireEvent.change(screen.getByLabelText('Region'), { target: { value: 'Limgrave' } })
    expect(names()).toEqual(['Godrick the Grafted', 'Tree Sentinel'])
    fireEvent.click(screen.getByLabelText('Remaining'))
    expect(names()).toEqual(['Tree Sentinel'])
    fireEvent.click(screen.getByRole('button', { name: 'Favorites' }))
    expect(screen.getByText('No bosses match these filters.')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(names()).toHaveLength(4)
  })

  it('points to the Endings page when Required is on but no ending is chosen', () => {
    mount('/bosses?req=1')
    expect(screen.getByRole('link', { name: 'Choose an ending' })).toBeTruthy()
  })

  it('checks off, favorites, and adds bosses to the run', () => {
    mount()
    fireEvent.click(screen.getByLabelText('Defeated: Tree Sentinel'))
    fireEvent.click(screen.getByLabelText('Favorite Tree Sentinel'))
    fireEvent.click(screen.getByLabelText('Add Tree Sentinel to run'))
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toMatchObject({
      defeated: ['tree-sentinel'],
      favorites: ['tree-sentinel'],
      extras: ['tree-sentinel'],
    })
    expect(screen.getByLabelText('Favorite Tree Sentinel').getAttribute('aria-pressed')).toBe(
      'true',
    )
  })

  it('keeps filters when opening a boss and going back', () => {
    mount('/bosses?region=Caelid')
    fireEvent.click(screen.getByRole('link', { name: /Starscourge Radahn/ }))
    expect(screen.getByRole('heading', { name: 'Starscourge Radahn' })).toBeTruthy()
    fireEvent.click(screen.getByRole('link', { name: '← All bosses' }))
    expect(names()).toEqual(['Starscourge Radahn'])
  })
})

describe('Boss Detail page', () => {
  it('shows Great Rune progress for a group option', () => {
    mount('/bosses/starscourge-radahn', {
      selectedEnding: 'fracture',
      defeated: ['godrick-the-grafted'],
    })
    expect(screen.getByText('Defeat any 2 Great Rune bearers (1 / 2 done).')).toBeTruthy()
  })

  it('shows when a boss is fixed-required, and hides "Add to run"', () => {
    mount('/bosses/fire-giant', { selectedEnding: 'stars' })
    expect(screen.getByText('Required for Age of the Stars.')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Add to run/ })).toBeNull()
  })

  it('handles an unknown boss', () => {
    mount('/bosses/nobody')
    expect(screen.getByRole('heading', { name: 'Boss not found' })).toBeTruthy()
  })
})
