import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import endings from '../data/endings.json'
import { useBosses } from '../hooks/useBosses.js'
import { getProgress } from '../lib/progress.js'
import { useTracker } from '../state/TrackerContext.jsx'

export default function Endings() {
  const { bosses } = useBosses()
  const { state, dispatch } = useTracker()
  const navigate = useNavigate()
  // The ending waiting for "Switch?" confirmation, if any.
  const [confirming, setConfirming] = useState(null)
  const names = useMemo(() => new Map(bosses.map((b) => [b.slug, b.name])), [bosses])
  const current = endings.endings.find((e) => e.id === state.selectedEnding)

  const choose = (endingId) => {
    dispatch({ type: 'selectEnding', endingId })
    navigate('/')
  }

  return (
    <section className="page">
      <h1>Choose Ending</h1>
      <p className="muted">
        Every ending needs the common path through Leyndell to the Elden Beast. Switching keeps the
        bosses you’ve already defeated.
      </p>

      <ul className="ending-list">
        {endings.endings.map((ending) => {
          const selected = ending.id === state.selectedEnding
          const { requiredDone, requiredTotal } = getProgress(
            { ...state, selectedEnding: ending.id },
            endings,
          )
          return (
            <li key={ending.id} className={`ending-card${selected ? ' is-selected' : ''}`}>
              <div className="section-head">
                <h2>{ending.name}</h2>
                {selected && <span className="tag">Current</span>}
              </div>
              <p className="ending-extra">
                {ending.extraRequired.length === 0
                  ? 'No extra bosses beyond the common path.'
                  : `+${ending.extraRequired.length} extra: ${ending.extraRequired
                      .map((slug) => names.get(slug) ?? slug)
                      .join(', ')}`}
              </p>
              {ending.notes && <p className="muted">{ending.notes}</p>}
              <p className="muted ending-done">
                {requiredDone} / {requiredTotal} required done
              </p>

              {selected ? null : confirming === ending.id ? (
                <div className="confirm" role="group" aria-label={`Switch to ${ending.name}?`}>
                  <p>
                    Switch from {current.name} to {ending.name}? Your defeated bosses stay checked.
                  </p>
                  <button
                    type="button"
                    className="toggle primary"
                    onClick={() => choose(ending.id)}
                  >
                    Switch
                  </button>
                  <button type="button" className="toggle" onClick={() => setConfirming(null)}>
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="toggle"
                  aria-label={`Choose ${ending.name}`}
                  onClick={() => (current ? setConfirming(ending.id) : choose(ending.id))}
                >
                  Choose
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
