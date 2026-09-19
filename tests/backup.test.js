import { describe, expect, it } from 'vitest'
import { backupFilename, parseBackup } from '../src/lib/backup.js'

describe('backup', () => {
  it('names the file by date', () => {
    expect(backupFilename(new Date('2026-09-19T12:00:00Z'))).toBe(
      'elden-ring-tracker-2026-09-19.json',
    )
  })

  it('parses a saved state', () => {
    const state = { selectedEnding: 'stars', defeated: ['fire-giant'], version: 1 }
    expect(parseBackup(JSON.stringify(state))).toEqual(state)
  })

  it.each([
    ['{oops', 'That file isn’t valid JSON.'],
    ['[1, 2]', 'That file isn’t an Elden Ring Tracker backup.'],
    ['{"defeated": []}', 'That file isn’t an Elden Ring Tracker backup.'],
    ['{"version": 2}', 'That backup is from a different version of the tracker.'],
  ])('rejects %s', (text, message) => {
    expect(() => parseBackup(text)).toThrow(message)
  })
})
