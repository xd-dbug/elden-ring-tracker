// localStorage can throw (private browsing, quota exceeded), so every access is guarded.

export function readJSON(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key)
    return raw == null ? fallback : JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function remove(key) {
  try {
    localStorage.removeItem(key)
  } catch {
    // ignore
  }
}
