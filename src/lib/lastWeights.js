import { isPastSession } from './sessionStatus'

function normalizeName(name) {
  return (name ?? '').trim().toLocaleLowerCase()
}

function byMostRecent(a, b) {
  const byDate = (b.date ?? '').localeCompare(a.date ?? '')
  if (byDate !== 0) return byDate
  return (b.endedAt ?? b.startedAt ?? '').localeCompare(a.endedAt ?? a.startedAt ?? '')
}

/** Sets of `name` in the most recent finished session that has it with a weight, or null. */
export function lastExerciseSets(sessions, name) {
  const key = normalizeName(name)
  if (!key) return null
  const past = (sessions ?? []).filter(isPastSession).sort(byMostRecent)
  for (const session of past) {
    const ex = (session.exercises ?? []).find(
      (e) => normalizeName(e.name) === key && (e.sets ?? []).some((s) => Number(s.weight) > 0),
    )
    if (ex) return ex.sets
  }
  return null
}

/** Same set index from last time; extra sets reuse the last set's weight. */
function weightAt(prevSets, idx) {
  const s = prevSets[Math.min(idx, prevSets.length - 1)]
  return Number(s?.weight) || 0
}

/**
 * Prefill each set's weight from the last session with the same exercise.
 * `onlyEmpty` keeps weights the user already set (e.g. a planned session).
 */
export function withLastWeights(exercises, sessions, { onlyEmpty = false } = {}) {
  return (exercises ?? []).map((ex) => {
    const prev = lastExerciseSets(sessions, ex.name)
    if (!prev) return ex
    return {
      ...ex,
      sets: (ex.sets ?? []).map((s, i) => {
        if (s.done) return s
        if (onlyEmpty && Number(s.weight) > 0) return s
        const weight = weightAt(prev, i)
        return weight > 0 ? { ...s, weight } : s
      }),
    }
  })
}
