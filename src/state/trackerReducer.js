export const initialState = {
  selectedEnding: null,
  defeated: [],
  extras: [],
  favorites: [],
  customBosses: [],
  version: 1,
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
