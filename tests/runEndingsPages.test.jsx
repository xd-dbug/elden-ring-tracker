// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { STORAGE_KEY, TrackerProvider } from '../src/state/TrackerContext.jsx'
import Run from '../src/pages/Run.jsx'
import Endings from '../src/pages/Endings.jsx'
import BossDetail from '../src/pages/BossDetail.jsx'

const BOSSES = [
  { slug: 'godrick-the-grafted', name: 'Godrick the Grafted', region: 'Limgrave', image: null },
  { slug: 'starscourge-radahn', name: 'Starscourge Radahn', region: 'Caelid', image: null },
  { slug: 'fire-giant', name: 'Fire Giant', region: 'Mountaintops of the Giants', image: null },
  { slug: 'tree-sentinel', name: 'Tree Sentinel', region: 'Limgrave', image: null },
  {
    slug: 'astel-naturalborn-of-the-void',
    name: 'Astel, Naturalborn of the Void',
    region: 'Lake of Rot',
    image: null,
  },
]

vi.mock('../src/hooks/useBosses.js', () => ({
  useBosses: () => ({ bosses: BOSSES, source: 'api', loading: false }),
}))

function mount(url, saved) {
  if (saved) localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
  return render(
    <TrackerProvider>
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route path="/" element={<Run />} />
          <Route path="/endings" element={<Endings />} />
          <Route path="/bosses/:slug" element={<BossDetail />} />
        </Routes>
      </MemoryRouter>
    </TrackerProvider>,
  )
}

const saved = () => JSON.parse(localStorage.getItem(STORAGE_KEY))
const bar = (name) => screen.getByRole('progressbar', { name })

beforeEach(() => localStorage.clear())
afterEach(cleanup)

describe('Run page', () => {
  it('asks for an ending when none is chosen', () => {
    mount('/')
    expect(screen.getByRole('link', { name: 'Choose an ending' })).toBeTruthy()
    expect(screen.queryByRole('progressbar')).toBeNull()
  })

  it('shows required progress, counting at most `pick` Great Runes', () => {
    mount('/', {
      selectedEnding: 'fracture',
      defeated: ['fire-giant', 'godrick-the-grafted', 'starscourge-radahn', 'tree-sentinel'],
    })
    expect(screen.getByRole('heading', { name: 'Age of Fracture' })).toBeTruthy()
    // 9 common + 2 Great Runes; Fire Giant and two runes done. Tree Sentinel isn't in the run.
    expect(bar('Required bosses').getAttribute('aria-valuetext')).toBe('3 of 11')
    expect(screen.queryByRole('progressbar', { name: 'Extras' })).toBeNull()

    const group = screen.getByRole('heading', { name: 'Defeat any 2 Great Rune bearers' })
      .parentElement.parentElement
    expect(within(group).getByText('✓ 2 / 2')).toBeTruthy()
  })

  it('lists remaining required bosses under Next up and defeated ones separately', () => {
    mount('/', { selectedEnding: 'stars', defeated: ['fire-giant'] })
    const lists = screen.getAllByRole('list')
    const nextUp = within(lists[0])
      .getAllByRole('link')
      .map((a) => a.querySelector('.boss-name').textContent)
    // Ending-specific bosses come first; Fire Giant is defeated so it's not "next up".
    expect(nextUp.slice(0, 2)).toEqual(['Starscourge Radahn', 'Astel, Naturalborn of the Void'])
    expect(nextUp).not.toContain('Fire Giant')
    expect(screen.getByText('Defeated (1)')).toBeTruthy()
  })

  it('checks off a boss from the run and updates progress', () => {
    mount('/', { selectedEnding: 'fracture' })
    expect(bar('Required bosses').getAttribute('aria-valuetext')).toBe('0 of 11')
    fireEvent.click(screen.getByLabelText('Defeated: Fire Giant'))
    expect(bar('Required bosses').getAttribute('aria-valuetext')).toBe('1 of 11')
    expect(saved().defeated).toEqual(['fire-giant'])
  })

  it('shows extras that are not already required, with their own progress', () => {
    mount('/', {
      selectedEnding: 'fracture',
      extras: ['tree-sentinel', 'fire-giant'],
      defeated: ['tree-sentinel'],
    })
    expect(bar('Extras').getAttribute('aria-valuetext')).toBe('1 of 1')
    const extras = screen.getByRole('heading', { name: 'Extra bosses' }).parentElement
      .nextElementSibling
    expect(within(extras).getAllByRole('link')).toHaveLength(1)
    expect(within(extras).getByText('Tree Sentinel')).toBeTruthy()
  })

  it('links from a run row to the boss and back to the run', () => {
    mount('/', { selectedEnding: 'fracture' })
    fireEvent.click(screen.getAllByRole('link', { name: /Fire Giant/ })[0])
    expect(screen.getByRole('heading', { name: 'Fire Giant' })).toBeTruthy()
    fireEvent.click(screen.getByRole('link', { name: '← Your run' }))
    expect(screen.getByRole('heading', { name: 'Your Run' })).toBeTruthy()
  })
})

describe('Endings page', () => {
  it('shows all six endings with their extra bosses and notes', () => {
    mount('/endings')
    expect(screen.getAllByRole('listitem')).toHaveLength(6)
    expect(
      screen.getByText('+2 extra: Starscourge Radahn, Astel, Naturalborn of the Void'),
    ).toBeTruthy()
    expect(screen.getByText(/Ranni's questline/)).toBeTruthy()
  })

  it('picks the first ending without asking and goes to the run', () => {
    mount('/endings')
    fireEvent.click(screen.getByLabelText('Choose Age of Fracture'))
    expect(saved().selectedEnding).toBe('fracture')
    expect(screen.getByRole('heading', { name: 'Your Run' })).toBeTruthy()
  })

  it('asks before switching, and keeps defeated bosses when you do', () => {
    mount('/endings', {
      selectedEnding: 'fracture',
      defeated: ['fire-giant', 'starscourge-radahn'],
    })
    fireEvent.click(screen.getByLabelText('Choose Age of the Stars'))
    expect(saved().selectedEnding).toBe('fracture')

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('button', { name: 'Switch' })).toBeNull()

    fireEvent.click(screen.getByLabelText('Choose Age of the Stars'))
    fireEvent.click(screen.getByRole('button', { name: 'Switch' }))
    expect(saved()).toMatchObject({
      selectedEnding: 'stars',
      defeated: ['fire-giant', 'starscourge-radahn'],
    })
    // Stars: 9 common + Radahn + Astel + 2 runes. Fire Giant, Radahn (fixed) and Radahn (rune).
    expect(bar('Required bosses').getAttribute('aria-valuetext')).toBe('3 of 13')
  })

  it('previews how much of each ending is already done', () => {
    mount('/endings', { selectedEnding: 'fracture', defeated: ['starscourge-radahn'] })
    const card = (name) => screen.getByRole('heading', { name }).closest('li')
    expect(within(card('Age of Fracture')).getByText('1 / 11 required done')).toBeTruthy()
    expect(within(card('Age of the Stars')).getByText('2 / 13 required done')).toBeTruthy()
    expect(within(card('Age of Fracture')).queryByRole('button')).toBeNull()
  })
})
