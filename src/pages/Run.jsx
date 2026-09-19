import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import BossRow from '../components/BossRow.jsx'
import ProgressBar from '../components/ProgressBar.jsx'
import endings from '../data/endings.json'
import { useBosses } from '../hooks/useBosses.js'
import { getBossRoles, getGroupStatus, getProgress, getRequiredForEnding } from '../lib/progress.js'
import { useTracker } from '../state/TrackerContext.jsx'

export default function Run() {
  const { bosses, loading } = useBosses()
  const { state, dispatch } = useTracker()
  const ending = endings.endings.find((e) => e.id === state.selectedEnding)
  const roles = useMemo(() => getBossRoles(state.selectedEnding, endings), [state.selectedEnding])
  const bySlug = useMemo(() => new Map(bosses.map((b) => [b.slug, b])), [bosses])

  const { fixed, groups } = getRequiredForEnding(state.selectedEnding, endings)
  const progress = getProgress(state, endings)
  const beaten = new Set(state.defeated)
  const extras = state.extras.filter((slug) => !roles.has(slug))

  // Ending-specific bosses (Radahn, Astel, Fortissax...) come before the Leyndell-onward
  // common ones in a playthrough, so list them first.
  const extraRequired = new Set(ending?.extraRequired)
  const inOrder = [
    ...fixed.filter((s) => extraRequired.has(s)),
    ...fixed.filter((s) => !extraRequired.has(s)),
  ]
  const nextUp = inOrder.filter((s) => !beaten.has(s))
  const doneFixed = inOrder.filter((s) => beaten.has(s))

  const rows = (slugs) =>
    loading ? (
      <ul className="boss-list" aria-hidden="true">
        {slugs.map((slug) => (
          <li key={slug} className="boss-row skeleton" />
        ))}
      </ul>
    ) : (
      <ul className="boss-list">
        {slugs.map((slug) => (
          <BossRow
            key={slug}
            // A slug the boss data lacks still gets a row, so it can be checked off.
            boss={bySlug.get(slug) ?? { slug, name: slug, region: null, image: null }}
            role={roles.get(slug)}
            defeated={beaten.has(slug)}
            favorite={state.favorites.includes(slug)}
            inRun={state.extras.includes(slug)}
            backTo="/"
            backLabel="Your run"
            dispatch={dispatch}
          />
        ))}
      </ul>
    )

  const extrasSection = (
    <>
      <div className="section-head">
        <h2>Extra bosses</h2>
        <Link to="/bosses">+ Add bosses</Link>
      </div>
      {extras.length > 0 ? (
        rows(extras)
      ) : (
        <p className="muted">Add any other boss you want to beat from the boss list.</p>
      )}
    </>
  )

  if (!ending) {
    return (
      <section className="page">
        <h1>Your Run</h1>
        <p className="muted">Pick an ending to see which bosses it requires.</p>
        <Link className="toggle button-link" to="/endings">
          Choose an ending
        </Link>
        {extrasSection}
      </section>
    )
  }

  return (
    <section className="page">
      <h1>Your Run</h1>
      <div className="run-ending">
        <div>
          <span className="muted eyebrow">Ending</span>
          <h2>{ending.name}</h2>
        </div>
        <Link className="toggle button-link" to="/endings">
          Change
        </Link>
      </div>
      {ending.notes && <p className="muted ending-notes">{ending.notes}</p>}

      <div className="progress-group">
        <ProgressBar
          label="Required bosses"
          done={progress.requiredDone}
          total={progress.requiredTotal}
        />
        {progress.extrasTotal > 0 && (
          <ProgressBar label="Extras" done={progress.extrasDone} total={progress.extrasTotal} />
        )}
      </div>

      <h2>Next up</h2>
      {nextUp.length > 0 ? (
        rows(nextUp)
      ) : (
        <p className="muted">Every fixed required boss is defeated.</p>
      )}
      {doneFixed.length > 0 && (
        <details className="done-list">
          <summary>Defeated ({doneFixed.length})</summary>
          {rows(doneFixed)}
        </details>
      )}

      {groups.map((group) => {
        const { done, satisfied } = getGroupStatus(group, state.defeated)
        return (
          <section key={group.id} className={`group-card${satisfied ? ' is-done' : ''}`}>
            <div className="section-head">
              <h2>{group.label}</h2>
              <span className="group-count">
                {satisfied ? '✓ ' : ''}
                {Math.min(done, group.pick)} / {group.pick}
              </span>
            </div>
            {group.note && <p className="muted">{group.note}</p>}
            {rows(group.options)}
          </section>
        )
      })}

      {extrasSection}
    </section>
  )
}
