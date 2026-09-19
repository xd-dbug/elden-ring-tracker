// Pure ending/progress logic (plan section 5). `data` is the shape of endings.json.

/** @returns {{ fixed: string[], groups: object[] }} */
export function getRequiredForEnding(endingId, data) {
  const ending = data.endings.find((e) => e.id === endingId)
  if (!ending) return { fixed: [], groups: [] }
  return {
    fixed: [...new Set([...data.commonRequired, ...ending.extraRequired])],
    groups: data.groups,
  }
}

/** @returns {{ done: number, satisfied: boolean, remaining: number }} */
export function getGroupStatus(group, defeated) {
  const beaten = new Set(defeated)
  const done = group.options.filter((slug) => beaten.has(slug)).length
  return { done, satisfied: done >= group.pick, remaining: Math.max(0, group.pick - done) }
}

/**
 * Every boss in the run, once each, tagged with why it's there.
 * A boss can have several sources, e.g. Radahn is fixed-required for Age of the Stars
 * and also a Great Rune option.
 * @returns {{ slug: string, sources: string[], defeated: boolean }[]}
 */
export function getRunList(state, data) {
  const { fixed, groups } = getRequiredForEnding(state.selectedEnding, data)
  const beaten = new Set(state.defeated)
  const bySlug = new Map()
  const tag = (slug, source) => {
    if (!bySlug.has(slug)) bySlug.set(slug, { slug, sources: [], defeated: beaten.has(slug) })
    const entry = bySlug.get(slug)
    if (!entry.sources.includes(source)) entry.sources.push(source)
  }

  fixed.forEach((slug) => tag(slug, 'required'))
  for (const group of groups) group.options.forEach((slug) => tag(slug, `group:${group.id}`))
  state.extras.forEach((slug) => tag(slug, 'extra'))
  return [...bySlug.values()]
}

/**
 * Required progress counts each fixed boss plus `pick` per group; bosses beyond a group's
 * `pick` don't add to it. An extra that is already required (fixed or a group option) is
 * counted only on the required side.
 * @returns {{ requiredDone: number, requiredTotal: number, extrasDone: number, extrasTotal: number, percent: number }}
 */
export function getProgress(state, data) {
  const { fixed, groups } = getRequiredForEnding(state.selectedEnding, data)
  const beaten = new Set(state.defeated)

  let requiredDone = fixed.filter((slug) => beaten.has(slug)).length
  let requiredTotal = fixed.length
  for (const group of groups) {
    requiredDone += Math.min(getGroupStatus(group, state.defeated).done, group.pick)
    requiredTotal += group.pick
  }

  const required = new Set([...fixed, ...groups.flatMap((g) => g.options)])
  const extras = [...new Set(state.extras)].filter((slug) => !required.has(slug))
  const extrasDone = extras.filter((slug) => beaten.has(slug)).length
  const extrasTotal = extras.length

  const total = requiredTotal + extrasTotal
  const percent = total === 0 ? 0 : Math.round(((requiredDone + extrasDone) / total) * 100)
  return { requiredDone, requiredTotal, extrasDone, extrasTotal, percent }
}
