import { createContext, useContext, useEffect, useReducer } from 'react'
import { readJSON, writeJSON } from '../lib/storage.js'
import { initialState, trackerReducer } from './trackerReducer.js'

const STORAGE_KEY = 'ertracker:v1'

const TrackerContext = createContext(null)

export function TrackerProvider({ children }) {
  const [state, dispatch] = useReducer(trackerReducer, null, () => ({
    ...initialState,
    ...readJSON(STORAGE_KEY, {}),
  }))

  useEffect(() => {
    writeJSON(STORAGE_KEY, state)
  }, [state])

  return <TrackerContext.Provider value={{ state, dispatch }}>{children}</TrackerContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTracker() {
  const ctx = useContext(TrackerContext)
  if (!ctx) throw new Error('useTracker must be used inside <TrackerProvider>')
  return ctx
}
