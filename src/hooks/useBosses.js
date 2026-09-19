import { useEffect, useMemo, useState } from 'react'
import { loadBosses } from '../api/bosses.js'
import { withCuratedBosses } from '../lib/normalize.js'
import { useTracker } from '../state/TrackerContext.jsx'

// Loaded once per page load and shared, so moving between pages doesn't refetch or flash.
let loaded = null
let pending = null

/** All bosses: API (or cache/snapshot), curated, and the user's custom bosses. */
export function useBosses() {
  const { state } = useTracker()
  const [result, setResult] = useState(loaded)

  useEffect(() => {
    if (loaded) return
    let cancelled = false
    pending ??= loadBosses().then((r) => (loaded = r))
    pending.then((r) => {
      if (!cancelled) setResult(r)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const bosses = useMemo(
    () => (result ? withCuratedBosses(result.bosses, state.customBosses) : []),
    [result, state.customBosses],
  )
  return { bosses, source: result?.source ?? null, loading: !result }
}
