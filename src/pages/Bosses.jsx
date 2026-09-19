import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import BossRow from '../components/BossRow.jsx'
import endings from '../data/endings.json'
import { useBosses } from '../hooks/useBosses.js'
import { useDebouncedValue } from '../hooks/useDebouncedValue.js'
import { filterBosses, getRegions, sortByName } from '../lib/filterBosses.js'
import { getBossRoles } from '../lib/progress.js'
import { useTracker } from '../state/TrackerContext.jsx'

const TOGGLES = [
  ['req', 'Required'],
  ['extra', 'Extra'],
  ['fav', 'Favorites'],
]
const STATUSES = [
  ['all', 'All'],
  ['remaining', 'Remaining'],
  ['defeated', 'Defeated'],
]
const FILTER_KEYS = ['q', 'region', 'req', 'extra', 'fav', 'status']

// Filters live in the URL, so they survive opening a boss and coming back.
export default function Bosses() {
  const { bosses, source, loading } = useBosses()
  const { state, dispatch } = useTracker()
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') ?? '')
  const debouncedQuery = useDebouncedValue(query, 200)

  const setParam = (key, value) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value) next.set(key, value)
        else next.delete(key)
        return next
      },
      { replace: true },
    )

  useEffect(() => {
    setParams(
      (prev) => {
        if ((prev.get('q') ?? '') === debouncedQuery) return prev
        const next = new URLSearchParams(prev)
        if (debouncedQuery) next.set('q', debouncedQuery)
        else next.delete('q')
        return next
      },
      { replace: true },
    )
  }, [debouncedQuery, setParams])

  const roles = useMemo(() => getBossRoles(state.selectedEnding, endings), [state.selectedEnding])
  const sorted = useMemo(() => sortByName(bosses), [bosses])
  const regions = useMemo(() => getRegions(bosses), [bosses])
  const sets = {
    required: new Set(roles.keys()),
    extras: new Set(state.extras),
    favorites: new Set(state.favorites),
    defeated: new Set(state.defeated),
  }
  const filters = {
    q: debouncedQuery,
    region: params.get('region') ?? '',
    required: params.has('req'),
    extra: params.has('extra'),
    favorites: params.has('fav'),
    status: params.get('status') ?? 'all',
  }
  const visible = filterBosses(sorted, filters, sets)
  const filtered = query !== '' || FILTER_KEYS.some((k) => k !== 'q' && params.has(k))

  const clearFilters = () => {
    setQuery('')
    setParams({}, { replace: true })
  }

  return (
    <section className="page">
      <h1>Bosses</h1>
      {(source === 'snapshot' || source === 'stale-cache') && (
        <p className="notice" role="status">
          Can’t reach the boss API, so this is saved boss data. Your progress isn’t affected.
        </p>
      )}

      <div className="filters">
        <input
          type="search"
          className="search"
          placeholder="Search bosses or places"
          aria-label="Search bosses"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="region"
          aria-label="Region"
          value={filters.region}
          onChange={(e) => setParam('region', e.target.value)}
        >
          <option value="">All regions</option>
          {regions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <div className="chips" role="group" aria-label="Show only">
          {TOGGLES.map(([key, label]) => (
            <button
              key={key}
              type="button"
              className="chip"
              aria-pressed={params.has(key)}
              onClick={() => setParam(key, params.has(key) ? '' : '1')}
            >
              {label}
            </button>
          ))}
        </div>
        <fieldset className="segmented">
          <legend className="visually-hidden">Status</legend>
          {STATUSES.map(([value, label]) => (
            <label key={value}>
              <input
                type="radio"
                name="status"
                value={value}
                checked={filters.status === value}
                onChange={() => setParam('status', value === 'all' ? '' : value)}
              />
              <span>{label}</span>
            </label>
          ))}
        </fieldset>
      </div>

      <p className="muted result-count" aria-live="polite">
        {loading ? 'Loading bosses…' : `${visible.length} of ${bosses.length} bosses`}
        {filtered && (
          <button type="button" className="link-btn" onClick={clearFilters}>
            Clear filters
          </button>
        )}
      </p>

      {loading ? (
        <ul className="boss-list" aria-hidden="true">
          {Array.from({ length: 8 }, (_, i) => (
            <li key={i} className="boss-row skeleton" />
          ))}
        </ul>
      ) : visible.length > 0 ? (
        <ul className="boss-list">
          {visible.map((boss) => (
            <BossRow
              key={boss.slug}
              boss={boss}
              role={roles.get(boss.slug)}
              defeated={sets.defeated.has(boss.slug)}
              favorite={sets.favorites.has(boss.slug)}
              inRun={sets.extras.has(boss.slug)}
              backTo={`/bosses?${params}`}
              dispatch={dispatch}
            />
          ))}
        </ul>
      ) : (
        <p className="empty">
          {filters.required && !state.selectedEnding ? (
            <>
              No ending picked yet. <Link to="/endings">Choose an ending</Link> to see its required
              bosses.
            </>
          ) : (
            'No bosses match these filters.'
          )}
        </p>
      )}
    </section>
  )
}
