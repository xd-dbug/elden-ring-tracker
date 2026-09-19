export const initialState = {
  selectedEnding: null,
  defeated: [],
  extras: [],
  favorites: [],
  customBosses: [],
  version: 1,
}

const slugList = (value) =>
  Array.isArray(value) ? [...new Set(value.filter((s) => typeof s === 'string'))] : []

/**
 * Turn whatever is in localStorage into a valid state. Saved data can be missing, from an
 * older build, or hand-edited, and a bad value must not crash the app on load.
 */
export function loadState(saved) {
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return initialState
  return {
    selectedEnding: typeof saved.selectedEnding === 'string' ? saved.selectedEnding : null,
    defeated: slugList(saved.defeated),
    extras: slugList(saved.extras),
    favorites: slugList(saved.favorites),
    customBosses: Array.isArray(saved.customBosses)
      ? saved.customBosses.filter((b) => typeof b?.slug === 'string' && typeof b?.name === 'string')
      : [],
    version: 1,
  }
}

function toggle(list, slug) {
  return list.includes(slug) ? list.filter((s) => s !== slug) : [...list, slug]
}

export function trackerReducer(state, action) {
  switch (action.type) {
    case 'selectEnding':
      // Defeats are facts about the playthrough, so switching endings keeps them.
      return { ...state, selectedEnding: action.endingId }
    case 'toggleDefeated':
      return { ...state, defeated: toggle(state.defeated, action.slug) }
    case 'toggleExtra':
      return { ...state, extras: toggle(state.extras, action.slug) }
    case 'toggleFavorite':
      return { ...state, favorites: toggle(state.favorites, action.slug) }
    case 'reset':
      return initialState
    default:
      return state
  }
}
