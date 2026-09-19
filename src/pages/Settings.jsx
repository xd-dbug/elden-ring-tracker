import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useBosses } from '../hooks/useBosses.js'
import { backupFilename, parseBackup } from '../lib/backup.js'
import { getRegions } from '../lib/filterBosses.js'
import { useTracker } from '../state/TrackerContext.jsx'

function download(filename, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  // Revoking straight away can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function Settings() {
  const { bosses } = useBosses()
  const { state, dispatch } = useTracker()
  const regions = useMemo(() => getRegions(bosses), [bosses])

  // A parsed backup waiting for "Replace?" confirmation.
  const [pendingImport, setPendingImport] = useState(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)
  const [name, setName] = useState('')
  const [region, setRegion] = useState('')
  const [addToRun, setAddToRun] = useState(true)

  const say = (text) => {
    setError(null)
    setMessage(text)
  }

  const onFile = async (e) => {
    const file = e.target.files[0]
    e.target.value = '' // so picking the same file again still fires onChange
    if (!file) return
    setMessage(null)
    try {
      setPendingImport(parseBackup(await file.text()))
      setError(null)
    } catch (err) {
      setPendingImport(null)
      setError(err.message)
    }
  }

  const addBoss = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    dispatch({ type: 'addCustomBoss', name, region, addToRun })
    say(`Added ${name.trim()}.`)
    setName('')
    setRegion('')
  }

  return (
    <section className="page settings">
      <h1>Settings</h1>
      <p className="status-line" role="status">
        {message}
      </p>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <h2>Backup</h2>
      <p className="muted">
        Progress is saved in this browser only. Clearing site data erases it, so export a backup now
        and then.
      </p>
      <div className="button-row">
        <button
          type="button"
          className="toggle"
          onClick={() => {
            download(backupFilename(), JSON.stringify(state, null, 2))
            say('Backup downloaded.')
          }}
        >
          Export progress
        </button>
        <label className="toggle file-btn">
          Import progress
          <input type="file" accept="application/json,.json" onChange={onFile} />
        </label>
      </div>
      {pendingImport && (
        <div className="confirm" role="group" aria-label="Replace progress?">
          <p>
            Replace your current progress with this backup? It has{' '}
            {Array.isArray(pendingImport.defeated) ? pendingImport.defeated.length : 0} defeated
            bosses.
          </p>
          <button
            type="button"
            className="toggle primary"
            onClick={() => {
              dispatch({ type: 'import', saved: pendingImport })
              setPendingImport(null)
              say('Progress imported.')
            }}
          >
            Replace
          </button>
          <button type="button" className="toggle" onClick={() => setPendingImport(null)}>
            Cancel
          </button>
        </div>
      )}

      <h2>Custom bosses</h2>
      <p className="muted">
        Add bosses the boss list is missing, such as DLC bosses. They show up in the boss list like
        any other.
      </p>
      <form className="custom-form" onSubmit={addBoss}>
        <label>
          Name
          <input
            className="search"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={100}
          />
        </label>
        <label>
          Region (optional)
          <input
            className="search"
            list="region-options"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            maxLength={100}
          />
          <datalist id="region-options">
            {regions.map((r) => (
              <option key={r} value={r} />
            ))}
          </datalist>
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={addToRun}
            onChange={(e) => setAddToRun(e.target.checked)}
          />
          Add to my run
        </label>
        <button type="submit" className="toggle primary">
          Add boss
        </button>
      </form>
      {state.customBosses.length > 0 && (
        <ul className="custom-list">
          {state.customBosses.map((b) => (
            <li key={b.slug}>
              <Link to={`/bosses/${b.slug}`} state={{ backTo: '/settings', backLabel: 'Settings' }}>
                {b.name}
              </Link>
              {b.region && <span className="muted"> · {b.region}</span>}
              <button
                type="button"
                className="link-btn"
                aria-label={`Remove ${b.name}`}
                onClick={() => {
                  dispatch({ type: 'removeCustomBoss', slug: b.slug })
                  say(`Removed ${b.name}.`)
                }}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <h2>Reset</h2>
      <p className="muted">
        Clears your ending, defeated bosses, extras, favorites and custom bosses.
      </p>
      {confirmReset ? (
        <div className="confirm" role="group" aria-label="Reset everything?">
          <p>Reset everything? This can’t be undone unless you have a backup.</p>
          <button
            type="button"
            className="toggle danger"
            onClick={() => {
              dispatch({ type: 'reset' })
              setConfirmReset(false)
              say('Progress reset.')
            }}
          >
            Reset
          </button>
          <button type="button" className="toggle" onClick={() => setConfirmReset(false)}>
            Cancel
          </button>
        </div>
      ) : (
        <button type="button" className="toggle danger" onClick={() => setConfirmReset(true)}>
          Reset progress
        </button>
      )}
    </section>
  )
}
