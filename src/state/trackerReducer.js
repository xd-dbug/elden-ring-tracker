import { slugify } from '../lib/slug.js'

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
      ? saved.customBosses
          .filter((b) => typeof b?.slug === 'string' && typeof b?.name === 'string')
          // Only the fields the form sets, so an imported file can't add e.g. an image URL.
          .map(({ slug, name, region }) => ({
            slug,
            name,
            ...(typeof region === 'string' && region && { region }),
          }))
      : [],
    version: 1,
  }
}

/** "custom-" keeps custom slugs apart from API ones; a number keeps them unique. */
function customSlug(name, taken) {
  const base = `custom-${slugify(name) || 'boss'}`
  let slug = base
  for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`
  return slug
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
    case 'addCustomBoss': {
      const name = action.name.trim()
      if (!name) return state
      const region = action.region?.trim()
      const slug = customSlug(name, new Set(state.customBosses.map((b) => b.slug)))
      return {
        ...state,
        customBosses: [...state.customBosses, { slug, name, ...(region && { region }) }],
        extras: action.addToRun ? [...state.extras, slug] : state.extras,
      }
    }
    case 'removeCustomBoss': {
      const without = (list) => list.filter((s) => s !== action.slug)
      return {
        ...state,
        customBosses: state.customBosses.filter((b) => b.slug !== action.slug),
        defeated: without(state.defeated),
        extras: without(state.extras),
        favorites: without(state.favorites),
      }
    }
    case 'import':
      return loadState(action.saved)
    case 'reset':
      return initialState
    default:
      return state
  }
}
