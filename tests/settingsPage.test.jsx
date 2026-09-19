// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { STORAGE_KEY, TrackerProvider } from '../src/state/TrackerContext.jsx'
import Settings from '../src/pages/Settings.jsx'

vi.mock('../src/hooks/useBosses.js', () => ({
  useBosses: () => ({
    bosses: [{ slug: 'fire-giant', name: 'Fire Giant', region: 'Mountaintops of the Giants' }],
    source: 'api',
    loading: false,
  }),
}))

function mount(saved) {
  if (saved) localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
  return render(
    <TrackerProvider>
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    </TrackerProvider>,
  )
}

const saved = () => JSON.parse(localStorage.getItem(STORAGE_KEY))
const pickFile = (text) =>
  fireEvent.change(screen.getByLabelText('Import progress'), {
    target: { files: [new File([text], 'backup.json', { type: 'application/json' })] },
  })

beforeEach(() => localStorage.clear())
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('Settings page', () => {
  it('exports progress as a JSON download', async () => {
    let blob
    URL.createObjectURL = vi.fn((b) => ((blob = b), 'blob:x'))
    URL.revokeObjectURL = vi.fn()
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    mount({ selectedEnding: 'stars', defeated: ['fire-giant'] })

    fireEvent.click(screen.getByRole('button', { name: 'Export progress' }))
    expect(click).toHaveBeenCalledOnce()
    expect(click.mock.contexts[0].download).toMatch(/^elden-ring-tracker-\d{4}-\d\d-\d\d\.json$/)
    expect(JSON.parse(await blob.text())).toMatchObject({
      selectedEnding: 'stars',
      defeated: ['fire-giant'],
      version: 1,
    })
    expect(screen.getByRole('status').textContent).toBe('Backup downloaded.')
  })

  it('imports a backup after confirmation', async () => {
    mount({ selectedEnding: 'fracture' })
    pickFile(JSON.stringify({ selectedEnding: 'stars', defeated: ['fire-giant'], version: 1 }))
    await screen.findByText(/It has 1 defeated bosses/)
    expect(saved().selectedEnding).toBe('fracture')

    fireEvent.click(screen.getByRole('button', { name: 'Replace' }))
    expect(saved()).toMatchObject({ selectedEnding: 'stars', defeated: ['fire-giant'] })
    expect(screen.getByRole('status').textContent).toBe('Progress imported.')
  })

  it('rejects a file that is not a backup, leaving progress alone', async () => {
    mount({ selectedEnding: 'fracture' })
    pickFile('{"hello": "world"}')
    expect((await screen.findByRole('alert')).textContent).toBe(
      'That file isn’t an Elden Ring Tracker backup.',
    )
    expect(screen.queryByRole('button', { name: 'Replace' })).toBeNull()
    expect(saved().selectedEnding).toBe('fracture')
  })

  it('adds and removes custom bosses', () => {
    mount()
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Messmer the Impaler' } })
    fireEvent.change(screen.getByLabelText('Region (optional)'), {
      target: { value: 'Shadow Keep' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Add boss' }))
    expect(saved()).toMatchObject({
      customBosses: [
        { slug: 'custom-messmer-the-impaler', name: 'Messmer the Impaler', region: 'Shadow Keep' },
      ],
      extras: ['custom-messmer-the-impaler'],
    })
    expect(screen.getByRole('link', { name: 'Messmer the Impaler' })).toBeTruthy()
    expect(screen.getByLabelText('Name').value).toBe('')

    fireEvent.click(screen.getByRole('button', { name: 'Remove Messmer the Impaler' }))
    expect(saved()).toMatchObject({ customBosses: [], extras: [] })
  })

  it('resets only after confirmation', () => {
    mount({ selectedEnding: 'stars', defeated: ['fire-giant'] })
    fireEvent.click(screen.getByRole('button', { name: 'Reset progress' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(saved().defeated).toEqual(['fire-giant'])

    fireEvent.click(screen.getByRole('button', { name: 'Reset progress' }))
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
    expect(saved()).toMatchObject({ selectedEnding: null, defeated: [] })
  })
})
