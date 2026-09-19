import { useParams } from 'react-router-dom'
import { useBosses } from '../hooks/useBosses.js'
import { useTracker } from '../state/TrackerContext.jsx'

export default function BossDetail() {
  const { slug } = useParams()
  const { bosses, loading } = useBosses()
  const { state, dispatch } = useTracker()

  if (loading) return <section className="page muted">Loading…</section>

  const boss = bosses.find((b) => b.slug === slug)
  if (!boss) {
    return (
      <section className="page">
        <h1>Boss not found</h1>
        <p className="muted">No boss matches “{slug}”.</p>
      </section>
    )
  }

  const defeated = state.defeated.includes(slug)
  return (
    <section className="page">
      <h1>{boss.name}</h1>
      <p className="muted">{[boss.location, boss.region].filter(Boolean).join(' · ')}</p>
      <button
        type="button"
        className="toggle"
        aria-pressed={defeated}
        onClick={() => dispatch({ type: 'toggleDefeated', slug })}
      >
        {defeated ? '✓ Defeated' : 'Mark as defeated'}
      </button>
      <p className="muted">Full boss details arrive in milestone 5.</p>
    </section>
  )
}
