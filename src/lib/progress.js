// Pure ending/progress logic. Implemented in milestone 3 — see plan section 5.

/** @returns {{ fixed: string[], groups: object[] }} */
export function getRequiredForEnding(_endingId, _data) {
  throw new Error('Not implemented')
}

/** @returns {{ done: number, satisfied: boolean, remaining: number }} */
export function getGroupStatus(_group, _defeated) {
  throw new Error('Not implemented')
}

export function getRunList(_state, _data) {
  throw new Error('Not implemented')
}

/** @returns {{ requiredDone: number, requiredTotal: number, extrasDone: number, extrasTotal: number, percent: number }} */
export function getProgress(_state, _data) {
  throw new Error('Not implemented')
}
