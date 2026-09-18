import { useEffect, useState } from 'react'
import { loadBosses } from '../api/bosses.js'

export function useBosses() {
  const [state, setState] = useState({ bosses: [], source: null, loading: true })

  useEffect(() => {
    let cancelled = false
    loadBosses().then(({ bosses, source }) => {
      if (!cancelled) setState({ bosses, source, loading: false })
    })
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
