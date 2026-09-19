import { useMemo } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import BossImage from '../components/BossImage.jsx'
import endings from '../data/endings.json'
import { useBosses } from '../hooks/useBosses.js'
import { getBossRoles, getGroupStatus } from '../lib/progress.js'
import { useTracker } from '../state/TrackerContext.jsx'

function runStatus(role, inRun, state) {
  const ending = endings.endings.find((e) => e.id === state.selectedEnding)
  if (!ending) return inRun ? 'In your run as an extra.' : 'Pick an ending to see what it requires.'
  if (role?.fixed) return `Required for ${ending.name}.`
  if (role?.groups.length) {
    return role.groups
      .map((g) => {
        const { done } = getGroupStatus(g, state.defeated)
        return `${g.label} (${Math.min(done, g.pick)} / ${g.pick} done).`
      })
      .join(' ')
  }
  return inRun ? 'In your run as an extra.' : `Not required for ${ending.name}.`
}

export default function BossDetail() {
  const { slug } = useParams()
  const location = useLocation()
  const { bosses, loading } = useBosses()
  const { state, dispatch } = useTracker()
  const roles = useMemo(() => getBossRoles(state.selectedEnding, endings), [state.selectedEnding])
  const backTo = location.state?.backTo ?? '/bosses'

  const back = (
    <Link className="back-link" to={backTo}>
      ← All bosses
    </Link>
  )

  if (loading) {
    return (
      <section className="page">
        {back}
        <p className="muted">Loading…</p>
      </section>
    )
  }

  const boss = bosses.find((b) => b.slug === slug)
  if (!boss) {
    return (
      <section className="page">
        {back}
        <h1>Boss not found</h1>
        <p className="muted">No boss matches “{slug}”.</p>
      </section>
    )
  }

  const role = roles.get(slug)
  const defeated = state.defeated.includes(slug)
  const favorite = state.favorites.includes(slug)
  const inRun = state.extras.includes(slug)

  return (
    <section className="page boss-detail">
      {back}
      <BossImage key={boss.image} boss={boss} className="boss-hero" loading="eager" />
      <h1>{boss.name}</h1>
      <p className="muted">{[boss.location, boss.region].filter(Boolean).join(' · ')}</p>
      <p className="run-status">{runStatus(role, inRun, state)}</p>

      <div className="detail-actions">
        <button
          type="button"
          className="toggle"
          aria-pressed={defeated}
          onClick={() => dispatch({ type: 'toggleDefeated', slug })}
        >
          {defeated ? '✓ Defeated' : 'Mark as defeated'}
        </button>
        <button
          type="button"
          className="toggle"
          aria-pressed={favorite}
          onClick={() => dispatch({ type: 'toggleFavorite', slug })}
        >
          {favorite ? '★ Favorite' : '☆ Favorite'}
        </button>
        {!role?.fixed && (
          <button
            type="button"
            className="toggle"
            aria-pressed={inRun}
            onClick={() => dispatch({ type: 'toggleExtra', slug })}
          >
            {inRun ? '✓ In your run' : '+ Add to run'}
          </button>
        )}
      </div>

      {boss.description && <p>{boss.description}</p>}
      {boss.drops?.length > 0 && (
        <>
          <h2>Drops</h2>
          <ul className="drops">
            {boss.drops.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
