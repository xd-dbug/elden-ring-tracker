// Export/import of the tracker state as a JSON file (plan section 6, Settings).

export function backupFilename(date = new Date()) {
  return `elden-ring-tracker-${date.toISOString().slice(0, 10)}.json`
}

/**
 * Check that `text` is a tracker backup and return the parsed object, ready for loadState.
 * Throws an Error with a message fit to show the user.
 */
export function parseBackup(text) {
  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('That file isn’t valid JSON.')
  }
  if (!data || typeof data !== 'object' || Array.isArray(data) || !('version' in data)) {
    throw new Error('That file isn’t an Elden Ring Tracker backup.')
  }
  if (data.version !== 1) {
    throw new Error('That backup is from a different version of the tracker.')
  }
  return data
}
